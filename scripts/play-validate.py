#!/usr/bin/env python3
"""Validate a Google Play service-account key WITHOUT publishing anything.

Opens an Android Publisher "edit" session for the app and immediately
abandons it. If the insert succeeds, the key is valid and the service
account has release access to the package. Nothing is uploaded, committed,
or made visible to users.

Usage:
    pip install google-auth
    python scripts/play-validate.py path/to/service-account.json [packageName]

packageName defaults to org.missingmaps.mapswipe.
"""
import json
import sys
import urllib.request
import urllib.error

from google.oauth2 import service_account
from google.auth.transport.requests import Request

SCOPE = "https://www.googleapis.com/auth/androidpublisher"
BASE = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications"


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    key_path = sys.argv[1]
    package = sys.argv[2] if len(sys.argv) > 2 else "org.missingmaps.mapswipe"

    creds = service_account.Credentials.from_service_account_file(
        key_path, scopes=[SCOPE]
    )
    creds.refresh(Request())
    print(f"✓ Authenticated as {creds.service_account_email}")
    headers = {"Authorization": f"Bearer {creds.token}"}

    # Open an edit — this is the call that requires package access.
    req = urllib.request.Request(f"{BASE}/{package}/edits", method="POST", headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            edit_id = json.load(resp)["id"]
    except urllib.error.HTTPError as e:
        print(f"✗ FAILED opening edit for {package}: HTTP {e.code}")
        print(e.read().decode())
        print("\nCommon causes: service account not invited to this app in "
              "Play Console, or wrong packageName.")
        return 1
    print(f"✓ Opened edit {edit_id} on {package} — key has release access")

    # Abandon it so nothing is changed.
    req = urllib.request.Request(
        f"{BASE}/{package}/edits/{edit_id}", method="DELETE", headers=headers
    )
    urllib.request.urlopen(req).read()
    print("✓ Abandoned edit — no changes published. Key is good to use.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
