# Setting up a development environment for iOS

You cannot build an iOS app without a Mac. If you don't have one, develop against
[Android](develop-android.md) — the codebase is shared, and CI builds and signs
the iOS app for you on every release tag.

Much of this page is shared with the Android setup. Read
[develop-android.md](develop-android.md) first for the parts that aren't
platform-specific (submodules, `.env.local`, GraphQL codegen, checks); this page
covers what differs.

---

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| macOS | recent | Needs to run the Xcode version below. |
| Xcode | **26.x** | CI pins Xcode 26 for the iOS 26 SDK. Older Xcode will not match CI. |
| Node.js | **22** | Pinned in `package.json` `engines`. |
| pnpm | **10.6.1** | Via `corepack enable`. Not npm, not yarn. |
| CocoaPods | recent | `brew install cocoapods`. Installed by prebuild if missing. |

Install the Xcode command line tools and accept the licence:

```sh
xcode-select --install
sudo xcodebuild -license accept
```

There is **no `Gemfile`, no bundler and no fastlane** in this project. Pods are
installed by `expo prebuild`; you do not run `pod install` yourself.

---

## Getting the code and configuring it

Identical to Android — see
[develop-android.md](develop-android.md#getting-the-code):

```sh
git clone --recurse-submodules git@github.com:mapswipe/mapswipe-mobile.git
cd mapswipe-mobile
pnpm install
cp .env.example .env.local   # then fill in values from a maintainer
pnpm generate:type
```

No `GoogleService-Info.plist` is needed. Firebase is configured entirely through
`EXPO_PUBLIC_*` environment variables via the Firebase JS SDK.

---

## Running the app

### Simulator

```sh
pnpm ios
```

That's `expo run:ios` — it runs `expo prebuild` to generate `ios/`, installs
pods, builds, and boots the app in the simulator with Metro attached. The first
run is slow.

Afterwards, just start the bundler and press `i`:

```sh
pnpm start
```

For the staging app (`.dev` bundle ID, staging Firebase):

```sh
APP_ENV=staging pnpm ios
```

### Physical device

```sh
pnpm ios --device
```

The first build on a device needs a signing identity. Sign in with your Apple ID
under **Xcode → Settings → Accounts**, then open the generated workspace and set
a team:

```sh
open ios/*.xcworkspace
```

Select the target → **Signing & Capabilities** → set **Team**, and let Xcode
manage signing automatically. A free Apple ID works for local development; the
provisioning profile expires after 7 days and the bundle ID may need a unique
suffix if someone else already registered it.

**Always open the `.xcworkspace`, never the `.xcodeproj`** — the project alone
doesn't know about CocoaPods.

Any signing setting you change in Xcode is lost on the next `expo prebuild`. For
a local device build that's fine — you'll just set it again. If it needs to
persist, it belongs in the app config or a config plugin.

---

## Never edit `ios/` by hand

Same rule as Android, and it bites harder here because Xcode invites you to edit
things. `ios/` is **gitignored generated output**; `expo prebuild` recreates it
from `app.config.js`, and `--clean` deletes it first.

Native changes go in:

- **`app.staging.json` / `app.prod.json`** — bundle ID, `infoPlist` entries,
  icons, splash screen, plugin options.
- **A config plugin in [`plugins/`](../plugins/)** — for anything else.
  `disable-liquid-glass.cjs` is the iOS example: it injects a line into
  `AppDelegate.swift` to opt out of the iOS 26 glass navigation bar style, which
  otherwise pushes header button icons off-centre.

---

## Checks

No test suite exists. Before opening a PR:

```sh
pnpm check        # typecheck + lint
pnpm lint:unused
```

---

## When things break

```sh
pnpm prebuild:clean            # regenerate ios/ and android/
rm -rf ios && pnpm ios         # nuclear option for iOS specifically
pnpm start --clear             # clear Metro cache
```

Also worth knowing:

- **Pod install failures** — `rm -rf ios ~/Library/Caches/CocoaPods`, then
  `pnpm ios` again.
- **"resource fork, Finder information, or similar detritus not allowed"** —
  `xattr -cr .` in the repo root
  ([background](https://developer.apple.com/library/archive/qa/qa1940/_index.html)).
- **Xcode builds but CI doesn't (or vice versa)** — check your Xcode major
  version matches the 26.x that
  [`release-ios.yml`](../.github/workflows/release-ios.yml) selects.
- **Odd, unexplainable install failures** — check `node -v` is 22. React Native
  is regularly unhappy on very new Node releases.

---

## Code signing for releases

Local development signing (above) is separate from release signing. Releases are
built and signed entirely in GitHub Actions by
[`release-ios.yml`](../.github/workflows/release-ios.yml) and
[`test-ios.yml`](../.github/workflows/test-ios.yml) — see
[deployment.md](deployment.md) for the release flow itself.

There is no fastlane and no `match` repository. The workflow imports a `.p12`
certificate and a `.mobileprovision` profile into a temporary keychain, archives
with `xcodebuild`, and exports an `app-store` IPA.

### The secrets involved

Stored as **repository secrets** in GitHub:

| Secret | Contents |
| --- | --- |
| `APPLE_CERTIFICATE_P12` | Base64 of the Apple Distribution certificate + private key, exported as `.p12`. |
| `APPLE_CERTIFICATE_PASSWORD` | The password set when exporting that `.p12`. |
| `APPLE_PROVISIONING_PROFILE` | Base64 of the **production** `.mobileprovision` (bundle ID `org.missingmaps.mapswipe`). |
| `APPLE_PROVISIONING_PROFILE_DEV` | Base64 of the **staging** `.mobileprovision` (bundle ID `org.missingmaps.mapswipe-dev`). |
| `APPLE_TEAM_ID` | Apple Developer Team ID, used as `DEVELOPMENT_TEAM` and in `ExportOptions.plist`. |

Both the staging and production jobs use the *same* certificate and differ only
in which provisioning profile they import.

Encode a file for storage with:

```sh
base64 -i certificate.p12 | pbcopy
```

The profile name is not stored — the workflow reads it out of the profile itself
with `PlistBuddy` and passes it as `PROVISIONING_PROFILE_SPECIFIER`. So you only
ever need to replace the base64 blob, never a name string.

### Renewing an expired certificate or profile

> ⚠️ **Unverified.** The GitHub-side facts above are read directly from the
> workflow and are reliable. The developer.apple.com steps below are a
> best-effort outline written without access to the Apple Developer account, and
> Apple changes this portal regularly. **Whoever performs the next renewal:
> please correct this section as you go.**

Apple distribution certificates last 1 year and provisioning profiles expire with
them. When a release build starts failing to sign, roughly:

1. On developer.apple.com → **Certificates, Identifiers & Profiles**:
   - Revoke the expired **Apple Distribution** certificate.
   - Create a new one. This needs a Certificate Signing Request generated on a
     Mac (Keychain Access → Certificate Assistant → Request a Certificate From a
     Certificate Authority).
   - If you hit "maximum number of certificates reached", revoke an unused
     distribution certificate first.
2. Download the new certificate, open it in Keychain Access so it pairs with its
   private key, then export **both together** as a `.p12` with a password.
3. Under **Profiles**, delete the two expired MapSwipe App Store profiles and
   create new ones — one for `org.missingmaps.mapswipe`, one for
   `org.missingmaps.mapswipe-dev` — both distribution/App Store type, both using
   the new certificate. Download each `.mobileprovision`.
4. Update all four secrets in GitHub → Settings → Secrets and variables →
   Actions: `APPLE_CERTIFICATE_P12`, `APPLE_CERTIFICATE_PASSWORD`,
   `APPLE_PROVISIONING_PROFILE`, `APPLE_PROVISIONING_PROFILE_DEV`.
5. Verify with a **test release** rather than a production tag — push a
   `test-vX.Y.Z-bN` tag and confirm `test-ios.yml` signs and exports an IPA. See
   [deployment.md](deployment.md#test-releases).

---

## Next steps

- [architecture.md](architecture.md) — how the code is organised
- [workflow.md](workflow.md) — branching, PRs and releases
- [deployment.md](deployment.md) — cutting a release
- [upgrading-dependencies.md](upgrading-dependencies.md) — dependency and SDK upgrades
