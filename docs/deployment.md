# Deployment

MapSwipe Mobile releases are **tag-driven**, and [`deploy.sh`](../deploy.sh) at
the repo root is the supported way to cut one. It has **two modes**:

| Mode | Run from | Tag | CI it triggers |
| --- | --- | --- | --- |
| **production** | `develop` only | `vX.Y.Z` | staging build → **manual approval** → production release |
| **test** | any branch | `test-vX.Y.Z-bN` | **staging-only** build, no approval |

You type the **version** and **build number** by hand in both modes; the script
only warns on regressions and on version changes during test releases.

> ⚠️ A **production** tag starts a real dual-platform release whose production
> stage waits for a manual approval. A **test** tag only ever produces a staging
> build for internal testing.

---

## Running `deploy.sh`

```bash
./deploy.sh
```

Both modes share the same flow:

1. **Release type** — `1) production` or `2) test`.
2. **Preconditions** — checked up front; the script **aborts before changing
   anything** if they fail (see each mode below).
3. **Version** — free-form, validated as strict `X.Y.Z` (current value shown).
4. **Build number** — free-form integer (current value shown).
5. **Description** — one line; becomes the commit subject suffix and the tag's
   annotation message.
6. **Confirmation** — a summary box (plus any warnings) is shown; type `yes` to
   proceed, anything else aborts with no changes.

### What it changes (both modes)

| Action | Detail |
| --- | --- |
| Sets `version` | in `package.json`, `app.prod.json`, `app.staging.json` |
| Sets `ios.buildNumber` | in `app.prod.json`, `app.staging.json` |
| Commits | production: `release(vX.Y.Z): <desc>` · test: `test(vX.Y.Z-bN): <desc>` |
| Tags (annotated) | production: `vX.Y.Z` · test: `test-vX.Y.Z-bN` |
| Pushes | production: `develop` + tag · test: current branch + tag |

### Warnings (proceed on explicit `yes`)

1. **Version regression** — new version `<` current.
2. **Build regression** — same version and new build `≤` current (TestFlight /
   Play reject non-increasing builds within a version).
3. **Version change in test mode** — a test release that changes the version.
   That change lands on `develop` (directly if you're on it, or via merge from a
   feature branch); version bumps belong to production releases.

---

## Production releases

**Prerequisites** (all enforced by the script):

- On `develop`.
- Clean working tree.
- Local `develop` **exactly in sync** with `origin/develop` (not ahead, behind,
  or diverged) — `git pull` first if needed.
- The three version files already agree, and the target `vX.Y.Z` tag is unused.
- Push access to `origin` and permission to approve the `production` Environment.

### What happens after you push

The `vX.Y.Z` tag triggers **two** workflows in parallel:

- [`release-android.yml`](../.github/workflows/release-android.yml)
- [`release-ios.yml`](../.github/workflows/release-ios.yml)

Each runs in **two stages**:

```
tag vX.Y.Z pushed
        ├── release-android.yml : build-staging (staging) ──▶ build-production (production)
        │                                                        ▲ manual approval
        └── release-ios.yml     : build-staging (staging) ──▶ build-production (production)
                                                                 ▲ manual approval
```

**Stage 1 — Staging (automatic).**
- Android: signed staging APK (`org.missingmaps.mapswipe.dev`), published as a
  pre-release `vX.Y.Z-beta` with the APK attached.
- iOS: signed staging IPA uploaded as a workflow artifact.

**Stage 2 — Production (⚠️ requires manual approval).** `build-production`
targets the protected `production` Environment and will **not run until approved**:

1. Open the [Actions tab](https://github.com/toggle-corp/mapswipe-mobile/actions)
   and click into the running run for your tag.
2. The `build-production` job waits with a **“Review deployments”** button.
3. **Approve and deploy.** (iOS and Android are separate workflows — approve
   each.)

Once approved:
- Android: production APK (`org.missingmaps.mapswipe`) → final GitHub Release
  `vX.Y.Z` with the APK attached.
- iOS: production IPA uploaded as a workflow artifact — **download it and upload
  to App Store Connect manually** (no automatic TestFlight/App Store push yet).

---

## Test releases

For putting a build on a device without going through the production pipeline —
QA a feature branch, iterate on a TestFlight build, etc. Runs from **any branch**.

**Prerequisites:**

- Clean working tree.
- The target `test-vX.Y.Z-bN` tag is unused (re-using the same version + build
  number aborts — this is what stops duplicate builds).
- If the branch is **behind `origin/develop`**, the script **warns** ("N commits
  behind — testing against a stale base") and asks you to confirm; it does not
  block.

### What happens after you push

The `test-*` tag triggers the **staging-only** workflows (no production, no
approval):

- [`test-android.yml`](../.github/workflows/test-android.yml)
- [`test-ios.yml`](../.github/workflows/test-ios.yml)

Both build the **staging variant** (`APP_ENV=staging`, the `.dev` app, against
the staging database):

- **Android:** signed staging APK, published as a pre-release named after the tag
  (`test-vX.Y.Z-bN`) with the APK attached — download and sideload it.
- **iOS:** app-store IPA uploaded as a workflow artifact. **Download it and
  upload to TestFlight manually** (CI-side TestFlight upload is a planned
  follow-up). This is why you set the build number by hand — TestFlight requires
  it to increase for each upload of the same version.

### Keep `develop` clean

Test releases **commit** to your branch, so **squash-merge** the branch into
`develop` to collapse those `test(...)` commits. Note: squashing removes the
*commits* but keeps the *net file diff* — so the `buildNumber` value still lands
on `develop`. That's harmless (the next production release resets it via a fresh
version, and develop's CI only lint/typechecks). But a **version** change would
leak, which is exactly what warning #3 exists to catch — keep test releases to
build-number-only unless you mean it.

A test release run from `develop` itself commits straight to `develop` (no squash
to clean it up) — prefer a feature branch for iterative test builds.

---

## Rolling back / fixing a mistake

The tag triggers everything, so undoing a release means removing the tag (and any
releases it created). For production, do this **before** approving the prod stage:

```bash
# production
git tag -d vX.Y.Z && git push origin :refs/tags/vX.Y.Z
gh release delete vX.Y.Z-beta --yes
gh release delete vX.Y.Z --yes

# test
git tag -d test-vX.Y.Z-bN && git push origin :refs/tags/test-vX.Y.Z-bN
gh release delete test-vX.Y.Z-bN --yes
```

To cancel only the production build, **reject** the deployment in the Actions
"Review deployments" dialog instead.

---

## Known gaps

- **Release notes:** GitHub Release bodies come from a hardcoded template in the
  workflows — your `deploy.sh` description is **not** included there (it lives in
  the commit and tag).
- **iOS uploads are manual:** both production and test IPAs are workflow
  artifacts; there's no automated TestFlight/App Store Connect upload yet.
- **Android `versionCode`:** neither app config sets `android.versionCode`, so
  Expo prebuild uses its default (`1`). Google Play rejects re-uploads with a
  non-incrementing `versionCode` — set/increment it before shipping to Play.
- **Test-tag cleanup:** test pre-releases/tags accumulate; prune them manually
  for now.
