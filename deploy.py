#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["typer>=0.12", "rich>=13"]
# ///
"""deploy.py — cut a MapSwipe Mobile release.

Two modes:

  production  — only from `develop`. Bumps version + build number, commits as
                "release(vX.Y.Z): <desc>", tags `vX.Y.Z`, pushes develop + tag.
                The tag triggers the production iOS + Android pipelines
                (staging build -> manual approval -> production release).

  test        — from any branch. Same version/build edits, commits as
                "test(vX.Y.Z-bN): <desc>", tags `test-vX.Y.Z-bN`, pushes the
                current branch + tag. The tag triggers the staging-only test
                pipelines (no production, no approval). Squash these commits
                away when the branch merges into develop.

You type the version and build number by hand in both modes; the script only
warns on regressions and on version changes during test releases.

Run it with `./deploy.py` (uv resolves deps on first run) or `uv run deploy.py`.
CLI flags (--mode/--version/--build/--description/--yes) override the prompts;
omit them for the same fully-interactive flow as the old deploy.sh.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
from enum import Enum
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.markup import escape
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table

# ── Config ──────────────────────────────────────────────────────────────
REMOTE = "origin"
DEVELOP_BRANCH = "develop"
VERSION_FILES = ("package.json", "app.prod.json", "app.staging.json")
BUILDNUMBER_FILES = ("app.prod.json", "app.staging.json")

SEMVER_RE = re.compile(r"^[0-9]+\.[0-9]+\.[0-9]+$")
VERSION_SUB_RE = re.compile(r'("version"\s*:\s*")[0-9]+\.[0-9]+\.[0-9]+(")')
BUILD_SUB_RE = re.compile(r'("buildNumber"\s*:\s*")[^"]*(")')

console = Console()
err_console = Console(stderr=True)


class Mode(str, Enum):
    production = "production"
    test = "test"


# ── Pretty output ───────────────────────────────────────────────────────
def info(msg: str) -> None:
    console.print(f"[blue]➜[/]  {msg}")


def ok(msg: str) -> None:
    console.print(f"[green]✓[/]  {msg}")


def warn(msg: str) -> None:
    console.print(f"[yellow]![/]  {msg}")


def rule() -> None:
    console.print("[dim]" + "─" * 52 + "[/]")


def die(msg: str) -> "typer.Exit":
    err_console.print(f"\n[bold red]✗ {msg}[/]\n")
    raise typer.Exit(1)


def confirm_or_die(prompt: str, *, assume_yes: bool = False) -> None:
    """Ask a yes/no question; abort unless the answer is exactly "yes"."""
    if assume_yes:
        return
    answer = Prompt.ask(f"[bold]{prompt}[/]")
    if answer != "yes":
        die("Aborted. Nothing was changed.")


# ── Subprocess helpers ────────────────────────────────────────────────────
def run(cmd: list[str], *, check: bool = True) -> subprocess.CompletedProcess:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if check and result.returncode != 0:
        if result.stderr:
            err_console.print(result.stderr.rstrip(), markup=False)
        die(f"Command failed: {' '.join(cmd)}")
    return result


def git(*args: str, check: bool = True) -> str:
    return run(["git", *args], check=check).stdout.strip()


# ── JSON read helper (equivalent to the old jget) ─────────────────────────
def jget(file: str, *path: str):
    value = json.loads(Path(file).read_text())
    for key in path:
        value = value[key]
    return value


# ── Semver helper (base-10 to avoid octal on leading zeros) ───────────────
def ver_lt(a: str, b: str) -> bool:
    """True if version a < version b."""
    pa = tuple(int(x) for x in a.split("."))
    pb = tuple(int(x) for x in b.split("."))
    return pa < pb


# ── In-place field edits (regex, to preserve file formatting) ─────────────
def replace_in_file(file: str, pattern: re.Pattern, value: str, label: str) -> None:
    text = Path(file).read_text()
    new_text, n = pattern.subn(lambda m: m.group(1) + value + m.group(2), text)
    if n == 0:
        die(f"Could not update {label} in {file} (pattern not found).")
    Path(file).write_text(new_text)


app = typer.Typer(add_completion=False, rich_markup_mode="rich")


@app.command()
def main(
    mode: Optional[Mode] = typer.Option(
        None, "--mode", "-m", help="Release type (prompts if omitted)."
    ),
    new_version: Optional[str] = typer.Option(
        None, "--version", "-v", help="New X.Y.Z version (prompts if omitted)."
    ),
    new_build: Optional[str] = typer.Option(
        None, "--build", "-b", help="New iOS build number (prompts if omitted)."
    ),
    description: Optional[str] = typer.Option(
        None, "--description", "-d", help="One-line release description."
    ),
    assume_yes: bool = typer.Option(
        False, "--yes", "-y", help="Skip confirmation prompts (for automation)."
    ),
) -> None:
    """Cut a MapSwipe Mobile release (production or test)."""

    # ── 0. Run from the repo root ─────────────────────────────────────────
    os.chdir(git("rev-parse", "--show-toplevel"))

    console.print(f"\n[bold cyan]MapSwipe Mobile — Release[/]")
    rule()

    # ── 1. Mode selection ─────────────────────────────────────────────────
    current_branch = git("rev-parse", "--abbrev-ref", "HEAD")

    if mode is None:
        console.print("[bold]Release type[/]")
        console.print(
            "  [cyan]1)[/] production  "
            "[dim](develop only — triggers staging → prod approval)[/]"
        )
        console.print(
            "  [cyan]2)[/] test        "
            "[dim](any branch — staging-only build, no approval)[/]"
        )
        choice = Prompt.ask("[bold]Select [1-2]:[/]")
        if choice == "1":
            mode = Mode.production
        elif choice == "2":
            mode = Mode.test
        else:
            die(f"Invalid selection: '{choice}'.")

    ok(f"Mode: [bold]{mode.value}[/]  (branch: {current_branch})")

    # ── 2. Preconditions ──────────────────────────────────────────────────
    info("Checking preconditions…")

    if mode is Mode.production and current_branch != DEVELOP_BRANCH:
        die(
            f"Production releases must be cut from '{DEVELOP_BRANCH}' "
            f"(you are on '{current_branch}')."
        )

    dirty = git("status", "--porcelain")
    if dirty:
        err_console.print(dirty, markup=False)
        die("Working tree is not clean. Commit or stash the changes above first.")

    info(f"Fetching {REMOTE}…")
    git("fetch", "--quiet", REMOTE)

    if run(
        ["git", "rev-parse", "--verify", "--quiet", f"{REMOTE}/{DEVELOP_BRANCH}"],
        check=False,
    ).returncode != 0:
        die(f"{REMOTE}/{DEVELOP_BRANCH} not found.")

    if mode is Mode.production:
        # develop must exactly match origin/develop.
        behind, ahead = (
            int(n)
            for n in git(
                "rev-list",
                "--left-right",
                "--count",
                f"{REMOTE}/{DEVELOP_BRANCH}...{DEVELOP_BRANCH}",
            ).split()
        )
        if behind > 0 and ahead > 0:
            die(
                f"Local '{DEVELOP_BRANCH}' has diverged from "
                f"{REMOTE}/{DEVELOP_BRANCH} ({behind} behind, {ahead} ahead). "
                "Reconcile first."
            )
        elif behind > 0:
            die(
                f"Local '{DEVELOP_BRANCH}' is {behind} commit(s) behind "
                f"{REMOTE}/{DEVELOP_BRANCH}. Run 'git pull' first."
            )
        elif ahead > 0:
            die(
                f"Local '{DEVELOP_BRANCH}' is {ahead} commit(s) ahead of "
                f"{REMOTE}/{DEVELOP_BRANCH} (unpushed commits). Push or reset first."
            )
        ok(
            f"On '{DEVELOP_BRANCH}', clean, and in sync with "
            f"{REMOTE}/{DEVELOP_BRANCH}."
        )
    else:
        # Test: warn (don't block) if the branch is behind the latest develop.
        behind = int(git("rev-list", "--count", f"HEAD..{REMOTE}/{DEVELOP_BRANCH}"))
        if behind > 0:
            warn(
                f"This branch is {behind} commit(s) behind "
                f"{REMOTE}/{DEVELOP_BRANCH} — your test build is against a stale base."
            )
            confirm_or_die("Continue anyway? Type 'yes':", assume_yes=assume_yes)
        else:
            ok(f"Clean and up to date with {REMOTE}/{DEVELOP_BRANCH}.")

    # ── 3. Version drift guard ────────────────────────────────────────────
    current_version = jget("package.json", "version")
    prod_version = jget("app.prod.json", "expo", "version")
    staging_version = jget("app.staging.json", "expo", "version")

    if current_version != prod_version or current_version != staging_version:
        warn(f"package.json    : {current_version}")
        warn(f"app.prod.json   : {prod_version}")
        warn(f"app.staging.json: {staging_version}")
        die("Version files disagree. Fix the drift before releasing.")

    if not SEMVER_RE.match(current_version):
        die(f"Current version '{current_version}' is not a valid X.Y.Z semver.")

    current_build = jget("app.prod.json", "expo", "ios", "buildNumber")
    ok(f"Current: version [bold]{current_version}[/], build [bold]{current_build}[/].")

    # ── 4. New version + build number (free-form) ─────────────────────────
    console.print()
    if new_version is None:
        new_version = Prompt.ask(f"[bold]New version[/] [current: {current_version}]")
    if not SEMVER_RE.match(new_version):
        die(f"Version must be strict semver X.Y.Z (got '{new_version}').")

    if new_build is None:
        new_build = Prompt.ask(f"[bold]New build number[/] [current: {current_build}]")
    if not re.match(r"^[0-9]+$", new_build):
        die(f"Build number must be a non-negative integer (got '{new_build}').")

    if description is None:
        description = Prompt.ask("[bold]One-line release description:[/]")
    description = description.strip()
    if not description:
        die("Release description cannot be empty.")

    # ── 5. Compute tag + collision check ──────────────────────────────────
    if mode is Mode.production:
        tag = f"v{new_version}"
        commit_subject = f"release({tag}): {description}"
        push_target = DEVELOP_BRANCH
    else:
        tag = f"test-v{new_version}-b{new_build}"
        commit_subject = f"test(v{new_version}-b{new_build}): {description}"
        push_target = current_branch

    if run(
        ["git", "rev-parse", "-q", "--verify", f"refs/tags/{tag}"], check=False
    ).returncode == 0:
        die(f"Tag '{tag}' already exists locally.")
    if git("ls-remote", "--tags", REMOTE, f"refs/tags/{tag}"):
        die(f"Tag '{tag}' already exists on {REMOTE}.")

    # ── 6. Warnings ───────────────────────────────────────────────────────
    warnings: list[str] = []
    if ver_lt(new_version, current_version):
        warnings.append(
            f"Version {new_version} is LOWER than current {current_version} "
            "(version regression)."
        )
    elif new_version == current_version and int(new_build) <= int(current_build):
        warnings.append(
            f"Same version, but build {new_build} ≤ current {current_build} — "
            "TestFlight/Play reject non-increasing builds."
        )
    if mode is Mode.test and new_version != current_version:
        warnings.append(
            f"Test release changes the version. This lands on '{DEVELOP_BRANCH}' "
            "(directly, or via merge) — version bumps belong to production releases."
        )

    # ── 7. Summary + confirm ──────────────────────────────────────────────
    grid = Table.grid(padding=(0, 2))
    grid.add_column(style="cyan")
    grid.add_column()
    grid.add_row("mode", f"[bold]{mode.value}[/]")
    grid.add_row("branch", current_branch)
    grid.add_row("version", f"{current_version} → [bold]{new_version}[/]")
    grid.add_row("buildNumber", f"{current_build} → [bold]{new_build}[/]")
    grid.add_row("commit", f"[dim]{escape(commit_subject)}[/]")
    grid.add_row("tag", f"[bold]{tag}[/]  (annotated)")
    grid.add_row("push", f"{push_target} → {REMOTE}")
    console.print()
    console.print(
        Panel(
            grid,
            title="[bold cyan]Release summary[/]",
            border_style="cyan",
            expand=False,
        )
    )

    if warnings:
        console.print()
        for w in warnings:
            warn(w)

    console.print()
    if mode is Mode.production:
        console.print(
            f"[yellow][bold]⚠  Pushing {tag} triggers the PRODUCTION "
            "iOS + Android builds.[/][/]"
        )
    else:
        console.print(
            f"[yellow][bold]ℹ  Pushing {tag} triggers STAGING-ONLY test "
            "builds (no production).[/][/]"
        )
    console.print()

    confirm_or_die("Type 'yes' to proceed:", assume_yes=assume_yes)

    # ── 8. Apply changes ──────────────────────────────────────────────────
    # `version` appears exactly once per file; `buildNumber` once per app config.
    info(f"Setting version to {new_version}…")
    for f in VERSION_FILES:
        replace_in_file(f, VERSION_SUB_RE, new_version, "version")

    info(f"Setting ios.buildNumber to {new_build}…")
    for f in BUILDNUMBER_FILES:
        replace_in_file(f, BUILD_SUB_RE, new_build, "buildNumber")

    info("Committing…")
    git("add", *VERSION_FILES)
    git("commit", "--quiet", "-m", commit_subject)

    info(f"Tagging {tag}…")
    git("tag", "-a", tag, "-m", description)

    info(f"Pushing {push_target}…")
    git("push", "--quiet", REMOTE, push_target)

    info(f"Pushing {tag}…")
    git("push", "--quiet", REMOTE, tag)

    # ── 9. Done ───────────────────────────────────────────────────────────
    remote_url = git("remote", "get-url", REMOTE)
    m = re.match(r"(?:git@|https://)([^:/]+)[:/]([^/]+)/(.+)", remote_url)
    base_url = (
        f"https://{m.group(1)}/{m.group(2)}/{m.group(3)}" if m else remote_url
    )
    base_url = re.sub(r"\.git$", "", base_url)

    console.print()
    ok(f"Released [bold]{tag}[/]")
    rule()
    info(f"Watch the builds: [cyan]{base_url}/actions[/]")
    if mode is Mode.production:
        warn(
            "Production needs manual approval in GitHub Actions after the "
            "staging build passes."
        )
    else:
        info(
            "Android: grab the APK from the pre-release; iOS: download the IPA "
            "artifact and upload it to TestFlight."
        )
        warn(
            "Remember to squash these test commits when this branch merges "
            f"into {DEVELOP_BRANCH}."
        )
    console.print()


if __name__ == "__main__":
    app()
