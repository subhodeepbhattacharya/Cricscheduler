import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mt-8 mb-6 text-6xl">🏏</div>
      <h1 className="text-3xl font-bold text-gray-900">CricScheduler</h1>
      <p className="mt-3 max-w-sm text-gray-600">
        Stop the WhatsApp chaos. Create matches, track availability, and collect UPI payments — all
        in one place.
      </p>

      <div className="mt-8 w-full max-w-xs space-y-3">
        <Link href={user ? "/groups" : "/auth"} className={buttonVariants({ size: "lg" })}>
          {user ? "Go to my groups" : "Get started"}
        </Link>
      </div>

      <div className="mt-12 grid w-full gap-4 text-left">
        {[
          { icon: "📅", title: "Schedule matches", desc: "Set date, time, location & player limit" },
          { icon: "✅", title: "Track availability", desc: "Confirmed, standby, or declined — auto-managed" },
          { icon: "💰", title: "UPI prepayment", desc: "Optional payment before confirming your spot" },
        ].map((feature) => (
          <div key={feature.title} className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4">
            <span className="text-2xl">{feature.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
