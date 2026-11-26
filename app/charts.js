// Hearth & Ledger — hand-rolled SVG chart builders.
//
// Pure functions that return static SVG strings (plus, for the donut, a
// small HTML legend). No library, no network, no extra JavaScript needed
// to render the result. All money goes through formatMoney from data.js
// so the figures always match the rest of the site.
//
// Category colour map — one colour per category, used identically in
// every chart (and by the category chips in the views):
//   Housing #1e4d3b (deep green)   Groceries #2e7d4f (soft green)
//   Dining Out #d98e32 (amber)    Transport #5b7a8c (slate blue)
//   Utilities #2f7f7a (teal)       Health #c26a7a (rose)
//   Entertainment #8a7bb8 (soft purple)
//   Shopping #8a6a4f (brown)       Kids & School #e07b39 (orange)
//   Savings #6aa84f (light green) Misc #8a8f8c (grey)

import { formatMoney, formatCompact } from "./data.js";

export const CATEGORY_COLORS = {
  "Housing": "#1e4d3b",
  "Groceries": "#2e7d4f",
  "Dining Out": "#d98e32",
  "Transport": "#5b7a8c",
  "Utilities": "#2f7f7a",
  "Health": "#c26a7a",
  "Entertainment": "#8a7bb8",
  "Shopping": "#8a6a4f",
  "Kids & School": "#e07b39",
  "Savings": "#6aa84f",
  "Misc": "#8a8f8c",
};

export const INCOME_COLOR = "#2e7d4f";
export const SPENDING_COLOR = "#c0392b";

export function colorForCategory(name) {
  return CATEGORY_COLORS[name] || "#8a8f8c";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shortMonthLabel(month) {
  // "Jun 2026" -> "Jun", "Nov 2026" -> "Nov"
  return String(month).split(" ")[0].slice(0, 3);
}

// ---- 1. Horizontal bars: spending by category ----
//
// data: [{ name, amount, color }] — longest bar is the largest amount.
// Width 640, one row per category, name on the left, dollar value at the
// end of each bar.

export function categoryBars(data) {
  const rows = (Array.isArray(data) ? data : []).filter(
    (d) => d && Number(d.amount) > 0,
  );
  const max = Math.max(0, ...rows.map((d) => Number(d.amount) || 0));
  const rowHeight = 36;
  const topPad = 10;
  const height = topPad * 2 + rows.length * rowHeight;
  const labelX = 0;
  const labelWidth = 118;
  const barX = labelWidth + 10;
  const barMaxWidth = 400;
  const valueGap = 8;
  const barHeight = 22;
  const width = barX + barMaxWidth + 90;

  const total = rows.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const largest = rows.reduce(
    (best, d) => (Number(d.amount) || 0) > (Number(best.amount) || 0) ? d : best,
    rows[0] || { name: "", amount: 0 },
  );
  const title = `Spending by category in November 2026, total ${formatMoney(total)}. Largest: ${largest.name} ${formatMoney(largest.amount)}`;

  const bars = rows
    .map((d, i) => {
      const amount = Number(d.amount) || 0;
      const w = max > 0 ? Math.max(3, (amount / max) * barMaxWidth) : 0;
      const y = topPad + i * rowHeight;
      const color = d.color || colorForCategory(d.name);
      return [
        `<text x="${labelX}" y="${y + 15}" class="chart-label" text-anchor="start">${escapeHtml(d.name)}</text>`,
        `<rect x="${barX}" y="${y}" width="${w.toFixed(1)}" height="${barHeight}" rx="4" fill="${color}"><title>${escapeHtml(d.name)}: ${formatMoney(amount)}</title></rect>`,
        `<text x="${(barX + w + valueGap).toFixed(1)}" y="${y + 15}" class="chart-value" text-anchor="start">${formatMoney(amount)}</text>`,
      ].join("");
    })
    .join("");

  return `<svg class="chart chart-bars" viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="${escapeHtml(title)}"><title>${escapeHtml(title)}</title>${bars}</svg>`;
}

// ---- 2. Grouped bars: income vs spending, Jun–Nov 2026 ----
//
// months: [{ month, income, spending }] — "Jun 2026" labels shorten to
// "Jun". Income green #2e7d4f, spending red #c0392b, with an HTML legend.

export function monthlyBars(months) {
  const rows = Array.isArray(months) ? months : [];
  const max = Math.max(
    0,
    ...rows.flatMap((m) => [Number(m.income) || 0, Number(m.spending) || 0]),
  );
  const width = 640;
  const height = 300;
  const padLeft = 8;
  const padRight = 8;
  const padTop = 26;
  const padBottom = 30;
  const plotHeight = height - padTop - padBottom;
  const groupWidth = (width - padLeft - padRight) / Math.max(1, rows.length);
  const barWidth = Math.min(34, (groupWidth - 24) / 2);
  const baseline = padTop + plotHeight;

  const title = "Income versus spending, June to November 2026";

  // Light gridlines at half and full scale, so bar heights read
  // against something instead of floating in empty space. No text
  // on the lines: the per-bar value labels already carry the exact
  // figures, and a scale label would collide with them.
  const gridline = (fraction) => {
    const y = baseline - fraction * plotHeight;
    return `<line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${width - padRight}" y2="${y.toFixed(1)}" class="chart-grid" />`;
  };
  const grid = max > 0 ? gridline(0.5) + gridline(1) : "";

  const groups = rows
    .map((m, i) => {
      const income = Number(m.income) || 0;
      const spending = Number(m.spending) || 0;
      const incomeH = max > 0 ? (income / max) * plotHeight : 0;
      const spendingH = max > 0 ? (spending / max) * plotHeight : 0;
      const groupX = padLeft + i * groupWidth;
      const cx = groupX + groupWidth / 2;
      const incomeX = cx - barWidth - 3;
      const spendingX = cx + 3;
      const label = shortMonthLabel(m.month);
      return [
        `<rect x="${incomeX.toFixed(1)}" y="${(baseline - incomeH).toFixed(1)}" width="${barWidth}" height="${incomeH.toFixed(1)}" rx="3" fill="${INCOME_COLOR}"><title>${escapeHtml(label)} income ${formatMoney(income)}</title></rect>`,
        `<rect x="${spendingX.toFixed(1)}" y="${(baseline - spendingH).toFixed(1)}" width="${barWidth}" height="${spendingH.toFixed(1)}" rx="3" fill="${SPENDING_COLOR}"><title>${escapeHtml(label)} spending ${formatMoney(spending)}</title></rect>`,
        // Compact labels ("$6,820", no cents): the full "$6,820.00"
        // is ~58px wide but the two bar centres are only 40px apart,
        // so full labels overlapped. The spending value sits inside
        // its bar in white instead of above it — same fix, and the
        // spending bars are always tall enough to hold it.
        `<text x="${incomeX + barWidth / 2}" y="${(baseline - incomeH - 6).toFixed(1)}" class="chart-value chart-value-small" text-anchor="middle">${formatCompact(income)}</text>`,
        `<text x="${spendingX + barWidth / 2}" y="${(baseline - spendingH + 16).toFixed(1)}" class="chart-value chart-value-small chart-value-inside" text-anchor="middle">${formatCompact(spending)}</text>`,
        `<text x="${cx}" y="${height - 8}" class="chart-label" text-anchor="middle">${escapeHtml(label)}</text>`,
      ].join("");
    })
    .join("");

  const svg = `<svg class="chart chart-monthly" viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="${escapeHtml(title)}"><title>${escapeHtml(title)}</title>${grid}<line x1="${padLeft}" y1="${baseline}" x2="${width - padRight}" y2="${baseline}" class="chart-axis" />${groups}</svg>`;

  const legend = `<div class="chart-legend"><span class="legend-item"><span class="legend-swatch" style="background:${INCOME_COLOR}"></span>Income</span><span class="legend-item"><span class="legend-swatch" style="background:${SPENDING_COLOR}"></span>Spending</span></div>`;

  return `<div class="chart-wrap">${svg}${legend}</div>`;
}

// ---- 3. Donut: spending share by category ----
//
// data: [{ name, amount, color }] — hand-drawn arc paths, plus an HTML
// legend with each category, its dollar total and its share of spending.

function polar(cx, cy, r, angleDeg) {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function donutSlice(cx, cy, rOuter, rInner, startAngle, endAngle, color, name, amount) {
  const [x0, y0] = polar(cx, cy, rOuter, startAngle);
  const [x1, y1] = polar(cx, cy, rOuter, endAngle);
  const [x2, y2] = polar(cx, cy, rInner, endAngle);
  const [x3, y3] = polar(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const d = [
    `M ${x0.toFixed(2)} ${y0.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `L ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    "Z",
  ].join(" ");
  return `<path d="${d}" fill="${color}"><title>${escapeHtml(name)}: ${formatMoney(amount)}</title></path>`;
}

export function categoryDonut(data) {
  const rows = (Array.isArray(data) ? data : []).filter(
    (d) => d && Number(d.amount) > 0,
  );
  const total = rows.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 104;
  const rInner = 62;

  let angle = 0;
  const slices = rows
    .map((d) => {
      const amount = Number(d.amount) || 0;
      const sweep = total > 0 ? (amount / total) * 360 : 0;
      const start = angle;
      const end = angle + sweep;
      angle = end;
      // A full 360deg slice cannot be drawn as one arc; shave a hair.
      const endClamped = sweep >= 359.99 ? start + 359.99 : end;
      return donutSlice(
        cx,
        cy,
        rOuter,
        rInner,
        start,
        endClamped,
        d.color || colorForCategory(d.name),
        d.name,
        amount,
      );
    })
    .join("");

  const center = `<text x="${cx}" y="${cy - 4}" class="chart-donut-total" text-anchor="middle">${formatMoney(total)}</text><text x="${cx}" y="${cy + 16}" class="chart-donut-label" text-anchor="middle">spent in Nov</text>`;

  const title = `Spending by category in November 2026, total ${formatMoney(total)}`;
  const svg = `<svg class="chart chart-donut" viewBox="0 0 ${size} ${size}" width="240" height="240" role="img" aria-label="${escapeHtml(title)}"><title>${escapeHtml(title)}</title>${slices}${center}</svg>`;

  const legendItems = rows
    .map((d) => {
      const amount = Number(d.amount) || 0;
      const share = total > 0 ? (amount / total) * 100 : 0;
      const color = d.color || colorForCategory(d.name);
      return `<li><span class="legend-swatch" style="background:${color}"></span><span class="donut-legend-name">${escapeHtml(d.name)}</span><span class="donut-legend-amount">${formatMoney(amount)}</span><span class="donut-legend-share">${share.toFixed(1)}%</span></li>`;
    })
    .join("");

  return `<div class="donut-wrap">${svg}<ul class="donut-legend">${legendItems}</ul></div>`;
}
