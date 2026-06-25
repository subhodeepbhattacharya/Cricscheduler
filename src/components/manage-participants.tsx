"use client";

import { useState } from "react";
import {
  updatePaymentStatus,
  promoteStandby,
  markDroppedOut,
} from "@/app/matches/actions";
import { Button } from "@/components/ui/button";
import { Badge, statusLabel, formatStatus } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { ParticipationWithUser } from "@/lib/types/database";

interface ManageParticipantsProps {
  matchId: string;
  prepaymentRequired: boolean;
  participants: ParticipationWithUser[];
}

export function ManageParticipants({
  matchId,
  prepaymentRequired,
  participants,
}: ManageParticipantsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const groups = {
    CONFIRMED: participants.filter((p) => p.status === "CONFIRMED"),
    STANDBY: participants.filter((p) => p.status === "STANDBY"),
    DECLINED: participants.filter((p) => p.status === "DECLINED"),
    DROPPED_OUT: participants.filter((p) => p.status === "DROPPED_OUT"),
  };

  async function handlePayment(paymentId: string, status: "SUCCESS" | "FAILED") {
    setLoadingId(paymentId);
    await updatePaymentStatus(paymentId, matchId, status);
    setLoadingId(null);
  }

  async function handlePromote(participationId: string) {
    setLoadingId(participationId);
    await promoteStandby(participationId, matchId);
    setLoadingId(null);
  }

  async function handleDrop(participationId: string) {
    setLoadingId(participationId);
    await markDroppedOut(participationId, matchId);
    setLoadingId(null);
  }

  const sections = [
    { key: "CONFIRMED" as const, label: "Confirmed", items: groups.CONFIRMED },
    { key: "STANDBY" as const, label: "Standby", items: groups.STANDBY },
    { key: "DECLINED" as const, label: "Declined", items: groups.DECLINED },
    { key: "DROPPED_OUT" as const, label: "Dropped out", items: groups.DROPPED_OUT },
  ];

  return (
    <div className="space-y-6">
      {sections.map(({ key, label, items }) => (
        <div key={key}>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
            {label}
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              {items.length}
            </span>
          </h3>
          {items.length === 0 ? (
            <p className="text-sm text-gray-400">None</p>
          ) : (
            <div className="space-y-2">
              {items.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-gray-200 bg-white p-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{p.user.name}</p>
                      <p className="text-xs text-gray-500">{p.user.phone}</p>
                    </div>
                    <Badge variant={statusLabel(p.status)}>{formatStatus(p.status)}</Badge>
                  </div>

                  {prepaymentRequired && p.payment && (
                    <div className="mt-2 flex items-center justify-between rounded bg-gray-50 px-2 py-1.5">
                      <div className="text-xs">
                        <span className="text-gray-500">Payment: </span>
                        <Badge variant={statusLabel(p.payment.status)}>
                          {formatStatus(p.payment.status)}
                        </Badge>
                        <span className="ml-2 text-gray-600">
                          {formatCurrency(Number(p.payment.amount))}
                        </span>
                      </div>
                      {p.payment.status === "PENDING" && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handlePayment(p.payment!.id, "SUCCESS")}
                            loading={loadingId === p.payment!.id}
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handlePayment(p.payment!.id, "FAILED")}
                            loading={loadingId === p.payment!.id}
                          >
                            ✗
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-2 flex gap-2">
                    {p.status === "STANDBY" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handlePromote(p.id)}
                        loading={loadingId === p.id}
                      >
                        Promote
                      </Button>
                    )}
                    {(p.status === "CONFIRMED" || p.status === "STANDBY") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDrop(p.id)}
                        loading={loadingId === p.id}
                      >
                        Mark dropped out
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
