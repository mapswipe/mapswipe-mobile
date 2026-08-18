# Building a release-mode APK locally

Day-to-day development uses a **debug** build: the JS bundle is served live by
Metro, dev tooling is attached, and everything is unminified and slow. A
**release** build bundles the JS into the APK, enables minification, and drops
the dev tooling — it behaves like the app users actually get.

This page is about producing that build **on your own machine, for your own
use**. It is not how MapSwipe ships.

> **Releases are not cut from a laptop.** Real releases are tag-driven and built
> in GitHub Actions — see [deployment.md](deployment.md). Nothing you build here
> can be distributed: it isn't signed with a MapSwipe key.

Android only. For iOS, an equivalent local check is a Release-configuration build
from Xcode; see [develop-ios.md](develop-ios.md).

---

## When you'd want one

- **Performance work.** Debug builds are dramatically slower. Any judgement about
  jank, list scrolling, map rendering or startup time made against a debug build
  is meaningless.
- **Catching release-only breakage.** Minification and dead-code elimination only
  run in release, and can surface bugs that never appear in development.
- **Handing an APK to someone.** A teammate or tester can sideload it without
  running Metro.
- **Reproducing a bug that only happens in the released app.**

---

## Building

```sh
pnpm build:release
```

That runs three steps, defined in [`package.json`](../package.json):

1. `expo prebuild` — regenerates `android/` from the app config.
2. `cd android && ./gradlew assembleRelease` — builds the APK.
3. `scripts/copy-apk.ts release` — copies the result to `generated/` with the
   current short commit SHA in the filename.

The output lands at:

```
generated/app-release-<git-sha>.apk
```

The SHA in the name is deliberate — it tells you which commit an APK came from
once it's sitting in someone's Downloads folder.

There's also `pnpm build:debug`, which does the same with `assembleDebug` and
produces `generated/app-debug-<git-sha>.apk`. That's useful for handing someone a
build that still has dev tooling, but it is **not** a substitute for a release
build when measuring performance.

### Staging vs production

The prebuild step reads `APP_ENV`, exactly as elsewhere:

```sh
# production app: org.missingmaps.mapswipe, production Firebase
pnpm build:release

# staging app: org.missingmaps.mapswipe.dev, staging Firebase
APP_ENV=staging pnpm build:release
```

Different package names, so both can be installed side by side.

Which backend the build actually talks to comes from the `EXPO_PUBLIC_*` values
in your `.env.local` at build time, **not** from `APP_ENV` — `APP_ENV` only
selects `app.staging.json` vs `app.prod.json` (name, scheme, package/bundle ID,
icons). If your `.env.local` holds staging Firebase credentials, a
`pnpm build:release` without `APP_ENV` produces something branded as production
that talks to staging. Worth being deliberate about before you hand the APK to
anyone.

### Installing it

```sh
adb install -r generated/app-release-<sha>.apk
```

If `adb` refuses with a signature mismatch, uninstall the existing app first —
you can't upgrade across a change of signing key:

```sh
adb uninstall org.missingmaps.mapswipe.dev
```

---

## About signing

`expo prebuild` generates an `android/app/build.gradle` whose `release` build
type is signed with the **debug keystore**
([`android/app/build.gradle:115`](../android/app/build.gradle#L115), with an
upstream comment saying as much). So a local `pnpm build:release` produces a
*release-mode* APK signed with a *debug* key.

That's fine for everything on this page, and it's why no keystore setup is
needed. But it does mean:

- **It cannot be distributed.** Google Play rejects debug-signed APKs, and it
  isn't a MapSwipe build in any meaningful sense.
- **It won't upgrade over an installed CI build**, and vice versa — different
  signing keys. Uninstall first.
- **It's not a signing test.** If you're debugging a signing problem, you have to
  reproduce it in CI.

The real keystores never leave GitHub Actions secrets
(`ANDROID_STAGING_KEYSTORE_BASE64`, `ANDROID_PRODUCTION_KEYSTORE_BASE64` and
their passwords, injected as gradle properties in
[`release-android.yml`](../.github/workflows/release-android.yml)). There is no
supported path for signing with them locally, and you shouldn't need one: to get
a properly signed build onto a device, push a **test release** tag and download
the APK from the resulting GitHub pre-release. See
[deployment.md](deployment.md#test-releases) — that's the intended route, and
it's usually faster than building locally anyway.

---

## Troubleshooting

Release builds fail in different ways to debug builds. The build itself is
mostly the same Gradle path as Android development, so start with the
[Android troubleshooting steps](develop-android.md#when-things-break):

```sh
pnpm clean:gradle
pnpm prebuild:clean
```

Release-specific:

- **Builds fine, crashes on launch.** Usually minification stripping something
  reflected at runtime. Get the stack trace with
  `adb logcat | grep -i mapswipe`.
- **`generated/` is empty, but Gradle said BUILD SUCCESSFUL.** The copy step
  looks for `android/app/build/outputs/apk/release/app-release.apk`. If Gradle
  produced split APKs or an AAB instead, the path won't match.
- **Blank screen where debug worked.** The JS bundle is baked in at build time —
  a build made with a broken `.env.local` stays broken. Rebuild after fixing it.

---

## See also

- [deployment.md](deployment.md) — how releases are actually cut
- [develop-android.md](develop-android.md) — Android environment setup
- [workflow.md](workflow.md) — when to cut a test release vs a production one
