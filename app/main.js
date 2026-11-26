// Hearth & Ledger — hash router + boot.
//
// Loads the store, renders the page for the current hash into
// <main id="view">, binds that view's controls, and re-renders on
// hash change and on every state change. An empty or unknown hash
// falls back to the dashboard. The site never renders empty: the
// store falls back to the seed data when localStorage is empty or
// unavailable, so every route works from a cold browser.

import store from "./store.js";
import { render as renderDashboard, bind as bindDashboard } from "./views-dashboard.js";
import { render as renderTransactions, bind as bindTransactions } from "./views-transactions.js";
import { renderBudgets, renderGoals, bind as bindBudgets } from "./views-budgets.js";
import { renderBills, renderReports, bind as bindBills } from "./views-bills.js";

// Route map: hash path -> render + bind for that page. The budgets
// and bills modules each serve two pages with one shared bind.
const routes = {
  "/dashboard": { title: "Dashboard", render: renderDashboard, bind: bindDashboard },
  "/transactions": { title: "Transactions", render: renderTransactions, bind: bindTransactions },
  "/budgets": { title: "Budgets", render: renderBudgets, bind: bindBudgets },
  "/goals": { title: "Goals", render: renderGoals, bind: bindBudgets },
  "/bills": { title: "Bills", render: renderBills, bind: bindBills },
  "/reports": { title: "Reports", render: renderReports, bind: bindBills },
};

function currentPath() {
  const hash = window.location.hash.replace(/^#/, "");
  return routes[hash] ? hash : "/dashboard";
}

// The mount point. It is replaced with a fresh clone on every render:
// the view bind() calls attach listeners to this element, and cloning
// (no children, no listeners, same id) keeps exactly one listener set
// alive per render instead of stacking duplicates.
let view = document.getElementById("view");

function markActiveNav() {
  const path = currentPath();
  for (const link of document.querySelectorAll(".site-nav a")) {
    const isActive = link.getAttribute("href") === `#${path}`;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

function render() {
  const route = routes[currentPath()];
  document.title = `Hearth & Ledger — ${route.title}`;
  const fresh = view.cloneNode(false);
  view.replaceWith(fresh);
  view = fresh;
  view.innerHTML = route.render(store);
  route.bind(view, store, render);
  markActiveNav();
}

window.addEventListener("hashchange", render);
store.subscribe(render);
render();
