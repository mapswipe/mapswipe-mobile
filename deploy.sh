#!/usr/bin/env bash
#
# deploy.sh — cut a MapSwipe Mobile release.
#
# Two modes:
#
#   production  — only from `develop`. Bumps version + build number, commits as
#                 "release(vX.Y.Z): <desc>", tags `vX.Y.Z`, pushes develop + tag.
#                 The tag triggers the production iOS + Android pipelines
#                 (staging build → manual approval → production release).
#
#   test        — from any branch. Same version/build edits, commits as
#                 "test(vX.Y.Z-bN): <desc>", tags `test-vX.Y.Z-bN`, pushes the
#                 current branch + tag. The tag triggers the staging-only test
#                 pipelines (no production, no approval). Squash these commits
#                 away when the branch merges into develop.
#
# You type the version and build number by hand in both modes; the script only
# warns on regressions and on version changes during test releases.

set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────
REMOTE="origin"
DEVELOP_BRANCH="develop"
VERSION_FILES=(package.json app.prod.json app.staging.json)
BUILDNUMBER_FILES=(app.prod.json app.staging.json)
VERSIONCODE_FILES=(app.prod.json app.staging.json)   # android.versionCode, derived from version+build
CHANGELOG_FILE="changeLog.json"                      # in-app "What's new" entries, keyed by X.Y.Z

# ── Pretty output ───────────────────────────────────────────────────────
if [[ -t 1 ]]; then
    BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'
    RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'
    BLUE=$'\033[34m'; CYAN=$'\033[36m'
else
    BOLD=""; DIM=""; RESET=""; RED=""; GREEN=""; YELLOW=""; BLUE=""; CYAN=""
fi

info()  { printf '%s➜%s  %s\n'   "$BLUE"   "$RESET" "$1"; }
ok()    { printf '%s✓%s  %s\n'   "$GREEN"  "$RESET" "$1"; }
warn()  { printf '%s!%s  %s\n'   "$YELLOW" "$RESET" "$1"; }
die()   { printf '\n%s✗ %s%s\n\n' "$RED$BOLD" "$1" "$RESET" >&2; exit 1; }
rule()  { printf '%s────────────────────────────────────────────────────%s\n' "$DIM" "$RESET"; }

# Ask a yes/no question; abort unless the answer is exactly "yes".
confirm_or_die() {
    local prompt="$1" answer
    read -rp "$(printf '%s%s%s ' "$BOLD" "$prompt" "$RESET")" answer
    [[ "$answer" == "yes" ]] || die "Aborted. Nothing was changed."
}

# ── Small JSON helper (node is guaranteed in this repo) ──────────────────
# Usage: jget <file> <dotted.path>
jget() {
    node -pe "'$2'.split('.').reduce((a,k)=>a[k],require('./$1'))"
}

# ── Semver helpers (base-10 to avoid octal on leading zeros) ─────────────
# ver_lt A B  -> exit 0 if A < B
ver_lt() {
    local IFS=. a b i
    read -ra a <<< "$1"; read -ra b <<< "$2"
    for i in 0 1 2; do
        (( 10#${a[i]} < 10#${b[i]} )) && return 0
        (( 10#${a[i]} > 10#${b[i]} )) && return 1
    done
    return 1
}

# ── 0. Run from the repo root ────────────────────────────────────────────
cd "$(git rev-parse --show-toplevel)"

printf '\n%s%sMapSwipe Mobile — Release%s\n' "$BOLD" "$CYAN" "$RESET"
rule

# ── 1. Mode selection ────────────────────────────────────────────────────
current_branch="$(git rev-parse --abbrev-ref HEAD)"

printf '%sRelease type%s\n' "$BOLD" "$RESET"
printf '  %s1)%s production  %s(develop only — triggers staging → prod approval)%s\n' "$CYAN" "$RESET" "$DIM" "$RESET"
printf '  %s2)%s test        %s(any branch — staging-only build, no approval)%s\n'    "$CYAN" "$RESET" "$DIM" "$RESET"
read -rp "$(printf '%sSelect [1-2]:%s ' "$BOLD" "$RESET")" mode_choice
case "$mode_choice" in
    1) mode="production" ;;
    2) mode="test" ;;
    *) die "Invalid selection: '$mode_choice'." ;;
esac
ok "Mode: $BOLD$mode$RESET  (branch: $current_branch)"

# ── 2. Preconditions ─────────────────────────────────────────────────────
info "Checking preconditions…"

if [[ "$mode" == "production" && "$current_branch" != "$DEVELOP_BRANCH" ]]; then
    die "Production releases must be cut from '$DEVELOP_BRANCH' (you are on '$current_branch')."
fi

dirty="$(git status --porcelain)"
if [[ -n "$dirty" ]]; then
    printf '%s\n' "$dirty" >&2
    die "Working tree is not clean. Commit or stash the changes above first."
fi

info "Fetching $REMOTE…"
git fetch --quiet "$REMOTE"

git rev-parse --verify --quiet "$REMOTE/$DEVELOP_BRANCH" >/dev/null \
    || die "$REMOTE/$DEVELOP_BRANCH not found."

if [[ "$mode" == "production" ]]; then
    # develop must exactly match origin/develop.
    read -r behind ahead < <(git rev-list --left-right --count "$REMOTE/$DEVELOP_BRANCH...$DEVELOP_BRANCH")
    if (( behind > 0 && ahead > 0 )); then
        die "Local '$DEVELOP_BRANCH' has diverged from $REMOTE/$DEVELOP_BRANCH ($behind behind, $ahead ahead). Reconcile first."
    elif (( behind > 0 )); then
        die "Local '$DEVELOP_BRANCH' is $behind commit(s) behind $REMOTE/$DEVELOP_BRANCH. Run 'git pull' first."
    elif (( ahead > 0 )); then
        die "Local '$DEVELOP_BRANCH' is $ahead commit(s) ahead of $REMOTE/$DEVELOP_BRANCH (unpushed commits). Push or reset first."
    fi
    ok "On '$DEVELOP_BRANCH', clean, and in sync with $REMOTE/$DEVELOP_BRANCH."
else
    # Test: warn (don't block) if the branch is behind the latest develop.
    behind="$(git rev-list --count "HEAD..$REMOTE/$DEVELOP_BRANCH")"
    if (( behind > 0 )); then
        warn "This branch is $behind commit(s) behind $REMOTE/$DEVELOP_BRANCH — your test build is against a stale base."
        confirm_or_die "Continue anyway? Type 'yes':"
    else
        ok "Clean and up to date with $REMOTE/$DEVELOP_BRANCH."
    fi
fi

# ── 3. Version drift guard ───────────────────────────────────────────────
current_version="$(jget package.json version)"
prod_version="$(jget app.prod.json expo.version)"
staging_version="$(jget app.staging.json expo.version)"

if [[ "$current_version" != "$prod_version" || "$current_version" != "$staging_version" ]]; then
    warn "package.json    : $current_version"
    warn "app.prod.json   : $prod_version"
    warn "app.staging.json: $staging_version"
    die "Version files disagree. Fix the drift before releasing."
fi
[[ "$current_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] \
    || die "Current version '$current_version' is not a valid X.Y.Z semver."

current_build="$(jget app.prod.json expo.ios.buildNumber)"
ok "Current: version $BOLD$current_version$RESET, build $BOLD$current_build$RESET."

# ── 4. New version + build number (free-form) ────────────────────────────
printf '\n'
read -rp "$(printf '%sNew version%s [current: %s]: ' "$BOLD" "$RESET" "$current_version")" new_version
[[ "$new_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] \
    || die "Version must be strict semver X.Y.Z (got '$new_version')."

read -rp "$(printf '%sNew build number%s [current: %s]: ' "$BOLD" "$RESET" "$current_build")" new_build
[[ "$new_build" =~ ^[0-9]+$ ]] \
    || die "Build number must be a non-negative integer (got '$new_build')."

# Android versionCode: one monotonic integer derived from version + build, using
# the legacy MapSwipe scheme (major*1000000 + minor*10000 + patch*100 + build).
# The 1e6 scale keeps 3.x codes above the old 2.x app already live on Play.
# Assumes minor, patch and build each stay < 100 (10# forces base-10 on zeros).
IFS=. read -r vc_major vc_minor vc_patch <<< "$new_version"
new_version_code=$(( 10#$vc_major * 1000000 + 10#$vc_minor * 10000 + 10#$vc_patch * 100 + 10#$new_build ))

read -rp "$(printf '%sOne-line release description:%s ' "$BOLD" "$RESET")" description
description="${description#"${description%%[![:space:]]*}"}"   # ltrim
description="${description%"${description##*[![:space:]]}"}"     # rtrim
[[ -n "$description" ]] || die "Release description cannot be empty."

# ── 5. Compute tag + collision check ─────────────────────────────────────
if [[ "$mode" == "production" ]]; then
    tag="v$new_version"
    commit_subject="release($tag): $description"
    push_target="$DEVELOP_BRANCH"
else
    tag="test-v$new_version-b$new_build"
    commit_subject="test(v$new_version-b$new_build): $description"
    push_target="$current_branch"
fi

if git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then
    die "Tag '$tag' already exists locally."
fi
if [[ -n "$(git ls-remote --tags "$REMOTE" "refs/tags/$tag")" ]]; then
    die "Tag '$tag' already exists on $REMOTE."
fi

# ── 6. Changelog entry ───────────────────────────────────────────────────
# changeLog.json is keyed by X.Y.Z; the in-app "What's new" modal shows the
# entry whose key matches expo.version. Gather the bullets now, in $EDITOR
# (one per line). If v$new_version already has an entry we pre-fill its bullets
# so you can edit them; otherwise you start from an empty list. The file is
# written and committed with the version bump in step 9.
info "Preparing changelog for v$new_version…"

existing_changes="$(node -e '
    const fs = require("fs");
    const [file, version] = process.argv.slice(1);
    let data = {};
    try { data = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) {}
    const entry = data[version];
    if (entry && Array.isArray(entry.changes)) {
        process.stdout.write(entry.changes.join("\n"));
    }
' -- "$CHANGELOG_FILE" "$new_version")"

if [[ -n "$existing_changes" ]]; then
    changelog_state="edited"
else
    changelog_state="new"
fi

changelog_tmp="$(mktemp "${TMPDIR:-/tmp}/mapswipe-changelog.XXXXXX")"
trap 'rm -f "$changelog_tmp"' EXIT

{
    if [[ -n "$existing_changes" ]]; then
        printf '%s\n' "$existing_changes"
    fi
    printf '\n'
    printf '# ── Changelog for v%s ──\n' "$new_version"
    if [[ -n "$existing_changes" ]]; then
        printf '# v%s already exists in %s — its bullets are pre-filled above.\n' "$new_version" "$CHANGELOG_FILE"
        printf '# Edit them, then save and close to finalize.\n'
    else
        printf '# New version. Add one user-facing bullet per line above.\n'
    fi
    printf '#\n'
    printf '# One sentence per line. Blank lines and lines starting with "#"\n'
    printf '# are ignored. Save an empty file to abort the release.\n'
} > "$changelog_tmp"

# Resolve an editor the way git does (VISUAL/EDITOR, then git's configured one).
changelog_editor="${VISUAL:-${EDITOR:-}}"
if [[ -z "$changelog_editor" ]]; then
    changelog_editor="$(git var GIT_EDITOR 2>/dev/null || true)"
fi
[[ -n "$changelog_editor" ]] || changelog_editor="vi"

info "Opening $changelog_editor…"
eval "$changelog_editor \"\$changelog_tmp\""

# Strip comments/blank lines and trim what remains into an array of bullets.
changelog_entries=()
while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line#"${line%%[![:space:]]*}"}"   # ltrim
    line="${line%"${line##*[![:space:]]}"}"     # rtrim
    if [[ -z "$line" || "$line" == \#* ]]; then
        continue
    fi
    changelog_entries+=("$line")
done < "$changelog_tmp"

(( ${#changelog_entries[@]} > 0 )) \
    || die "No changelog entries provided. Aborted. Nothing was changed."

# JSON-encode the bullets now (NUL-delimited stdin keeps quotes/dashes intact);
# written into $CHANGELOG_FILE under the "$new_version" key in step 9.
changelog_changes_json="$(printf '%s\0' "${changelog_entries[@]}" | node -e '
    const chunks = [];
    process.stdin.on("data", (d) => chunks.push(d));
    process.stdin.on("end", () => {
        const parts = Buffer.concat(chunks).toString("utf8").split("\0");
        parts.pop();   // trailing empty field after the final NUL
        process.stdout.write(JSON.stringify(parts));
    });
')"

if (( ${#changelog_entries[@]} == 1 )); then changelog_word="entry"; else changelog_word="entries"; fi
ok "Changelog: ${#changelog_entries[@]} $changelog_word for v$new_version ($changelog_state)."

# ── 7. Warnings ──────────────────────────────────────────────────────────
warnings=()
if ver_lt "$new_version" "$current_version"; then
    warnings+=("Version $new_version is LOWER than current $current_version (version regression).")
elif [[ "$new_version" == "$current_version" ]] && (( 10#$new_build <= 10#$current_build )); then
    warnings+=("Same version, but build $new_build ≤ current $current_build — TestFlight/Play reject non-increasing builds.")
fi
if [[ "$mode" == "test" && "$new_version" != "$current_version" ]]; then
    warnings+=("Test release changes the version. This lands on '$DEVELOP_BRANCH' (directly, or via merge) — version bumps belong to production releases.")
fi
if (( 10#$vc_minor >= 100 || 10#$vc_patch >= 100 || 10#$new_build >= 100 )); then
    warnings+=("versionCode formula assumes minor/patch/build < 100; a component is ≥ 100, so the derived code ($new_version_code) may collide with a neighbouring version. Revisit the scheme.")
fi

# ── 8. Summary + confirm ─────────────────────────────────────────────────
printf '\n%s%s┌─ Release summary ─────────────────────────────────┐%s\n' "$BOLD" "$CYAN" "$RESET"
printf   '%s│%s  mode         %s%s%s\n'                "$CYAN" "$RESET" "$BOLD" "$mode" "$RESET"
printf   '%s│%s  branch       %s\n'                    "$CYAN" "$RESET" "$current_branch"
printf   '%s│%s  version      %s → %s%s%s\n'           "$CYAN" "$RESET" "$current_version" "$BOLD" "$new_version" "$RESET"
printf   '%s│%s  buildNumber  %s → %s%s%s\n'           "$CYAN" "$RESET" "$current_build" "$BOLD" "$new_build" "$RESET"
printf   '%s│%s  versionCode  %s%s%s  %s(android, derived)%s\n' "$CYAN" "$RESET" "$BOLD" "$new_version_code" "$RESET" "$DIM" "$RESET"
printf   '%s│%s  changelog    %s%s %s%s  %s(%s)%s\n'   "$CYAN" "$RESET" "$BOLD" "${#changelog_entries[@]}" "$changelog_word" "$RESET" "$DIM" "$changelog_state" "$RESET"
printf   '%s│%s  commit       %s%s%s\n'                "$CYAN" "$RESET" "$DIM" "$commit_subject" "$RESET"
printf   '%s│%s  tag          %s%s%s  (annotated)\n'   "$CYAN" "$RESET" "$BOLD" "$tag" "$RESET"
printf   '%s│%s  push         %s → %s\n'               "$CYAN" "$RESET" "$push_target" "$REMOTE"
printf '%s%s└───────────────────────────────────────────────────┘%s\n' "$BOLD" "$CYAN" "$RESET"

if (( ${#warnings[@]} > 0 )); then
    printf '\n'
    for w in "${warnings[@]}"; do warn "$w"; done
fi

if [[ "$mode" == "production" ]]; then
    printf '\n%s%s⚠  Pushing %s triggers the PRODUCTION iOS + Android builds.%s\n' "$YELLOW" "$BOLD" "$tag" "$RESET"
else
    printf '\n%s%sℹ  Pushing %s triggers STAGING-ONLY test builds (no production).%s\n' "$YELLOW" "$BOLD" "$tag" "$RESET"
fi
printf '\n'

confirm_or_die "Type 'yes' to proceed:"

# ── 9. Apply changes ─────────────────────────────────────────────────────
# `version` appears exactly once per file; `buildNumber` once per app config.
info "Setting version to $new_version…"
for f in "${VERSION_FILES[@]}"; do
    perl -i -pe 's/("version"\s*:\s*")[0-9]+\.[0-9]+\.[0-9]+(")/${1}'"$new_version"'${2}/' "$f"
done

info "Setting ios.buildNumber to $new_build…"
for f in "${BUILDNUMBER_FILES[@]}"; do
    perl -i -pe 's/("buildNumber"\s*:\s*")[^"]*(")/${1}'"$new_build"'${2}/' "$f"
done

info "Setting android.versionCode to $new_version_code…"
for f in "${VERSIONCODE_FILES[@]}"; do
    perl -i -pe 's/("versionCode"\s*:\s*)[0-9]+/${1}'"$new_version_code"'/' "$f"
done

info "Writing changelog for v$new_version to $CHANGELOG_FILE…"
node -e '
    const fs = require("fs");
    const [file, version, changesJson] = process.argv.slice(1);
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    data[version] = { changes: JSON.parse(changesJson) };
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
' -- "$CHANGELOG_FILE" "$new_version" "$changelog_changes_json"

info "Committing…"
git add "${VERSION_FILES[@]}" "$CHANGELOG_FILE"
git commit --quiet -m "$commit_subject"

info "Tagging $tag…"
git tag -a "$tag" -m "$description"

info "Pushing $push_target…"
git push --quiet "$REMOTE" "$push_target"

info "Pushing $tag…"
git push --quiet "$REMOTE" "$tag"

# ── 10. Done ─────────────────────────────────────────────────────────────
remote_url="$(git remote get-url "$REMOTE")"
base_url="$(sed -E 's#(git@|https://)([^:/]+)[:/]([^/]+)/(.+)#https://\2/\3/\4#; s#\.git$##' <<< "$remote_url")"

printf '\n'
ok "Released $BOLD$tag$RESET"
rule
info "Watch the builds: $CYAN$base_url/actions$RESET"
if [[ "$mode" == "production" ]]; then
    warn "Production needs manual approval in GitHub Actions after the staging build passes."
else
    info "Android: grab the APK from the pre-release; iOS: download the IPA artifact and upload it to TestFlight."
    warn "Remember to squash these test commits when this branch merges into $DEVELOP_BRANCH."
fi
printf '\n'
