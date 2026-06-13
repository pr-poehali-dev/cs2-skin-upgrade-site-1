"""
Интеграция с market.csgo.com.
GET  /?action=balance              — баланс на маркете
GET  /?action=prices&name=...      — цена предмета по market_hash_name
POST /?action=sell  {assetid, price} — выставить предмет на продажу
POST /?action=buy   {name, price}    — купить предмет
GET  /?action=items                — предметы пользователя на маркете
"""
import os, json, urllib.request, urllib.parse

MARKET_API = "https://market.csgo.com/api/v2"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
}


def market_get(path: str) -> dict:
    key = os.environ.get("CSGO_MARKET_KEY", "")
    sep = "&" if "?" in path else "?"
    url = f"{MARKET_API}{path}{sep}key={key}"
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "Mozilla/5.0")
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


def market_post(path: str, body: dict) -> dict:
    key = os.environ.get("CSGO_MARKET_KEY", "")
    sep = "&" if "?" in path else "?"
    url = f"{MARKET_API}{path}{sep}key={key}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", "Mozilla/5.0")
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


def get_price_for_item(market_hash_name: str) -> dict:
    """Цена с публичного эндпоинта — не требует ключа."""
    url = "https://market.csgo.com/api/v2/prices/RUB.json"
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "Mozilla/5.0")
    with urllib.request.urlopen(req, timeout=20) as r:
        all_prices = json.loads(r.read())
    items = all_prices.get("items", {})
    item = items.get(market_hash_name, {})
    return {
        "price": item.get("price", 0),
        "sold": item.get("sold", 0),
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    # action=balance
    if action == "balance":
        data = market_get("/get-money")
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({
                "money": data.get("money", 0),
                "currency": "RUB",
                "success": data.get("success", False),
            }),
        }

    # action=prices&name=AK-47+%7C+...
    if action == "prices":
        name = qs.get("name", "")
        if not name:
            return {
                "statusCode": 400,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"error": "name required"}),
            }
        price_data = get_price_for_item(name)
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(price_data),
        }

    # action=items — предметы пользователя на маркете
    if action == "items":
        data = market_get("/items")
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data),
        }

    # action=sell (POST) — выставить скин на продажу
    if action == "sell" and method == "POST":
        asset_id = body.get("assetid")
        price = body.get("price")
        if not asset_id or not price:
            return {
                "statusCode": 400,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"error": "assetid and price required"}),
            }
        data = market_get(f"/add-to-sale?id={asset_id}&price={price}&cur=RUB")
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data),
        }

    # action=buy (POST) — купить предмет
    if action == "buy" and method == "POST":
        name = body.get("name")
        price = body.get("price")
        if not name or not price:
            return {
                "statusCode": 400,
                "headers": {**CORS, "Content-Type": "application/json"},
                "body": json.dumps({"error": "name and price required"}),
            }
        encoded = urllib.parse.quote(name)
        data = market_get(f"/buy?market_hash_name={encoded}&price={price}&cur=RUB")
        return {
            "statusCode": 200,
            "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data),
        }

    return {
        "statusCode": 400,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"error": "unknown action"}),
    }
