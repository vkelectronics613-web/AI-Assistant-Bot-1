import { useGetSettings } from "@workspace/api-client-react";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", AED: "د.إ", SAR: "﷼", EGP: "E£",
  INR: "₹", PKR: "₨", NGN: "₦", BRL: "R$", MXN: "$", ZAR: "R",
  TRY: "₺", IDR: "Rp", PHP: "₱", MYR: "RM", THB: "฿", VND: "₫",
  JPY: "¥", CNY: "¥", KRW: "₩", CAD: "CA$", AUD: "A$", CHF: "CHF",
  RUB: "₽", PLN: "zł", SEK: "kr", NOK: "kr", DKK: "kr", CZK: "Kč",
};

export function useCurrency() {
  const { data: settings } = useGetSettings();
  const code = settings?.currency ?? "USD";
  const symbol = CURRENCY_SYMBOLS[code] ?? code;

  function format(amount: number | string | null | undefined): string {
    if (amount == null) return `${symbol}0.00`;
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return `${symbol}0.00`;
    return `${symbol}${num.toFixed(2)}`;
  }

  return { symbol, code, format };
}
