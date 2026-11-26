// Hearth & Ledger — dashboard view.
//
// Renders the home page: the concrete-numbers line, the five-card KPI
// strip, the category and monthly charts, budget watch, the 8 most
// recent transactions and the next unpaid bills. Every figure is
// computed from the store — nothing on this page is hardcoded.

import {
  HOUSEHOLD_NAME,
  HOUSEHOLD_SUBTITLE,
  DAYS_ELAPSED,
  categories,
  monthlyHistory,
  formatMoney,
  formatDate,
} from "./data.js";
import { categoryBars, monthlyBars, colorForCategory } from "./charts.js";

// The three categories the spec names for Budget watch, in spec order.
// (Housing at 100% and Utilities at 97.5% are mathematically closer,
// but the spec pins this trio explicitly, so the spec wins.)
const BUDGET_WATCH = ["Groceries", "Dining Out", "Transport"];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sortedTransactions(store) {
  return store.sortedTransactions();
}

function amountClass(type) {
  if (type === "income") return "positive";
  if (type === "expense") return "negative";
  return "";
}

function signedAmount(tx) {
  const money = formatMoney(tx.amount);
  if (tx.type === "income") return `+${money}`;
  if (tx.type === "expense") return `-${money}`;
  return money;
}

function kpiCard(label, value, note, valueClass) {
  const cls = valueClass ? ` class="kpi-value ${valueClass}"` : ` class="kpi-value"`;
  const noteHtml = note ? `<p class="kpi-note">${note}</p>` : "";
  return `<article class="kpi"><p class="kpi-label">${label}</p><p${cls}>${value}</p>${noteHtml}</article>`;
}

function budgetWatchItem(store, name) {
  const spent = store.spentByCategory()[name] || 0;
  const limit = store.budgetFor(name);
  const pct = limit > 0 ? (spent / limit) * 100 : 0;
  const barPct = Math.min(100, pct);
  const barClass = spent > limit
    ? "progress-bar red"
    : pct >= 85
      ? "progress-bar amber"
      : "progress-bar";
  const over = spent > limit
    ? ` <span class="over">Over by ${formatMoney(spent - limit)}</span>`
    : "";
  return `<div class="budget-watch-item"><div class="progress-row"><span>${escapeHtml(name)}</span><span>spent ${formatMoney(spent)} of ${formatMoney(limit)}${over}</span></div><div class="progress" role="progressbar" aria-valuenow="${Math.round(barPct)}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(name)} budget used ${Math.round(pct)} percent"><div class="${barClass}" style="width:${barPct.toFixed(1)}%"></div></div></div>`;
}

function recentTxItem(tx) {
  return `<li><span class="tx-date">${escapeHtml(formatDate(tx.date))}</span><span class="tx-desc">${escapeHtml(tx.description)}</span><span class="chip" style="background:${colorForCategory(tx.category)}">${escapeHtml(tx.category)}</span><span class="tx-amount ${amountClass(tx.type)}">${signedAmount(tx)}</span></li>`;
}

function billItem(bill) {
  return `<li><span class="bill-name">${escapeHtml(bill.name)}</span><span class="bill-due">${escapeHtml(formatDate(bill.due))}</span><span class="bill-amount">${formatMoney(bill.amount)}</span></li>`;
}

function billsDueFooter(unpaid, unpaidTotal) {
  return `<p class="card-foot">Total due: <strong>${formatMoney(unpaidTotal)}</strong> across ${unpaid.length} unpaid ${unpaid.length === 1 ? "bill" : "bills"}.</p>`;
}

export function render(store) {
  const txCount = store.state.transactions.length;
  const income = store.totalIncome();
  const spent = store.totalExpenses();
  const saved = store.totalSaved();
  const balance = store.balance();
  const remaining = store.remainingBudget();
  const savingsRate = store.savingsRate();
  const unpaid = store.unpaidBills().slice().sort((a, b) => (a.due < b.due ? -1 : 1));
  const unpaidTotal = store.unpaidBillsTotal();

  // Spending per category, largest first (Housing $1,850 leads).
  const byCategory = store.spentByCategory();
  const categoryData = categories
    .map((c) => ({ name: c.name, amount: byCategory[c.name] || 0 }))
    .concat([{ name: "Misc", amount: byCategory["Misc"] || 0 }])
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const recent = sortedTransactions(store).slice(0, 8);
  const billsDue = unpaid.slice(0, 3);

  const avgPerDay = DAYS_ELAPSED > 0 ? spent / DAYS_ELAPSED : 0;

  const kpis = [
    kpiCard("Balance", formatMoney(balance), "checking + savings available"),
    kpiCard("Income in November", formatMoney(income), null, "positive"),
    kpiCard("Spent in November", formatMoney(spent), `avg ${formatMoney(avgPerDay)}/day over ${DAYS_ELAPSED} days`, "negative"),
    kpiCard("Saved in November", formatMoney(saved), `savings rate ${savingsRate}%`, "positive"),
    kpiCard("Bills due", `${unpaid.length} unpaid · ${formatMoney(unpaidTotal)}`, "due in November"),
  ].join("");

  return `<section class="page dashboard-page">
  <h1>Dashboard</h1>
  <p class="lede">${HOUSEHOLD_NAME} — ${escapeHtml(HOUSEHOLD_SUBTITLE)}</p>
  <p class="dashboard-numbers">6 pages · <strong>${txCount} transactions</strong> · <strong>${categories.length} categories</strong> · <strong>${formatMoney(remaining)}</strong> left to spend in November</p>
  <div class="kpi-strip">${kpis}</div>
  <div class="dashboard">
    <div class="dashboard-main">
      <section class="card" aria-labelledby="where-money-went">
        <h2 id="where-money-went">Where the money went</h2>
        ${categoryBars(categoryData)}
      </section>
      <section class="card" aria-labelledby="income-vs-spending">
        <h2 id="income-vs-spending">Income vs spending</h2>
        ${monthlyBars(monthlyHistory)}
      </section>
      <section class="card" aria-labelledby="recent-transactions">
        <h2 id="recent-transactions">Recent transactions</h2>
        <ul class="tx-list">${recent.map(recentTxItem).join("")}</ul>
        <p><a href="#/transactions">See all transactions →</a></p>
      </section>
    </div>
    <div class="dashboard-side">
      <section class="card" aria-labelledby="budget-watch">
        <h2 id="budget-watch">Budget watch</h2>
        ${BUDGET_WATCH.map((name) => budgetWatchItem(store, name)).join("")}
      </section>
      <section class="card" aria-labelledby="bills-due-soon">
        <h2 id="bills-due-soon">Bills due soon</h2>
        <ul class="bill-list">${billsDue.map(billItem).join("")}</ul>
        ${billsDueFooter(unpaid, unpaidTotal)}
        <p><a href="#/bills">See all bills →</a></p>
      </section>
    </div>
  </div>
</section>`;
}

// The dashboard has no interactive controls, so there is nothing to
// bind. The function exists so main.js can treat every view the same.
export function bind(_root, _store, _rerender) {}
