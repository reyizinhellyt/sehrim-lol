export function getVoteIntensity(points: number, maxPoints: number) {
  if (points <= 0 || maxPoints <= 0) return 0;
  return Math.min(1, Math.pow(points / maxPoints, 0.58));
}

export function getVoteIntensityColor(points: number, maxPoints: number) {
  const intensity = getVoteIntensity(points, maxPoints);
  if (intensity === 0) return "#dce4e8";

  const saturation = Math.round(34 + intensity * 28);
  const lightness = Math.round(82 - intensity * 54);
  return `hsl(182 ${saturation}% ${lightness}%)`;
}
