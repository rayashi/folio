"use client";

import { useState } from "react";
import { AllocationMap } from "@/components/allocation-map";
import { HoldingsTable } from "@/components/holdings-table";
import { formatBrl, formatRate, formatUsd, type MoneyCurrency } from "@/lib/format";
import {
  buildPortfolio,
  type AllocationInput,
  type Portfolio,
} from "@/lib/portfolio";

const NAV = [
  { label: "Overview", current: false },
  { label: "Allocation", current: true },
  { label: "Activity", current: false },
];

export function AllocationDashboard({
  allocation,
  initialUsdBrlRate,
  initialQuotes,
  initialError = null,
  pending = false,
}: {
  allocation: AllocationInput;
  initialUsdBrlRate: number | null;
  initialQuotes: Record<string, number>;
  initialError?: string | null;
  pending?: boolean;
}) {
  const [portfolio, setPortfolio] = useState<Portfolio>(() =>
    buildPortfolio(allocation, initialUsdBrlRate ?? 0, initialQuotes),
  );
  const [refreshing, setRefreshing] = useState(pending);
  const [error, setError] = useState<string | null>(initialError);
  const [currency, setCurrency] = useState<MoneyCurrency>("BRL");
  const [view, setView] = useState<ViewMode>("map");
  const [showValues, setShowValues] = useState(true);

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/quotes", { cache: "no-store" });
      const body = (await response.json()) as {
        quotes?: Record<string, number>;
        usdBrlRate?: number;
        error?: string;
      };
      if (!response.ok || !body.quotes || typeof body.usdBrlRate !== "number") {
        throw new Error(body.error ?? "Não foi possível atualizar as cotações.");
      }
      setPortfolio(buildPortfolio(allocation, body.usdBrlRate, body.quotes));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao atualizar.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="min-h-full bg-[#f7f5ef] text-[#292c27]">
      <header className="border-b border-[#dcddd3]">
        <div className="mx-auto flex h-[76px] w-full max-w-[1680px] items-center gap-[54px] px-6 md:px-16">
          <p className="font-serif text-[24px] tracking-[-0.8px] text-[#292c27]">
            folio
          </p>
          <nav aria-label="Workspace" className="flex h-full gap-[30px]">
            {NAV.map((item) => (
              <span
                key={item.label}
                aria-current={item.current ? "page" : undefined}
                className={`relative flex h-full items-center text-[13px] ${
                  item.current
                    ? "font-semibold text-[#3e5744]"
                    : "text-[#74766c]"
                }`}
              >
                {item.label}
                {item.current ? (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[#3e5744]" />
                ) : null}
              </span>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1680px] px-6 pt-7 pb-6 md:px-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="font-serif text-[34px] tracking-[-1.2px] text-[#292c27] md:text-[40px] md:tracking-[-1.4px]">
            Asset Allocation
          </h1>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <p className="font-sans text-[10px] font-medium tracking-[1.1px] text-[#74766c]">
              TOTALIZADORES
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-4">
              <Total
                flag="/flags/us.svg"
                flagLabel="Estados Unidos"
                value={
                  showValues
                    ? portfolio.usdBrlRate > 0
                      ? formatUsd(portfolio.totalUsd)
                      : "—"
                    : HIDDEN_VALUE
                }
                caption="TOTAL USD"
              />
              <Total
                flag="/flags/br.svg"
                flagLabel="Brasil"
                value={showValues ? formatBrl(portfolio.totalBrl) : HIDDEN_VALUE}
                caption="TOTAL BRL"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-y border-[#dcddd3]">
        <div className="mx-auto flex min-h-[58px] w-full max-w-[1680px] flex-wrap items-center justify-between gap-3 px-6 py-3 md:px-16">
          <p className="text-[12px] text-[#74766c]">
            {portfolio.classCount} classes principais · {portfolio.assetCount}{" "}
            ativos
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {error ? (
              <p className="text-[12px] text-[#8a4b3c]">{error}</p>
            ) : null}
            <SegmentedSwitch
              label="Visualização"
              value={view}
              options={VIEW_OPTIONS}
              onChange={setView}
            />
            <CurrencySwitch value={currency} onChange={setCurrency} />
            <button
              type="button"
              aria-pressed={!showValues}
              aria-label={showValues ? "Ocultar valores" : "Mostrar valores"}
              title={showValues ? "Ocultar valores" : "Mostrar valores"}
              onClick={() => setShowValues((current) => !current)}
              className={`inline-flex size-[30px] items-center justify-center rounded-full border border-[#3e5744] transition-colors ${
                showValues
                  ? "text-[#3e5744] hover:bg-[#3e5744] hover:text-[#f7f5ef]"
                  : "bg-[#3e5744] text-[#f7f5ef]"
              }`}
            >
              {showValues ? <EyeIcon /> : <EyeOffIcon />}
            </button>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing}
              className="inline-flex items-center rounded-full border border-[#3e5744] px-3 py-2 text-[12px] leading-none text-[#3e5744] transition-colors hover:bg-[#3e5744] hover:text-[#f7f5ef] disabled:cursor-wait disabled:opacity-50"
            >
              {refreshing ? "Atualizando" : "Atualizar"}
            </button>
            <p className="font-mono text-[10px] text-[#6b756d]">
              1 USD ={" "}
              {portfolio.usdBrlRate > 0
                ? `R$ ${formatRate(portfolio.usdBrlRate)}`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1680px] px-6 py-6 md:px-16">
        {view === "map" ? (
          <section className="min-w-0">
            <div className="flex flex-col gap-1 pb-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <h2 className="font-serif text-[23px] leading-none text-[#29332d]">
                Mapa por valor atual
              </h2>
              <p className="font-mono text-[10px] text-[#6b756d]">
                ÁREA ≈ VALOR ATUAL · CLASSES PEQUENAS AMPLIADAS
              </p>
            </div>
            <AllocationMap
              nodes={portfolio.nodes}
              currency={currency}
              usdBrlRate={portfolio.usdBrlRate}
              showValues={showValues}
            />
          </section>
        ) : (
          <HoldingsTable
            nodes={portfolio.nodes}
            totalBrl={portfolio.totalBrl}
            usdBrlRate={portfolio.usdBrlRate}
            currency={currency}
            showValues={showValues}
            assetCount={portfolio.assetCount}
          />
        )}
      </main>
    </div>
  );
}

const HIDDEN_VALUE = "••••";

type ViewMode = "map" | "table";

const VIEW_OPTIONS = [
  { value: "map", label: "Mapa" },
  { value: "table", label: "Tabela" },
] as const;

function SegmentedSwitch<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex items-center rounded-full border border-[#3e5744] p-1"
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] leading-none transition-colors ${
              selected
                ? "bg-[#3e5744] text-[#f7f5ef]"
                : "text-[#3e5744] hover:bg-[#ebefe5]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-3.2 4.3" />
      <path d="M6.1 6.1C3.8 7.8 2 12 2 12s3.5 7 10 7a10.7 10.7 0 0 0 4.1-.8" />
    </svg>
  );
}

function CurrencySwitch({
  value,
  onChange,
}: {
  value: MoneyCurrency;
  onChange: (currency: MoneyCurrency) => void;
}) {
  return (
    <SegmentedSwitch
      label="Moeda dos valores"
      value={value}
      options={[
        { value: "BRL", label: "BRL" },
        { value: "USD", label: "USD" },
      ]}
      onChange={onChange}
    />
  );
}

function Total({
  flag,
  flagLabel,
  value,
  caption,
}: {
  flag: string;
  flagLabel: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- local SVG flag marks; next/image does not render them */}
        <img
          src={flag}
          alt=""
          className="h-4 w-6 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(41,44,39,0.15)]"
        />
        <span className="sr-only">{flagLabel}</span>
        <span className="font-serif text-[28px] tracking-[-1px] text-[#292c27] sm:text-[40px] sm:tracking-[-1.4px]">
          {value}
        </span>
      </div>
      <span className="font-mono text-[11px] text-[#74766c]">{caption}</span>
    </div>
  );
}
