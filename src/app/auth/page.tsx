import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "./auth-form";

export default async function AuthPage() {
  const user = await getCurrentUser();
  if (user) redirect("/groups");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        {`Welcome to CricScheduler`}
      </h1>
      <p className="mt-1 text-sm text-gray-500">Sign in or create an account to manage your cricket groups.</p>
      <div className="mt-6">
        <AuthForm />
      </div>
    </div>
  );
}
