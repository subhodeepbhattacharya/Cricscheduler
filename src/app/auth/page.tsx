import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "./auth-form";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;

  const user = await getCurrentUser();
  if (user) redirect(safeNext ?? "/groups");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        {`Welcome to CricScheduler`}
      </h1>
      <p className="mt-1 text-sm text-gray-500">Sign in or create an account to manage your cricket groups.</p>
      {error === "confirm" && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          That confirmation link is invalid or has expired. Please sign in or sign up again to get a new one.
        </div>
      )}
      <div className="mt-6">
        <AuthForm next={safeNext} />
      </div>
    </div>
  );
}
