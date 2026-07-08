"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate, formatMatchTime, formatMatchFee } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteMatchButton } from "@/components/delete-match-button";
import { MatchShareLink } from "@/components/match-share-link";
import { MatchCreatorLink, type MatchCreatorInfo } from "@/components/match-creator-link";
import type { Match } from "@/lib/types/database";

type Props = {
  matches: Match[];
  confirmedCounts: Record<string, number>;
  creators: Record<string, MatchCreatorInfo>;
  canManage: boolean;
  userId: string;
  userName?: string | null;
};

function groupByDate(matches: Match[]): { date: string; matches: Match[] }[] {
  const map = new Map<string, Match[]>();
  for (const match of matches) {
    const list = map.get(match.date) ?? [];
    list.push(match);
    map.set(match.date, list);
  }
  return Array.from(map.entries()).map(([date, dayMatches]) => ({
    date,
    matches: dayMatches,
  }));
}

export function UpcomingMatchesByDate({
  matches,
  confirmedCounts,
  creators,
  canManage,
  userId,
  userName,
}: Props) {
  const dateGroups = groupByDate(matches);
  const [expandedDate, setExpandedDate] = useState<string | null>(
    dateGroups[0]?.date ?? null
  );

  function toggleDate(date: string) {
    setExpandedDate((current) => (current === date ? null : date));
  }

  return (
    <div className="mt-4 space-y-2">
      {dateGroups.map(({ date, matches: dayMatches }) => {
        const isExpanded = expandedDate === date;
        const matchLabel = dayMatches.length === 1 ? "1 match" : `${dayMatches.length} matches`;

        return (
          <div
            key={date}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => toggleDate(date)}
              aria-expanded={isExpanded}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
            >
              <div>
                <p className="font-semibold text-gray-900">{formatDate(date)}</p>
                <p className="text-sm font-medium text-green-700">{matchLabel}</p>
              </div>
              <span
                className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                aria-hidden
              >
                ▾
              </span>
            </button>

            {isExpanded && (
              <div className="space-y-3 border-t border-gray-100 bg-gray-50/50 p-3">
                {dayMatches.map((match) => {
                  const canEditMatch = canManage || match.created_by_user_id === userId;
                  const confirmed = confirmedCounts[match.id] ?? 0;
                  const isFull = confirmed >= match.max_players;

                  return (
                    <Card key={match.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Link href={`/matches/${match.id}`}>
                            <p className="text-lg font-semibold text-green-700">
                              {formatMatchTime(match.start_time, match.end_time)}
                            </p>
                            <CardTitle className="mt-1">{match.title}</CardTitle>
                            <CardDescription>{match.location_name}</CardDescription>
                          </Link>
                          <MatchCreatorLink
                            creatorUserId={match.created_by_user_id}
                            creator={creators[match.created_by_user_id]}
                            matchTitle={match.title}
                            matchDateLabel={formatDate(match.date)}
                            currentUserId={userId}
                            currentUserName={userName}
                          />
                        </div>
                        <Link href={`/matches/${match.id}`} className="shrink-0 text-right">
                          <Badge variant={isFull ? "standby" : "confirmed"}>
                            {confirmed} / {match.max_players}
                          </Badge>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatMatchFee(Number(match.fee_per_player))}
                          </p>
                        </Link>
                      </div>
                      <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                        {canEditMatch && (
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/matches/${match.id}/edit`}
                              className={buttonVariants({ size: "sm", variant: "secondary" })}
                            >
                              Edit
                            </Link>
                            <DeleteMatchButton matchId={match.id} matchTitle={match.title} />
                          </div>
                        )}
                        <MatchShareLink matchId={match.id} compact />
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
