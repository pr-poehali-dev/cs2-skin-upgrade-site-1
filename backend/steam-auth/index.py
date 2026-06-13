"""
Steam OpenID авторизация.
GET /?action=login    — редирект на Steam OpenID
GET /?action=callback — верификация ответа Steam
GET /?action=me&token=... — данные текущего пользователя
POST /?action=logout  — выход
"""
import os, json, hmac, hashlib, time, urllib.parse, urllib.request

STEAM_OPENID = "https://steamcommunity.com/openid/login"
STEAM_API = "https://api.steampowered.com"
SESSION_SECRET = os.environ.get("SESSION_SECRET", "dev-secret-change-me")
SITE_URL = os.environ.get("SITE_URL", "https://cs2up.poehali.dev")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
}


def make_session_token(steam_id: str) -> str:
    payload = f"{steam_id}:{int(time.time())}"
    sig = hmac.new(SESSION_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return urllib.parse.quote(f"{payload}:{sig}")


def verify_session_token(token: str) -> str | None:
    try:
        decoded = urllib.parse.unquote(token)
        steam_id, ts, sig = decoded.rsplit(":", 2)
        if int(time.time()) - int(ts) > 86400 * 30:
            return None
        expected = hmac.new(SESSION_SECRET.encode(), f"{steam_id}:{ts}".encode(), hashlib.sha256).hexdigest()
        if hmac.compare_digest(sig, expected):
            return steam_id
    except Exception:
        pass
    return None


def get_steam_profile(steam_id: str) -> dict:
    api_key = os.environ.get("STEAM_API_KEY", "")
    url = f"{STEAM_API}/ISteamUser/GetPlayerSummaries/v0002/?key={api_key}&steamids={steam_id}"
    with urllib.request.urlopen(url, timeout=10) as r:
        data = json.loads(r.read())
    players = data.get("response", {}).get("players", [])
    return players[0] if players else {}


def verify_openid(params: dict) -> str | None:
    check_params = dict(params)
    check_params["openid.mode"] = "check_authentication"
    body = urllib.parse.urlencode(check_params).encode()
    req = urllib.request.Request(STEAM_OPENID, data=body, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req, timeout=10) as r:
        result = r.read().decode()
    if "is_valid:true" not in result:
        return None
    claimed = params.get("openid.claimed_id", "")
    if "/id/" in claimed:
        return claimed.split("/id/")[-1]
    return None


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")

    # action=login — редирект на Steam
    if action == "login":
        func_url = "https://functions.poehali.dev/a271073f-7df2-4b87-b3f0-ce63d38ac2b4/?action=callback"
        params = urllib.parse.urlencode({
            "openid.ns": "http://specs.openid.net/auth/2.0",
            "openid.mode": "checkid_setup",
            "openid.return_to": func_url,
            "openid.realm": SITE_URL,
            "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
            "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
        })
        return {
            "statusCode": 302,
            "headers": {**CORS, "Location": f"{STEAM_OPENID}?{params}"},
            "body": "",
        }

    # action=callback — верификация Steam OpenID ответа
    if action == "callback":
        steam_id = verify_openid(qs)
        if not steam_id:
            return {
                "statusCode": 302,
                "headers": {**CORS, "Location": f"{SITE_URL}/?auth=error"},
                "body": "",
            }
        token = make_session_token(steam_id)
        profile = get_steam_profile(steam_id)
        redirect = (
            f"{SITE_URL}/?auth=ok"
            f"&token={token}"
            f"&steam_id={steam_id}"
            f"&avatar={urllib.parse.quote(profile.get('avatarfull', ''))}"
            f"&username={urllib.parse.quote(profile.get('personaname', ''))}"
        )
        return {
            "statusCode": 302,
            "headers": {**CORS, "Location": redirect},
            "body": "",
        }

    # action=me — профиль текущего пользователя
    if action == "me":
        token = qs.get("token", "")
        steam_id = verify_session_token(token)
        if not steam_id:
            return {
                "statusCode": 401,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"error": "unauthorized"}),
            }
        profile = get_steam_profile(steam_id)
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({
                "steam_id": steam_id,
                "username": profile.get("personaname", ""),
                "avatar": profile.get("avatarfull", ""),
                "profile_url": profile.get("profileurl", ""),
            }),
        }

    # action=logout
    if action == "logout" and method == "POST":
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": True}),
        }

    return {
        "statusCode": 400,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"error": "unknown action"}),
    }