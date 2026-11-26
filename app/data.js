// Hearth & Ledger — seed household data for November 2026.
// The Alvarez household: Maya (teacher) and Jordan (electrician), two kids.
// All figures reconcile exactly: income $6,850.00, expenses $4,318.65,
// saved $2,531.35, remaining budget $621.35, unpaid bills $306.70.
//
// Arithmetic note (see progress.md, S2): the prose spec's Transport line
// items summed to $201 against a stated $301, and all line items summed
// to $4,076.08 against stated spending of $4,318.65. Fixed here by:
//   1. parking $20 -> $120 (monthly parking pass), Transport = $301.
//   2. one extra realistic transaction: "Washing machine repair"
//      $242.57 on Nov 26 (Misc).
//   3. the spec's itemised list is actually 34 rows, not the "36" its
//      dashboard line claims, so two more transfers (emergency fund $200
//      Nov 9, car fund $150 Nov 23) bring the ledger to 37 rows.
//      Transfers never count as spent, so no KPI moves.

export const HOUSEHOLD_NAME = "Hearth & Ledger";
export const HOUSEHOLD_SUBTITLE = "The Alvarez household — November 2026";
export const MONTH_LABEL = "November 2026";

// Opening checking+savings balance on Nov 1, chosen so that
// opening + income - expenses = $4,812.40 (the dashboard Balance KPI).
export const openingBalance = 2281.05;

// The ten budgeted categories and their November limits.
// Total budgeted: $4,940.
export const categories = [
  { name: "Housing", limit: 1850 },
  { name: "Groceries", limit: 650 },
  { name: "Dining Out", limit: 350 },
  { name: "Transport", limit: 320 },
  { name: "Utilities", limit: 380 },
  { name: "Health", limit: 200 },
  { name: "Entertainment", limit: 120 },
  { name: "Shopping", limit: 250 },
  { name: "Kids & School", limit: 220 },
  { name: "Savings", limit: 600 },
];

// "Misc" is not a budgeted category; it only labels the two uncategorised
// household purchases below (hardware store, washing machine repair).
export const MISC_CATEGORY = "Misc";

// type: "income" | "expense" | "transfer"
// Transfers to savings are counted as saved, never as spent.
// Amounts are always positive numbers; the sign comes from the type.
export const transactions = [
  // Income — Nov 1
  { id: "tx-01", date: "2026-11-01", description: "Maya salary — Lincoln Elementary", category: "Income", type: "income", amount: 3850 },
  { id: "tx-02", date: "2026-11-01", description: "Jordan salary — BrightSpark Electric", category: "Income", type: "income", amount: 3000 },
  // Housing — Nov 1
  { id: "tx-03", date: "2026-11-01", description: "November rent", category: "Housing", type: "expense", amount: 1850 },
  // Transport — parking pass, Nov 1
  { id: "tx-04", date: "2026-11-01", description: "Monthly parking pass", category: "Transport", type: "expense", amount: 120 },
  // Savings transfer — Nov 2
  { id: "tx-05", date: "2026-11-02", description: "Transfer to emergency fund", category: "Savings", type: "transfer", amount: 500 },
  // Groceries — Nov 2
  { id: "tx-06", date: "2026-11-02", description: "Weekly groceries — FreshMart", category: "Groceries", type: "expense", amount: 98 },
  // Dining — Nov 3
  { id: "tx-07", date: "2026-11-03", description: "Dinner at Luigi's Trattoria", category: "Dining Out", type: "expense", amount: 96 },
  // Transport — bus passes, Nov 3
  { id: "tx-08", date: "2026-11-03", description: "Kids' bus passes", category: "Transport", type: "expense", amount: 36 },
  // Transport — fuel, Nov 4
  { id: "tx-09", date: "2026-11-04", description: "Fuel — Shell", category: "Transport", type: "expense", amount: 45 },
  // Groceries — Nov 5
  { id: "tx-10", date: "2026-11-05", description: "Weekly groceries — FreshMart", category: "Groceries", type: "expense", amount: 112 },
  // Kids & School — Nov 5
  { id: "tx-11", date: "2026-11-05", description: "School lunch money — November", category: "Kids & School", type: "expense", amount: 85 },
  // Health — Nov 6
  { id: "tx-12", date: "2026-11-06", description: "Pharmacy — prescriptions", category: "Health", type: "expense", amount: 38.5 },
  // Dining — Nov 7
  { id: "tx-13", date: "2026-11-07", description: "Family pizza night", category: "Dining Out", type: "expense", amount: 84 },
  // Entertainment — Nov 8
  { id: "tx-14", date: "2026-11-08", description: "Streaming subscription", category: "Entertainment", type: "expense", amount: 15.99 },
  // Groceries — Nov 9
  { id: "tx-15", date: "2026-11-09", description: "Weekly groceries — FreshMart", category: "Groceries", type: "expense", amount: 87 },
  // Misc — Nov 9
  { id: "tx-16", date: "2026-11-09", description: "Hardware store — screws and paint", category: "Misc", type: "expense", amount: 25 },
  // Shopping — Nov 10
  { id: "tx-17", date: "2026-11-10", description: "Kids' shoes", category: "Shopping", type: "expense", amount: 68 },
  // Transport — fuel, Nov 11
  { id: "tx-18", date: "2026-11-11", description: "Fuel — Chevron", category: "Transport", type: "expense", amount: 52 },
  // Dining — Nov 12
  { id: "tx-19", date: "2026-11-12", description: "Lunch with coworkers", category: "Dining Out", type: "expense", amount: 72 },
  // Utilities — Nov 12
  { id: "tx-20", date: "2026-11-12", description: "Electric bill — City Power", category: "Utilities", type: "expense", amount: 132.4 },
  // Groceries — Nov 13
  { id: "tx-21", date: "2026-11-13", description: "Weekly groceries — FreshMart", category: "Groceries", type: "expense", amount: 132 },
  // Kids & School — Nov 13
  { id: "tx-22", date: "2026-11-13", description: "Field trip — science museum", category: "Kids & School", type: "expense", amount: 60 },
  // Health — Nov 14
  { id: "tx-23", date: "2026-11-14", description: "Dentist copay — Maya", category: "Health", type: "expense", amount: 75 },
  // Utilities — Nov 15
  { id: "tx-24", date: "2026-11-15", description: "Internet bill — FiberNet", category: "Utilities", type: "expense", amount: 79.99 },
  // Dining — Nov 16
  { id: "tx-25", date: "2026-11-16", description: "Takeout — Thai Garden", category: "Dining Out", type: "expense", amount: 61 },
  // Savings transfer — Nov 16
  { id: "tx-26", date: "2026-11-16", description: "Transfer to vacation fund", category: "Savings", type: "transfer", amount: 300 },
  // Shopping — Nov 17
  { id: "tx-27", date: "2026-11-17", description: "Winter coats for the kids", category: "Shopping", type: "expense", amount: 145 },
  // Groceries — Nov 18
  { id: "tx-28", date: "2026-11-18", description: "Weekly groceries — FreshMart", category: "Groceries", type: "expense", amount: 95 },
  // Utilities — Nov 18
  { id: "tx-29", date: "2026-11-18", description: "Water bill — City Water", category: "Utilities", type: "expense", amount: 46.2 },
  // Transport — fuel, Nov 19
  { id: "tx-30", date: "2026-11-19", description: "Fuel — Shell", category: "Transport", type: "expense", amount: 48 },
  // Entertainment — Nov 20
  { id: "tx-31", date: "2026-11-20", description: "Movie night — cinema tickets", category: "Entertainment", type: "expense", amount: 42 },
  // Dining — Nov 21
  { id: "tx-32", date: "2026-11-21", description: "Saturday brunch — Sunny Side Cafe", category: "Dining Out", type: "expense", amount: 75 },
  // Utilities — Nov 21
  { id: "tx-33", date: "2026-11-21", description: "Phone bill — MobilePlus", category: "Utilities", type: "expense", amount: 112 },
  // Groceries — Nov 22
  { id: "tx-34", date: "2026-11-22", description: "Weekly groceries — FreshMart", category: "Groceries", type: "expense", amount: 88 },
  // Misc — Nov 26 (fills the $242.57 gap to the stated November spending)
  { id: "tx-35", date: "2026-11-26", description: "Washing machine repair", category: "Misc", type: "expense", amount: 242.57 },
  // Savings transfers (transfers never count as spent, so the KPIs are
  // untouched; they bring the ledger to 37 rows — the spec's itemised
  // list is actually 34 rows, not the "36" its dashboard line claims).
  { id: "tx-36", date: "2026-11-09", description: "Transfer to emergency fund", category: "Savings", type: "transfer", amount: 200 },
  { id: "tx-37", date: "2026-11-23", description: "Transfer to car down payment fund", category: "Savings", type: "transfer", amount: 150 },
];

// Savings goals. Total saved $9,600 of $17,400 (55%).
export const goals = [
  { id: "goal-1", name: "Emergency fund", target: 10000, saved: 6400 },
  { id: "goal-2", name: "Family vacation to the coast", target: 2400, saved: 1150 },
  { id: "goal-3", name: "New car down payment", target: 5000, saved: 2050 },
];

// Bills. 3 unpaid ($306.70): Water, Phone, Car insurance.
export const bills = [
  { id: "bill-1", name: "Rent", due: "2026-11-01", amount: 1850, paid: true },
  { id: "bill-2", name: "Electric", due: "2026-11-12", amount: 132.4, paid: true },
  { id: "bill-3", name: "Internet", due: "2026-11-15", amount: 79.99, paid: true },
  { id: "bill-4", name: "Water", due: "2026-11-18", amount: 46.2, paid: false },
  { id: "bill-5", name: "Phone", due: "2026-11-21", amount: 112, paid: false },
  { id: "bill-6", name: "Car insurance", due: "2026-11-25", amount: 148.5, paid: false },
];

// Six-month history. Jun–Oct are plausible months in the same range as
// November (income ~$6,800–6,850, spending ~$4,100–4,300). November is
// exact: income $6,850.00, spending $4,318.65, saved $2,531.35.
export const monthlyHistory = [
  { month: "Jun 2026", income: 6820, spending: 4150, saved: 2670 },
  { month: "Jul 2026", income: 6850, spending: 4280, saved: 2570 },
  { month: "Aug 2026", income: 6800, spending: 4120, saved: 2680 },
  { month: "Sep 2026", income: 6840, spending: 4210, saved: 2630 },
  { month: "Oct 2026", income: 6830, spending: 4190, saved: 2640 },
  { month: "Nov 2026", income: 6850, spending: 4318.65, saved: 2531.35 },
];

// ---- Formatting helpers ----

export function formatMoney(n) {
  const value = Number(n) || 0;
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Whole-dollar amounts print without cents, exactly as the spec writes
// them ("$4,940", "$6,400"); fractional amounts keep their cents.
export function formatWhole(n) {
  const value = Number(n) || 0;
  if (Number.isInteger(value)) return `$${value.toLocaleString("en-US")}`;
  return formatMoney(value);
}

export function formatDate(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
