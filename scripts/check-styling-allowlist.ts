#!/usr/bin/env ts-node

/**
 * Fails if the styling allowlist grew. The base defaults to GITHUB_BASE_REF, then develop.
 *
 * Usage: ts-node -P tsconfig.scripts.json scripts/check-styling-allowlist.ts [baseRef]
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ALLOWLIST_PATH = 'eslint/styling-allowlist.json';

// A glob or bare directory in flat-config `ignores` exempts a whole subtree but counts as one
// entry. '[' and ']' are deliberately absent: expo-router routes are real files with brackets.
const GLOB_CHARACTERS = ['*', '?', '{', '}'];

interface ParsedAllowlist {
    entries: string[];
    problems: string[];
}

interface ResolvedAllowlist {
    files: string[];
    problems: string[];
}

function runGit(args: string[], cwd: string): string | undefined {
    try {
        return execFileSync('git', args, {
            cwd,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        });
    } catch {
        return undefined;
    }
}

// ts-node loads this as ESM, so __dirname is missing and `module: commonjs` forbids import.meta.
const REPO_ROOT = runGit(['rev-parse', '--show-toplevel'], process.cwd())?.trim() ?? process.cwd();

function git(args: string[]): string | undefined {
    return runGit(args, REPO_ROOT);
}

// Backslashes are rejected below, not rewritten: '\' is also minimatch's escape character.
function normalize(entry: string): string {
    return entry.replace(/^\.\//, '');
}

function parseAllowlist(text: string, source: string): ParsedAllowlist {
    let data: unknown;
    try {
        data = JSON.parse(text);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown error';
        return { entries: [], problems: [`${source}: not valid JSON (${message}).`] };
    }

    if (!Array.isArray(data)) {
        return { entries: [], problems: [`${source}: must be a JSON array of repo-relative file paths.`] };
    }

    const problems: string[] = [];
    const entries: string[] = [];

    data.forEach((value: unknown, index: number) => {
        if (typeof value !== 'string' || value.trim() === '') {
            problems.push(`${source}: entry ${index} is not a non-empty string.`);
            return;
        }
        entries.push(normalize(value));
    });

    return { entries, problems };
}

// `requireExists` is off for the base revision: its tree is not on disk to stat.
function resolveAllowlist(
    parsed: ParsedAllowlist,
    source: string,
    requireExists: boolean,
): ResolvedAllowlist {
    const problems = [...parsed.problems];
    const files: string[] = [];
    const seen = new Set<string>();

    parsed.entries.forEach((entry) => {
        const globCharacter = GLOB_CHARACTERS.find((character) => entry.includes(character));
        if (globCharacter !== undefined) {
            problems.push(
                `${source}: '${entry}' contains '${globCharacter}'. Entries must be literal file`
                + ' paths, never globs: a glob re-exempts a whole subtree but only counts once.',
            );
            return;
        }

        if (entry.includes('\\')) {
            problems.push(`${source}: '${entry}' contains a backslash. Use forward slashes.`);
            return;
        }

        if (path.isAbsolute(entry) || entry.split('/').includes('..')) {
            problems.push(`${source}: '${entry}' must be a repo-relative path without '..'.`);
            return;
        }

        if (seen.has(entry)) {
            problems.push(`${source}: '${entry}' is listed twice. Remove the duplicate.`);
            return;
        }
        seen.add(entry);

        if (requireExists) {
            const absolute = path.join(REPO_ROOT, entry);
            if (!fs.existsSync(absolute)) {
                problems.push(
                    `${source}: '${entry}' does not exist. The file was moved or deleted, so this`
                    + ' entry is stale: delete it.',
                );
                return;
            }
            if (!fs.statSync(absolute).isFile()) {
                problems.push(
                    `${source}: '${entry}' is a directory. Flat-config 'ignores' exempts everything`
                    + ' under a directory: list each file instead.',
                );
                return;
            }
        }

        files.push(entry);
    });

    return { files, problems };
}

function resolveBaseRef(explicitBaseRef: string | undefined): string | undefined {
    const baseRef = explicitBaseRef ?? process.env.GITHUB_BASE_REF;
    // origin/ first: a local branch of the same name is often behind the remote.
    const candidates = baseRef !== undefined && baseRef !== ''
        ? [`origin/${baseRef}`, baseRef]
        : ['origin/develop', 'develop'];

    return candidates.find((ref) => git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]) !== undefined);
}

function difference(a: string[], b: string[]): string[] {
    const exclude = new Set(b);
    return a.filter((entry) => !exclude.has(entry)).sort();
}

function report(title: string, lines: string[]): void {
    if (lines.length === 0) {
        return;
    }
    console.log(`\n${title}`);
    lines.forEach((line) => console.log(`  ${line}`));
}

function main(): void {
    const explicitBaseRef: string | undefined = process.argv[2];

    console.log('\n🎚️  Styling allowlist ratchet');
    console.log('='.repeat(70));

    const absoluteAllowlistPath = path.join(REPO_ROOT, ALLOWLIST_PATH);
    const currentExists = fs.existsSync(absoluteAllowlistPath);
    if (!currentExists) {
        console.log(`ℹ️  ${ALLOWLIST_PATH} does not exist on this checkout: treating it as empty.`);
    }
    const currentText = currentExists ? fs.readFileSync(absoluteAllowlistPath, 'utf8') : '[]';
    const current = resolveAllowlist(
        parseAllowlist(currentText, `${ALLOWLIST_PATH} (this checkout)`),
        `${ALLOWLIST_PATH} (this checkout)`,
        true,
    );

    const baseRef = resolveBaseRef(explicitBaseRef);
    if (baseRef === undefined) {
        const requested = explicitBaseRef ?? process.env.GITHUB_BASE_REF ?? 'develop';
        console.log(`\n✗ Cannot resolve the base revision '${requested}'.`);
        console.log('  The ratchet needs the base branch to compare against. In CI, fetch it first:');
        console.log(`    git fetch --no-tags --depth=1 origin "+refs/heads/${requested}:refs/remotes/origin/${requested}"`);
        console.log('='.repeat(70) + '\n');
        process.exit(1);
    }

    const baseText = git(['show', `${baseRef}:${ALLOWLIST_PATH}`]);
    const base = baseText === undefined
        ? undefined
        : resolveAllowlist(
            parseAllowlist(baseText, `${ALLOWLIST_PATH} (${baseRef})`),
            `${ALLOWLIST_PATH} (${baseRef})`,
            false,
        );

    console.log(`  base revision:   ${baseRef}`);
    console.log(`  base count:      ${base === undefined ? 'n/a (file absent)' : base.files.length}`);
    console.log(`  current count:   ${current.files.length}`);

    // Base-side defects only warn; dropping them lowers the base count, which is the strict side.
    report('⚠️  Ignored in the base revision:', base?.problems ?? []);

    if (base === undefined) {
        console.log(`\nℹ️  ${ALLOWLIST_PATH} does not exist at ${baseRef}: first run, nothing to compare.`);
    } else {
        const removed = difference(base.files, current.files);
        const added = difference(current.files, base.files);
        report(`➖ Removed (${removed.length}):`, removed);
        report(`➕ Added (${added.length}):`, added);
    }

    report('✗ Invalid entries:', current.problems);

    // Everything goes to stdout: CI pipes stderr separately and would interleave the output.
    const grew = base !== undefined && current.files.length > base.files.length;
    if (grew) {
        console.log(`\n✗ The allowlist grew: ${base.files.length} → ${current.files.length}.`);
        console.log('  It may only shrink. Migrate the file to components/ui/** instead of');
        console.log(`  adding it to ${ALLOWLIST_PATH}.`);
    }

    if (current.problems.length > 0) {
        console.log(`\n✗ ${current.problems.length} invalid entr${current.problems.length === 1 ? 'y' : 'ies'} in ${ALLOWLIST_PATH}.`);
    }

    if (grew || current.problems.length > 0) {
        console.log('='.repeat(70) + '\n');
        process.exit(1);
    }

    console.log('\n✓ Allowlist is valid and did not grow.');
    console.log('='.repeat(70) + '\n');
}

main();
