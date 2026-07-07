import { redirect } from "next/navigation";
import { getCurrentUser, getUserProfile } from "@/lib/auth";
import { needsProfileName } from "@/lib/profile-name";
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
  if (user) {
    const profile = await getUserProfile(user.id);
    if (needsProfileName(profile?.name, user)) {
      const profileNext = safeNext
        ? `/auth/profile?next=${encodeURIComponent(safeNext)}`
        : "/auth/profile";
      redirect(profileNext);
    }
    redirect(safeNext ?? "/groups");
  }

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
          // Both methods live: email OTP (Supabase) and WhatsApp OTP (delivered
          // via the MSG91 Send SMS Hook). Same config in all environments.
          methods={{ email: true, phone: "whatsapp" }}
        />
      </div>
    </div>
  );
}
