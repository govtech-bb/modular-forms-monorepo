/**
 * Increments the minor segment of a semver string (e.g. "1.2.3" → "1.3.0"),
 * resetting patch to 0. Returns the original string unchanged if it is not a
 * valid three-part numeric semver.
 */
export function bumpMinor(version: string): string {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return version;
  return `${parts[0]}.${parts[1] + 1}.0`;
}

/**
 * Compares two semver strings. Returns a negative number if `a < b`,
 * zero if `a === b`, or a positive number if `a > b`.
 * Missing parts default to 0.
 */
export function compareSemver(a: string, b: string): number {
  const parse = (v: string): [number, number, number] => {
    const parts = v.split(".").map(Number);
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  };

  const [aMajor, aMinor, aPatch] = parse(a);
  const [bMajor, bMinor, bPatch] = parse(b);

  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
}

/**
 * Validates a semver version string against formatting rules and, optionally,
 * the current registered version.
 *
 * Returns a human-readable error string if invalid, or `null` if valid.
 */
export function validateVersion(
  version: string,
  currentVersion: string | null,
): string | null {
  const parts = version.split(".");
  if (
    parts.length !== 3 ||
    parts.some(
      (p) => p === "" || isNaN(Number(p)) || !Number.isInteger(Number(p)),
    )
  ) {
    return "Version must be in X.Y.Z format (e.g. 1.3.0).";
  }

  const [major] = parts.map(Number);
  if (major < 1) {
    return "Version must be 1.0.0 or higher.";
  }

  if (currentVersion !== null && compareSemver(version, currentVersion) <= 0) {
    return `Version must be higher than the current registered version (${currentVersion}).`;
  }

  return null;
}
