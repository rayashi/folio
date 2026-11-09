"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatInCurrency,
  formatPercent,
  formatQuantity,
  formatTarget,
  type MoneyCurrency,
} from "@/lib/format";
import type { PortfolioNode } from "@/lib/portfolio";
import { layoutPortfolio, type MapCell } from "@/lib/treemap";

function pairLabel(cell: MapCell) {
  const current =
    cell.globalShare == null ? "—" : formatPercent(cell.globalShare);
  if (cell.targetPercentage == null) return current;
  return `${current} | ${formatTarget(cell.targetPercentage)}`;
}

function HeaderCell({
  cell,
  currency,
  usdBrlRate,
  showValues,
}: {
  cell: MapCell;
  currency: MoneyCurrency;
  usdBrlRate: number;
  showValues: boolean;
}) {
  const value =
    !showValues || cell.valueBrl == null
      ? null
      : formatInCurrency(cell.valueBrl, "BRL", currency, usdBrlRate);
  const showName = cell.pixelWidth >= 88 && cell.pixelHeight >= 18;
  const showValue = value != null && cell.pixelWidth >= 140 && cell.pixelHeight >= 18;
  const showShare = cell.pixelWidth >= (showValues ? 300 : 140) && cell.pixelHeight >= 20;
  return (
    <div
      className="absolute flex items-center justify-between gap-2 overflow-hidden px-2 whitespace-nowrap"
      style={{
        left: `${cell.x}%`,
        top: `${cell.y}%`,
        width: `${cell.w}%`,
        height: `${cell.h}%`,
        backgroundColor: cell.fill,
        backgroundImage:
          "linear-gradient(rgba(41, 59, 46, 0.05), rgba(41, 59, 46, 0.05))",
      }}
      title={`${cell.name}${value ? ` · ${value}` : ""} · ${pairLabel(cell)}`}
    >
      {showName ? (
        <span className="truncate font-sans text-[12px] font-semibold text-[#293b2e]">
          {cell.name}
        </span>
      ) : null}
      {showValue || showShare ? (
        <span className="ml-auto flex shrink-0 items-center gap-3">
          {showValue ? (
            <span className="font-mono text-[11px] text-[#293b2e]">{value}</span>
          ) : null}
          {showShare ? (
            <span className="font-mono text-[11px] text-[#405447]">
              {pairLabel(cell)}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

function AssetCell({
  cell,
  currency,
  usdBrlRate,
  showValues,
}: {
  cell: MapCell;
  currency: MoneyCurrency;
  usdBrlRate: number;
  showValues: boolean;
}) {
  const showTicker = cell.pixelWidth >= 56 && cell.pixelHeight >= 32;
  const showShare = cell.pixelWidth >= 140 && cell.pixelHeight >= 64;
  const showValue = showValues && cell.pixelWidth >= 120 && cell.pixelHeight >= 96;
  const showQuantity =
    showValues &&
    cell.quantity != null &&
    cell.pixelWidth >= 96 &&
    cell.pixelHeight >= 124;
  const tickerSize = cell.pixelWidth >= 180 ? 25 : cell.pixelWidth >= 110 ? 16 : 12;

  return (
    <div
      className="absolute overflow-hidden"
      style={{
        left: `${cell.x}%`,
        top: `${cell.y}%`,
        width: `${cell.w}%`,
        height: `${cell.h}%`,
        backgroundColor: cell.fill,
      }}
      title={`${cell.name} · ${pairLabel(cell)}${showValues && cell.valueBrl != null ? ` · ${formatInCurrency(cell.valueBrl, "BRL", currency, usdBrlRate)}` : ""}`}
    >
      <div className="flex h-full flex-col px-2.5 py-2">
        {showTicker ? (
          <span
            className="truncate font-sans font-semibold leading-none text-[#29332d]"
            style={{ fontSize: tickerSize }}
          >
            {cell.name}
          </span>
        ) : null}
        {showShare ? (
          <span className="mt-1.5 truncate font-mono text-[12px] text-[#405447]">
            {pairLabel(cell)}
          </span>
        ) : null}
        {showValue ? (
          <span className="mt-auto truncate font-mono text-[13px] text-[#405447]">
            {cell.valueBrl == null
              ? "—"
              : formatInCurrency(cell.valueBrl, "BRL", currency, usdBrlRate)}
          </span>
        ) : null}
        {showQuantity ? (
          <span className="mt-1 truncate font-mono text-[10px] text-[#697667]">
            Qtd. {formatQuantity(cell.quantity ?? 0)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function AllocationMap({
  nodes,
  currency,
  usdBrlRate,
  showValues,
}: {
  nodes: PortfolioNode[];
  currency: MoneyCurrency;
  usdBrlRate: number;
  showValues: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => setWidth(frame.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  // Narrow screens need more height so small classes still fit their labels.
  const ratio = width < 720 ? 2.6 : 0.92;
  const height = width === 0 ? 640 : Math.max(640, Math.round(width * ratio));
  const cells = width === 0 ? [] : layoutPortfolio(nodes, width, height);

  return (
    <div ref={frameRef} className="relative w-full bg-[#f7f5ef]" style={{ height }}>
      {cells.map((cell) =>
        cell.kind === "header" ? (
          <HeaderCell
            key={cell.key}
            cell={cell}
            currency={currency}
            usdBrlRate={usdBrlRate}
            showValues={showValues}
          />
        ) : (
          <AssetCell
            key={cell.key}
            cell={cell}
            currency={currency}
            usdBrlRate={usdBrlRate}
            showValues={showValues}
          />
        ),
      )}
    </div>
  );
}
