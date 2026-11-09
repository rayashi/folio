import type { AllocationInput } from "@/lib/portfolio";

export function isListedCode(code: string) {
  return /^[A-Z]{1,5}(\d{1,2})?$/.test(code);
}

export function yahooSymbol(code: string) {
  return /\d/.test(code) ? `${code}.SA` : code;
}

export function listedCodes(allocation: AllocationInput): string[] {
  const codes: string[] = [];
  const visit = (nodes: AllocationInput["classes"]) => {
    for (const node of nodes) {
      if (node.classes) visit(node.classes);
      for (const asset of node.assets ?? []) {
        if (isListedCode(asset.code)) codes.push(asset.code);
      }
    }
  };
  visit(allocation.classes);
  return codes;
}

async function fetchPrice(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": "folio" },
  });
  if (!response.ok) {
    throw new Error(`${symbol}: HTTP ${response.status}`);
  }
  const payload = (await response.json()) as {
    chart?: { result?: Array<{ meta?: { regularMarketPrice?: number } }> };
  };
  const price = payload.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (typeof price !== "number") {
    throw new Error(`${symbol}: sem cotação`);
  }
  return price;
}

export async function fetchMarketQuotes(codes: string[]) {
  const entries = await Promise.all(
    codes.map(async (code) => {
      const price = await fetchPrice(yahooSymbol(code));
      return [code, Math.round(price * 100) / 100] as const;
    }),
  );
  return Object.fromEntries(entries);
}

/** Reais per one US dollar. */
export async function fetchUsdBrlRate() {
  const price = await fetchPrice("USDBRL=X");
  return Math.round(price * 10000) / 10000;
}
