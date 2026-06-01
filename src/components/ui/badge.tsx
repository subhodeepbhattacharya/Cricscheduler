import { cn } from "@/lib/cn";

const variants = {
  confirmed: "bg-green-100 text-green-800",
  standby: "bg-amber-100 text-amber-800",
  declined: "bg-gray-100 text-gray-600",
  dropped_out: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-800",
  success: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-700",
  scheduled: "bg-blue-100 text-blue-800",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
  host: "bg-purple-100 text-purple-800",
} as const;

type BadgeVariant = keyof typeof variants;

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function statusLabel(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    CONFIRMED: "confirmed",
    STANDBY: "standby",
    DECLINED: "declined",
    DROPPED_OUT: "dropped_out",
    PENDING: "pending",
    SUCCESS: "success",
    FAILED: "failed",
    SCHEDULED: "scheduled",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    HOST: "host",
    CO_HOST: "host",
    PLAYER: "confirmed",
  };
  return map[status] ?? "declined";
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
