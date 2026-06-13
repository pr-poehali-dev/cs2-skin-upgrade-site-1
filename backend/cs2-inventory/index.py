"""
Получение CS2 инвентаря пользователя через Steam API.
GET /?steam_id=76561198...&token=... — возвращает список скинов с изображениями
"""
import os, json, hmac, hashlib, time, urllib.parse, urllib.request

SESSION_SECRET = os.environ.get("SESSION_SECRET", "dev-secret-change-me")
CS2_APP_ID = 730
STEAM_API = "https://api.steampowered.com"
CDN_IMG = "https://community.akamai.steamstatic.com/economy/image"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
}

RARITY_MAP = {
    "Rarity_Common": "consumer",
    "Rarity_Uncommon": "industrial",
    "Rarity_Rare": "milspec",
    "Rarity_Mythical": "restricted",
    "Rarity_Legendary": "classified",
    "Rarity_Ancient": "covert",
    "Rarity_Immortal": "extraordinary",
}

WEAR_MAP = {
    "WearCategory0": "Factory New",
    "WearCategory1": "Minimal Wear",
    "WearCategory2": "Field-Tested",
    "WearCategory3": "Well-Worn",
    "WearCategory4": "Battle-Scarred",
}


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


def get_tag_value(tags: list, category: str) -> str:
    for tag in tags:
        if tag.get("category") == category:
            return tag.get("internal_name", "")
    return ""


def get_tag_name(tags: list, category: str) -> str:
    for tag in tags:
        if tag.get("category") == category:
            return tag.get("localized_tag_name", "")
    return ""


def fetch_inventory(steam_id: str) -> list:
    url = f"https://steamcommunity.com/inventory/{steam_id}/{CS2_APP_ID}/2?l=russian&count=500"
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "Mozilla/5.0")
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.loads(r.read())

    assets = {f"{a['classid']}_{a['instanceid']}": a for a in data.get("assets", [])}
    descriptions = {f"{d['classid']}_{d['instanceid']}": d for d in data.get("descriptions", [])}

    items = []
    for key, asset in assets.items():
        desc = descriptions.get(key, {})
        if not desc:
            continue

        tags = desc.get("tags", [])
        rarity_key = get_tag_value(tags, "Rarity")
        wear_key = get_tag_value(tags, "Exterior")
        item_type = get_tag_name(tags, "Type")
        weapon_type = get_tag_name(tags, "Weapon")

        # Only weapon skins and knives
        if not any(t.get("category") == "Rarity" for t in tags):
            continue
        if "Sticker" in item_type or "Graffiti" in item_type or "Music" in item_type:
            continue

        icon = desc.get("icon_url", "")
        image_url = f"{CDN_IMG}/{icon}/330x192" if icon else ""

        name = desc.get("name", "")
        market_name = desc.get("market_hash_name", "")

        # Parse "Weapon | Skin Name" format
        parts = name.split(" | ", 1)
        weapon = parts[0].strip() if len(parts) == 2 else name
        skin_name = parts[1].strip() if len(parts) == 2 else ""

        # Remove wear from skin name: "Skin (Factory New)" → "Skin"
        if skin_name and "(" in skin_name:
            skin_name = skin_name[:skin_name.rfind("(")].strip()

        stattrak = "StatTrak" in name or "StatTrak" in desc.get("name", "")

        items.append({
            "id": asset["assetid"],
            "classid": asset["classid"],
            "instanceid": asset["instanceid"],
            "name": skin_name or weapon,
            "weapon": weapon.replace("StatTrak™ ", "").replace("Souvenir ", ""),
            "market_hash_name": market_name,
            "rarity": RARITY_MAP.get(rarity_key, "consumer"),
            "wear": WEAR_MAP.get(wear_key, ""),
            "image": image_url,
            "stattrak": stattrak,
            "souvenir": "Souvenir" in name,
        })

    return items


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    qs = event.get("queryStringParameters") or {}
    token = qs.get("token", "")
    steam_id = qs.get("steam_id", "")

    if not token or not steam_id:
        return {
            "statusCode": 400,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": "token and steam_id required"}),
        }

    verified_id = verify_session_token(token)
    if not verified_id or verified_id != steam_id:
        return {
            "statusCode": 401,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": "unauthorized"}),
        }

    items = fetch_inventory(steam_id)
    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"items": items, "total": len(items)}),
    }
