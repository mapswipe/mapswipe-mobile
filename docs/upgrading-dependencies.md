# Upgrading dependencies and tools

Notes on keeping this project's dependencies current. The tricky parts here are
specific to how MapSwipe is put together — Expo config plugins, a patched
dependency, two git submodules, and generated GraphQL types — so this page
concentrates on those and links out for the generic steps.

**Everything goes through `pnpm`.** Never `npm install` or `yarn` in this repo:
[`pnpm-workspace.yaml`](../pnpm-workspace.yaml) declares `nodeLinker: hoisted`
and a `patchedDependencies` entry, neither of which other package managers honour.
pnpm 10.6.1 and Node 22 are pinned in `package.json`; `corepack enable` gets you
the right pnpm.

---

## Routine dependency bumps

```sh
pnpm outdated              # what's behind
pnpm update <pkg>          # within the existing semver range
pnpm add <pkg>@latest      # jump a major
pnpm check                 # typecheck + lint
pnpm lint:unused           # knip: is anything now unused?
```

For anything with a native component (maplibre, reanimated, gesture-handler,
svg, webview, screens…), a passing typecheck proves nothing. Rebuild:

```sh
pnpm prebuild:clean
pnpm android     # and pnpm ios, if you have a Mac
```

**Never bump an `expo-*` package or `react-native` directly.** Their versions are
tied to the Expo SDK — see [Expo SDK upgrades](#expo-sdk-upgrades) below. If you
need to move one, use `npx expo install`, which resolves the version compatible
with the installed SDK rather than the newest published:

```sh
npx expo install expo-image
```

Run the doctor afterwards. It catches version skew that nothing else will:

```sh
npx expo-doctor
```

---

## The patched dependency

[`@togglecorp/re-map`](https://www.npmjs.com/package/@togglecorp/re-map) carries a
local patch, wired up in `pnpm-workspace.yaml`:

```yaml
patchedDependencies:
  '@togglecorp/re-map': patches/@togglecorp__re-map.patch
```

If you upgrade that package and the patch no longer applies, `pnpm install` fails
loudly — which is the good case. To regenerate it:

```sh
pnpm patch @togglecorp/re-map     # prints a temp dir
# edit the files in that directory
pnpm patch-commit <that-dir>      # rewrites patches/@togglecorp__re-map.patch
```

Before regenerating, check whether the upstream fix has landed — if it has, drop
the `patchedDependencies` entry and delete the patch file instead of carrying it
forward.

---

## Expo SDK upgrades

The big one. Expo publishes a canonical, version-specific upgrade guide, and it
changes every release, so it isn't reproduced here:

**→ [Expo SDK upgrade guides](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)**

Read the release notes for the target SDK first, especially for React Native
version changes and New Architecture notes — this app runs with
`newArchEnabled: true`.

The mechanical part is short:

```sh
git switch -c chore/expo-sdk-<version>
pnpm check                  # confirm you're starting from green
npx expo install expo@^<version> --fix
npx expo install --fix      # realign every other expo-* package
npx expo-doctor
```

What that guide *won't* tell you is the MapSwipe-specific follow-up:

1. **Re-verify the config plugins.** [`plugins/`](../plugins/) patch generated
   native files by string-matching their contents, so an SDK bump can silently
   break them — the plugin still runs, just no longer matches anything.
   - `disable-liquid-glass.cjs` looks for a specific `return super.application(…)`
     line in `AppDelegate.swift`. It carries a `FIXME` to delete it once
     `react-native-screens` handles iOS 26 Liquid Glass natively — **check
     whether that's now true** and remove it if so.
   - `strip-unused-permissions.cjs` rewrites `AndroidManifest.xml`. After
     prebuilding, confirm the permissions really are gone:
     ```sh
     grep uses-permission android/app/src/main/AndroidManifest.xml
     ```
2. **Regenerate the native projects from scratch.** Incremental prebuilds hide
   template changes:
   ```sh
   pnpm clean:all
   pnpm prebuild
   ```
3. **Check the app config against the new template.** Compare
   `app.staging.json` / `app.prod.json` against a scratch `npx create-expo-app`
   on the new SDK — `expo-build-properties` values (`compileSdkVersion`,
   `targetSdkVersion`), the splash screen config and plugin option shapes all
   drift between releases.
4. **Build both platforms on a device.** A green typecheck says nothing about
   whether MapLibre still renders. Exercise a real mapping session, not just the
   login screen.
5. **Check CI's toolchain assumptions.** The workflows pin JDK 17, Node 22 and
   Xcode 26.x. A new SDK may require newer — update
   [`.github/workflows/`](../.github/workflows/) in the same PR, and prove it
   with a [test release](deployment.md#test-releases) before merging.

Upgrade one SDK major at a time, in its own PR, with nothing else in it.

---

## Submodules

`backend/` and `firebase/` are pinned to specific commits. To move them:

```sh
git submodule update --remote backend
pnpm generate:type          # schema may have changed
pnpm check
git add backend && git commit -m "chore: bump backend submodule"
```

The commit pointer is part of the repo's state, so a submodule bump is a real
change that belongs in a PR like any other.

`backend/schema.graphql` feeds GraphQL codegen. If the schema changed
incompatibly, `pnpm check` fails against `generated/types/graphql.ts` — that's
the intended signal. Fix the queries; don't hand-edit generated output.

`firebase/functions/generated/tsfirebase/` supplies the Firebase model types
imported through the `@/firebaseGenerated/*` alias, so a `firebase/` bump can
change types across the app too.

---

## Android and iOS toolchains

Because `android/` and `ios/` are regenerated by `expo prebuild`, there is no
Gradle wrapper or Podfile in this repo to upgrade by hand — Expo's template owns
them, and they move with the SDK. What you *can* control:

- **SDK levels** — `expo-build-properties` in the app config
  (`compileSdkVersion` / `targetSdkVersion`, currently 36). Bump when Google's
  Play Store deadline requires it; test on a device, since target SDK bumps
  change runtime permission behaviour.
- **JDK** — 17, matching CI.
- **Xcode** — 26.x, matching what `release-ios.yml` selects.

There is no fastlane, no CocoaPods `Gemfile` and no bundler in this project. Pods
are installed by prebuild.

---

## After any significant upgrade

```sh
pnpm check
pnpm lint:unused
pnpm prebuild:clean && pnpm android
```

Then push a [test release](deployment.md#test-releases) tag and install the
resulting APK on a real device. CI builds differently to your laptop — a clean
checkout, a different keystore, `--frozen-lockfile` — and that's where upgrade
breakage tends to actually show up.

---

## See also

- [develop-android.md](develop-android.md) / [develop-ios.md](develop-ios.md) — environment setup
- [architecture.md](architecture.md#native-code) — why the native directories are disposable
- [deployment.md](deployment.md) — verifying an upgrade through CI
