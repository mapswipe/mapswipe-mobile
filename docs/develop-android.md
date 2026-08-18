# Setting up a development environment for Android

*Note*: this page assumes some flavour of Linux or macOS. On Windows, WSL2 works;
adjust paths accordingly.

**Read this whole page before starting.** In particular, read
[Never edit `android/` by hand](#never-edit-android-by-hand) — it's the one thing
that reliably catches people out on this codebase.

---

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | **22** | Pinned in `package.json` `engines`. Use `nvm`/`fnm`. |
| pnpm | **10.6.1** | Pinned via `packageManager`. `corepack enable` picks it up automatically. |
| JDK | **17** | Temurin is what CI uses. Newer JDKs will fail the Gradle build. |
| Android SDK | platform 36 | Via Android Studio, or `sdkmanager` standalone. |

This project uses **pnpm**, not npm or yarn. `npm install` will produce a broken
tree — the repo relies on pnpm's `patchedDependencies` and `nodeLinker: hoisted`
settings in [`pnpm-workspace.yaml`](../pnpm-workspace.yaml).

### Android SDK

Install [Android Studio](https://developer.android.com/studio) and, from its SDK
Manager, the SDK platform and build tools for **API 36** (the `compileSdkVersion`
/ `targetSdkVersion` set in the app config).

Set `ANDROID_HOME` and put the platform tools on your `PATH` — add to
`~/.bashrc`, `~/.zshrc` or equivalent:

```sh
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
```

Accept the licences once:

```sh
yes | sdkmanager --licenses
```

Verify `adb` can see a device or running emulator:

```sh
adb devices
```

For a physical phone, [enable developer options and USB
debugging](https://developer.android.com/studio/debug/dev-options). For an
emulator, create an AVD from Android Studio's Device Manager.

> Do **not** open `android/` in Android Studio to develop. You need Android
> Studio for the SDK and emulator; the code you edit lives in `app/`,
> `components/` and the rest of the TypeScript tree.

---

## Getting the code

The repo has two submodules (`backend/` and `firebase/`) and won't build without
them:

```sh
git clone --recurse-submodules git@github.com:mapswipe/mapswipe-mobile.git
cd mapswipe-mobile
```

Already cloned without them?

```sh
git submodule update --init --recursive
```

Install dependencies:

```sh
pnpm install
```

---

## Configuration

All runtime configuration comes from `EXPO_PUBLIC_*` environment variables. Copy
the template:

```sh
cp .env.example .env.local
```

You then need real values. `.env.local` is gitignored and is **not** in the repo
— ask a project maintainer for the staging values, which point at the
development Firebase instance and the staging GraphQL API. (Contacts are listed
on [mapswipe.org](https://mapswipe.org/get-involved.html).)

| Variable | What it's for |
| --- | --- |
| `EXPO_PUBLIC_FIREBASE_*` | Firebase project config — auth and the Realtime Database. |
| `EXPO_PUBLIC_GRAPHQL_ENDPOINT` | The stats/community-dashboard GraphQL API. |
| `EXPO_PUBLIC_GRAPHQL_CODEGEN_ENDPOINT` | Schema source for type generation. Can be a URL, or the local path `./backend/schema.graphql` (what CI uses). |
| `EXPO_PUBLIC_COMMUNITY_DASHBOARD_URL` | Link target for the community dashboard. |
| `EXPO_PUBLIC_REFERRER_ENDPOINT` | Sent as the `Referer` header on GraphQL requests; the API rejects requests without it. |
| `EXPO_PUBLIC_OSM_AUTH_URL` | Base URL of the OSM OAuth cloud functions — see [osm-login.md](osm-login.md). |

There is no `google-services.json` in this project. Firebase is configured
entirely through those variables via the Firebase JS SDK.

### Generate GraphQL types

```sh
pnpm generate:type
```

Writes `generated/types/graphql.ts`. Typechecking and linting will fail without
it (`pnpm lint` runs it first automatically via `prelint`).

---

## Running the app

```sh
pnpm android
```

That's `expo run:android` — it runs `expo prebuild` to generate `android/`,
builds a debug APK, installs it, and starts the Metro bundler. **The first run
takes a long time** (Gradle downloading the world); subsequent runs are much
faster.

Once it's installed, you usually only need the bundler:

```sh
pnpm start
```

Press `a` to launch on Android. You only need to re-run `pnpm android` when
native dependencies or the app config change.

If the device can't reach the bundler over USB:

```sh
adb reverse tcp:8081 tcp:8081
```

### Dev menu and debugging

Shake the device, or:

```sh
adb shell input keyevent 82
```

From there you can open React DevTools and the JS debugger. `j` in the Metro
terminal opens the debugger directly. See the
[Expo debugging docs](https://docs.expo.dev/debugging/tools/).

### Production-flavoured builds

`pnpm android` builds the **production** variant by default. For the staging app
(`.dev` package, staging Firebase):

```sh
APP_ENV=staging pnpm android
```

The two install side by side — different package names — so you can keep both on
one device.

---

## Never edit `android/` by hand

`android/` and `ios/` are **gitignored generated output**. `expo prebuild`
recreates them from `app.config.js` (which selects `app.staging.json` or
`app.prod.json`), and `expo prebuild --clean` deletes them first. Any manual edit
is silently thrown away on the next prebuild, and since the directory isn't in
git, nobody will ever see the change.

To change native behaviour, use one of:

- **App config** — permissions, icons, splash, SDK versions, plugin options go in
  `app.staging.json` / `app.prod.json`.
- **A config plugin** — anything that requires editing a generated native file.
  See [`plugins/`](../plugins/) for two worked examples
  (`strip-unused-permissions.cjs` edits `AndroidManifest.xml`;
  `disable-liquid-glass.cjs` edits `AppDelegate.swift`). Register new plugins in
  the `plugins` array of both app config files.

---

## Checks

There is **no test suite** in this repository. CI runs static checks only, and
so should you before opening a PR:

```sh
pnpm check        # typecheck + lint
pnpm lint:fix     # autofix what's fixable
pnpm lint:unused  # knip — unused files, exports and dependencies
```

`pnpm check` and `pnpm lint:unused` are exactly what
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs.

---

## When things break

Most Android build problems are stale generated state. In escalating order:

```sh
pnpm clean:gradle    # gradle clean
pnpm prebuild:clean  # delete and regenerate android/ + ios/
pnpm clean:all       # delete android/, ios/ and generated/
rm -rf node_modules && pnpm install
pnpm start --clear   # clear the Metro cache
```

Because the native directories are disposable, `pnpm clean:build` followed by a
fresh `pnpm android` is a cheap and usually effective reset.

Other common cases:

- **Codegen fails / GraphQL types missing** — `backend/` submodule not
  initialised, or `EXPO_PUBLIC_GRAPHQL_CODEGEN_ENDPOINT` unset.
- **Gradle fails on an unsupported class file version** — you're not on JDK 17.
- **App installs but shows a blank screen** — `.env.local` values are missing or
  wrong; check the Metro output.

---

## Next steps

- [architecture.md](architecture.md) — how the code is organised
- [workflow.md](workflow.md) — branching, PRs and releases
- [dev-release.md](dev-release.md) — building a release-mode APK locally
- [upgrading-dependencies.md](upgrading-dependencies.md) — dependency and SDK upgrades
- [deployment.md](deployment.md) — cutting a real release
