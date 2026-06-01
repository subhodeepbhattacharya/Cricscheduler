"use client";

import { useState } from "react";
import {
  confirmSpot,
  initiatePayment,
  declineSpot,
  dropOut,
} from "@/app/matches/actions";
import { Button } from "@/components/ui/button";
import { Badge, statusLabel, formatStatus } from "@/components/ui/badge";
import type { MatchParticipation, Payment } from "@/lib/types/database";

interface RsvpActionsProps {
  matchId: string;
  groupId: string;
  prepaymentRequired: boolean;
  confirmedCount: number;
  maxPlayers: number;
  participation: MatchParticipation | null;
  latestPayment: Payment | null;
}

export function RsvpActions({
  matchId,
  groupId,
  prepaymentRequired,
  confirmedCount,
  maxPlayers,
  participation,
  latestPayment,
}: RsvpActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentPending, setPaymentPending] = useState(false);
  const [transactionRef, setTransactionRef] = useState<string | null>(null);

  const isFull = confirmedCount >= maxPlayers;
  const status = participation?.status;

  function applyError(result: { error?: string; success?: boolean } | void) {
    if (result?.error) setError(result.error);
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const result = await confirmSpot(matchId, groupId);
    applyError(result);
    setLoading(false);
  }

  async function handlePayAndConfirm() {
    setLoading(true);
    setError(null);
    const result = await initiatePayment(matchId, groupId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    if (result.upiIntentUrl) {
      setTransactionRef(result.transactionRef ?? null);
      setPaymentPending(true);
      window.location.href = result.upiIntentUrl;
    }
    setLoading(false);
  }

  async function handleDecline() {
    setLoading(true);
    setError(null);
    const result = await declineSpot(matchId, groupId);
    applyError(result);
    setLoading(false);
  }

  async function handleDropOut() {
    setLoading(true);
    setError(null);
    const result = await dropOut(matchId);
    applyError(result);
    setLoading(false);
  }

  if (paymentPending || (latestPayment?.status === "PENDING" && prepaymentRequired)) {
    const ref = transactionRef ?? latestPayment?.transaction_ref;
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h3 className="font-semibold text-amber-900">Complete your payment</h3>
        <p className="mt-2 text-sm text-amber-800">
          Your UPI app should have opened. Complete the payment, then wait for the host to verify.
        </p>
        {ref && (
          <p className="mt-2 text-xs text-amber-700">
            Transaction ref: <span className="font-mono">{ref}</span>
          </p>
        )}
        <p className="mt-3 text-xs text-amber-600">
          The host will confirm your spot once they verify the payment in their UPI app.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {status && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Your status:</span>
          <Badge variant={statusLabel(status)}>{formatStatus(status)}</Badge>
          {latestPayment && prepaymentRequired && (
            <Badge variant={statusLabel(latestPayment.status)}>
              Payment {formatStatus(latestPayment.status)}
            </Badge>
          )}
        </div>
      )}

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {(!status || status === "DECLINED") && (
        <div className="space-y-2">
          {!isFull ? (
            prepaymentRequired ? (
              <Button size="lg" onClick={handlePayAndConfirm} loading={loading}>
                Pay & Confirm Spot
              </Button>
            ) : (
              <Button size="lg" onClick={handleConfirm} loading={loading}>
                Confirm Spot
              </Button>
            )
          ) : (
            <Button size="lg" variant="secondary" onClick={handleConfirm} loading={loading}>
              Join as Standby
            </Button>
          )}
          <Button size="lg" variant="ghost" onClick={handleDecline} loading={loading}>
            Decline
          </Button>
        </div>
      )}

      {status === "STANDBY" && (
        <div className="space-y-2">
          <p className="text-sm text-amber-700">
            You&apos;re on standby. You&apos;ll be promoted if a spot opens up.
          </p>
          <Button size="lg" variant="ghost" onClick={handleDecline} loading={loading}>
            Decline
          </Button>
        </div>
      )}

      {status === "CONFIRMED" && (
        <Button size="lg" variant="danger" onClick={handleDropOut} loading={loading}>
          Drop out
        </Button>
      )}
    </div>
  );
}
