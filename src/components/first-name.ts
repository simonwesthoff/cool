/** First word of a person's name, e.g. "Anna Weber" -> "Anna". */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}
