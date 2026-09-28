#!/usr/bin/env python3
"""Validate an App Store Connect API key WITHOUT uploading anything.

Reads APPSTORE_API_KEY_ID and APPSTORE_API_ISSUER_ID from the environment
(falling back to .env.local) and takes the path to the .p8 private key as
an argument. Signs a short-lived JWT and calls a read-only endpoint
(GET /v1/apps). A 200 response proves the key, Key ID and Issuer ID are
correct and have access. Nothing is uploaded, submitted, or released.

Usage:
    pip install pyjwt cryptography
    python scripts/appstore-validate.py path/to/AuthKey_XXXX.p8
"""
import os
import sys
import time
import json
import urllib.request
import urllib.error

import jwt  # PyJWT

AUDIENCE = "appstoreconnect-v1"
APPS_URL = "https://api.appstoreconnect.apple.com/v1/apps?limit=5"


def load_env_local(path=".env.local"):
    """Populate os.environ from .env.local without overriding real env vars."""
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    p8_path = sys.argv[1]

    load_env_local()
    key_id = os.environ.get("APPSTORE_API_KEY_ID")
    issuer_id = os.environ.get("APPSTORE_API_ISSUER_ID")
    if not key_id or not issuer_id:
        print("✗ APPSTORE_API_KEY_ID / APPSTORE_API_ISSUER_ID not found in "
              "environment or .env.local")
        return 2

    with open(p8_path, "r") as f:
        private_key = f.read()

    now = int(time.time())
    # Apple rejects tokens expiring > 20 min out; keep well under and backdate
    # iat slightly to tolerate clock skew between this machine and Apple.
    token = jwt.encode(
        {"iss": issuer_id, "iat": now - 30, "exp": now + 15 * 60, "aud": AUDIENCE},
        private_key,
        algorithm="ES256",
        headers={"kid": key_id, "typ": "JWT"},
    )
    print(f"✓ Signed a JWT with key {key_id}")

    req = urllib.request.Request(APPS_URL, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.load(resp)
    except urllib.error.HTTPError as e:
        print(f"✗ FAILED: HTTP {e.code}")
        print(e.read().decode())
        print("\nCommon causes: wrong Key ID / Issuer ID, key revoked, or the "
              "key lacks access (needs at least App Manager role).")
        return 1

    apps = data.get("data", [])
    print(f"✓ Authenticated — key can see {len(apps)} app(s):")
    for a in apps:
        attr = a.get("attributes", {})
        print(f"    - {attr.get('name')} ({attr.get('bundleId')})")
    print("✓ Key is valid and has access. Nothing was uploaded or changed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
