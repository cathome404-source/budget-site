// Hearth & Ledger — state store.
//
// Owns the household state (transactions, budgets, goals, bills), persists
// it to localStorage under "hearth-ledger-v1", and computes every total
// from the transaction list — no KPI is ever hardcoded here. Views
// subscribe and re-render on change.
//
// If localStorage is unavailable or holds nothing usable, the seed data
// from data.js is used from memory, so the site never renders empty.

import {
  transactions as seedTransactions,
  categories as seedCategories,
  goals as seedGoals,
  bills as seedBills,
  openingBalance,
} from "./data.js";

export const STORAGE_KEY = "hearth-ledger-v1";

let memoryState = null; // in-memory fallback when localStorage is unusable
let listeners = [];
let idCounter = 0;

function deepCopy(value) {
  return JSON.parse(JSON.stringify(value));
}

function seedState() {
  return {
    transactions: deepCopy(seedTransactions),
    budgets: seedCategories.map((c) => ({ name: c.name, limit: c.limit })),
    goals: deepCopy(seedGoals),
    bills: deepCopy(seedBills),
  };
}

function storageAvailable() {
  try {
    return typeof localStorage !== "undefined" && localStorage !== null;
  } catch {
    return false;
  }
}

function loadStored() {
  if (!storageAvailable()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.transactions)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function normalise(state) {
  const seed = seedState();
  return {
    transactions: Array.isArray(state.transactions)
      ? state.transactions
      : seed.transactions,
    budgets: Array.isArray(state.budgets) && state.budgets.length
      ? state.budgets
      : seed.budgets,
    goals: Array.isArray(state.goals) && state.goals.length
      ? state.goals
      : seed.goals,
    bills: Array.isArray(state.bills) && state.bills.length
      ? state.bills
      : seed.bills,
  };
}

// The live state. First load: stored state if present, else the seed.
export const state = normalise(loadStored() || seedState());

function save() {
  if (!storageAvailable()) {
    memoryState = deepCopy(state);
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    memoryState = deepCopy(state);
  }
}

function emit() {
  for (const fn of [...listeners]) {
    try {
      fn(state);
    } catch {
      // A failing subscriber must not break the store or other views.
    }
  }
}

function mutate() {
  save();
  emit();
}

export function subscribe(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((f) => f !== fn);
  };
}

// ---- Ids ----

export function nextTransactionId() {
  idCounter += 1;
  return `tx-${Date.now().toString(36)}-${idCounter}`;
}

// ---- Computed totals (all derived from the transaction list) ----

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function totalIncome(list = state.transactions) {
  return round2(
    list
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
  );
}

// Transfers to savings are NOT spending.
export function totalExpenses(list = state.transactions) {
  return round2(
    list
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
  );
}

export function totalTransfers(list = state.transactions) {
  return round2(
    list
      .filter((t) => t.type === "transfer")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
  );
}

// Saved = income minus expenses (spec definition of the Saved KPI).
export function totalSaved(list = state.transactions) {
  return round2(totalIncome(list) - totalExpenses(list));
}

export function balance(list = state.transactions) {
  return round2(openingBalance + totalIncome(list) - totalExpenses(list));
}

export function spentByCategory(list = state.transactions) {
  const spent = {};
  for (const t of list) {
    if (t.type !== "expense") continue;
    spent[t.category] = round2(
      (spent[t.category] || 0) + (Number(t.amount) || 0),
    );
  }
  return spent;
}

export function totalBudgeted() {
  return round2(state.budgets.reduce((s, b) => s + (Number(b.limit) || 0), 0));
}

export function remainingBudget() {
  return round2(totalBudgeted() - totalExpenses());
}

export function budgetFor(categoryName) {
  const found = state.budgets.find((b) => b.name === categoryName);
  return found ? Number(found.limit) || 0 : 0;
}

export function unpaidBills() {
  return state.bills.filter((b) => !b.paid);
}

export function unpaidBillsTotal() {
  return round2(
    unpaidBills().reduce((s, b) => s + (Number(b.amount) || 0), 0),
  );
}

export function goalsTotals() {
  const saved = round2(
    state.goals.reduce((s, g) => s + (Number(g.saved) || 0), 0),
  );
  const target = round2(
    state.goals.reduce((s, g) => s + (Number(g.target) || 0), 0),
  );
  return { saved, target };
}

// ---- Transactions CRUD ----

function cleanTransaction(input) {
  const amount = Math.max(0, Number(input.amount) || 0);
  return {
    id: input.id || nextTransactionId(),
    date: String(input.date || "2026-11-01"),
    description: String(input.description || "").trim() || "Untitled",
    category: String(input.category || "Misc"),
    type: input.type === "income" || input.type === "transfer"
      ? input.type
      : "expense",
    amount: round2(amount),
  };
}

export function addTransaction(input) {
  const tx = cleanTransaction(input);
  state.transactions.push(tx);
  mutate();
  return tx;
}

export function editTransaction(id, patch) {
  const tx = state.transactions.find((t) => t.id === id);
  if (!tx) return null;
  const updated = cleanTransaction({ ...tx, ...patch, id });
  Object.assign(tx, updated);
  mutate();
  return tx;
}

export function deleteTransaction(id) {
  const index = state.transactions.findIndex((t) => t.id === id);
  if (index === -1) return false;
  state.transactions.splice(index, 1);
  mutate();
  return true;
}

// ---- Budgets ----

export function setBudgetLimit(categoryName, limit) {
  const value = Math.max(0, Number(limit) || 0);
  const budget = state.budgets.find((b) => b.name === categoryName);
  if (!budget) return false;
  budget.limit = round2(value);
  mutate();
  return true;
}

// ---- Goals ----

export function adjustGoal(id, delta) {
  const goal = state.goals.find((g) => g.id === id);
  if (!goal) return null;
  goal.saved = Math.max(
    0,
    round2((Number(goal.saved) || 0) + (Number(delta) || 0)),
  );
  mutate();
  return goal;
}

// ---- Bills ----

export function toggleBillPaid(id) {
  const bill = state.bills.find((b) => b.id === id);
  if (!bill) return null;
  bill.paid = !bill.paid;
  mutate();
  return bill;
}

export function setBillPaid(id, paid) {
  const bill = state.bills.find((b) => b.id === id);
  if (!bill) return null;
  bill.paid = Boolean(paid);
  mutate();
  return bill;
}

// ---- Store handle for the views / main.js ----

export const store = {
  state,
  subscribe,
  save,
  totalIncome,
  totalExpenses,
  totalTransfers,
  totalSaved,
  balance,
  spentByCategory,
  totalBudgeted,
  remainingBudget,
  budgetFor,
  unpaidBills,
  unpaidBillsTotal,
  goalsTotals,
  addTransaction,
  editTransaction,
  deleteTransaction,
  setBudgetLimit,
  adjustGoal,
  toggleBillPaid,
  setBillPaid,
  nextTransactionId,
};

export default store;
