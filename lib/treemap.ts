import type { PortfolioNode } from "./portfolio";

export type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type MapCell = {
  key: string;
  kind: "header" | "asset";
  name: string;
  depth: number;
  fill: string;
  globalShare: number | null;
  targetPercentage: number | null;
  valueBrl: number | null;
  quantity: number | null;
  x: number;
  y: number;
  w: number;
  h: number;
  pixelWidth: number;
  pixelHeight: number;
};

export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 1080;

/**
 * Classes smaller than this share of the portfolio are drawn at this minimum
 * size so their label and holdings stay readable (e.g. REITs ETFs at 0.29%).
 * Assets keep their true value. This makes small classes look larger than
 * their real share; the map caption says so.
 */
export const MIN_CLASS_SHARE = 0.04;

function worst(row: number[], side: number) {
  const sum = row.reduce((total, value) => total + value, 0);
  const max = Math.max(...row);
  const min = Math.min(...row);
  const sumSquared = sum * sum;
  const sideSquared = side * side;
  return Math.max((sideSquared * max) / sumSquared, sumSquared / (sideSquared * min));
}

export function squarify(values: number[], bounds: Box): Box[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0 || bounds.w <= 0 || bounds.h <= 0) {
    return values.map(() => ({ x: bounds.x, y: bounds.y, w: 0, h: 0 }));
  }

  const areas = values.map((value) => (value / total) * bounds.w * bounds.h);
  const rects: Box[] = [];
  let x = bounds.x;
  let y = bounds.y;
  let w = bounds.w;
  let h = bounds.h;
  let index = 0;

  while (index < areas.length) {
    const row: number[] = [];
    let rowSum = 0;
    const side = Math.min(w, h);

    while (index < areas.length) {
      const area = areas[index];
      if (area <= 0) {
        rects.push({ x, y, w: 0, h: 0 });
        index += 1;
        continue;
      }
      const candidate = [...row, area];
      if (
        row.length === 0 ||
        side <= 0 ||
        worst(candidate, side) <= worst(row, side)
      ) {
        row.push(area);
        rowSum += area;
        index += 1;
      } else {
        break;
      }
    }

    if (row.length === 0) continue;

    if (w >= h) {
      const rowWidth = h > 0 ? rowSum / h : 0;
      let cursor = y;
      for (const area of row) {
        const rowHeight = rowWidth > 0 ? area / rowWidth : 0;
        rects.push({ x, y: cursor, w: rowWidth, h: rowHeight });
        cursor += rowHeight;
      }
      x += rowWidth;
      w = Math.max(0, w - rowWidth);
    } else {
      const rowHeight = w > 0 ? rowSum / w : 0;
      let cursor = x;
      for (const area of row) {
        const rowWidth = rowHeight > 0 ? area / rowHeight : 0;
        rects.push({ x: cursor, y, w: rowWidth, h: rowHeight });
        cursor += rowWidth;
      }
      y += rowHeight;
      h = Math.max(0, h - rowHeight);
    }
  }

  return rects;
}

function inset(box: Box, gutter: number): Box {
  return {
    x: box.x + gutter,
    y: box.y + gutter,
    w: Math.max(0, box.w - gutter * 2),
    h: Math.max(0, box.h - gutter * 2),
  };
}

type Layout = {
  canvas: Box;
  minClassWeight: number;
};

function layoutWeight(node: PortfolioNode, layout: Layout) {
  const value = node.valueBrl ?? 0;
  if (node.kind === "class") return Math.max(value, layout.minClassWeight);
  return value;
}

function byWeight(nodes: PortfolioNode[], layout: Layout) {
  return nodes
    .filter((node) => (node.valueBrl ?? 0) > 0)
    .sort((a, b) => layoutWeight(b, layout) - layoutWeight(a, layout));
}

function pushNode(
  node: PortfolioNode,
  bounds: Box,
  cells: MapCell[],
  depth: number,
  layout: Layout,
) {
  const frame = inset(bounds, 1.25);
  if (frame.w < 2 || frame.h < 2) return;

  if (node.kind === "asset") {
    cells.push(toCell(node, "asset", frame, depth, layout.canvas));
    return;
  }

  const headerHeight = Math.min(depth === 0 ? 32 : 22, Math.max(16, frame.h * 0.3));
  const showHeader = frame.h >= 18 && frame.w >= 60;
  const contentTop = showHeader ? headerHeight : 0;

  if (showHeader) {
    cells.push(
      toCell(node, "header", { ...frame, h: headerHeight }, depth, layout.canvas),
    );
  }

  const weighted = byWeight(node.children, layout);
  if (weighted.length === 0) return;

  const content: Box = {
    x: frame.x,
    y: frame.y + contentTop,
    w: frame.w,
    h: Math.max(0, frame.h - contentTop),
  };
  const boxes = squarify(
    weighted.map((child) => layoutWeight(child, layout)),
    content,
  );
  weighted.forEach((child, index) => {
    pushNode(child, boxes[index], cells, depth + 1, layout);
  });
}

function toCell(
  node: PortfolioNode,
  kind: MapCell["kind"],
  box: Box,
  depth: number,
  canvas: Box,
): MapCell {
  return {
    key: `${kind}:${node.id}`,
    kind,
    name: node.name,
    depth,
    fill: node.color,
    globalShare: node.holdingGlobalPercentage,
    targetPercentage: node.targetPercentage,
    valueBrl: node.valueBrl,
    quantity: node.quantity,
    x: (box.x / canvas.w) * 100,
    y: (box.y / canvas.h) * 100,
    w: (box.w / canvas.w) * 100,
    h: (box.h / canvas.h) * 100,
    pixelWidth: box.w,
    pixelHeight: box.h,
  };
}

export function layoutPortfolio(
  nodes: PortfolioNode[],
  width = MAP_WIDTH,
  height = MAP_HEIGHT,
): MapCell[] {
  const canvas = { x: 0, y: 0, w: width, h: height };
  const total = nodes.reduce((sum, node) => sum + (node.valueBrl ?? 0), 0);
  const layout: Layout = { canvas, minClassWeight: total * MIN_CLASS_SHARE };
  const weighted = byWeight(nodes, layout);
  const boxes = squarify(
    weighted.map((node) => layoutWeight(node, layout)),
    canvas,
  );
  const cells: MapCell[] = [];
  weighted.forEach((node, index) => {
    pushNode(node, boxes[index], cells, 0, layout);
  });
  return cells;
}
