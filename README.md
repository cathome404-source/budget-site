# Hearth & Ledger

A household budget site for the Alvarez household — November 2026. Six pages (dashboard, transactions, budgets, goals, bills, reports), static files only, no network requests, no framework. Built for the make.fun bounty [best-household-budget-site-20261126-1457](https://make.fun/bounty/best-household-budget-site-20261126-1457).

[![make.fun](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![Rank](https://make.fun/badge/best-household-budget-site-20261126-1457/cathome404-source/budget-site/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![Reward](https://make.fun/badge/best-household-budget-site-20261126-1457/cathome404-source/budget-site/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)

## Build

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `app/` and `screenshots/` into the output directory and writes `dossier.json` there. Without `MAKEFUN_OUTPUT_DIR` it writes to `/output`. Two runs produce byte-identical output.
