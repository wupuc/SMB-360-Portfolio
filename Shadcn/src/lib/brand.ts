export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Strip leading #
  let cleaned = hex.replace(/^#/, "")

  // Expand 3-char shorthand to 6-char
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split("")
      .map((c) => c + c)
      .join("")
  }

  if (cleaned.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`)
  }

  const r = parseInt(cleaned.slice(0, 2), 16) / 255
  const g = parseInt(cleaned.slice(2, 4), 16) / 255
  const b = parseInt(cleaned.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))

    if (max === r) {
      h = ((g - b) / delta) % 6
    } else if (max === g) {
      h = (b - r) / delta + 2
    } else {
      h = (r - g) / delta + 4
    }

    h = Math.round(h * 60)
    if (h < 0) h += 360
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export function generateBrandTokens(hexColor: string): Record<string, string> {
  const hsl = hexToHsl(hexColor)
  return {
    "--brand-primary": `${hsl.h} ${hsl.s}% ${hsl.l}%`,
    "--brand-primary-hover": `${hsl.h} ${hsl.s}% ${Math.max(0, hsl.l - 8)}%`,
    "--brand-primary-foreground": hsl.l > 55 ? "0 0% 5%" : "0 0% 98%",
    "--brand-ring": `${hsl.h} ${hsl.s}% ${hsl.l}%`,
  }
}
