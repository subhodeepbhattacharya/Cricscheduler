import { redirect } from "next/navigation";
import { getCurrentUser, getUserProfile } from "@/lib/auth";
import { needsProfileName } from "@/lib/profile-name";
import { ProfileNameForm } from "./profile-name-form";

export default async function ProfileSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;

  const user = await getCurrentUser();
  if (!user) redirect("/auth");

  const profile = await getUserProfile(user.id);
  if (!needsProfileName(profile?.name, user)) {
    redirect(safeNext ?? "/groups");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">What should we call you?</h1>
      <p className="mt-1 text-sm text-gray-500">
        Add your name so teammates recognize you in groups and matches.
      </p>
      <div className="mt-6">
        <ProfileNameForm next={safeNext} />
      </div>
    </div>
  );
}
