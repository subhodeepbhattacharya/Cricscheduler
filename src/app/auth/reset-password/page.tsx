import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Set a new password</h1>

      {user ? (
        <>
          <p className="mt-1 text-sm text-gray-500">
            Choose a new password for <span className="font-medium">{user.email}</span>.
          </p>
          <div className="mt-6">
            <ResetPasswordForm />
          </div>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-gray-500">
            This password reset link is invalid or has expired.
          </p>
          <Link
            href="/auth"
            className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            ← Back to sign in
          </Link>
        </>
      )}
    </div>
  );
}
