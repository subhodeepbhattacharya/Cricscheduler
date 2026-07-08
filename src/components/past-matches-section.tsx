"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate, formatMatchTime } from "@/lib/utils";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchCreatorLink, type MatchCreatorInfo } from "@/components/match-creator-link";
import type { Match } from "@/lib/types/database";

type Props = {
  matches: Match[];
  confirmedCounts: Record<string, number>;
  creators: Record<string, MatchCreatorInfo>;
  userId: string;
  userName?: string | null;
};

export function PastMatchesSection({
  matches,
  confirmedCounts,
  creators,
  userId,
  userName,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  if (matches.length === 0) return null;

  const matchLabel = matches.length === 1 ? "1 match" : `${matches.length} matches`;

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
      >
        <div>
          <p className="text-lg font-semibold text-gray-900">Past matches</p>
          <p className="text-xs text-gray-500">{matchLabel}</p>
        </div>
        <span
          className={`text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-gray-100 bg-gray-50/50 p-3">
          {matches.map((match) => (
            <Card key={match.id} className="opacity-75">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Link href={`/matches/${match.id}`}>
                    <CardTitle>{match.title}</CardTitle>
                    <CardDescription>
                      {formatDate(match.date)} · {formatMatchTime(match.start_time, match.end_time)}
                    </CardDescription>
                    <CardDescription>{match.location_name}</CardDescription>
                  </Link>
                  <MatchCreatorLink
                    creatorUserId={match.created_by_user_id}
                    creator={creators[match.created_by_user_id]}
                    matchTitle={match.title}
                    matchDateLabel={formatDate(match.date)}
                    currentUserId={userId}
                    currentUserName={userName}
                    className="text-sm text-gray-500"
                  />
                </div>
                <Link href={`/matches/${match.id}`} className="text-right">
                  <Badge variant={match.status === "CANCELLED" ? "cancelled" : "completed"}>
                    {match.status === "CANCELLED" ? "Cancelled" : "Ended"}
                  </Badge>
                  <p className="mt-1 text-xs text-gray-500">
                    {confirmedCounts[match.id] ?? 0} / {match.max_players} played
                  </p>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
