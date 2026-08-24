import React, { useEffect, useMemo, useRef, useState } from "react";
import { getVoteIntensityColor } from "@shared/mapColorScale";
import "./MapTooltip.css";

export type MapCity = {
  cityCode: string;
  cityName: string;
  totalPoints: number;
  rank: number;
  leader: { userId: number; name: string; points: number } | null;
};

export type MapSponsorBadge = {
  cityCode: string;
  brandName: string;
  logoUrl: string;
};

type TurkeyMapProps = {
  cities: MapCity[];
  selectedCityCode?: string;
  onCitySelect: (cityCode: string) => void;
  sponsorBadges?: MapSponsorBadge[];
};

const MAP_ASSET_URL = "/manus-storage/turkey-provinces_2e7f5a30.svg";
const TOOLTIP_EXIT_DURATION_MS = 160;
const TOUCH_CLICK_GUARD_MS = 450;
const EMPTY_SPONSOR_BADGES: MapSponsorBadge[] = [];

type TooltipData = {
  city: MapCity;
  x: number;
  y: number;
};

type TooltipState = TooltipData & {
  isClosing: boolean;
  presentation: "animated" | "static";
};

type SponsorTooltipState = {
  cityCode: string;
  cityName: string;
  brandName: string;
  x: number;
  y: number;
};

export function TurkeyMap({ cities, selectedCityCode, onCitySelect, sponsorBadges = EMPTY_SPONSOR_BADGES }: TurkeyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgMarkup, setSvgMarkup] = useState<string>("");
  const [loadError, setLoadError] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [sponsorTooltip, setSponsorTooltip] = useState<SponsorTooltipState | null>(null);
  const [sponsorBadgePositions, setSponsorBadgePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [failedSponsorBadgeCodes, setFailedSponsorBadgeCodes] = useState<Set<string>>(() => new Set());
  const tooltipRef = useRef<TooltipData | null>(null);
  const tooltipExitTimerRef = useRef<number | null>(null);
  const hoveredCityCodeRef = useRef<string | null>(null);
  const lastTouchActivationAtRef = useRef(0);
  const citiesByCode = useMemo(
    () => Object.fromEntries(cities.map(city => [city.cityCode, city])),
    [cities]
  );
  const maxPoints = useMemo(() => Math.max(0, ...cities.map(city => city.totalPoints)), [cities]);
  const visibleSponsorBadges = useMemo(
    () => sponsorBadges.filter(badge => Boolean(badge.logoUrl) && Boolean(citiesByCode[badge.cityCode]) && !failedSponsorBadgeCodes.has(badge.cityCode)),
    [citiesByCode, failedSponsorBadgeCodes, sponsorBadges]
  );
  const showSponsorTooltip = (badge: MapSponsorBadge, cityName: string) => {
    const position = sponsorBadgePositions[badge.cityCode] ?? { x: 0, y: 0 };
    const mapWidth = containerRef.current?.getBoundingClientRect().width ?? 0;
    setSponsorTooltip({
      cityCode: badge.cityCode,
      cityName,
      brandName: badge.brandName,
      x: mapWidth ? Math.max(98, Math.min(mapWidth - 98, position.x)) : position.x,
      y: Math.max(42, position.y - 24),
    });
  };
  const renderedSvgMarkup = useMemo(() => {
    if (!svgMarkup || typeof DOMParser === "undefined") return svgMarkup;
    const document = new DOMParser().parseFromString(svgMarkup, "image/svg+xml");
    document.querySelectorAll<SVGGElement>("g[data-city-code]").forEach(group => {
      const cityCode = group.dataset.cityCode ?? "";
      const city = citiesByCode[cityCode];
      if (!city) return;
      const isSelected = cityCode === selectedCityCode;
      group.style.setProperty("--city-fill", getVoteIntensityColor(city.totalPoints, maxPoints));
      group.classList.toggle("is-selected", isSelected);
      group.toggleAttribute("data-selected", isSelected);
      group.setAttribute("tabindex", "0");
      group.setAttribute("role", "button");
      group.setAttribute("aria-pressed", String(isSelected));
      group.setAttribute("aria-label", `${city.cityName}: Türkiye sırası ${city.rank}, ${city.totalPoints} günlük puan`);
    });
    return document.documentElement.outerHTML;
  }, [citiesByCode, maxPoints, selectedCityCode, svgMarkup]);

  useEffect(() => {
    let active = true;
    fetch(MAP_ASSET_URL)
      .then(response => {
        if (!response.ok) throw new Error("Harita yüklenemedi");
        return response.text();
      })
      .then(source => {
        if (!active) return;
        setSvgMarkup(source.replace(/<script[\s\S]*?<\/script>/gi, ""));
      })
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => () => {
    if (tooltipExitTimerRef.current !== null) {
      window.clearTimeout(tooltipExitTimerRef.current);
    }
  }, []);

  useEffect(() => {
    const root = containerRef.current;
    if (!root || !renderedSvgMarkup || visibleSponsorBadges.length === 0) {
      setSponsorBadgePositions(previous => Object.keys(previous).length === 0 ? previous : {});
      return;
    }
    let animationFrame: number | null = null;
    const updatePositions = () => {
      const rootBox = root.getBoundingClientRect();
      if (rootBox.width === 0 || rootBox.height === 0) return;
      const nextPositions: Record<string, { x: number; y: number }> = {};
      visibleSponsorBadges.forEach(badge => {
        const group = root.querySelector<SVGGElement>(`g[data-city-code="${badge.cityCode}"]`);
        if (!group) return;
        const groupBox = group.getBoundingClientRect();
        if (groupBox.width === 0 || groupBox.height === 0) return;
        nextPositions[badge.cityCode] = {
          x: groupBox.left - rootBox.left + groupBox.width / 2,
          y: groupBox.top - rootBox.top + groupBox.height / 2,
        };
      });
      setSponsorBadgePositions(nextPositions);
    };
    animationFrame = window.requestAnimationFrame(updatePositions);
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updatePositions);
    resizeObserver?.observe(root);
    window.addEventListener("resize", updatePositions);
    return () => {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updatePositions);
    };
  }, [renderedSvgMarkup, visibleSponsorBadges]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root || !renderedSvgMarkup) return;
    const groups = Array.from(root.querySelectorAll<SVGGElement>("g[data-city-code]"));
    const closestGroup = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return;
      return target.closest<SVGGElement>("g[data-city-code]");
    };
    const applySelection = (cityCode?: string) => {
      groups.forEach(group => {
        const isSelected = group.dataset.cityCode === cityCode;
        group.classList.toggle("is-selected", isSelected);
        group.toggleAttribute("data-selected", isSelected);
      });
    };
    const activate = (target: EventTarget | null) => {
      const group = closestGroup(target);
      const cityCode = group?.dataset.cityCode;
      if (!cityCode) return;
      applySelection(cityCode);
      onCitySelect(cityCode);
    };
    const showTooltipForGroup = (group: SVGGElement, presentation: TooltipState["presentation"] = "static") => {
      const cityCode = group.dataset.cityCode;
      const city = cityCode ? citiesByCode[cityCode] : undefined;
      if (!group || !city) return;
      const rootBox = root.getBoundingClientRect();
      const groupBox = group.getBoundingClientRect();
      if (tooltipExitTimerRef.current !== null) {
        window.clearTimeout(tooltipExitTimerRef.current);
        tooltipExitTimerRef.current = null;
      }
      const nextTooltip: TooltipData = {
        city,
        x: Math.max(104, Math.min(rootBox.width - 104, groupBox.left - rootBox.left + groupBox.width / 2)),
        y: Math.max(132, groupBox.top - rootBox.top + 16),
      };
      tooltipRef.current = nextTooltip;
      setTooltip({ ...nextTooltip, isClosing: false, presentation });
    };
    const hideTooltip = () => {
      const currentTooltip = tooltipRef.current;
      if (!currentTooltip) return;
      tooltipRef.current = null;
      const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      if (prefersReducedMotion) {
        setTooltip(null);
        return;
      }
      setTooltip({ ...currentTooltip, isClosing: true, presentation: "animated" });
      if (tooltipExitTimerRef.current !== null) {
        window.clearTimeout(tooltipExitTimerRef.current);
      }
      tooltipExitTimerRef.current = window.setTimeout(() => {
        setTooltip(current => current?.isClosing ? null : current);
        tooltipExitTimerRef.current = null;
      }, TOOLTIP_EXIT_DURATION_MS);
    };
    const handleClick = (event: MouseEvent) => {
      const group = closestGroup(event.target);
      const isFollowUpTouchClick = Date.now() - lastTouchActivationAtRef.current < TOUCH_CLICK_GUARD_MS;
      if (group && !isFollowUpTouchClick) showTooltipForGroup(group, "static");
      activate(event.target);
    };
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate(event.target);
      }
    };
    const handleMapMouseOver = (event: MouseEvent) => {
      const group = closestGroup(event.target);
      const cityCode = group?.dataset.cityCode;
      if (!group || !cityCode || hoveredCityCodeRef.current === cityCode) return;
      if (Date.now() - lastTouchActivationAtRef.current < TOUCH_CLICK_GUARD_MS) return;
      hoveredCityCodeRef.current = cityCode;
      showTooltipForGroup(group, "animated");
    };
    const handleMapMouseLeave = () => {
      hoveredCityCodeRef.current = null;
      hideTooltip();
    };
    const handleTouchPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      const group = closestGroup(event.target);
      const cityCode = group?.dataset.cityCode;
      if (!group || !cityCode) return;
      event.stopPropagation();
      lastTouchActivationAtRef.current = Date.now();
      if (tooltipRef.current?.city.cityCode === cityCode) {
        hideTooltip();
        return;
      }
      showTooltipForGroup(group, "static");
    };
    const handleOutsideTouchPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch" && event.target instanceof Node && !root.contains(event.target)) {
        hideTooltip();
      }
    };

    const groupListeners = groups.map(group => {
      const handleFocus = () => showTooltipForGroup(group, "static");
      const handleBlur = () => hideTooltip();
      group.addEventListener("focus", handleFocus);
      group.addEventListener("blur", handleBlur);
      return { group, handleFocus, handleBlur };
    });

    root.addEventListener("click", handleClick);
    root.addEventListener("keydown", handleKeydown);
    root.addEventListener("mouseover", handleMapMouseOver);
    root.addEventListener("mouseleave", handleMapMouseLeave);
    root.addEventListener("pointerdown", handleTouchPointerDown);
    document.addEventListener("pointerdown", handleOutsideTouchPointerDown);
    root.dataset.interactive = "true";
    return () => {
      delete root.dataset.interactive;
      root.removeEventListener("click", handleClick);
      root.removeEventListener("keydown", handleKeydown);
      root.removeEventListener("mouseover", handleMapMouseOver);
      root.removeEventListener("mouseleave", handleMapMouseLeave);
      root.removeEventListener("pointerdown", handleTouchPointerDown);
      document.removeEventListener("pointerdown", handleOutsideTouchPointerDown);
      groupListeners.forEach(listener => {
        if (!listener) return;
        listener.group.removeEventListener("focus", listener.handleFocus);
        listener.group.removeEventListener("blur", listener.handleBlur);
      });
    };
  }, [citiesByCode, onCitySelect, renderedSvgMarkup]);

  if (loadError) {
    return (
      <div className="map-fallback" role="status">
        Türkiye haritası şu anda yüklenemedi. İl sıralaması üzerinden yarışa katılabilirsin.
      </div>
    );
  }

  return (
    <div className="turkey-map" ref={containerRef} aria-label="Etkileşimli Türkiye il haritası">
      {renderedSvgMarkup ? (
        <div dangerouslySetInnerHTML={{ __html: renderedSvgMarkup }} />
      ) : (
        <div className="map-loading">Harita hazırlanıyor…</div>
      )}
      {visibleSponsorBadges.length > 0 && (
        <div className="map-sponsor-badges" aria-label="Şehir Valisi logoları">
          {visibleSponsorBadges.map(badge => {
            const position = sponsorBadgePositions[badge.cityCode];
            const cityName = citiesByCode[badge.cityCode]?.cityName ?? badge.cityCode;
            return (
              <button
                key={badge.cityCode}
                className={`map-sponsor-badge${position ? " is-positioned" : ""}`}
                type="button"
                data-sponsor-city-code={badge.cityCode}
                aria-label={`${cityName} Şehir Valisi: ${badge.brandName}. Şehir ayrıntısını aç.`}
                aria-describedby={sponsorTooltip?.cityCode === badge.cityCode ? "map-sponsor-tooltip" : undefined}
                aria-hidden={!position}
                tabIndex={position ? 0 : -1}
                style={position ? { left: `${position.x}px`, top: `${position.y}px` } : undefined}
                onPointerDown={event => event.stopPropagation()}
                onMouseEnter={() => showSponsorTooltip(badge, cityName)}
                onMouseLeave={() => setSponsorTooltip(current => current?.cityCode === badge.cityCode ? null : current)}
                onFocus={() => showSponsorTooltip(badge, cityName)}
                onBlur={() => setSponsorTooltip(current => current?.cityCode === badge.cityCode ? null : current)}
                onClick={event => {
                  event.stopPropagation();
                  onCitySelect(badge.cityCode);
                }}
              >
                <img src={badge.logoUrl} alt="" onError={() => setFailedSponsorBadgeCodes(previous => new Set(previous).add(badge.cityCode))} />
                <span className="map-sponsor-badge-crown" aria-hidden="true">♛</span>
              </button>
            );
          })}
        </div>
      )}
      {sponsorTooltip && (
        <div
          id="map-sponsor-tooltip"
          className="map-sponsor-tooltip"
          role="tooltip"
          style={{ left: `${sponsorTooltip.x}px`, top: `${sponsorTooltip.y}px` }}
        >
          <span>ŞEHİR VALİSİ</span>
          <strong>{sponsorTooltip.cityName}</strong>
          <b>{sponsorTooltip.brandName}</b>
        </div>
      )}
      {tooltip && (
        <div
          id="map-vote-tooltip"
          className={`map-vote-tooltip ${tooltip.isClosing ? "is-closing" : tooltip.presentation === "animated" ? "is-visible" : "is-static"}`}
          role="tooltip"
          aria-hidden={tooltip.isClosing ? true : undefined}
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          <span className="map-vote-tooltip-kicker">ANLIK GÜNLÜK DURUM</span>
          <strong>{tooltip.city.cityName}</strong>
          <dl className="map-vote-tooltip-stats">
            <div><dt>Günlük oy</dt><dd>{tooltip.city.totalPoints}</dd></div>
            <div><dt>Türkiye sırası</dt><dd>#{tooltip.city.rank}</dd></div>
          </dl>
        </div>
      )}
    </div>
  );
}
