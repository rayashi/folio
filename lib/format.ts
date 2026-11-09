const amount = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const grouped = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

export function formatUsd(value: number) {
  return `$${amount.format(value)}`;
}

export function formatBrl(value: number) {
  return `R$ ${amount.format(value)}`;
}

export function formatAmount(value: number) {
  return amount.format(value);
}

export function formatQuantity(value: number) {
  return grouped.format(value);
}

export function formatPercent(value: number) {
  return `${amount.format(value)}%`;
}

export function formatTarget(value: number) {
  const digits = Number.isInteger(value) ? 0 : 2;
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function formatRate(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

export type MoneyCurrency = "USD" | "BRL";

export function formatMoney(value: number, currency: MoneyCurrency) {
  return currency === "USD" ? formatUsd(value) : formatBrl(value);
}

/** Format `value`, stored in `from`, as `to` using reais per dollar. */
export function formatInCurrency(
  value: number,
  from: MoneyCurrency,
  to: MoneyCurrency,
  usdBrlRate: number,
) {
  if (from === to) return formatMoney(value, to);
  if (!(usdBrlRate > 0)) return "—";
  const converted = from === "USD" ? value * usdBrlRate : value / usdBrlRate;
  return formatMoney(converted, to);
}
