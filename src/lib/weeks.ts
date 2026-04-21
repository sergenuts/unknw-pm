const MONTHS = [
  "january","february","march","april","may","june",
  "july","august","september","october","november","december",
];

export function parseMonth(monthStr: string): { year: number; month: number } | null {
  const [m, y] = monthStr.split(" ");
  const mi = MONTHS.indexOf(m.toLowerCase());
  if (mi < 0) return null;
  return { year: Number(y), month: mi };
}

export function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function weekStart(year: number, week: number): Date {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay() || 7;
  const monday = new Date(simple);
  monday.setUTCDate(simple.getUTCDate() - dow + 1);
  return monday;
}

export function weeksInMonth(monthStr: string): { week: number; label: string }[] {
  const p = parseMonth(monthStr);
  if (!p) return [];
  const first = new Date(Date.UTC(p.year, p.month, 1));
  const last = new Date(Date.UTC(p.year, p.month + 1, 0));
  const seen = new Set<number>();
  const result: { week: number; label: string }[] = [];
  for (let d = new Date(first); d <= last; d.setUTCDate(d.getUTCDate() + 1)) {
    const w = isoWeek(d);
    if (seen.has(w)) continue;
    seen.add(w);
    const mon = weekStart(p.year, w);
    const sun = new Date(mon);
    sun.setUTCDate(mon.getUTCDate() + 6);
    const fmt = (dt: Date) =>
      dt.toLocaleString("en", { month: "short", day: "numeric", timeZone: "UTC" });
    result.push({ week: w, label: `Week ${w} (${fmt(mon)} – ${fmt(sun)})` });
  }
  return result;
}
