/**
 * First name: the first word of the full name (Google gives only the full
 * name), e.g. "Anna Weber" -> "Anna".
 */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}
