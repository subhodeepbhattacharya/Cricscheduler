"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate, formatMatchTime } from "@/lib/utils";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Match } from "@/lib/types/database";

type Props = {
  matches: Match[];
  confirmedCounts: Record<string, number>;
};

export function PastMatchesSection({ matches, confirmedCounts }: Props) {
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
              <Link href={`/matches/${match.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{match.title}</CardTitle>
                    <CardDescription>
                      {formatDate(match.date)} · {formatMatchTime(match.start_time, match.end_time)}
                    </CardDescription>
                    <CardDescription>{match.location_name}</CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge variant={match.status === "CANCELLED" ? "cancelled" : "completed"}>
                      {match.status === "CANCELLED" ? "Cancelled" : "Ended"}
                    </Badge>
                    <p className="mt-1 text-xs text-gray-500">
                      {confirmedCounts[match.id] ?? 0} / {match.max_players} played
                    </p>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
