export type HallOfFameArchiveItem = {
  recordDate: string;
  cityCode: string;
  totalPoints: number;
  cityRank: number;
  cityLeaderName: string;
  cityLeaderPoints: number;
};

export function groupHallOfFameByDate(entries: HallOfFameArchiveItem[]) {
  const groups = new Map<string, HallOfFameArchiveItem[]>();
  for (const entry of entries) {
    const current = groups.get(entry.recordDate) ?? [];
    current.push(entry);
    groups.set(entry.recordDate, current);
  }
  return Array.from(groups, ([recordDate, results]) => ({ recordDate, results }));
}
