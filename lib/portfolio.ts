export type Currency = "USD" | "BRL";

export type AssetInput = {
  code: string;
  targetPercentage?: number;
  holdingQuantity?: number;
  /** Cash already held, in `currency`. Not a market quote. */
  balance?: number;
  currency?: Currency;
};

export type ClassInput = {
  name: string;
  targetPercentage: number;
  classes?: ClassInput[];
  assets?: AssetInput[];
};

export type AllocationInput = {
  targetPercentage: number;
  classes: ClassInput[];
};

export type PortfolioNode = {
  id: string;
  name: string;
  kind: "class" | "asset";
  depth: number;
  targetPercentage: number | null;
  quantity: number | null;
  currency: Currency | null;
  quote: number | null;
  /** Position value in `currency`. Global share uses the BRL equivalent. */
  holdingValue: number | null;
  /** Share of the parent class, 0–100. */
  holdingClassPercentage: number | null;
  /** Share of the whole portfolio, 0–100. */
  holdingGlobalPercentage: number | null;
  valueBrl: number | null;
  color: string;
  children: PortfolioNode[];
};

export type Portfolio = {
  totalBrl: number;
  totalUsd: number;
  usdBrlRate: number;
  assetCount: number;
  classCount: number;
  nodes: PortfolioNode[];
};

const CLASS_COLORS: Record<string, string> = {
  Internacional: "#ebefe5",
  "Internacional/Stocks": "#dde8e9",
  "Internacional/Stocks/ETFs de Stocks": "#ccdee8",
  "Internacional/Stocks/Stocks Picking": "#d7d2e7",
  "Internacional/REITs": "#e2ead2",
  "Internacional/REITs/REITs ETFs": "#d7e3be",
  "Internacional/REITs/REITs": "#c9dccb",
  Nacional: "#efe6d5",
  "Nacional/Ações": "#e8d8b8",
  "Nacional/Renda Fixa": "#cadde2",
  "Nacional/Fundos Imobiliários": "#ecddad",
  "Nacional/Liquido": "#e4d4d1",
};

function colorFor(path: string[]) {
  return CLASS_COLORS[path.join("/")] ?? "#efe6d5";
}

function currencyFor(path: string[], asset: AssetInput): Currency {
  if (asset.currency) return asset.currency;
  return path[0] === "Internacional" ? "USD" : "BRL";
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function toBrl(value: number, currency: Currency, usdBrlRate: number) {
  if (currency === "BRL") return value;
  if (usdBrlRate <= 0) return null;
  return value * usdBrlRate;
}

function sharedCurrency(children: PortfolioNode[]): Currency {
  const currencies = new Set(
    children
      .map((child) => child.currency)
      .filter((currency): currency is Currency => currency != null),
  );
  if (currencies.size === 1) return [...currencies][0];
  return "BRL";
}

function sumKnown(values: Array<number | null>): number | null {
  if (values.every((value) => value == null)) return null;
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

function buildClass(
  input: ClassInput,
  path: string[],
  depth: number,
  usdBrlRate: number,
  quotes: Record<string, number>,
): PortfolioNode {
  const nextPath = [...path, input.name];
  const color = colorFor(nextPath);
  const children = input.classes
    ? input.classes.map((child) =>
        buildClass(child, nextPath, depth + 1, usdBrlRate, quotes),
      )
    : (input.assets ?? []).map((asset) =>
        buildAsset(asset, nextPath, depth + 1, color, usdBrlRate, quotes),
      );
  const valueBrl = sumKnown(children.map((child) => child.valueBrl));
  const currency = sharedCurrency(children);
  const holdingValue =
    currency === "USD"
      ? sumKnown(children.map((child) => child.holdingValue))
      : valueBrl;

  return {
    id: nextPath.join("/"),
    name: input.name,
    kind: "class",
    depth,
    targetPercentage: input.targetPercentage,
    quantity: null,
    currency,
    quote: null,
    holdingValue,
    holdingClassPercentage: null,
    holdingGlobalPercentage: null,
    valueBrl,
    color,
    children,
  };
}

function buildAsset(
  asset: AssetInput,
  path: string[],
  depth: number,
  color: string,
  usdBrlRate: number,
  quotes: Record<string, number>,
): PortfolioNode {
  const currency = currencyFor(path, asset);
  const marketQuote = quotes[asset.code];
  const quote = typeof marketQuote === "number" ? marketQuote : null;
  const holdingValue =
    quote == null
      ? (asset.balance ?? null)
      : roundMoney(quote * (asset.holdingQuantity ?? 0));

  return {
    id: [...path, asset.code].join("/"),
    name: asset.code,
    kind: "asset",
    depth,
    targetPercentage: asset.targetPercentage ?? null,
    quantity: asset.holdingQuantity ?? null,
    currency,
    quote,
    holdingValue,
    holdingClassPercentage: null,
    holdingGlobalPercentage: null,
    valueBrl:
      holdingValue == null ? null : toBrl(holdingValue, currency, usdBrlRate),
    color,
    children: [],
  };
}

function assignShares(
  node: PortfolioNode,
  parentValue: number | null,
  total: number,
) {
  node.holdingClassPercentage =
    node.valueBrl == null || parentValue == null || parentValue <= 0
      ? null
      : (node.valueBrl / parentValue) * 100;
  node.holdingGlobalPercentage =
    node.valueBrl == null || total <= 0 ? null : (node.valueBrl / total) * 100;
  for (const child of node.children) {
    assignShares(child, node.valueBrl, total);
  }
}

function countAssets(nodes: PortfolioNode[]): number {
  return nodes.reduce((total, node) => {
    if (node.kind === "asset") return total + 1;
    return total + countAssets(node.children);
  }, 0);
}

export function buildPortfolio(
  allocation: AllocationInput,
  usdBrlRate: number,
  quotes: Record<string, number> = {},
): Portfolio {
  const nodes = allocation.classes.map((assetClass) =>
    buildClass(assetClass, [], 0, usdBrlRate, quotes),
  );
  const totalBrl = sumKnown(nodes.map((node) => node.valueBrl)) ?? 0;
  for (const node of nodes) assignShares(node, totalBrl, totalBrl);

  return {
    totalBrl,
    totalUsd: usdBrlRate > 0 ? totalBrl / usdBrlRate : 0,
    usdBrlRate,
    assetCount: countAssets(nodes),
    classCount: nodes.length,
    nodes,
  };
}
