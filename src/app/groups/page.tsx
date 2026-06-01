import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge, statusLabel, formatStatus } from "@/components/ui/badge";
import type { Group, MembershipRole } from "@/lib/types/database";

export default async function GroupsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("group_memberships")
    .select("role, cricket_groups(*)")
    .eq("user_id", user.id)
    .eq("status", "ACTIVE");

  const groups = (memberships ?? [])
    .map((m) => {
      const group = m.cricket_groups as unknown as Group;
      return { ...group, role: m.role as MembershipRole };
    })
    .filter((g) => g.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Groups</h1>
        <Link href="/groups/new">
          <Button size="sm">+ Create</Button>
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-gray-500">You haven&apos;t joined any groups yet.</p>
          <Link href="/groups/new" className="mt-4 inline-block">
            <Button>Create your first group</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{group.name}</CardTitle>
                    {group.description && (
                      <CardDescription className="line-clamp-2">{group.description}</CardDescription>
                    )}
                  </div>
                  <Badge variant={statusLabel(group.role)}>{formatStatus(group.role)}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
