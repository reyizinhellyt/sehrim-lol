import { DAILY_PARTICIPATION_LIMIT } from "./gameLogic";

export function maySelectRepresentativeCity(currentCityCode: string | null): boolean {
  return currentCityCode === null;
}

export function hasRemainingDailyParticipation(participationCount: number): boolean {
  return participationCount < DAILY_PARTICIPATION_LIMIT;
}

export function participationCityForUser(representativeCityCode: string): string {
  return representativeCityCode;
}
