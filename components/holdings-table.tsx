"use client";

import { useState } from "react";
import {
  formatInCurrency,
  formatPercent,
  formatQuantity,
  formatTarget,
  type MoneyCurrency,
} from "@/lib/format";
import type { PortfolioNode } from "@/lib/portfolio";

function dash(value: string | null) {
  return value ?? "—";
}

const HIDDEN_VALUE = "••••";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`size-3 shrink-0 text-[#667866] transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="size-3.5 shrink-0 text-[#3e5744]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 8.5V7a2 2 0 0 1 2-2h12a1.5 1.5 0 0 1 1.5 1.5V8" />
      <path d="M3 9h18v8.5A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5V9Z" />
      <path d="M16 14.5h2.5" />
    </svg>
  );
}

function HoldingRows({
  nodes,
  currency,
  usdBrlRate,
  showValues,
  collapsed,
  onToggle,
}: {
  nodes: PortfolioNode[];
  currency: MoneyCurrency;
  usdBrlRate: number;
  showValues: boolean;
  collapsed: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  return nodes.map((node) => (
    <HoldingRow
      key={node.id}
      node={node}
      currency={currency}
      usdBrlRate={usdBrlRate}
      showValues={showValues}
      collapsed={collapsed}
      onToggle={onToggle}
    />
  ));
}

function HoldingRow({
  node,
  currency,
  usdBrlRate,
  showValues,
  collapsed,
  onToggle,
}: {
  node: PortfolioNode;
  currency: MoneyCurrency;
  usdBrlRate: number;
  showValues: boolean;
  collapsed: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  const isAsset = node.kind === "asset";
  const open = !collapsed.has(node.id);
  return (
    <>
      <tr className="border-b border-[#d9ded2]">
        <th
          scope="row"
          className="overflow-hidden py-2 pr-2 text-left font-sans font-normal whitespace-nowrap"
          style={{ paddingLeft: 8 + node.depth * 14 }}
        >
          {isAsset ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                aria-hidden
                className="w-3 shrink-0 text-center text-[11px] text-[#667866]"
              >
                •
              </span>
              <span className="truncate text-[11px] font-normal text-[#293b2e]">
                {node.name}
              </span>
            </span>
          ) : (
            <button
              type="button"
              aria-expanded={open}
              onClick={() => onToggle(node.id)}
              className="flex min-w-0 items-center gap-1.5 text-left"
            >
              <ChevronIcon open={open} />
              <WalletIcon />
              <span className="truncate text-[11px] font-semibold text-[#293b2e]">
                {node.name}
              </span>
            </button>
          )}
        </th>
        <td className="px-1 py-2 text-right font-mono text-[10px] whitespace-nowrap text-[#788273]">
          {!showValues && node.quantity != null
            ? HIDDEN_VALUE
            : node.quantity == null
              ? "—"
              : formatQuantity(node.quantity)}
        </td>
        <td className="px-1 py-2 text-right font-mono text-[10px] whitespace-nowrap text-[#788273]">
          {!showValues && node.quote != null
            ? HIDDEN_VALUE
            : node.quote == null || node.currency == null
              ? "—"
              : formatInCurrency(node.quote, node.currency, currency, usdBrlRate)}
        </td>
        <td className="px-1 py-2 text-right font-mono text-[10px] whitespace-nowrap text-[#788273]">
          {!showValues && node.holdingValue != null
            ? HIDDEN_VALUE
            : node.holdingValue == null || node.currency == null
              ? "—"
              : formatInCurrency(node.holdingValue, node.currency, currency, usdBrlRate)}
        </td>
        <td className="px-1 py-2 text-right font-mono text-[10px] whitespace-nowrap text-[#5c6a5b]">
          {dash(
            node.holdingClassPercentage == null
              ? null
              : formatPercent(node.holdingClassPercentage),
          )}
        </td>
        <td className="px-1 py-2 text-right font-mono text-[10px] whitespace-nowrap text-[#293b2e]">
          {dash(
            node.holdingGlobalPercentage == null
              ? null
              : formatPercent(node.holdingGlobalPercentage),
          )}
        </td>
        <td className="py-2 pl-1 text-right font-mono text-[10px] whitespace-nowrap text-[#657563]">
          {node.targetPercentage == null ? "—" : formatTarget(node.targetPercentage)}
        </td>
      </tr>
      {open && node.children.length > 0 ? (
        <HoldingRows
          nodes={node.children}
          currency={currency}
          usdBrlRate={usdBrlRate}
          showValues={showValues}
          collapsed={collapsed}
          onToggle={onToggle}
        />
      ) : null}
    </>
  );
}

export function HoldingsTable({
  nodes,
  totalBrl,
  usdBrlRate,
  currency,
  showValues,
  assetCount,
}: {
  nodes: PortfolioNode[];
  totalBrl: number;
  usdBrlRate: number;
  currency: MoneyCurrency;
  showValues: boolean;
  assetCount: number;
}) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  function toggle(id: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section>
      <div className="flex flex-col gap-1 pb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <h2 className="font-serif text-[23px] leading-none text-[#29332d]">
          Estrutura da carteira
        </h2>
        <p className="font-mono text-[10px] text-[#7a8378]">
          {assetCount} ativos
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] table-fixed border-collapse">
          <colgroup>
            <col className="w-[26%]" />
            <col className="w-[8%]" />
            <col className="w-[16%]" />
            <col className="w-[18%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-[#d9ded2] text-[9px] tracking-[0.04em] text-[#7a8378]">
              <th scope="col" className="py-2 pr-2 text-left font-sans font-normal">
                CLASSE / ATIVO
              </th>
              <th scope="col" className="px-1 py-2 text-right font-mono font-normal">
                QTD.
              </th>
              <th scope="col" className="px-1 py-2 text-right font-mono font-normal">
                COTAÇÃO · {currency}
              </th>
              <th scope="col" className="px-1 py-2 text-right font-mono font-normal">
                ATUAL · {currency}
              </th>
              <th scope="col" className="px-1 py-2 text-right font-mono font-normal">
                NA CLASSE
              </th>
              <th scope="col" className="px-1 py-2 text-right font-mono font-normal">
                GLOBAL
              </th>
              <th scope="col" className="py-2 pl-1 text-right font-mono font-normal">
                META
              </th>
            </tr>
          </thead>
          <tbody>
            <HoldingRows
              nodes={nodes}
              currency={currency}
              usdBrlRate={usdBrlRate}
              showValues={showValues}
              collapsed={collapsed}
              onToggle={toggle}
            />
          </tbody>
          <tfoot>
            <tr>
              <th
                scope="row"
                className="py-3.5 pr-3 text-left font-sans text-[12px] font-semibold text-[#29332d]"
              >
                Valor atual total
              </th>
              <td />
              <td />
              <td className="px-1 py-3.5 text-right font-mono text-[12px] text-[#788273]">
                {showValues
                  ? formatInCurrency(totalBrl, "BRL", currency, usdBrlRate)
                  : HIDDEN_VALUE}
              </td>
              <td />
              <td className="px-1 py-3.5 text-right font-mono text-[12px] text-[#29332d]">
                100%
              </td>
              <td className="py-3.5 pl-1 text-right font-mono text-[10px] text-[#657563]">
                100%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
