import { commandRegistry } from "./registry";

commandRegistry.set("get_available_fonts", async (params) => {
  const { family, limit } = params;
  const maxResults = limit ?? 50;

  const availableFonts = await figma.listAvailableFontsAsync();

  const grouped = new Map<string, string[]>();
  for (const font of availableFonts) {
    if (family && !font.fontName.family.toLowerCase().includes((family as string).toLowerCase())) {
      continue;
    }
    const existing = grouped.get(font.fontName.family);
    if (existing) {
      existing.push(font.fontName.style);
    } else {
      grouped.set(font.fontName.family, [font.fontName.style]);
    }
  }

  const families: Array<{ family: string; styles: string[] }> = [];
  let count = 0;
  for (const [fam, styles] of grouped) {
    if (count >= maxResults) break;
    families.push({ family: fam, styles });
    count++;
  }

  return {
    count: families.length,
    totalFamilies: grouped.size,
    truncated: grouped.size > maxResults,
    families,
  };
});
