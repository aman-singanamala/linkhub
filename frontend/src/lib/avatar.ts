const COLORS = ["#1d7874", "#ff8552", "#2a4b62", "#f7c59f", "#5b2a86", "#247ba0"];

export function getInitials(name?: string, fallback = "U") {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase() || fallback;
}

export function getAvatarColor(seed?: string) {
  if (!seed) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 0xffff;
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
}
