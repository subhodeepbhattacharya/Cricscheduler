/** Local calendar date as YYYY-MM-DD (avoid UTC off-by-one in date filters). */
export function getLocalTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function generateTransactionRef(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `CS-${timestamp}-${random}`.toUpperCase();
}

export function buildUpiIntentUrl(params: {
  amount: number;
  transactionRef: string;
  note: string;
}): string {
  const vpa = process.env.NEXT_PUBLIC_UPI_MERCHANT_VPA ?? "merchant@upi";
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "CricScheduler";
  const searchParams = new URLSearchParams({
    pa: vpa,
    pn: appName,
    am: params.amount.toFixed(2),
    cu: "INR",
    tn: params.note,
    tr: params.transactionRef,
  });
  return `upi://pay?${searchParams.toString()}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  const date = new Date();
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatMatchTime(startTime: string, endTime?: string | null): string {
  const start = formatTime(startTime);
  if (!endTime) return start;
  const startKey = startTime.slice(0, 5);
  const endKey = endTime.slice(0, 5);
  if (startKey === endKey) return start;
  return `${start} – ${formatTime(endTime)}`;
}
