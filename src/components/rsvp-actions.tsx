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
  elapsed?: boolean;
}

export function RsvpActions({
  matchId,
  groupId,
  prepaymentRequired,
  confirmedCount,
  maxPlayers,
  participation,
  latestPayment,
  elapsed = false,
}: RsvpActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentPending, setPaymentPending] = useState(false);
  const [transactionRef, setTransactionRef] = useState<string | null>(null);
  const [confirmingDropOut, setConfirmingDropOut] = useState(false);

  const isFull = confirmedCount >= maxPlayers;
  const status = participation?.status;
  const canRespond = !status || status === "DECLINED" || status === "DROPPED_OUT";
  const canRejoinWithPriorPayment =
    prepaymentRequired && latestPayment?.status === "SUCCESS";

  if (elapsed) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-medium text-gray-700">This match has ended.</p>
        <p className="mt-1 text-sm text-gray-500">RSVPs are closed.</p>
        {status && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-600">Your status:</span>
            <Badge variant={statusLabel(status)}>{formatStatus(status)}</Badge>
          </div>
        )}
      </div>
    );
  }

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
    if (result?.error) {
      applyError(result);
      setLoading(false);
      return;
    }
    setConfirmingDropOut(false);
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

      {canRespond && (
        <div className="space-y-2">
          {status === "DROPPED_OUT" && (
            <p className="text-sm text-gray-600">
              You dropped out of this match. You can rejoin while it&apos;s still open.
            </p>
          )}
          {!isFull ? (
            prepaymentRequired && !canRejoinWithPriorPayment ? (
              <Button size="lg" onClick={handlePayAndConfirm} loading={loading}>
                Pay & Confirm Spot
              </Button>
            ) : (
              <Button size="lg" onClick={handleConfirm} loading={loading}>
                {status === "DROPPED_OUT" ? "Rejoin match" : "Confirm Spot"}
              </Button>
            )
          ) : (
            <Button size="lg" variant="secondary" onClick={handleConfirm} loading={loading}>
              {status === "DROPPED_OUT" ? "Rejoin as standby" : "Join as Standby"}
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

      {status === "CONFIRMED" &&
        (confirmingDropOut ? (
          <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">
              Drop out of this match? Your confirmed spot will be freed and the next standby player
              may be promoted automatically.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setConfirmingDropOut(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="lg"
                loading={loading}
                onClick={handleDropOut}
              >
                Yes, drop out
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="lg"
            variant="danger"
            onClick={() => {
              setError(null);
              setConfirmingDropOut(true);
            }}
          >
            Drop out
          </Button>
        ))}
    </div>
  );
}
