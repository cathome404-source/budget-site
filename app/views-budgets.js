// Hearth & Ledger — budgets + goals views.
//
// Budgets: one card per budgeted category (the 10 spec categories only —
// Misc has no limit and gets no card), each with its limit, spent
// (computed from the ledger), remaining, and a progress bar; over-limit
// cards are red and full, near-limit (>85%) amber. Each card has an
// "Edit limit" button that turns the limit into a number input with
// Save/Cancel, and saving really updates the budget via the store.
// Goals: three savings-goal cards with progress, an "Add money" input
// + button and a "Take out" button, both really moving the saved amount
// (never below $0). Edit state lives in a module-level variable so a
// re-render never loses it.

import { formatMoney, formatWhole } from "./data.js";
import { escapeHtml } from "./views-transactions.js";

// Module-level UI state — survives re-renders.
let editingCategory = null;

function progressBarHtml(pct, barClass, label) {
  const barPct = Math.min(100, pct);
  return `<div class="progress" role="progressbar" aria-valuenow="${Math.round(barPct)}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(label)}"><div class="${barClass}" style="width:${barPct.toFixed(1)}%"></div></div>`;
}

function budgetCard(store, name, spentByCategory) {
  const limit = store.budgetFor(name);
  const spent = spentByCategory[name] || 0;
  const pct = limit > 0 ? (spent / limit) * 100 : 0;
  const over = spent > limit;
  const near = !over && pct > 85;
  const barClass = over
    ? "progress-bar red"
    : near
      ? "progress-bar amber"
      : "progress-bar";
  const status = over
    ? `<span class="over">Over by ${formatMoney(spent - limit)}</span>`
    : `<span>Remaining ${formatMoney(limit - spent)}</span>`;
  const limitHtml = editingCategory === name
    ? `<span class="inline-field"><input type="number" name="limit-input" value="${limit}" min="0" step="1" aria-label="Monthly limit for ${escapeHtml(name)}"> <button type="button" class="btn btn-small" data-action="save-limit" data-category="${escapeHtml(name)}">Save</button> <button type="button" class="btn btn-secondary btn-small" data-action="cancel-limit">Cancel</button></span>`
    : `<span>Limit ${formatMoney(limit)}</span> <button type="button" class="btn btn-secondary btn-small" data-action="edit-limit" data-category="${escapeHtml(name)}">Edit limit</button>`;

  return `<article class="card budget-card" data-budget-card="${escapeHtml(name)}">
    <h2>${escapeHtml(name)}</h2>
    <p class="budget-pct">${Math.round(pct)}%</p>
    <p class="budget-remaining">spent ${formatMoney(spent)} of ${formatMoney(limit)} · ${status}</p>
    ${progressBarHtml(pct, barClass, `${name} budget used ${Math.round(pct)} percent`)}
    <p>${limitHtml}</p>
  </article>`;
}

export function renderBudgets(store) {
  const total = store.totalBudgeted();
  const spent = store.totalExpenses();
  const remaining = store.remainingBudget();
  const spentByCategory = store.spentByCategory();
  // state.budgets holds exactly the 10 spec categories, in spec order;
  // Misc is not a budget and never gets a card.
  const cards = store.state.budgets
    .map((b) => budgetCard(store, b.name, spentByCategory))
    .join("");

  return `<section class="page budgets-page">
  <h1>Budgets</h1>
  <p class="lede">Monthly spending limits for November 2026, computed from the ledger.</p>
  <p class="summary-line">Total budgeted ${formatWhole(total)} · Spent ${formatMoney(spent)} · Remaining ${formatMoney(remaining)}</p>
  <div class="grid-cards">${cards}</div>
</section>`;
}

function goalCard(goal) {
  const pct = goal.target > 0
    ? Math.round((goal.saved / goal.target) * 100)
    : 0;
  const toGo = Math.max(0, goal.target - goal.saved);
  const funded = goal.saved >= goal.target && goal.target > 0
    ? ` <span class="tag-paid">Fully funded</span>`
    : "";
  return `<article class="card goal-card" data-goal-card="${escapeHtml(goal.id)}">
    <h2>${escapeHtml(goal.name)}${funded}</h2>
    <p class="goal-pct">${pct}%</p>
    <p class="goal-remaining">${formatWhole(goal.saved)} saved of ${formatWhole(goal.target)} · ${formatWhole(toGo)} to go</p>
    ${progressBarHtml(pct, "progress-bar", `${goal.name} ${pct} percent saved`)}
    <div class="goal-actions">
      <span class="inline-field"><input type="number" name="goal-amount" min="0" step="0.01" placeholder="Amount ($)" aria-label="Amount to add or take out for ${escapeHtml(goal.name)}"> <button type="button" class="btn btn-small" data-action="goal-add" data-id="${escapeHtml(goal.id)}">Add money</button> <button type="button" class="btn btn-secondary btn-small" data-action="goal-take" data-id="${escapeHtml(goal.id)}">Take out</button></span>
    </div>
  </article>`;
}

export function renderGoals(store) {
  const { saved, target } = store.goalsTotals();
  const pct = target > 0 ? Math.round((saved / target) * 100) : 0;
  const cards = store.state.goals.map(goalCard).join("");

  return `<section class="page goals-page">
  <h1>Goals</h1>
  <p class="lede">What the Alvarez household is saving for.</p>
  <p class="summary-line">Total saved ${formatWhole(saved)} of ${formatWhole(target)} (${pct}%)</p>
  <div class="grid-cards">${cards}</div>
</section>`;
}

// Default render for this file is the budgets page; main.js picks
// renderBudgets or renderGoals per route.
export function render(store) {
  return renderBudgets(store);
}

export function bind(root, store, rerender) {
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button || !root.contains(button)) return;
    const action = button.dataset.action;

    if (action === "edit-limit") {
      editingCategory = button.dataset.category;
      rerender();
      focusLimitInput(root, button.dataset.category);
      return;
    }

    if (action === "cancel-limit") {
      editingCategory = null;
      rerender();
      focusEditLimitButton(root, button.dataset.category);
      return;
    }

    if (action === "save-limit") {
      const card = button.closest("[data-budget-card]");
      const input = card ? card.querySelector('[name="limit-input"]') : null;
      const value = input ? Number(input.value) : NaN;
      // Invalid input (empty, not a number, negative) is ignored and the
      // card stays in edit mode.
      if (!Number.isFinite(value) || value < 0) return;
      store.setBudgetLimit(button.dataset.category, value);
      editingCategory = null;
      rerender();
      focusEditLimitButton(root, button.dataset.category);
      return;
    }

    if (action === "goal-add" || action === "goal-take") {
      const card = button.closest("[data-goal-card]");
      const input = card ? card.querySelector('[name="goal-amount"]') : null;
      const value = input ? Number(input.value) : NaN;
      // Only a positive number moves money; empty or non-numeric input
      // is ignored. Take out never goes below $0 (store clamps).
      if (!Number.isFinite(value) || value <= 0) return;
      store.adjustGoal(button.dataset.id, action === "goal-add" ? value : -value);
      rerender();
    }
  });
}

// Focus helpers: after a re-render, return focus to the control the
// user was using instead of dropping it to the top of the page.
function focusLimitInput(root, categoryName) {
  const card = root.querySelector(`[data-budget-card="${CSS.escape(categoryName)}"]`);
  const input = card ? card.querySelector('[name="limit-input"]') : null;
  if (input) {
    input.focus();
    input.select();
  }
}

function focusEditLimitButton(root, categoryName) {
  const card = root.querySelector(`[data-budget-card="${CSS.escape(categoryName)}"]`);
  const button = card ? card.querySelector('[data-action="edit-limit"]') : null;
  if (button) button.focus();
}
