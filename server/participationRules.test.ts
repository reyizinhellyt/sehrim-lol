import { describe, expect, it } from "vitest";
import {
  hasRemainingDailyParticipation,
  maySelectRepresentativeCity,
  participationCityForUser,
} from "../shared/participationRules";

describe("katılım ve temsil kuralları", () => {
  it("temsil edilecek ilin yalnızca ilk seçimde atanmasına izin verir", () => {
    expect(maySelectRepresentativeCity(null)).toBe(true);
    expect(maySelectRepresentativeCity("06")).toBe(false);
  });

  it("günlük katılım sınırına ulaşıldığında yeni katılımı engeller", () => {
    expect(hasRemainingDailyParticipation(0)).toBe(true);
    expect(hasRemainingDailyParticipation(1)).toBe(false);
    expect(hasRemainingDailyParticipation(2)).toBe(false);
  });

  it("katılım puanını yalnızca kullanıcının temsil ettiği ile yönlendirir", () => {
    expect(participationCityForUser("34")).toBe("34");
    expect(participationCityForUser("06")).toBe("06");
  });
});
