import React, { useState, useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Split,
  Activity,
  FileText,
  Scale,
  Network,
  Wallet,
  TriangleAlert,
  CircleCheckBig,
  ShieldCheck,
  Gavel,
  ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------
   BASIS — benchmark dislocation exposure, Strait of Hormuz 2026

   Thesis: when a chokepoint closes, cargo stops moving but paper keeps
   settling. TD3C is assessed off Red Sea fixtures plus a strait risk
   premium; the physical market clears materially lower. Every
   index-linked CoA, floating charter and freight hedge inherits that
   gap, and nobody owns the number because it sits between legal,
   chartering and treasury.

   All figures are illustrative and internally consistent. See the
   PROVENANCE note at the foot of each screen.
------------------------------------------------------------------- */

const c = {
  ink: "#07090C",
  panel: "#10151B",
  panel2: "#161D26",
  rule: "#1E2731",
  text: "#E6EAEE",
  muted: "#6F8496",
  paper: "#C9A227",     // the printed index
  physical: "#4FA8C7",  // what actually clears
  bleed: "#D9534A",
  good: "#5FC79B",
};

const PAPER = 18.1;
const PHYSICAL = 13.0;
const GAP = +(PAPER - PHYSICAL).toFixed(2);

const GROSS_MARGIN_PER_DAY = 1440; // $k/day — 120 kbpd at $12/bbl
const DAYS_SINCE = 163;            // 5 Mar to 15 Aug 2026
const AVG_RATE = 318;              // $k/day, average across the window
const CUMULATIVE = (AVG_RATE * DAYS_SINCE) / 1000;

const NAV = [
  { id: "basis", label: "Basis", icon: Split },
  { id: "bleed", label: "Bleed", icon: Activity },
  { id: "ledger", label: "Ledger", icon: FileText },
  { id: "exits", label: "Exits", icon: Scale },
  { id: "system", label: "System", icon: Network },
  { id: "gtm", label: "Pricing & GTM", icon: Wallet },
];

const ticker = [
  { k: "TD3C PRINTED", v: "$18.10/bbl", n: "Baltic assessment, Red Sea basis plus premium" },
  { k: "PHYSICAL CLEARED", v: "$13.00/bbl", n: "broker-verified fixtures" },
  { k: "BASIS", v: "$5.10/bbl", n: "widened 42% in 11 days" },
  { k: "MERCURIA v BALTIC", v: "TRIAL OCT", n: "London, benchmark representativeness" },
  { k: "JWC", v: "LISTED AREA", n: "Arabian Gulf, whole" },
];

const basisSeries = [
  { m: "Mar", paper: 22.4, physical: 15.1, gap: 7.3 },
  { m: "Apr", paper: 24.8, physical: 16.0, gap: 8.8 },
  { m: "May", paper: 21.6, physical: 14.2, gap: 7.4 },
  { m: "Jun", paper: 17.9, physical: 13.4, gap: 4.5 },
  { m: "Jul", paper: 16.2, physical: 12.6, gap: 3.6 },
  { m: "Aug", paper: 18.1, physical: 13.0, gap: 5.1 },
];

/* Ledger. Bleed in $k/day. Negative means credit — the basis cuts both ways. */
const CONTRACTS = [
  {
    ref: "CoA-2291",
    kind: "Contract of affreightment",
    detail: "2.16M bbl/mo, MEG to Ningbo basis",
    settles: "TD3C monthly average",
    status: "exposed",
    bleed: 367,
    math: "2.16M bbl x $5.10 = $11.0M/mo",
    clause: "s14.3 benchmark change, untested",
  },
  {
    ref: "TC-0884",
    kind: "Time charter, VLCC",
    detail: "hire floats at 92% of TD3C TCE",
    settles: "TD3C daily TCE",
    status: "exposed",
    bleed: 132,
    math: "($412k - $268k)/day x 0.92",
    clause: "no benchmark provision",
  },
  {
    ref: "FFA-Q3-26",
    kind: "Forward freight agreement",
    detail: "long 45 days, placed 24 Feb",
    settles: "TD3C settlement price",
    status: "credit",
    bleed: -96,
    math: "an inflated index pays out above physical cost",
    clause: "not applicable, cleared",
  },
  {
    ref: "BNK-SWAP-11",
    kind: "Bunker swap",
    detail: "3,000 mt/mo",
    settles: "Fujairah 0.5% assessment",
    status: "watch",
    bleed: 14,
    math: "thin assessment window, four reported deals",
    clause: "s9 price source substitution",
  },
  {
    ref: "CoA-1740",
    kind: "Contract of affreightment",
    detail: "lumpsum, Red Sea load",
    settles: "fixed WS flat, agreed January",
    status: "protected",
    bleed: 0,
    math: "no index reference",
    clause: "fixed, nothing to invoke",
  },
  {
    ref: "STOR-FJR-06",
    kind: "Tank lease, Fujairah",
    detail: "180,000 bbl",
    settles: "fixed $/bbl per month",
    status: "protected",
    bleed: 0,
    math: "no index reference",
    clause: "fixed, nothing to invoke",
  },
];

const EXITS = [
  {
    id: "reprice",
    group: "CoA-2291",
    name: "Reprice to physical basis",
    move: "Amend the settlement reference on CoA-2291 to a broker-verified physical average.",
    recovers: 367,
    carry: 0,
    cost: "$1.8M one-off, legal plus a concession on demurrage terms",
    counterparty:
      "The owner sits on the winning side of the gap and will not reopen voluntarily. Your leverage is fourteen months of renewal volume and the Mercuria filing as precedent.",
    odds: 45,
    timeline: "6 to 10 weeks",
  },
  {
    id: "hedge",
    group: "CoA-2291",
    name: "Hedge the basis",
    move: "Short TD3C forward against the CoA settlement volume. Stay physical on the cargo.",
    recovers: 310,
    carry: 21,
    cost: "$640k/mo margin and carry, or $21k/day",
    counterparty:
      "None required. Executes today through your existing clearer. The residual is the basis between your load port and the published assessment, which is not zero.",
    odds: 85,
    timeline: "same day",
  },
  {
    id: "clause",
    group: "CoA-2291",
    name: "Invoke the benchmark-change clause",
    move: "Serve notice under s14.3, material change in the character of the referenced assessment.",
    recovers: 367,
    carry: 0,
    cost: "No direct cost. Arbitration fees and the relationship.",
    counterparty:
      "Contested. The Baltic still publishes daily, so unavailable is arguable rather than obvious. Mercuria v Baltic Exchange tests this exact question in London in October, and filing before judgment is a gamble on a ruling you have not read.",
    odds: 25,
    timeline: "4 to 9 months",
  },
  {
    id: "fixhire",
    group: "TC-0884",
    name: "Convert TC-0884 to fixed hire",
    move: "Buy out the floating hire at $291k/day for the balance of the period.",
    recovers: 132,
    carry: 0,
    cost: "$2.4M implied, the owner prices a four-month extension into the fix",
    counterparty:
      "The owner will trade certainty for duration. That is the whole negotiation, and it is winnable in a fortnight.",
    odds: 60,
    timeline: "2 weeks",
  },
];

const DECISIONS = {
  act: {
    title: "Short 45 days TD3C against CoA-2291, $640k/mo",
    drivers: [
      { d: "Basis widened 42% in eleven days", w: 0.48 },
      { d: "Forward curve prices a Q4 reversion the physical market does not support", w: 0.33 },
      { d: "CoA settles on the 31 August monthly average, sixteen days of accrual left", w: 0.19 },
    ],
  },
  hold: {
    title: "Hold. Do not serve notice on s14.3 yet",
    drivers: [
      { d: "Mercuria v Baltic judgment expected October; an adverse finding materially strengthens the amendment position", w: 0.44 },
      { d: "The owner has no commercial reason to reopen while the gap runs in their favour", w: 0.35 },
      { d: "Hedging captures 84% of the exposure with no counterparty conversation", w: 0.21 },
    ],
  },
};

const TIERS = [
  { n: "Basis Monitor", p: "$9k/mo", d: "Up to 25 contracts. Daily ledger and bleed print." },
  { n: "Basis Desk", p: "$28k/mo", d: "Adds exit modelling, hedge sizing, clause library and evidence packs." },
  { n: "Enterprise", p: "Custom", d: "API, multi-benchmark coverage, arbitration support." },
];

const GTM = [
  ["Buyer", "Independent refiners and mid-size charterers holding index-linked CoAs without an in-house freight derivatives desk. Majors already run this reconciliation internally."],
  ["Channel", "Shipbrokers and maritime law firms. They hold the contracts, and their clients are already asking this question without getting a number back."],
  ["Timing", "Mercuria v Baltic Exchange, London, October. Publish the reconciliation methodology openly before judgment, not after."],
  ["Proof", "Three design partners, one published monthly basis print, methodology open to inspection."],
  ["Expansion", "Benchmark-integrity monitoring beyond freight: Platts Dated Brent windows, Argus assessments, Baltic dry. Chokepoint-independent, so it survives a reopening."],
];

const RISKS = [
  ["Fixture data is proprietary", "A broker or exchange data licence is a real cost of goods, not a footnote. Gross margin depends on that negotiation more than on pricing."],
  ["Reconvergence decays the product", "If the strait reopens and the index re-anchors, the acute pitch evaporates. Multi-benchmark monitoring has to be built before that happens, not after."],
  ["The Baltic is a source and a counterparty", "Publishing a rival reconciliation of an index we also consume invites a licensing dispute at best."],
];

/* ---------------------------- primitives ---------------------------- */

const money = (k) => (Math.abs(k) >= 1000 ? `$${(k / 1000).toFixed(2)}M` : `$${Math.round(k)}k`);

function Eyebrow({ children }) {
  return (
    <div className="font-mono text-[10px] tracking-[0.18em] uppercase mb-2" style={{ color: c.muted }}>
      {children}
    </div>
  );
}

function Provenance({ children }) {
  return (
    <div className="mt-8 pt-3 border-t font-mono text-[10px] leading-relaxed" style={{ borderColor: c.rule, color: c.muted }}>
      PROVENANCE — {children}
    </div>
  );
}

/* Signature element: two tracks, printed above and paid below, with the
   space between them filled. Large in the hero, small in each ledger row. */
function SplitRule({ data, height = 160, showEnds = true, strokeW = 2 }) {
  const w = 1000;
  const pad = 10;
  const all = data.flatMap((d) => [d.paper, d.physical]);
  const min = Math.min(...all) - 1.5;
  const max = Math.max(...all) + 1.5;
  const x = (i) => pad + (i * (w - pad * 2)) / (data.length - 1);
  const y = (v) => height - pad - ((v - min) / (max - min)) * (height - pad * 2);
  const path = (key) => data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d[key])}`).join(" ");
  const band =
    data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.paper)}`).join(" ") +
    " " +
    data.map((_, i) => {
      const j = data.length - 1 - i;
      return `L${x(j)},${y(data[j].physical)}`;
    }).join(" ") +
    " Z";
  const last = data[data.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img"
         aria-label="The printed index against physically cleared freight">
      <path d={band} fill={c.bleed} fillOpacity="0.13" />
      <path d={path("paper")} fill="none" stroke={c.paper} strokeWidth={strokeW} vectorEffect="non-scaling-stroke" />
      <path d={path("physical")} fill="none" stroke={c.physical} strokeWidth={strokeW} vectorEffect="non-scaling-stroke"
            strokeDasharray="6 4" />
      {showEnds && (
        <>
          <circle cx={x(data.length - 1)} cy={y(last.paper)} r="3.5" fill={c.paper} />
          <circle cx={x(data.length - 1)} cy={y(last.physical)} r="3.5" fill={c.physical} />
        </>
      )}
    </svg>
  );
}

function MiniSplit() {
  return (
    <div className="w-20 h-8 shrink-0 hidden sm:block">
      <SplitRule data={basisSeries.slice(2)} height={32} showEnds={false} strokeW={1.5} />
    </div>
  );
}

function Ticker() {
  const items = [...ticker, ...ticker];
  return (
    <div className="overflow-hidden border-b" style={{ borderColor: c.rule, backgroundColor: c.panel }}>
      <div className="flex ticker-track" style={{ width: "max-content" }}>
        {items.map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-5 py-2 whitespace-nowrap border-r" style={{ borderColor: c.rule }}>
            <span className="font-mono text-[10px] tracking-wider" style={{ color: c.muted }}>{t.k}</span>
            <span className="font-mono text-[11px] font-semibold"
                  style={{ color: t.k === "PHYSICAL CLEARED" ? c.physical : c.paper }}>{t.v}</span>
            <span className="font-mono text-[10px]" style={{ color: c.muted }}>{t.n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ screens ------------------------------ */

function BasisScreen() {
  return (
    <div className="max-w-3xl">
      <Eyebrow>Two prices for one voyage</Eyebrow>
      <h1 className="font-display text-[2.5rem] sm:text-[3.4rem] leading-[1.04] mb-6" style={{ color: c.text }}>
        The index stopped<br />measuring the market.<br />
        <span style={{ color: c.muted }}>Your contracts didn&rsquo;t notice.</span>
      </h1>

      <div className="rounded-lg border p-4 mb-6" style={{ borderColor: c.rule, backgroundColor: c.panel }}>
        <SplitRule data={basisSeries} height={150} />
        <div className="flex justify-between mt-2 font-mono text-[10px]" style={{ color: c.muted }}>
          {basisSeries.map((d) => <span key={d.m}>{d.m}</span>)}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t" style={{ borderColor: c.rule }}>
          <div>
            <div className="font-mono text-lg font-semibold">
              <span style={{ color: c.paper }}>${PAPER.toFixed(2)}</span>
            </div>
            <div className="font-body text-[11px]" style={{ color: c.muted }}>printed, TD3C implied</div>
          </div>
          <div>
            <div className="font-mono text-lg font-semibold">
              <span style={{ color: c.physical }}>${PHYSICAL.toFixed(2)}</span>
            </div>
            <div className="font-body text-[11px]" style={{ color: c.muted }}>paid, physically cleared</div>
          </div>
          <div>
            <div className="font-mono text-lg font-semibold">
              <span style={{ color: c.bleed }}>${GAP.toFixed(2)}</span>
            </div>
            <div className="font-body text-[11px]" style={{ color: c.muted }}>basis, per barrel</div>
          </div>
        </div>
      </div>

      <p className="font-body text-sm leading-relaxed mb-4" style={{ color: c.muted }}>
        Cargo stopped moving through Hormuz in March. Paper did not. The benchmark is now assessed off Red Sea fixtures
        with a strait premium bolted on, while the physical market clears several dollars lower, and every index-linked
        contract of affreightment, floating charter and freight hedge settles against the printed number regardless.
      </p>
      <p className="font-body text-sm leading-relaxed mb-6" style={{ color: c.text }}>
        Nobody owns that gap internally. It lives in contract language rather than in a trading system, so it sits
        between legal, chartering and treasury and no single team sees the whole of it. BASIS reads the contracts,
        reconciles the printed assessment against verified fixtures, and states what the difference costs per day.
      </p>

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          [ShieldCheck, "A number, not a score", "The output is dollars per day, traceable to a named contract and a named clause."],
          [Gavel, "Built on a live dispute", "Whether the benchmark still represents the voyage is being argued in court, not in theory."],
          [Scale, "It also tells you to wait", "Three of the four exits are worth less than holding today. The product says so."],
        ].map(([Icon, t, b]) => (
          <div key={t} className="p-4 rounded-lg border" style={{ borderColor: c.rule, backgroundColor: c.panel }}>
            <Icon size={16} style={{ color: c.paper }} className="mb-2" />
            <div className="font-body text-[13px] font-semibold mb-1" style={{ color: c.text }}>{t}</div>
            <div className="font-body text-[11px] leading-relaxed" style={{ color: c.muted }}>{b}</div>
          </div>
        ))}
      </div>

      <Provenance>
        Monthly prints are illustrative, shaped to the reported 2026 pattern: a March and April blowout, partial easing
        after the June war-risk facility, renewed widening in August.
      </Provenance>
    </div>
  );
}

function BleedScreen({ net, chosen }) {
  const shown = Math.max(0, net);
  const pct = ((shown / GROSS_MARGIN_PER_DAY) * 100).toFixed(1);
  const rows = CONTRACTS.filter((k) => k.bleed !== 0);
  const carry = chosen.reduce((s, e) => s + e.carry, 0);

  return (
    <div className="max-w-3xl">
      <Eyebrow>Refinery treasury, 120 kbpd</Eyebrow>

      <div className="flex flex-wrap items-end gap-x-10 gap-y-5 mb-2">
        <div>
          <div className="font-mono text-5xl sm:text-6xl font-bold tabular-nums"
               style={{ color: shown > 0 ? c.bleed : c.good }}>
            {shown > 0 ? money(shown) : "$0"}
          </div>
          <div className="font-body text-xs mt-1" style={{ color: c.muted }}>
            {shown > 0 ? "per day, to the basis" : "basis exposure neutralised"}
          </div>
        </div>
        <div>
          <div className="font-mono text-2xl font-semibold" style={{ color: c.text }}>{pct}%</div>
          <div className="font-body text-xs mt-1" style={{ color: c.muted }}>of gross refining margin</div>
        </div>
        <div>
          <div className="font-mono text-2xl font-semibold" style={{ color: c.text }}>${CUMULATIVE.toFixed(1)}M</div>
          <div className="font-body text-xs mt-1" style={{ color: c.muted }}>since 5 March, {DAYS_SINCE} days</div>
        </div>
      </div>
      <p className="font-body text-[11px] mb-8 max-w-xl leading-relaxed" style={{ color: c.muted }}>
        Cumulative is {DAYS_SINCE} days at a {money(AVG_RATE)}/day average. Today runs above that average because the
        basis has widened since July.
      </p>

      <div className="rounded-lg border mb-6 overflow-hidden" style={{ borderColor: c.rule, backgroundColor: c.panel }}>
        <div className="px-4 py-3 border-b font-body text-[11px] font-semibold tracking-wide"
             style={{ borderColor: c.rule, color: c.muted }}>
          WHERE IT COMES FROM — AN ITEMISED SUM, NOT AN INDEX
        </div>
        {rows.map((k) => {
          const hit = chosen.find((e) => e.group === k.ref);
          const eff = hit ? Math.max(0, k.bleed - hit.recovers) : k.bleed;
          return (
            <div key={k.ref} className="px-4 py-3 border-b" style={{ borderColor: c.rule }}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-xs" style={{ color: c.text }}>{k.ref}</span>
                <span className="font-mono text-sm tabular-nums"
                      style={{ color: eff === 0 ? c.muted : eff < 0 ? c.good : c.bleed }}>
                  {eff === 0 ? "—" : `${eff > 0 ? "+" : "−"}${money(Math.abs(eff))}/d`}
                </span>
              </div>
              <div className="font-body text-[11px] mt-0.5" style={{ color: c.muted }}>
                {k.math}
                {hit && <span style={{ color: c.good }}> · mitigated by {hit.name.toLowerCase()}</span>}
              </div>
            </div>
          );
        })}
        {carry > 0 && (
          <div className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-xs" style={{ color: c.text }}>HEDGE CARRY</span>
              <span className="font-mono text-sm tabular-nums" style={{ color: c.bleed }}>+{money(carry)}/d</span>
            </div>
            <div className="font-body text-[11px] mt-0.5" style={{ color: c.muted }}>
              margin and carry on the committed positions
            </div>
          </div>
        )}
      </div>

      {chosen.length > 0 && (
        <div className="p-4 rounded-lg border mb-6" style={{ borderColor: c.good, backgroundColor: c.panel2 }}>
          <div className="font-body text-[11px] font-semibold mb-2" style={{ color: c.muted }}>
            COMMITTED — ONE-OFF COST
          </div>
          {chosen.map((e) => (
            <div key={e.id} className="font-body text-[12px] leading-relaxed mb-1 last:mb-0" style={{ color: c.text }}>
              <span style={{ color: c.muted }}>{e.name} — </span>{e.cost}
            </div>
          ))}
        </div>
      )}

      <div className="p-4 rounded-lg border" style={{ borderColor: c.bleed, backgroundColor: "#170F0F" }}>
        <div className="flex items-center gap-2 mb-2">
          <TriangleAlert size={15} style={{ color: c.bleed }} />
          <span className="font-body text-[11px] font-semibold tracking-wide" style={{ color: c.bleed }}>
            THE ONE THAT MATTERS
          </span>
        </div>
        <p className="font-body text-sm leading-relaxed" style={{ color: c.text }}>
          CoA-2291 carries 88% of gross exposure and is the only contract with a benchmark clause worth reading. Fix
          that contract before touching anything else. The bunker swap is noise, and the charter is a fortnight of
          negotiation whenever you want it.
        </p>
      </div>

      <Provenance>
        Bleed is computed per contract from the $5.10 basis, then summed. FFA-Q3-26 is a credit rather than a cost,
        because an inflated index pays out on a long position. Netting it is the difference between a real number and a
        scare number.
      </Provenance>
    </div>
  );
}

function LedgerScreen() {
  const badge = {
    exposed: [c.bleed, "EXPOSED"],
    credit: [c.good, "CREDIT"],
    watch: [c.paper, "WATCH"],
    protected: [c.muted, "PROTECTED"],
  };
  return (
    <div className="max-w-3xl">
      <Eyebrow>Contract ledger, six instruments and four settlement references</Eyebrow>
      <p className="font-body text-sm leading-relaxed mb-6" style={{ color: c.muted }}>
        Parsed from the contract repository. Rows are read by what they settle against, because that, rather than the
        counterparty or the commodity, is what decides whether the dislocation reaches you.
      </p>

      <div className="space-y-2">
        {CONTRACTS.map((k) => {
          const [col, label] = badge[k.status];
          return (
            <div key={k.ref} className="p-4 rounded-lg border" style={{ borderColor: c.rule, backgroundColor: c.panel }}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold" style={{ color: c.text }}>{k.ref}</span>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded tracking-wider"
                          style={{ color: col, border: `1px solid ${col}` }}>{label}</span>
                  </div>
                  <div className="font-body text-[11px] mt-0.5" style={{ color: c.muted }}>{k.kind} · {k.detail}</div>
                </div>
                <div className="flex items-center gap-3">
                  {k.bleed !== 0 && <MiniSplit />}
                  <span className="font-mono text-sm tabular-nums shrink-0"
                        style={{ color: k.bleed === 0 ? c.muted : k.bleed < 0 ? c.good : c.bleed }}>
                    {k.bleed === 0 ? "—" : `${k.bleed > 0 ? "+" : "−"}${money(Math.abs(k.bleed))}/d`}
                  </span>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 pt-3 border-t" style={{ borderColor: c.rule }}>
                <div>
                  <div className="font-mono text-[10px] tracking-wider" style={{ color: c.muted }}>SETTLES ON</div>
                  <div className="font-body text-[12px]" style={{ color: c.text }}>{k.settles}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] tracking-wider" style={{ color: c.muted }}>ESCAPE CLAUSE</div>
                  <div className="font-body text-[12px]" style={{ color: c.text }}>{k.clause}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Provenance>
        A real deployment reads CoAs and charter parties from the customer&rsquo;s own repository. Clause extraction is
        the hard part and the defensible one. The reconciliation itself is arithmetic once the references are known.
      </Provenance>
    </div>
  );
}

function ExitsScreen({ committed, onCommit }) {
  return (
    <div className="max-w-3xl">
      <Eyebrow>Exits, what is available and what it costs</Eyebrow>
      <p className="font-body text-sm leading-relaxed mb-2" style={{ color: c.muted }}>
        The first three target CoA-2291 and are mutually exclusive, so committing one closes the other two. The charter
        fix is independent and stacks on top.
      </p>
      <p className="font-body text-[12px] leading-relaxed mb-6" style={{ color: c.paper }}>
        Today&rsquo;s recommendation is to hedge and wait. The decision log on the System screen shows why the clause
        route scores lower than it looks.
      </p>

      <div className="space-y-3">
        {EXITS.map((e) => {
          const inGroup = committed[e.group];
          const mine = inGroup === e.id;
          const blocked = Boolean(inGroup) && !mine;
          return (
            <div key={e.id} className="p-4 rounded-lg border"
                 style={{ borderColor: mine ? c.good : c.rule, backgroundColor: c.panel, opacity: blocked ? 0.45 : 1 }}>
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-body text-sm font-semibold" style={{ color: c.text }}>{e.name}</div>
                  <div className="font-mono text-[10px] tracking-wider" style={{ color: c.muted }}>TARGETS {e.group}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-semibold" style={{ color: c.good }}>−{money(e.recovers)}/d</div>
                  {e.carry > 0 && (
                    <div className="font-mono text-[10px]" style={{ color: c.bleed }}>+{money(e.carry)}/d carry</div>
                  )}
                </div>
              </div>

              <p className="font-body text-[12px] leading-relaxed mb-3" style={{ color: c.text }}>{e.move}</p>

              <div className="grid sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <div className="font-mono text-[10px] tracking-wider" style={{ color: c.muted }}>LIKELIHOOD</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1 w-14 rounded-full" style={{ backgroundColor: c.rule }}>
                      <div className="h-1 rounded-full"
                           style={{ width: `${e.odds}%`, backgroundColor: e.odds >= 60 ? c.good : c.paper }} />
                    </div>
                    <span className="font-mono text-[11px]" style={{ color: c.text }}>{e.odds}%</span>
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[10px] tracking-wider" style={{ color: c.muted }}>TIMELINE</div>
                  <div className="font-body text-[12px] mt-1" style={{ color: c.text }}>{e.timeline}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] tracking-wider" style={{ color: c.muted }}>COST</div>
                  <div className="font-body text-[12px] mt-1" style={{ color: c.text }}>{e.cost}</div>
                </div>
              </div>

              <div className="p-3 rounded-md mb-3" style={{ backgroundColor: c.panel2 }}>
                <div className="font-mono text-[10px] tracking-wider mb-1" style={{ color: c.muted }}>
                  WHAT THE COUNTERPARTY DOES
                </div>
                <p className="font-body text-[12px] leading-relaxed" style={{ color: c.text }}>{e.counterparty}</p>
              </div>

              <button
                onClick={() => !blocked && onCommit(e.id)}
                disabled={blocked}
                className="w-full sm:w-auto font-mono text-[11px] px-4 py-2 rounded-md font-semibold tracking-wide"
                style={{
                  backgroundColor: mine || blocked ? "transparent" : c.paper,
                  color: mine ? c.good : blocked ? c.muted : c.ink,
                  border: `1px solid ${mine ? c.good : blocked ? c.rule : c.paper}`,
                  cursor: blocked ? "not-allowed" : "pointer",
                }}
              >
                {mine ? "COMMITTED — CLICK TO UNDO" : blocked ? "CLOSED BY THE COMMITTED EXIT" : "COMMIT"}
              </button>
            </div>
          );
        })}
      </div>

      <Provenance>
        Likelihoods are judgement rather than model output, and are labelled that way in the product. A percentage that
        cannot be traced to a method should never be rendered as though it can.
      </Provenance>
    </div>
  );
}

function SystemScreen() {
  const [view, setView] = useState("act");
  const log = DECISIONS[view];
  const sources = [
    "Baltic TD3C assessment",
    "Broker fixture reports",
    "Argus and Platts physical",
    "Contract repository",
    "AIS load-port confirmations",
  ];
  return (
    <div className="max-w-3xl">
      <Eyebrow>System, reconciliation and provenance</Eyebrow>

      <div className="flex flex-wrap gap-2 mb-3 justify-center">
        {sources.map((s) => (
          <div key={s} className="px-3 py-2 rounded-md border font-mono text-[10px]"
               style={{ borderColor: c.rule, backgroundColor: c.panel, color: c.text }}>{s}</div>
        ))}
      </div>
      <div className="flex justify-center mb-3">
        <ArrowRight size={15} style={{ color: c.muted, transform: "rotate(90deg)" }} />
      </div>
      <div className="flex justify-center mb-3">
        <div className="px-5 py-3 rounded-md border font-body text-sm font-semibold text-center"
             style={{ borderColor: c.paper, backgroundColor: c.panel2, color: c.paper }}>
          Basis Engine
          <div className="font-mono text-[10px] font-normal mt-1" style={{ color: c.muted }}>
            benchmark reconciliation · clause extraction · exposure attribution
          </div>
        </div>
      </div>
      <div className="flex justify-center mb-3">
        <ArrowRight size={15} style={{ color: c.muted, transform: "rotate(90deg)" }} />
      </div>
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {["Bleed ledger", "Exit modelling", "Arbitration evidence pack"].map((o) => (
          <div key={o} className="px-3 py-2 rounded-md border font-mono text-[10px]"
               style={{ borderColor: c.rule, backgroundColor: c.panel, color: c.text }}>{o}</div>
        ))}
      </div>

      <div className="p-4 rounded-lg border mb-6" style={{ borderColor: c.rule, backgroundColor: c.panel }}>
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="flex items-center gap-2">
            <FileText size={14} style={{ color: c.muted }} />
            <span className="font-body text-[11px] font-semibold" style={{ color: c.muted }}>
              DECISION LOG — RECOMMENDATION 0812
            </span>
          </div>
          <div className="flex gap-1">
            {["act", "hold"].map((v) => (
              <button key={v} onClick={() => setView(v)}
                      className="font-mono text-[10px] px-2 py-1 rounded tracking-wider"
                      style={{
                        backgroundColor: view === v ? c.panel2 : "transparent",
                        color: view === v ? c.paper : c.muted,
                        border: `1px solid ${view === v ? c.rule : "transparent"}`,
                        cursor: "pointer",
                      }}>{v.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <p className="font-body text-sm mb-4" style={{ color: c.text }}>{log.title}</p>
        {log.drivers.map((d) => (
          <div key={d.d} className="mb-3">
            <div className="flex justify-between mb-1 gap-3">
              <span className="font-body text-[12px] leading-snug" style={{ color: c.text }}>{d.d}</span>
              <span className="font-mono text-[11px] shrink-0" style={{ color: c.paper }}>{Math.round(d.w * 100)}%</span>
            </div>
            <div className="h-1 w-full rounded-full" style={{ backgroundColor: c.rule }}>
              <div className="h-1 rounded-full" style={{ width: `${d.w * 100}%`, backgroundColor: c.paper }} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-4" style={{ borderColor: c.rule, backgroundColor: c.panel }}>
        <div className="font-body text-[11px] font-semibold mb-3" style={{ color: c.muted }}>
          PRINTED AGAINST PAID — $/BBL
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={basisSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={c.rule} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="m" tick={{ fill: c.muted, fontSize: 10 }} axisLine={{ stroke: c.rule }} tickLine={false} />
              <YAxis tickFormatter={(v) => `$${v}`} tick={{ fill: c.muted, fontSize: 10 }}
                     axisLine={{ stroke: c.rule }} tickLine={false} />
              <Tooltip contentStyle={{ background: c.panel2, border: `1px solid ${c.rule}`, borderRadius: 6, fontSize: 11 }}
                       labelStyle={{ color: c.muted }} />
              <Area type="monotone" dataKey="gap" stroke="none" fill={c.bleed} fillOpacity={0.16} name="basis" />
              <Line type="monotone" dataKey="paper" stroke={c.paper} strokeWidth={2} dot={false} name="printed" />
              <Line type="monotone" dataKey="physical" stroke={c.physical} strokeWidth={2} strokeDasharray="5 4"
                    dot={false} name="paid" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Provenance>
        The engine&rsquo;s only defensible claim is the reconciliation method, so it ships published rather than
        proprietary. A benchmark critique nobody can audit is just a second opinion.
      </Provenance>
    </div>
  );
}

function GtmScreen() {
  return (
    <div className="max-w-3xl">
      <Eyebrow>Pricing and go-to-market</Eyebrow>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {TIERS.map((t) => (
          <div key={t.n} className="p-4 rounded-lg border" style={{ borderColor: c.rule, backgroundColor: c.panel }}>
            <div className="font-body text-[11px] font-semibold mb-1" style={{ color: c.muted }}>{t.n}</div>
            <div className="font-mono text-xl font-bold mb-2" style={{ color: c.text }}>{t.p}</div>
            <div className="font-body text-[11px] leading-relaxed" style={{ color: c.muted }}>{t.d}</div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-lg border mb-8" style={{ borderColor: c.rule, backgroundColor: c.panel }}>
        <div className="font-body text-[11px] font-semibold mb-1" style={{ color: c.muted }}>OPTIONAL OUTCOME FEE</div>
        <div className="font-mono text-base font-bold mb-1" style={{ color: c.text }}>
          10% of documented first-year recovery, capped at $500k
        </div>
        <div className="font-body text-[11px] leading-relaxed" style={{ color: c.muted }}>
          Offered only on repriced contracts, where the saving is auditable against the amended settlement reference.
          No fee on hedging, because that would mean pricing our own advice.
        </div>
      </div>

      {GTM.map(([k, v], i, arr) => (
        <div key={k} className={`flex gap-4 py-3 ${i === arr.length - 1 ? "" : "border-b"}`} style={{ borderColor: c.rule }}>
          <span className="font-mono text-[10px] w-20 shrink-0 tracking-wider pt-0.5" style={{ color: c.paper }}>
            {k.toUpperCase()}
          </span>
          <span className="font-body text-[12px] leading-relaxed" style={{ color: c.text }}>{v}</span>
        </div>
      ))}

      <div className="mt-8 p-4 rounded-lg border" style={{ borderColor: c.rule, backgroundColor: c.panel2 }}>
        <div className="font-body text-[11px] font-semibold mb-3 tracking-wide" style={{ color: c.bleed }}>
          WHERE THIS BREAKS
        </div>
        {RISKS.map(([k, v]) => (
          <div key={k} className="mb-3 last:mb-0">
            <div className="font-body text-[12px] font-semibold" style={{ color: c.text }}>{k}</div>
            <div className="font-body text-[11px] leading-relaxed mt-0.5" style={{ color: c.muted }}>{v}</div>
          </div>
        ))}
      </div>

      <Provenance>
        Pricing is anchored to what a mid-size charterer already pays for freight analytics, not to the size of the
        saving. Value-based pricing on a number we produce ourselves invites exactly the scepticism the product exists
        to remove.
      </Provenance>
    </div>
  );
}

/* -------------------------------- app -------------------------------- */

export default function App() {
  const [screen, setScreen] = useState("basis");
  // One committed exit per contract, keyed by the contract it targets.
  const [committed, setCommitted] = useState({});

  const chosen = useMemo(
    () => Object.values(committed).map((id) => EXITS.find((x) => x.id === id)).filter(Boolean),
    [committed]
  );
  const gross = useMemo(() => CONTRACTS.reduce((s, k) => s + k.bleed, 0), []);
  const net = chosen.reduce((s, e) => s - e.recovers + e.carry, gross);

  const toggle = (id) => {
    const e = EXITS.find((x) => x.id === id);
    setCommitted((prev) => {
      const next = { ...prev };
      if (next[e.group] === id) delete next[e.group];
      else next[e.group] = id;
      return next;
    });
  };

  return (
    <div className="min-h-screen w-full font-body" style={{ backgroundColor: c.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        .font-display { font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; }
        .font-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
        .font-body { font-family: 'IBM Plex Sans', system-ui, sans-serif; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ticker-track { animation: ticker 44s linear infinite; }
        button:focus-visible { outline: 2px solid ${c.paper}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { .ticker-track { animation: none; } }
      `}</style>

      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b" style={{ borderColor: c.rule }}>
        <div className="flex items-baseline gap-2.5">
          <span className="font-display text-2xl tracking-tight" style={{ color: c.text }}>BASIS</span>
          <span className="font-mono text-[10px] hidden sm:inline tracking-wider" style={{ color: c.muted }}>
            BENCHMARK DISLOCATION EXPOSURE
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: c.muted }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.bleed }} />
          TD3C — DISLOCATED
        </div>
      </header>

      <Ticker />

      <nav className="flex gap-1 px-4 sm:px-6 py-3 overflow-x-auto border-b" style={{ borderColor: c.rule }}>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = screen === n.id;
          return (
            <button key={n.id} onClick={() => setScreen(n.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md whitespace-nowrap font-body text-[12px] font-medium shrink-0"
                    style={{
                      backgroundColor: active ? c.panel2 : "transparent",
                      color: active ? c.paper : c.muted,
                      border: `1px solid ${active ? c.rule : "transparent"}`,
                      cursor: "pointer",
                    }}>
              <Icon size={13} />
              {n.label}
            </button>
          );
        })}
      </nav>

      <main className="px-4 sm:px-6 py-8">
        {screen === "basis" && <BasisScreen />}
        {screen === "bleed" && <BleedScreen net={net} chosen={chosen} />}
        {screen === "ledger" && <LedgerScreen />}
        {screen === "exits" && <ExitsScreen committed={committed} onCommit={toggle} />}
        {screen === "system" && <SystemScreen />}
        {screen === "gtm" && <GtmScreen />}
      </main>

      {chosen.length > 0 && screen !== "bleed" && (
        <div className="sticky bottom-0 px-4 sm:px-6 py-3 border-t flex items-center justify-between gap-3 flex-wrap"
             style={{ borderColor: c.rule, backgroundColor: c.panel2 }}>
          <span className="flex items-center gap-2 font-mono text-[11px]" style={{ color: c.good }}>
            <CircleCheckBig size={13} /> {chosen.map((e) => e.name).join(" + ")} committed
          </span>
          <button onClick={() => setScreen("bleed")} className="font-mono text-[11px] px-3 py-1.5 rounded-md"
                  style={{ color: c.paper, border: `1px solid ${c.rule}`, cursor: "pointer" }}>
            SEE THE BLEED →
          </button>
        </div>
      )}

      <footer className="px-4 sm:px-6 py-4 border-t font-mono text-[10px] leading-relaxed"
              style={{ borderColor: c.rule, color: c.muted }}>
        PROTOTYPE — ILLUSTRATIVE DATA, NOT A LIVE SETTLEMENT SYSTEM. Figures are internally consistent and shaped to
        publicly reported 2026 conditions rather than drawn from a live feed.
      </footer>
    </div>
  );
}
