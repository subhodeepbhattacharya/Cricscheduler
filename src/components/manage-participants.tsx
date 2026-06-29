"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmDropId, setConfirmDropId] = useState<string | null>(null);

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
    const result = await markDroppedOut(participationId, matchId);
    if (!result?.error) {
      setConfirmDropId(null);
      router.refresh();
    }
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

                    {(p.status === "CONFIRMED" || p.status === "STANDBY") &&
                      (confirmDropId === p.id ? (
                        <div className="mt-2 flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                          <p className="text-xs text-red-700">
                            Mark <span className="font-semibold">{p.user.name}</span> as dropped
                            out?
                            {p.status === "CONFIRMED" &&
                              " Their spot will be freed and the next standby player may be promoted."}
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setConfirmDropId(null)}
                              disabled={loadingId === p.id}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              loading={loadingId === p.id}
                              onClick={() => handleDrop(p.id)}
                            >
                              Yes, mark dropped out
                            </Button>
                          </div>
                        </div>
                      ) : (
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
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDropId(p.id)}
                            className="text-red-700 hover:text-red-800"
                          >
                            Mark dropped out
                          </Button>
                        </div>
                      ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
