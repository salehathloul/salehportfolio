"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Country, City } from "country-state-city";

// ── Excluded countries ────────────────────────────────────────────────────────
const EXCLUDED = new Set(["IL"]); // إسرائيل

// ── Arabic country name overrides ─────────────────────────────────────────────
const AR_COUNTRY: Record<string, string> = {
  SA: "المملكة العربية السعودية",
  AE: "الإمارات العربية المتحدة",
  KW: "الكويت",
  QA: "قطر",
  BH: "البحرين",
  OM: "سلطنة عُمان",
  JO: "الأردن",
  EG: "مصر",
  LB: "لبنان",
  IQ: "العراق",
  SY: "سوريا",
  YE: "اليمن",
  LY: "ليبيا",
  TN: "تونس",
  DZ: "الجزائر",
  MA: "المغرب",
  SD: "السودان",
  SO: "الصومال",
  MR: "موريتانيا",
  KM: "جزر القمر",
  DJ: "جيبوتي",
  PS: "فلسطين",
  US: "الولايات المتحدة",
  GB: "المملكة المتحدة",
  FR: "فرنسا",
  DE: "ألمانيا",
  IT: "إيطاليا",
  ES: "إسبانيا",
  TR: "تركيا",
  PK: "باكستان",
  IN: "الهند",
  CN: "الصين",
  JP: "اليابان",
  CA: "كندا",
  AU: "أستراليا",
};

// ── Build country list once ───────────────────────────────────────────────────
const ALL_COUNTRIES = Country.getAllCountries()
  .filter((c) => !EXCLUDED.has(c.isoCode))
  .sort((a, b) => {
    // Arabic-speaking countries first
    const arCodes = ["SA","AE","KW","QA","BH","OM","JO","EG","LB","IQ","SY","YE","LY","TN","DZ","MA","SD","PS","MR","SO","KM","DJ"];
    const ai = arCodes.indexOf(a.isoCode);
    const bi = arCodes.indexOf(b.isoCode);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

// ── Types ─────────────────────────────────────────────────────────────────────
interface Props {
  locale: "ar" | "en";
  country: string;
  city: string;
  onCountryChange: (val: string) => void;
  onCityChange: (val: string) => void;
}

// ── Combobox (shared) ─────────────────────────────────────────────────────────
function Combobox({
  value,
  placeholder,
  options,
  onChange,
  disabled,
  dir,
}: {
  value: string;
  placeholder: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
  dir?: "rtl" | "ltr";
}) {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState("");
  const inputRef  = useRef<HTMLInputElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [query, options]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleOpen() {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 10);
  }

  function handleSelect(v: string) {
    onChange(v);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={wrapRef} className="lc-wrap" dir={dir}>
      {/* Trigger */}
      <button
        type="button"
        className={`lc-trigger ${disabled ? "lc-trigger--disabled" : ""}`}
        onClick={handleOpen}
        disabled={disabled}
      >
        <span className={`lc-trigger-val ${!selectedLabel ? "lc-trigger-placeholder" : ""}`}>
          {selectedLabel || placeholder}
        </span>
        <svg className="lc-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 5l4 4 4-4" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="lc-dropdown">
          <div className="lc-search-wrap">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="6.5" cy="6.5" r="4.5" /><path d="M11 11l3 3" />
            </svg>
            <input
              ref={inputRef}
              className="lc-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dir === "rtl" ? "ابحث..." : "Search..."}
              dir={dir}
            />
          </div>

          <ul className="lc-list" role="listbox">
            {filtered.length === 0 ? (
              <li className="lc-empty">{dir === "rtl" ? "لا نتائج" : "No results"}</li>
            ) : (
              filtered.map((opt) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={opt.value === value}
                  className={`lc-item ${opt.value === value ? "lc-item--active" : ""}`}
                  onMouseDown={() => handleSelect(opt.value)}
                >
                  {opt.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      <style>{`
        .lc-wrap { position: relative; width: 100%; }

        .lc-trigger {
          width: 100%;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.65rem 0.875rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.9rem; font-family: inherit;
          cursor: pointer;
          text-align: start;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }
        .lc-trigger:not(.lc-trigger--disabled):hover { border-color: var(--text-secondary); }
        .lc-trigger--disabled { opacity: 0.45; cursor: not-allowed; }
        .lc-trigger-placeholder { color: var(--text-subtle); }
        .lc-chevron { flex-shrink: 0; opacity: 0.5; }

        .lc-dropdown {
          position: absolute; top: calc(100% + 4px); inset-inline-start: 0;
          width: 100%; min-width: 220px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          z-index: 999;
          overflow: hidden;
        }

        .lc-search-wrap {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-subtle);
        }
        .lc-search {
          flex: 1; border: none; outline: none; background: transparent;
          font-size: 0.85rem; font-family: inherit;
          color: var(--text-primary);
        }
        .lc-search::placeholder { color: var(--text-subtle); }

        .lc-list {
          list-style: none; margin: 0; padding: 0.25rem 0;
          max-height: 220px; overflow-y: auto;
        }

        .lc-item {
          padding: 0.5rem 0.875rem;
          font-size: 0.875rem; cursor: pointer;
          color: var(--text-primary);
          transition: background var(--transition-fast);
        }
        .lc-item:hover { background: var(--bg-secondary); }
        .lc-item--active {
          background: var(--bg-secondary);
          font-weight: 500;
        }

        .lc-empty {
          padding: 0.75rem 0.875rem;
          font-size: 0.85rem; color: var(--text-muted);
          text-align: center;
        }
      `}</style>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function LocationSelect({
  locale, country, city, onCountryChange, onCityChange,
}: Props) {
  const isAr = locale === "ar";
  const dir  = isAr ? "rtl" as const : "ltr" as const;

  // Country options
  const countryOptions = useMemo(() =>
    ALL_COUNTRIES.map((c) => ({
      value: c.isoCode,
      label: isAr
        ? (AR_COUNTRY[c.isoCode] ?? c.name)
        : c.name,
    })),
  [isAr]);

  // City options filtered by selected country
  const cityOptions = useMemo(() => {
    if (!country) return [];
    const cities = City.getCitiesOfCountry(country) ?? [];
    // Deduplicate city names
    const seen = new Set<string>();
    return cities
      .filter((c) => {
        if (seen.has(c.name)) return false;
        seen.add(c.name);
        return true;
      })
      .map((c) => ({ value: c.name, label: c.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [country]);

  function handleCountryChange(code: string) {
    onCountryChange(code);
    onCityChange(""); // reset city on country change
  }

  return (
    <div className="location-row" dir={dir}>
      <div className="location-field">
        <label className="om-label">{isAr ? "الدولة" : "Country"}</label>
        <Combobox
          value={country}
          placeholder={isAr ? "اختر الدولة" : "Select country"}
          options={countryOptions}
          onChange={handleCountryChange}
          dir={dir}
        />
      </div>

      <div className="location-field">
        <label className="om-label">{isAr ? "المدينة" : "City"}</label>
        <Combobox
          value={city}
          placeholder={isAr ? (country ? "اختر المدينة" : "اختر الدولة أولاً") : (country ? "Select city" : "Select country first")}
          options={cityOptions}
          onChange={onCityChange}
          disabled={!country}
          dir={dir}
        />
      </div>

      <style>{`
        .location-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        @media (max-width: 420px) {
          .location-row { grid-template-columns: 1fr; }
        }
        .location-field { display: flex; flex-direction: column; gap: 0.4rem; }
      `}</style>
    </div>
  );
}
