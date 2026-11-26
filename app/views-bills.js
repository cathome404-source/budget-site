// Hearth & Ledger — bills + reports views.
//
// Bills: two groups — "Due soon" (unpaid, sorted by due date) and
// "Paid". Unpaid rows have a "Mark paid" button that really moves the
// bill to Paid; paid rows show a green "Paid" tag and a "Mark unpaid"
// button that moves it back. Reports: "Six months at a glance"
// (monthlyBars from charts.js plus totals per month), "Spending by
// category" (categoryDonut from charts.js with its legend), "Biggest
// single expenses" (the 5 largest November expense transactions,
// computed from the ledger), and a "Monthly totals" table (Jun–Nov
// with income, spending, saved, savings rate).

import {
  categories,
  monthlyHistory,
  formatMoney,
  formatDate,
} from "./data.js";
import { monthlyBars, categoryDonut, colorForCategory } from "./charts.js";
import { escapeHtml } from "./views-transactions.js";

function billRow(bill) {
  const control = bill.paid
    ? `<span class="tag-paid">Paid</span> <button type="button" class="btn btn-secondary btn-small" data-action="bill-unpaid" data-id="${escapeHtml(bill.id)}">Mark unpaid</button>`
    : `<button type="button" class="btn btn-small" data-action="bill-paid" data-id="${escapeHtml(bill.id)}">Mark paid</button>`;
  return `<li><span class="bill-name">${escapeHtml(bill.name)}</span><span class="bill-due">${escapeHtml(formatDate(bill.due))}</span><span class="bill-amount">${formatMoney(bill.amount)}</span>${control}</li>`;
}

export function renderBills(store) {
  const sorted = [...store.state.bills].sort((a, b) =>
    a.due < b.due ? -1 : 1,
  );
  const due = sorted.filter((b) => !b.paid);
  const paid = sorted.filter((b) => b.paid);
  const dueTotal = due.reduce((s, b) => s + (Number(b.amount) || 0), 0);

  return `<section class="page bills-page">
  <h1>Bills</h1>
  <p class="lede">November 2026 bills — ${due.length} unpaid · ${formatMoney(dueTotal)} due.</p>
  <section class="card" aria-labelledby="bills-due-soon">
    <h2 id="bills-due-soon">Due soon</h2>
    ${due.length ? `<ul class="bill-list">${due.map(billRow).join("")}</ul>` : `<p class="empty-state">No bills due — everything is paid.</p>`}
  </section>
  <section class="card" aria-labelledby="bills-paid">
    <h2 id="bills-paid">Paid</h2>
    ${paid.length ? `<ul class="bill-list">${paid.map(billRow).join("")}</ul>` : `<p class="empty-state">No bills paid yet.</p>`}
  </section>
</section>`;
}

function monthTotalsLine(m) {
  const rate = m.income > 0 ? Math.round((m.saved / m.income) * 100) : 0;
  return `<li><span class="bill-name">${escapeHtml(m.month)}</span><span>income ${formatMoney(m.income)} · spending ${formatMoney(m.spending)} · saved ${formatMoney(m.saved)} · ${rate}% saved</span></li>`;
}

export function renderReports(store) {
  // Spending per category, largest first (Housing $1,850 leads),
  // including Misc — it is real November spending.
  const byCategory = store.spentByCategory();
  const categoryData = categories
    .map((c) => ({ name: c.name, amount: byCategory[c.name] || 0 }))
    .concat([{ name: "Misc", amount: byCategory["Misc"] || 0 }])
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const biggest = store.biggestExpenses(5);
  const biggestItems = biggest
    .map(
      (tx, i) =>
        `<li><span class="rank">${i + 1}</span><span class="tx-date">${escapeHtml(formatDate(tx.date))}</span><span class="tx-desc">${escapeHtml(tx.description)}</span><span class="chip" style="background:${colorForCategory(tx.category)}">${escapeHtml(tx.category)}</span><span class="tx-amount negative">${formatMoney(tx.amount)}</span></li>`,
    )
    .join("");

  const tableRows = monthlyHistory
    .map((m) => {
      const rate = m.income > 0 ? Math.round((m.saved / m.income) * 100) : 0;
      return `<tr><td>${escapeHtml(m.month)}</td><td class="amount positive">${formatMoney(m.income)}</td><td class="amount negative">${formatMoney(m.spending)}</td><td class="amount">${formatMoney(m.saved)}</td><td>${rate}%</td></tr>`;
    })
    .join("");

  return `<section class="page reports-page">
  <h1>Reports</h1>
  <p class="lede">Six months of Alvarez household money, June to November 2026.</p>

  <section class="card" aria-labelledby="six-months">
    <h2 id="six-months">Six months at a glance</h2>
    ${monthlyBars(monthlyHistory)}
    <ul class="bill-list">${monthlyHistory.map(monthTotalsLine).join("")}</ul>
  </section>

  <section class="card" aria-labelledby="spending-by-category">
    <h2 id="spending-by-category">Spending by category</h2>
    ${categoryDonut(categoryData)}
  </section>

  <section class="card" aria-labelledby="biggest-expenses">
    <h2 id="biggest-expenses">Biggest single expenses</h2>
    <ol class="ranked-list">${biggestItems}</ol>
  </section>

  <section class="card" aria-labelledby="monthly-totals">
    <h2 id="monthly-totals">Monthly totals</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Month</th><th class="amount">Income</th><th class="amount">Spending</th><th class="amount">Saved</th><th>Savings rate</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
  </section>
</section>`;
}

// Default render for this file is the bills page; main.js picks
// renderBills or renderReports per route.
export function render(store) {
  return renderBills(store);
}

export function bind(root, store, rerender) {
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button || !root.contains(button)) return;
    const action = button.dataset.action;

    if (action === "bill-paid") {
      store.setBillPaid(button.dataset.id, true);
      rerender();
      return;
    }

    if (action === "bill-unpaid") {
      store.setBillPaid(button.dataset.id, false);
      rerender();
    }
  });
}
