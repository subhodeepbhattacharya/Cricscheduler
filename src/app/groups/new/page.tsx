import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { CreateGroupForm } from "./create-group-form";

export default async function NewGroupPage() {
  await requireAuth();

  return (
    <div>
      <Link href="/groups" className="text-sm text-green-700 hover:underline">
        ← Back to groups
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Create a group</h1>
      <p className="mt-1 text-sm text-gray-500">Set up a cricket group for your WhatsApp crew.</p>
      <div className="mt-6">
        <CreateGroupForm />
      </div>
    </div>
  );
}
