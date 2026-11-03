/**
 * Minimal semver-style comparison for app version strings like "3.0.9".
 *
 * Only the numeric, dot-separated core is compared; any suffix (e.g. "-dev",
 * "-beta") and an optional leading "v" are ignored. A missing or unparseable
 * version is treated as very old (0), so callers can safely floor-clamp
 * unknown/absent versions to "older than everything".
 */

function isFalsyVersion(version: string | undefined | null): version is undefined | null | '' {
    return version === undefined || version === null || version.trim() === '';
}

function parseVersion(version: string | undefined | null): number[] {
    if (isFalsyVersion(version)) {
        return [0];
    }
    const core = version
        .trim()
        .replace(/^v/i, '')
        .split(/[^0-9.]/, 1)[0] ?? '';
    const parts = core
        .split('.')
        .map((part) => {
            const parsed = Number.parseInt(part, 10);
            return Number.isNaN(parsed) ? 0 : parsed;
        });
    return parts.length > 0 ? parts : [0];
}

/**
 * Returns a negative number when `a` is older than `b`, positive when newer,
 * and 0 when equal.
 */
export function compareVersions(
    a: string | undefined | null,
    b: string | undefined | null,
): number {
    const partsA = parseVersion(a);
    const partsB = parseVersion(b);
    const length = Math.max(partsA.length, partsB.length);
    for (let index = 0; index < length; index += 1) {
        const diff = (partsA[index] ?? 0) - (partsB[index] ?? 0);
        if (diff !== 0) {
            return diff < 0 ? -1 : 1;
        }
    }
    return 0;
}

/** True when `version` is strictly older than `other`. */
export function isOlder(
    version: string | undefined | null,
    other: string | undefined | null,
): boolean {
    return compareVersions(version, other) < 0;
}
