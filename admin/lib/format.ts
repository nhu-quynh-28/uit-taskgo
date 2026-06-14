/** Safe avatar fallback initial from a display name. */
export function getInitial(name: string | undefined | null): string {
  const char = name?.trim().charAt(0);
  return char ? char.toUpperCase() : "?";
}
