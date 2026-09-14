const PALETTE = [
  "#00d2ff",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#a855f7",
  "#ef4444",
  "#14b8a6",
  "#eab308",
  "#6366f1",
  "#84cc16",
  "#f97316",
];

export function colorForIndex(index: number): string {
  if (index < PALETTE.length) {
    return PALETTE[index];
  }

  const hue = (index * 47) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}
