import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "./auth-form";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mode?: string }>;
}) {
  const { next, mode } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  const initialMode = mode === "signup" ? "signup" : "signin";

  const user = await getCurrentUser();
  if (user) redirect(safeNext ?? "/groups");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        {`Welcome to CricScheduler`}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Use your phone number to manage your cricket groups.
      </p>
      <div className="mt-6">
        <AuthForm
          next={safeNext}
          initialMode={initialMode}
          methods={
            process.env.NODE_ENV === "production"
              ? // WhatsApp OTP is hidden until Meta Business verification / MSG91
                // are live. Email OTP works today via Supabase, so ship it alone.
                { email: true, phone: false }
              : { email: true, phone: "dual" }
          }
        />
      </div>
    </div>
  );
}
