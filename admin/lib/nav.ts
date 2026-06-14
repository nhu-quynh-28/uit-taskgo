/** Normalizes paths for sidebar active-state matching (handles trailing slashes). */
export function isActiveNavPath(pathname: string, baseUrl: string): boolean {
  const normalize = (path: string) => {
    const trimmed = path.replace(/\/+$/, "");
    return trimmed || "/";
  };
  const current = normalize(pathname);
  const base = normalize(baseUrl);
  return current === base || current.startsWith(`${base}/`);
}
