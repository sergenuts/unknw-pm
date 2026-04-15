export function formatMoney(value: number, currency: string): string {
  const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
  return sym + Number(value).toLocaleString("en-GB", { maximumFractionDigits: 0 });
}

export function getCurrentMonth(): string {
  const d = new Date();
  return d.toLocaleString("en", { month: "long" }).toLowerCase() + " " + d.getFullYear();
}
