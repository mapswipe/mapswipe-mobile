# Login and signup with OpenStreetMap via OAuth

## What it is

MapSwipe lets users sign up and log in with their **OpenStreetMap** account,
using OAuth 2.0 (authorization code grant). OAuth means the user types their OSM
password on an OSM page — we never see it, and never store it.

The end result is an ordinary Firebase account. Once signed in, an OSM user looks
identical to an email/password user everywhere else in the app; their Firebase
UID is just `osm:<osm user id>`.

Two halves are involved:

- **The app** — [`app/login/osm.tsx`](../app/login/osm.tsx). Authoritative
  reference, documented in full below.
- **Two Firebase cloud functions**, `/redirect` and `/token`, which live in the
  [`firebase/`](../firebase) submodule
  ([`firebase/functions/src/osm_auth.ts`](../firebase/functions/src/osm_auth.ts)).
  Summarised here so you can reason about failures; that repository is the source
  of truth for their config and deployment.

The functions exist because the OAuth token exchange needs a client secret, which
cannot be shipped inside a mobile app.

---

## How it works

Step by step:

1. The user taps **Login/Signup with OSM**. The app calls
   `openAuthSessionAsync(`${EXPO_PUBLIC_OSM_AUTH_URL}/redirect`, redirectUri)`
   from `expo-web-browser`, where `redirectUri` is `createURL('login/osm')`.

   This opens an **`ASWebAuthenticationSession` / Chrome Custom Tab**, not a
   `WebView` inside the app. That distinction is a security requirement, not a
   style choice — see
   [RFC 8252 §8.12](https://datatracker.ietf.org/doc/html/rfc8252#section-8.12).
   An embedded webview would let the app observe the user's OSM credentials,
   which defeats the point of using OAuth. **Do not "simplify" this into a
   `WebView`.**

2. `/redirect` generates a random `state`, stores it in a `__session` cookie in
   the user's browser, and redirects to OSM's authorization page carrying that
   `state`.

   The cookie must be named `__session` — Firebase Hosting strips every other
   cookie from requests to functions
   ([docs](https://firebase.google.com/docs/hosting/manage-cache#using_cookies)).

3. On OSM's own pages the user logs in if needed, and is asked to allow MapSwipe
   to read their user preferences.

4. OSM redirects back to `/token` with `code` and `state`.

5. `/token` checks the returned `state` against the `__session` cookie, then
   exchanges the `code` for an OSM access token using the client secret.

6. It calls OSM's `/api/0.6/user/details` to get the user's numeric `id` and
   `display_name` — the OAuth response alone carries no identity.

7. It creates or updates a Firebase user with UID `osm:<id>`, sets the display
   name from the OSM username, writes a profile at `v2/users/{uid}`, stashes the
   OSM access token at `v2/OSMAccessToken/{uid}`, and mints a Firebase **custom
   token**.

8. It redirects the browser to the app's deep link with that token attached.

9. The auth session resolves with `type: 'success'`; the app parses `token` out
   of the URL and calls `signInWithCustomToken`.

10. On success it redirects to `/`, and the root layout's auth listener takes
    over from there — see [architecture.md](architecture.md#navigation-and-auth).

---

## Configuration

### App side

One variable, in `.env.local`:

| Variable | Value |
| --- | --- |
| `EXPO_PUBLIC_OSM_AUTH_URL` | Base URL of the deployed cloud functions. The app appends `/redirect`. |

The redirect URI is **not** configured — `createURL('login/osm')` derives it from
the `scheme` in the active app config, so it follows `APP_ENV` automatically:

| `APP_ENV` | Scheme | Redirect URI |
| --- | --- | --- |
| `staging` | `devmapswipe` | `devmapswipe://login/osm` |
| production (default) | `mapswipe` | `mapswipe://login/osm` |

### Function side

Deployed and configured in the [`firebase/`](../firebase) submodule; these are
listed so you can recognise a misconfiguration, not so you can set them from
here. Read via `functions.config().osm`:

| Key | Purpose |
| --- | --- |
| `osm.client_id` / `osm.client_secret` | Credentials of the registered OSM OAuth application. |
| `osm.api_url` | `https://www.openstreetmap.org` or the OSM dev instance. |
| `osm.redirect_uri` | Where OSM sends the user after consent — the `/token` function URL. **Must exactly match** the value registered on OSM. |
| `osm.app_login_link` | The deep link back into the app (`devmapswipe://login/osm` or `mapswipe://login/osm`). |

Note the two different "redirect" concepts: `osm.redirect_uri` is
OSM → cloud function, while `osm.app_login_link` is cloud function → app. Mixing
them up is a common cause of a flow that dead-ends in the browser.

---

## Registering an OSM OAuth application

> Only needed when standing up a new environment. For normal development, the
> existing staging application is already registered — you just need
> `EXPO_PUBLIC_OSM_AUTH_URL`.

1. Log in to OSM and go to the OAuth 2 applications page:
   - production: <https://www.openstreetmap.org/oauth2/applications>
   - development: <https://master.apis.dev.openstreetmap.org/oauth2/applications>
2. **Register new application**:
   - **Name** — shown to users on the consent screen ("Allow *name* to access
     your account?"), so make it recognisable.
   - **Redirect URI** — the `/token` cloud function URL. This must match
     `osm.redirect_uri` exactly, character for character; a mismatch produces a
     famously unhelpful error from OSM.
   - **Confidential application** — leave **unchecked**. A mobile app cannot keep
     a secret.
   - **Permissions** — tick only **Read user preferences** (`read_prefs`). It's
     the minimum the flow needs, and we ask for nothing more.
3. Put the resulting client ID and secret into the functions' config, and deploy
   the functions from the `firebase/` submodule.
4. Ensure the Realtime Database rules permit writes to `v2/users/{uid}` and
   `v2/OSMAccessToken/{uid}` for the admin SDK — also in that submodule.

---

## Testing the deep link

You can fire the final leg of the flow directly, without going through OSM, to
check that the app's URL handling works. On Android, with a device or emulator
attached:

```sh
# staging build
adb shell am start -W -a android.intent.action.VIEW \
  -d "devmapswipe://login/osm?token=ttt" \
  org.missingmaps.mapswipe.dev

# production build
adb shell am start -W -a android.intent.action.VIEW \
  -d "mapswipe://login/osm?token=ttt" \
  org.missingmaps.mapswipe
```

On iOS with the simulator running:

```sh
xcrun simctl openurl booted "devmapswipe://login/osm?token=ttt"
```

A dummy token will fail at `signInWithCustomToken` with a "Login Failed" toast —
that's the expected outcome. It confirms routing and parsing work; it doesn't
test the exchange.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Browser opens on an OSM error page immediately | `osm.redirect_uri` doesn't match the URI registered on the OSM application. |
| "State cookie not set or expired" | The user took more than an hour, or the `__session` cookie was dropped — check the functions are served from the domain the cookie is set on. |
| "State validation failed" | The `state` came back altered, or the browser session was restarted mid-flow. |
| Consent succeeds, but the app never reopens | `osm.app_login_link` is wrong, or doesn't match the scheme of the installed build (`devmapswipe` vs `mapswipe`). Verify with the `adb` command above. |
| App reopens, then shows "No token received from OSM" | `/token` redirected without a `token` query parameter — check the function logs. |
| Works on staging, fails on production | Almost always a scheme/URI mismatch: staging and production need **separate** OSM applications and separate function config. |

Function-side logs are the fastest way in — `osm_auth.ts` logs the state, the
auth code and the profile at each step. Read them in the Firebase console for the
relevant project.

---

## See also

- [architecture.md](architecture.md) — where auth sits in the app
- [develop-android.md](develop-android.md#configuration) — setting up `.env.local`
- [`firebase/`](../firebase) — the cloud functions and database rules
