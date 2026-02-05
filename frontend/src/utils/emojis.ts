import * as unicodeEmoji from "unicode-emoji";

/**
 * Get a list of emoji characters from the Unicode Emoji database.
 * Uses the unicode-emoji package (Unicode Emoji v16).
 *
 * @param options.includeFlags - If false (default), excludes flag emojis to keep the list more focused for chat.
 * @returns Array of emoji character strings.
 */
export function getEmojiList(options?: { includeFlags?: boolean }): string[] {
  const omitWhere = options?.includeFlags
    ? undefined
    : ({ category: ["flags"] } as Parameters<typeof unicodeEmoji.getEmojis>[0]);
  const list = omitWhere
    ? unicodeEmoji.getEmojis(omitWhere)
    : unicodeEmoji.getEmojis();
  return list.map((entry) => entry.emoji);
}

/**
 * Get emojis grouped by group (e.g. "smileys-emotion", "people-body").
 * Useful for a picker with category tabs.
 */
export function getEmojisGroupedByCategory(): Record<string, string[]> {
  const omitFlags = { category: ["flags"] } as Parameters<
    typeof unicodeEmoji.getEmojisGroupedBy
  >[1];
  const grouped = unicodeEmoji.getEmojisGroupedBy("group", omitFlags);
  const result: Record<string, string[]> = {};
  for (const [group, entries] of Object.entries(grouped)) {
    result[group] = (entries || []).map((e: { emoji: string }) => e.emoji);
  }
  return result;
}
