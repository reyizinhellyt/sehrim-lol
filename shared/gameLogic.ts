import { CITIES } from "./cities";

export const DAILY_PARTICIPATION_LIMIT = 1;
export const TURKEY_TIME_ZONE = "Europe/Istanbul";

export type RankedCity = {
  cityCode: string;
  cityName: string;
  totalPoints: number;
  rank: number;
};

export function getTurkeyDate(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TURKEY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const find = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? "";
  return `${find("year")}-${find("month")}-${find("day")}`;
}

export function getPreviousTurkeyDate(now: Date = new Date()): string {
  const [year, month, day] = getTurkeyDate(now).split("-").map(Number);
  const previous = new Date(Date.UTC(year, month - 1, day - 1));
  return previous.toISOString().slice(0, 10);
}

export function secondsUntilTurkeyMidnight(now: Date = new Date()): number {
  const turkeyDate = getTurkeyDate(now);
  const nextMidnight = new Date(`${turkeyDate}T21:00:00.000Z`);
  if (now.getTime() >= nextMidnight.getTime()) {
    nextMidnight.setUTCDate(nextMidnight.getUTCDate() + 1);
  }
  return Math.max(0, Math.floor((nextMidnight.getTime() - now.getTime()) / 1000));
}

export function rankCities(pointsByCode: Record<string, number>): RankedCity[] {
  return CITIES.map(city => ({
    cityCode: city.code,
    cityName: city.name,
    totalPoints: pointsByCode[city.code] ?? 0,
    rank: 0,
  }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.cityCode.localeCompare(b.cityCode))
    .map((city, index) => ({ ...city, rank: index + 1 }));
}
