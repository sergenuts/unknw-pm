import { formatMoney } from "@/lib/format";
import { weekDateLabel } from "@/lib/weeks";
import type { Client, Entry, FixedItem, ClientRate } from "@/lib/types";

type TaskAgg = {
  key: string;
  task: string;
  hours: number;
  sortKey: number;
  /** earliest entry — used for date label when single-day */
  firstDate: string | null;
  /** latest entry — used as upper bound when range */
  lastDate: string | null;
  /** week_num (for hours_week entries) — only one expected */
  weekNum: number | null;
  entryType: Entry["entry_type"];
  hasRange: boolean;
};

const MONTH_ORDER = [
  "december 2025", "january 2026", "february 2026", "march 2026", "april 2026",
  "may 2026", "june 2026", "july 2026", "august 2026", "september 2026",
  "october 2026", "november 2026", "december 2026",
];

function dateLabel(d: string | null | undefined): string {
  if (!d) return "—";
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}.${m[2]}`;
  return d;
}

function entrySortKey(e: Entry): number {
  if (e.date) {
    if (/^\d{4}-\d{2}-\d{2}/.test(e.date)) {
      const t = Date.parse(e.date);
      if (!isNaN(t)) return t;
    }
    const n = parseInt(e.date, 10);
    if (!isNaN(n)) return n;
  }
  if (e.week_num) return (e.week_num - 1) * 7 + 1;
  return 0;
}

export function ReportView({
  client,
  entries,
  rates,
  fixed,
  month,
  variant = "full",
}: {
  client: Client;
  entries: Entry[];
  rates: ClientRate[];
  fixed: FixedItem[];
  month?: string;
  variant?: "full" | "short";
}) {
  const fm = (v: number) => formatMoney(v, client.currency);
  const getRate = (role: string) => rates.find((r) => r.role === role)?.rate || 0;

  const monthSet = new Set<string>();
  entries.forEach((e) => monthSet.add(e.month));
  fixed.forEach((f) => monthSet.add(f.month));
  const allMonths = MONTH_ORDER.filter((m) => monthSet.has(m));
  const selected = month && allMonths.includes(month) ? month : null;
  const includedMonths = selected ? [selected] : allMonths;

  const monthsData = includedMonths.map((m) => {
    const mEntries = entries
      .filter((e) => e.month === m && e.status === "done")
      .sort((a, b) => entrySortKey(b) - entrySortKey(a));
    const mFixed = fixed.filter((f) => f.month === m && f.status === "done");

    const byRole = new Map<string, { hours: number; amount: number; tasks: Map<string, TaskAgg> }>();
    mEntries.forEach((e) => {
      const h = (e.hours || 0) * (e.coeff || 1);
      const amt = h * getRate(e.role);
      const g = byRole.get(e.role) || { hours: 0, amount: 0, tasks: new Map<string, TaskAgg>() };
      g.hours += h;
      g.amount += amt;

      // Merge entries with the same task name into one row.
      // hours_week entries are kept distinct per week.
      const isWeek = e.entry_type === "hours_week";
      const taskKey = isWeek ? `__w${e.week_num}__${e.task}` : e.task.trim().toLowerCase();
      const sk = entrySortKey(e);
      const existing = g.tasks.get(taskKey);
      if (existing) {
        existing.hours += h;
        if (sk > existing.sortKey) existing.sortKey = sk;
        if (e.date && (!existing.lastDate || e.date > existing.lastDate)) existing.lastDate = e.date;
        if (e.date && (!existing.firstDate || e.date < existing.firstDate)) existing.firstDate = e.date;
        if (existing.firstDate && existing.lastDate && existing.firstDate !== existing.lastDate) {
          existing.hasRange = true;
        }
      } else {
        g.tasks.set(taskKey, {
          key: taskKey,
          task: e.task,
          hours: h,
          sortKey: sk,
          firstDate: e.date || null,
          lastDate: e.date || null,
          weekNum: isWeek ? e.week_num : null,
          entryType: e.entry_type,
          hasRange: false,
        });
      }

      byRole.set(e.role, g);
    });

    const hoursTotal = Array.from(byRole.values()).reduce((s, g) => s + g.hours, 0);
    const hoursAmount = Array.from(byRole.values()).reduce((s, g) => s + g.amount, 0);
    const fixedAmount = mFixed.reduce((s, f) => s + (f.total || 0), 0);
    const subtotal = hoursAmount + fixedAmount;

    return { month: m, byRole, mFixed, hoursTotal, hoursAmount, fixedAmount, subtotal };
  });

  const grandHours = monthsData.reduce((s, m) => s + m.hoursTotal, 0);
  const grandSubtotal = monthsData.reduce((s, m) => s + m.subtotal, 0);
  // VAT: 'excl' = added on top, 'incl' = extracted from subtotal (which is gross), 'none' = no VAT.
  const vatMode = client.vat_mode || (client.vat ? "excl" : "none");
  const rate = client.vat_rate / 100;
  const vatAmount =
    vatMode === "excl" ? grandSubtotal * rate :
    vatMode === "incl" ? grandSubtotal - grandSubtotal / (1 + rate) :
    0;
  const netAmount = vatMode === "incl" ? grandSubtotal - vatAmount : grandSubtotal;
  const grandTotal = vatMode === "excl" ? grandSubtotal + vatAmount : grandSubtotal;
  const showVatLine = vatMode !== "none";

  const now = new Date().toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Brand */}
        <div style={styles.brand}>
          <span style={styles.brandMark}>UNKNW</span>
          <span style={styles.brandSub}>your ai design partner</span>
        </div>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>Statement of work</div>
            <h1 style={styles.title}>{client.name}</h1>
            <div style={styles.subtitle}>
              {selected ? selected : allMonths.length > 0 ? `${allMonths[0]} — ${allMonths[allMonths.length - 1]}` : "—"}
            </div>
          </div>
          <div style={styles.headerMeta}>
            <div style={styles.metaLabel}>Issued</div>
            <div style={styles.metaValue}>{now}</div>
            <div style={{ ...styles.metaLabel, marginTop: 10 }}>Currency</div>
            <div style={styles.metaValue}>{client.currency}</div>
          </div>
        </div>

        {/* Summary */}
        <div style={styles.summary}>
          <div style={styles.summaryCell}>
            <div style={styles.summaryValue}>{grandHours.toFixed(1)}</div>
            <div style={styles.summaryLabel}>Hours</div>
          </div>
          <div style={styles.summaryCell}>
            <div style={styles.summaryValue}>{fm(vatMode === "incl" ? netAmount : grandSubtotal)}</div>
            <div style={styles.summaryLabel}>{vatMode === "incl" ? "Net" : "Subtotal"}</div>
          </div>
          {showVatLine && (
            <div style={styles.summaryCell}>
              <div style={styles.summaryValue}>{fm(vatAmount)}</div>
              <div style={styles.summaryLabel}>
                VAT {client.vat_rate}%{vatMode === "incl" ? " (incl.)" : ""}
              </div>
            </div>
          )}
          <div style={{ ...styles.summaryCell, ...styles.summaryCellGrand }}>
            <div style={{ ...styles.summaryValue, ...styles.summaryValueGrand }}>{fm(grandTotal)}</div>
            <div style={styles.summaryLabel}>Total due</div>
          </div>
        </div>

        {/* Per-month sections */}
        {monthsData.map((md) => (
          <section key={md.month} style={styles.section}>
            {includedMonths.length > 1 && (
              <h2 style={styles.sectionTitle}>{md.month}</h2>
            )}

            {md.byRole.size > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={styles.subheader}>Time & materials</div>
                {Array.from(md.byRole.entries()).map(([role, g]) => (
                  <div key={role} style={styles.roleGroup}>
                    <div style={styles.roleHeader}>
                      <div style={styles.roleName}>{role}</div>
                      <div style={styles.roleMeta}>
                        <span>{g.hours.toFixed(1)} h</span>
                        <span style={styles.rateCell}>× {fm(getRate(role))}</span>
                        <span style={styles.amountCell}>{fm(g.amount)}</span>
                      </div>
                    </div>
                    {variant === "full" && (
                      <ul style={styles.taskList}>
                        {Array.from(g.tasks.values())
                          .sort((a, b) => b.sortKey - a.sortKey)
                          .map((t) => {
                            const when =
                              t.entryType === "hours_week"
                                ? weekDateLabel(md.month, t.weekNum)
                                : t.hasRange && t.firstDate && t.lastDate
                                  ? `${dateLabel(t.firstDate)} – ${dateLabel(t.lastDate)}`
                                  : dateLabel(t.firstDate);
                            return (
                              <li key={t.key} style={styles.taskRow}>
                                <span style={styles.taskDate}>{when}</span>
                                <span style={styles.taskName}>{t.task}</span>
                                <span style={styles.taskHours}>{t.hours.toFixed(1)} h</span>
                              </li>
                            );
                          })}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {md.mFixed.length > 0 && (
              <div>
                <div style={styles.subheader}>Fixed price</div>
                {md.mFixed.map((f) => (
                  <div key={f.id} style={styles.fixedRow}>
                    <div style={styles.fixedName}>{f.name}</div>
                    <div style={styles.fixedMeta}>
                      <span>{f.qty} × {fm(f.price)}</span>
                      <span style={styles.amountCell}>{fm(f.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {monthsData.length > 1 && (
              <div style={styles.monthSubtotal}>
                <span>{md.month} subtotal</span>
                <span>{fm(md.subtotal)}</span>
              </div>
            )}
          </section>
        ))}

        {/* Totals */}
        <div style={styles.totalsBlock}>
          <div style={styles.totalsRow}>
            <span>{vatMode === "incl" ? "Net" : "Subtotal"}</span>
            <span>{fm(vatMode === "incl" ? netAmount : grandSubtotal)}</span>
          </div>
          {showVatLine && (
            <div style={styles.totalsRow}>
              <span>VAT {client.vat_rate}%{vatMode === "incl" ? " (incl.)" : ""}</span>
              <span>{fm(vatAmount)}</span>
            </div>
          )}
          <div style={{ ...styles.totalsRow, ...styles.totalsRowGrand }}>
            <span>Total due</span>
            <span>{fm(grandTotal)}</span>
          </div>
        </div>

        <div style={styles.footer}>
          <div style={{ fontWeight: 600, color: "#4a4a4a", marginBottom: 2 }}>UNKNW</div>
          your ai design partner
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f5f4f0",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: "#1a1a1a",
    padding: "48px 24px",
    fontSize: 14,
    lineHeight: 1.5,
  },
  container: {
    maxWidth: 860,
    margin: "0 auto",
    background: "#fff",
    padding: "56px 64px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.06)",
  },
  brand: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 40,
  },
  brandMark: {
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: "0.22em",
    color: "#1a1a1a",
  },
  brandSub: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.22em",
    color: "#8a8a8a",
    textTransform: "uppercase",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 24,
    marginBottom: 48,
    paddingBottom: 32,
    borderBottom: "1px solid #eee",
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.14em",
    color: "#8a8a8a",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    margin: 0,
    lineHeight: 1.05,
    textTransform: "capitalize",
  },
  subtitle: {
    fontSize: 15,
    color: "#6a6a6a",
    marginTop: 8,
    textTransform: "capitalize",
  },
  headerMeta: {
    textAlign: "right",
    minWidth: 140,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.12em",
    color: "#8a8a8a",
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 14,
    color: "#1a1a1a",
    marginTop: 3,
  },
  summary: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: 1,
    marginBottom: 48,
    background: "#eee",
    border: "1px solid #eee",
  },
  summaryCell: {
    background: "#fff",
    padding: "20px 18px",
  },
  summaryCellGrand: {
    background: "#1a1a1a",
    color: "#fff",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    fontVariantNumeric: "tabular-nums",
  },
  summaryValueGrand: {
    color: "#fff",
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.12em",
    color: "#8a8a8a",
    textTransform: "uppercase",
    marginTop: 6,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: "0 0 20px",
    textTransform: "capitalize",
    letterSpacing: "-0.01em",
  },
  subheader: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.14em",
    color: "#8a8a8a",
    textTransform: "uppercase",
    marginBottom: 14,
    paddingBottom: 8,
    borderBottom: "1px solid #eee",
  },
  roleGroup: {
    marginBottom: 22,
  },
  roleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  roleName: {
    fontSize: 15,
    fontWeight: 600,
    textTransform: "capitalize",
  },
  roleMeta: {
    display: "flex",
    gap: 18,
    alignItems: "baseline",
    color: "#6a6a6a",
    fontSize: 13,
    fontVariantNumeric: "tabular-nums",
  },
  rateCell: {
    minWidth: 60,
    textAlign: "right",
  },
  amountCell: {
    minWidth: 80,
    textAlign: "right",
    color: "#1a1a1a",
    fontWeight: 600,
  },
  taskList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    borderLeft: "2px solid #f0f0f0",
    paddingLeft: 14,
  },
  taskRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 16,
    padding: "4px 0",
    fontSize: 13,
    color: "#4a4a4a",
  },
  taskDate: {
    minWidth: 74,
    color: "#8a8a8a",
    fontSize: 12,
    fontVariantNumeric: "tabular-nums",
  },
  taskName: {
    flex: 1,
  },
  taskHours: {
    color: "#8a8a8a",
    fontVariantNumeric: "tabular-nums",
    fontSize: 12,
  },
  fixedRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    padding: "10px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  fixedName: {
    fontSize: 15,
    fontWeight: 500,
  },
  fixedMeta: {
    display: "flex",
    gap: 18,
    color: "#6a6a6a",
    fontSize: 13,
    fontVariantNumeric: "tabular-nums",
  },
  monthSubtotal: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 18,
    paddingTop: 12,
    borderTop: "1px solid #eee",
    fontSize: 13,
    color: "#6a6a6a",
    textTransform: "capitalize",
    fontVariantNumeric: "tabular-nums",
  },
  totalsBlock: {
    marginTop: 40,
    paddingTop: 24,
    borderTop: "2px solid #1a1a1a",
  },
  totalsRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    fontSize: 14,
    color: "#4a4a4a",
    fontVariantNumeric: "tabular-nums",
  },
  totalsRowGrand: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1a1a1a",
    marginTop: 8,
    paddingTop: 14,
    borderTop: "1px solid #eee",
  },
  footer: {
    marginTop: 56,
    paddingTop: 24,
    borderTop: "1px solid #eee",
    fontSize: 12,
    color: "#8a8a8a",
    textAlign: "center",
  },
};
