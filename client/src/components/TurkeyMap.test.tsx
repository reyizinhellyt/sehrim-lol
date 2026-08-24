import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TurkeyMap, type MapCity } from "./TurkeyMap";

const mapSvg = `<svg xmlns="http://www.w3.org/2000/svg"><g data-city-code="01"><path /></g><g data-city-code="06"><path /></g><g data-city-code="34"><path /></g></svg>`;

const cities: MapCity[] = [
  { cityCode: "01", cityName: "Adana", totalPoints: 1, rank: 3, leader: null },
  { cityCode: "06", cityName: "Ankara", totalPoints: 25, rank: 2, leader: { userId: 7, name: "Zeynep Kaya", points: 16 } },
  { cityCode: "34", cityName: "İstanbul", totalPoints: 100, rank: 1, leader: null },
];

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => mapSvg }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TurkeyMap oy yoğunluğu renkleri", () => {
  it("az, orta ve yüksek oy seviyelerini üç ayrı açık-koyu tona dönüştürür", async () => {
    const { container } = render(<TurkeyMap cities={cities} onCitySelect={vi.fn()} />);

    await waitFor(() => expect(container.querySelectorAll("g[data-city-code]")).toHaveLength(3));

    const getFill = (cityCode: string) =>
      (container.querySelector(`g[data-city-code="${cityCode}"]`) as SVGGElement).style.getPropertyValue("--city-fill");
    await waitFor(() => expect(getFill("01")).toMatch(/^hsl\(/));
    const lowFill = getFill("01");
    const mediumFill = getFill("06");
    const highFill = getFill("34");

    expect(mediumFill).toMatch(/^hsl\(/);
    expect(highFill).toMatch(/^hsl\(/);
    expect(new Set([lowFill, mediumFill, highFill]).size).toBe(3);
  });

  it("ilk yüklemede hiçbir ili seçmez; seçim yapıldığında oy renklerini değiştirmez", async () => {
    const onCitySelect = vi.fn();
    const { container, rerender } = render(<TurkeyMap cities={cities} onCitySelect={onCitySelect} />);
    await waitFor(() => expect(container.querySelectorAll("g[data-city-code]")).toHaveLength(3));

    const initialAnkara = container.querySelector('g[data-city-code="06"]') as SVGGElement;
    const initialFill = initialAnkara.style.getPropertyValue("--city-fill");
    expect(container.querySelectorAll("g.is-selected")).toHaveLength(0);

    rerender(<TurkeyMap cities={cities} selectedCityCode="06" onCitySelect={onCitySelect} />);
    await waitFor(() => expect(container.querySelectorAll("g.is-selected")).toHaveLength(1));

    const selectedAnkara = container.querySelector('g[data-city-code="06"]') as SVGGElement;
    expect(selectedAnkara.classList.contains("is-selected")).toBe(true);
    expect(selectedAnkara.style.getPropertyValue("--city-fill")).toBe(initialFill);
  });

  it("tıklama anında yalnızca seçilen il için sabit seçili sınıfını uygular", async () => {
    const onCitySelect = vi.fn();
    const { container } = render(<TurkeyMap cities={cities} onCitySelect={onCitySelect} />);
    await waitFor(() => expect(container.querySelectorAll("g[data-city-code]")).toHaveLength(3));
    await waitFor(() => expect((container.querySelector(".turkey-map") as HTMLDivElement | null)?.dataset.interactive).toBe("true"));

    const adana = container.querySelector('g[data-city-code="01"]') as SVGGElement;
    const ankara = container.querySelector('g[data-city-code="06"]') as SVGGElement;
    fireEvent.click(ankara);

    await waitFor(() => expect(onCitySelect).toHaveBeenCalledWith("06"));
    expect(ankara.classList.contains("is-selected")).toBe(true);
    expect(ankara.hasAttribute("data-selected")).toBe(true);
    expect(adana.classList.contains("is-selected")).toBe(false);
  });

  it("onaylı görsel sponsor logosunu şehir rozeti olarak sunar ve tıklamada şehir ayrıntısını açar", async () => {
    const onCitySelect = vi.fn();
    const { container } = render(
      <TurkeyMap
        cities={cities}
        onCitySelect={onCitySelect}
        sponsorBadges={[{ cityCode: "06", brandName: "Ankara Markası", logoUrl: "/manus-storage/ankara-sponsor.png" }]}
      />
    );
    await waitFor(() => expect(container.querySelectorAll("g[data-city-code]")).toHaveLength(3));

    const badge = container.querySelector<HTMLButtonElement>('[data-sponsor-city-code="06"]');
    expect(badge?.getAttribute("aria-label")).toContain("Ankara Şehir Valisi: Ankara Markası");
    expect(badge?.querySelector("img")?.getAttribute("src")).toBe("/manus-storage/ankara-sponsor.png");

    fireEvent.mouseEnter(badge as HTMLButtonElement);
    expect(screen.getByRole("tooltip").textContent).toContain("ŞEHİR VALİSİAnkaraAnkara Markası");
    expect(screen.getByRole("tooltip").textContent).not.toContain("Zeynep Kaya");
    fireEvent.mouseLeave(badge as HTMLButtonElement);
    expect(screen.queryByRole("tooltip")).toBeNull();

    fireEvent.click(badge as HTMLButtonElement);
    expect(onCitySelect).toHaveBeenCalledWith("06");
  });

  it("hover ve klavye odağında ilin anlık oy bilgisini gösterir", async () => {
    const { container } = render(<TurkeyMap cities={cities} onCitySelect={vi.fn()} />);
    await waitFor(() => expect(container.querySelectorAll("g[data-city-code]")).toHaveLength(3));
    await waitFor(() => expect((container.querySelector(".turkey-map") as HTMLDivElement | null)?.dataset.interactive).toBe("true"));

    const map = container.querySelector(".turkey-map") as HTMLDivElement;
    const ankara = container.querySelector('g[data-city-code="06"]') as SVGGElement;
    fireEvent.mouseOver(ankara);

    expect(screen.getByRole("tooltip").textContent).toContain("Ankara");
    expect(screen.getByRole("tooltip").className).toContain("is-visible");
    expect(screen.getByRole("tooltip").textContent).toContain("Günlük oy25");
    expect(screen.getByRole("tooltip").textContent).toContain("Türkiye sırası#2");
    expect(screen.getByRole("tooltip").textContent).not.toContain("GÜNÜN LİDERİ");
    expect(screen.getByRole("tooltip").textContent).not.toContain("Zeynep Kaya");
    expect(screen.getByRole("tooltip").textContent).not.toContain("puan katkı");

    fireEvent.mouseLeave(map);
    expect(screen.getByRole("tooltip", { hidden: true }).className).toContain("is-closing");
    await waitFor(() => expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull());

    fireEvent.focus(ankara);
    expect(screen.getByRole("tooltip").textContent).toContain("Ankara");
  });

  it("hareket azaltma tercihinde tooltipi çıkış animasyonu olmadan hemen kapatır", async () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
    const { container } = render(<TurkeyMap cities={cities} onCitySelect={vi.fn()} />);
    await waitFor(() => expect(container.querySelectorAll("g[data-city-code]")).toHaveLength(3));

    const map = container.querySelector(".turkey-map") as HTMLDivElement;
    const ankara = container.querySelector('g[data-city-code="06"]') as SVGGElement;
    fireEvent.mouseOver(ankara);
    await waitFor(() => expect(screen.getByRole("tooltip")).toBeTruthy());

    fireEvent.mouseLeave(map);
    expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull();
  });

  it("tıklama ile tooltipi ilk kareden animasyonsuz ve sabit gösterir", async () => {
    const { container } = render(<TurkeyMap cities={cities} onCitySelect={vi.fn()} />);
    await waitFor(() => expect(container.querySelectorAll("g[data-city-code]")).toHaveLength(3));

    const ankara = container.querySelector('g[data-city-code="06"]') as SVGGElement;
    fireEvent.click(ankara);

    expect(screen.getByRole("tooltip").textContent).toContain("Ankara");
    expect(screen.getByRole("tooltip").className).toContain("is-static");
  });

  it("liderlik verisi gelse bile oy veren kişi bilgisini göstermez", async () => {
    const { container } = render(<TurkeyMap cities={cities} onCitySelect={vi.fn()} />);
    await waitFor(() => expect(container.querySelectorAll("g[data-city-code]")).toHaveLength(3));
    await waitFor(() => expect((container.querySelector(".turkey-map") as HTMLDivElement | null)?.dataset.interactive).toBe("true"));

    const ankara = container.querySelector('g[data-city-code="06"]') as SVGGElement;
    fireEvent.click(ankara);

    expect(screen.getByRole("tooltip").textContent).not.toContain("Zeynep Kaya");
    expect(screen.getByRole("tooltip").textContent).not.toContain("Lider puanı");
    expect(container.querySelector(".map-vote-tooltip-leader")).toBeNull();
  });

  it("mobil dokunuşta tooltipi açar; ikinci dokunuşta veya harita dışında kapatır", async () => {
    const { container } = render(<TurkeyMap cities={cities} onCitySelect={vi.fn()} />);
    await waitFor(() => expect(container.querySelectorAll("g[data-city-code]")).toHaveLength(3));

    const getAnkara = () => container.querySelector('g[data-city-code="06"]') as SVGGElement;
    let ankara = getAnkara();
    fireEvent.pointerDown(ankara, { pointerType: "touch" });

    await waitFor(() => expect(screen.getByRole("tooltip").textContent).toContain("Ankara"));
    expect(screen.getByRole("tooltip").className).toContain("is-static");

    ankara = getAnkara();
    fireEvent.pointerDown(ankara, { pointerType: "touch" });
    ankara = getAnkara();
    fireEvent.click(ankara);
    expect(screen.getByRole("tooltip", { hidden: true }).className).toContain("is-closing");
    await waitFor(() => expect(screen.queryByRole("tooltip", { hidden: true })).toBeNull());

    ankara = getAnkara();
    fireEvent.pointerDown(ankara, { pointerType: "touch" });
    await waitFor(() => expect(screen.getByRole("tooltip")).toBeTruthy());
    fireEvent.pointerDown(document.body, { pointerType: "touch" });
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
  });
});
