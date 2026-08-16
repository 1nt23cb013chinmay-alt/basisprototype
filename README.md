# BASIS — benchmark dislocation exposure

Vite + React 19 + Tailwind CSS 4. Static build, no backend. Every figure in
`src/App.jsx` is illustrative and internally consistent; the app says so on
every screen and in the footer.

## The idea in one paragraph

When a chokepoint closes, cargo stops moving but paper keeps settling. TD3C —
the benchmark VLCC freight index for the Gulf — is now assessed off Red Sea
fixtures with a strait risk premium added, while the physical market clears
several dollars per barrel lower. Every index-linked contract of affreightment,
floating-rate charter and freight hedge settles against the printed number
regardless. Nobody owns that gap internally, because it lives in contract
language rather than in a trading system, so it sits between legal, chartering
and treasury. BASIS reads the contracts, reconciles the printed assessment
against verified fixtures, and states what the difference costs per day.

This matters now rather than in the abstract: the representativeness of the
benchmark is being litigated in London, so the product has a dated catalyst
rather than a hypothetical one.

## Screens

| Screen | Job |
| --- | --- |
| Basis | The thesis, and the signature chart: printed above, paid below, the gap filled |
| Bleed | One number — dollars per day — decomposed by contract |
| Ledger | Six instruments read by what they settle against, not by counterparty |
| Exits | Four moves, each with cost, likelihood and what the counterparty does |
| System | Data flow, and a decision log that argues both ACT and HOLD |
| Pricing & GTM | Tiers, outcome fee, sequence, and where the business breaks |

## The interaction to demo

Exits → commit **Hedge the basis** → the bar at the bottom appears → **See the
bleed**. The headline falls from $417k/day to $128k/day: $310k recovered, $21k
of carry added back. Then commit **Convert TC-0884 to fixed hire** as well and
it reaches zero. The first three exits target the same contract and lock each
other out; the charter fix stacks.

## Numbers, so you can defend them

- Basis is $5.10/bbl — $18.10 printed against $13.00 cleared.
- CoA-2291: 2.16M bbl/mo × $5.10 = $11.0M/mo = **$367k/day**
- TC-0884: ($412k − $268k)/day × 0.92 = **$132k/day**
- FFA-Q3-26: **−$96k/day**, a credit — an inflated index pays out on a long
  position. Netting it is the difference between a real number and a scare number.
- BNK-SWAP-11: **$14k/day**
- Net **$417k/day**, which is 29.0% of a 120 kbpd refiner's gross margin at
  $12/bbl ($1.44M/day).
- Cumulative $51.8M = 163 days (5 Mar to 15 Aug) at a $318k/day average. Today
  runs above the average because the basis widened after July.

## Two-minute video, suggested beats

1. **0:00** The gap. Two prices for one voyage; show the split chart. (20s)
2. **0:20** Why nobody sees it: it is in contract language, not a trading
   system, so it falls between three teams. (20s)
3. **0:40** The Ledger — read by settlement reference. Note the FFA credit;
   that is the detail that shows the model is honest. (25s)
4. **1:05** Live: commit the hedge, watch $417k become $128k. (20s)
5. **1:25** The HOLD tab on System. A product that earns a fee and still tells
   you to wait. (20s)
6. **1:45** Business: who buys, who distributes, and the October trial as the
   timing. Close on "Where this breaks". (15s)

Lead with the honesty, not the dashboard. The FFA credit, the HOLD
recommendation and the "Where this breaks" panel are what separate this from a
risk dashboard.

## Run locally

```bash
npm install
npm run dev
```

Opens at http://localhost:5173. All six screens and the commit interaction were
tested by mounting the app and clicking through it; check it in a real browser
anyway before you push, since the sandbox has no layout engine.

## Deploy to Vercel

**GitHub (recommended)**

1. `git init && git add . && git commit -m "BASIS prototype"`
2. Push to a new GitHub repo.
3. Vercel → **Add New Project → Import**.
4. Vercel auto-detects Vite. Build command `npm run build`, output directory
   `dist`, no environment variables.

**CLI, no GitHub**

```bash
npm install -g vercel
vercel
```

## Structure

Everything sits flat in one folder. There is no `src/` directory.

```
index.html        entry, points at ./main.jsx
main.jsx          React root
App.jsx           all six screens, the data model and the SplitRule component
index.css         Tailwind v4 import
vite.config.js    React + Tailwind v4 plugins
vercel.json       pins install/build so the dashboard cannot skip npm install
package.json      deps and scripts
```

Requires Node 20.19+ or 22.12+.

## Honest limitations

- Fixture data is proprietary. A production version needs a broker or exchange
  data licence, and that is a real cost of goods, not a footnote.
- If the strait reopens and the index re-anchors, the acute product decays.
  Multi-benchmark integrity monitoring is the durable business and has to be
  built before that happens.
- Exit likelihoods are judgement, not model output, and are labelled that way
  in the interface.
