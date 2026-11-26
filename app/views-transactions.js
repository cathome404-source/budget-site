// Hearth & Ledger — transactions view.
//
// The full ledger: an add-transaction form on top, a category filter
// plus live description search, the November table newest-first with
// working Edit (inline Save/Cancel) and Delete (confirm) per row, and
// a totals row under the table. Filter and edit state live in
// module-level variables so a re-render never loses them.

import {
  categories,
  MISC_CATEGORY,
  formatMoney,
  formatDate,
} from "./data.js";
import { colorForCategory } from "./charts.js";

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Module-level UI state — survives re-renders.
let selectedCategory = "All";
let searchQuery = "";
let editingId = null;

function sortedTransactions(store) {
  return [...store.state.transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.id < b.id ? 1 : -1;
  });
}

function allFilterCategories(store) {
  const seen = new Set(categories.map((c) => c.name));
  seen.add(MISC_CATEGORY);
  seen.add("Income");
  for (const tx of store.state.transactions) seen.add(tx.category);
  return [...seen].sort();
}

function formCategories() {
  return [...categories.map((c) => c.name), MISC_CATEGORY];
}

function filteredTransactions(store) {
  const query = searchQuery.trim().toLowerCase();
  return sortedTransactions(store).filter((tx) => {
    if (selectedCategory !== "All" && tx.category !== selectedCategory) return false;
    if (query && !tx.description.toLowerCase().includes(query)) return false;
    return true;
  });
}

function amountCell(tx) {
  const money = formatMoney(tx.amount);
  if (tx.type === "income") return `<td class="amount positive">+${money}</td>`;
  if (tx.type === "expense") return `<td class="amount negative">-${money}</td>`;
  return `<td class="amount">${money}</td>`;
}

function chip(tx) {
  return `<span class="chip" style="background:${colorForCategory(tx.category)}">${escapeHtml(tx.category)}</span>`;
}

function readRow(tx) {
  return `<tr data-tx-id="${escapeHtml(tx.id)}">
    <td>${escapeHtml(formatDate(tx.date))}</td>
    <td>${escapeHtml(tx.description)}</td>
    <td>${chip(tx)}</td>
    ${amountCell(tx)}
    <td><button type="button" class="btn btn-secondary btn-small" data-action="edit" data-id="${escapeHtml(tx.id)}">Edit</button> <button type="button" class="btn btn-danger btn-small" data-action="delete" data-id="${escapeHtml(tx.id)}">Delete</button></td>
  </tr>`;
}

function editRow(tx) {
  const categoryOptions = formCategories()
    .map((name) => `<option value="${escapeHtml(name)}"${name === tx.category ? " selected" : ""}>${escapeHtml(name)}</option>`)
    .join("");
  const typeOptions = ["expense", "income"]
    .map((t) => `<option value="${t}"${t === tx.type ? " selected" : ""}>${t === "income" ? "Income" : "Expense"}</option>`)
    .join("");
  return `<tr data-tx-id="${escapeHtml(tx.id)}" class="editing-row">
    <td><input type="date" name="edit-date" value="${escapeHtml(tx.date)}" required aria-label="Date"></td>
    <td><input type="text" name="edit-description" value="${escapeHtml(tx.description)}" required aria-label="Description"></td>
    <td><select name="edit-category" aria-label="Category">${categoryOptions}</select></td>
    <td><input type="number" name="edit-amount" value="${tx.amount}" min="0" step="0.01" required aria-label="Amount"></td>
    <td><select name="edit-type" aria-label="Type">${typeOptions}</select>
    <button type="button" class="btn btn-small" data-action="save" data-id="${escapeHtml(tx.id)}">Save</button> <button type="button" class="btn btn-secondary btn-small" data-action="cancel" data-id="${escapeHtml(tx.id)}">Cancel</button></td>
  </tr>`;
}

function totalsRow(list) {
  const income = list.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expenses = list.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const net = income - expenses;
  const netClass = net >= 0 ? "positive" : "negative";
  return `<div class="totals-row" data-totals>
    <span><strong>${list.length}</strong> transactions shown</span>
    <span>Total income: <strong class="positive">${formatMoney(income)}</strong></span>
    <span>Total expenses: <strong class="negative">${formatMoney(expenses)}</strong></span>
    <span>Net: <strong class="${netClass}">${formatMoney(net)}</strong></span>
  </div>`;
}

export function render(store) {
  const shown = filteredTransactions(store);
  const filterOptions = ["All", ...allFilterCategories(store)]
    .map((name) => `<option value="${escapeHtml(name)}"${name === selectedCategory ? " selected" : ""}>${name === "All" ? "All categories" : escapeHtml(name)}</option>`)
    .join("");
  const formOptions = formCategories()
    .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join("");

  const tableBody = shown.length
    ? shown.map((tx) => (tx.id === editingId ? editRow(tx) : readRow(tx))).join("")
    : "";
  const emptyState = shown.length
    ? ""
    : `<p class="empty-state">No transactions match this filter.</p>`;

  return `<section class="page transactions-page">
  <h1>Transactions</h1>
  <p class="lede">Every dollar in and out of the Alvarez household in November 2026.</p>

  <section class="card" aria-labelledby="add-transaction">
    <h2 id="add-transaction">Add a transaction</h2>
    <form data-add-form>
      <div class="form-grid">
        <div><label for="tx-date">Date</label><input type="date" id="tx-date" name="date" value="2026-11-26" required></div>
        <div><label for="tx-description">Description</label><input type="text" id="tx-description" name="description" placeholder="e.g. Weekly groceries — FreshMart" required></div>
        <div><label for="tx-category">Category</label><select id="tx-category" name="category">${formOptions}</select></div>
        <div><label for="tx-amount">Amount ($)</label><input type="number" id="tx-amount" name="amount" min="0" step="0.01" placeholder="0.00" required></div>
        <div><label for="tx-type">Type</label><select id="tx-type" name="type"><option value="expense">Expense</option><option value="income">Income</option></select></div>
        <div><label aria-hidden="true">&nbsp;</label><button type="submit" class="btn">Add transaction</button></div>
      </div>
    </form>
  </section>

  <section class="card" aria-labelledby="ledger">
    <h2 id="ledger">November ledger</h2>
    <div class="filter-row">
      <div class="field"><label for="filter-category">Category</label><select id="filter-category" data-filter-category>${filterOptions}</select></div>
      <div class="field"><label for="filter-search">Search</label><input type="search" id="filter-search" data-filter-search placeholder="Search descriptions…" value="${escapeHtml(searchQuery)}"></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="amount">Amount</th><th>Actions</th></tr></thead>
        <tbody data-tx-rows>${tableBody}</tbody>
      </table>
    </div>
    ${emptyState}
    ${totalsRow(shown)}
  </section>
</section>`;
}

export function bind(root, store, rerender) {
  const addForm = root.querySelector("[data-add-form]");
  if (addForm) {
    addForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(addForm);
      const type = data.get("type") === "income" ? "income" : "expense";
      const category = type === "income" ? "Income" : String(data.get("category") || MISC_CATEGORY);
      store.addTransaction({
        date: String(data.get("date") || "2026-11-26"),
        description: String(data.get("description") || ""),
        category,
        amount: Number(data.get("amount") || 0),
        type,
      });
      addForm.reset();
      const dateInput = addForm.querySelector('[name="date"]');
      if (dateInput) dateInput.value = "2026-11-26";
      rerender();
    });
  }

  const categoryFilter = root.querySelector("[data-filter-category]");
  if (categoryFilter) {
    categoryFilter.addEventListener("change", () => {
      selectedCategory = categoryFilter.value;
      rerender();
    });
  }

  const searchInput = root.querySelector("[data-filter-search]");
  if (searchInput) {
    // Re-render only the table + totals while typing, so the search
    // box keeps focus and the caret stays where the user left it.
    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value;
      refreshTable(root, store);
    });
  }

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button || !root.contains(button)) return;
    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "delete") {
      const tx = store.state.transactions.find((t) => t.id === id);
      const label = tx ? `"${tx.description}" (${formatMoney(tx.amount)})` : "this transaction";
      if (typeof confirm === "function" && !confirm(`Delete ${label}?`)) return;
      if (editingId === id) editingId = null;
      store.deleteTransaction(id);
      rerender();
      return;
    }

    if (action === "edit") {
      editingId = id;
      rerender();
      return;
    }

    if (action === "cancel") {
      editingId = null;
      rerender();
      return;
    }

    if (action === "save") {
      const row = button.closest("tr");
      if (!row) return;
      const get = (name) => {
        const el = row.querySelector(`[name="${name}"]`);
        return el ? el.value : "";
      };
      const type = get("edit-type") === "income" ? "income" : "expense";
      store.editTransaction(id, {
        date: get("edit-date") || "2026-11-26",
        description: get("edit-description") || "",
        category: type === "income" ? "Income" : get("edit-category") || MISC_CATEGORY,
        amount: Number(get("edit-amount") || 0),
        type,
      });
      editingId = null;
      rerender();
    }
  });
}

// Rebuilds just the table body, the empty state and the totals row —
// used by the live search so typing never loses focus.
function refreshTable(root, store) {
  const shown = filteredTransactions(store);
  const tbody = root.querySelector("[data-tx-rows]");
  if (tbody) {
    tbody.innerHTML = shown
      .map((tx) => (tx.id === editingId ? editRow(tx) : readRow(tx)))
      .join("");
  }
  const totals = root.querySelector("[data-totals]");
  if (totals) totals.outerHTML = totalsRow(shown);
  const card = root.querySelector("[data-tx-rows]")?.closest(".card");
  if (card) {
    const existing = card.querySelector(".empty-state");
    if (!shown.length && !existing) {
      const wrap = card.querySelector(".table-wrap");
      if (wrap) wrap.insertAdjacentHTML("afterend", `<p class="empty-state">No transactions match this filter.</p>`);
    } else if (shown.length && existing) {
      existing.remove();
    }
  }
}
