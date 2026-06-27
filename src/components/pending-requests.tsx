"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveJoinRequest, denyJoinRequest } from "@/app/groups/actions";
import { Button } from "@/components/ui/button";
import { buildWhatsAppNotifyUrl, formatPhone } from "@/lib/phone";

export interface PendingRequest {
  membership_id: string;
  user_id: string;
  name: string;
  phone: string | null;
  requested_at: string;
}

type NotifyPrompt = {
  name: string;
  phone: string | null;
  action: "approved" | "denied";
};

function notifyMessage(groupName: string, prompt: NotifyPrompt): string {
  if (prompt.action === "approved") {
    return `Hi ${prompt.name}, your request to join "${groupName}" on CricScheduler has been approved! Open the app and check My Groups to see upcoming matches.`;
  }
  return `Hi ${prompt.name}, your request to join "${groupName}" on CricScheduler was not approved. Please contact the host if you have questions.`;
}

export function PendingRequests({
  groupId,
  groupName,
  requests,
}: {
  groupId: string;
  groupName: string;
  requests: PendingRequest[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notifyPrompt, setNotifyPrompt] = useState<NotifyPrompt | null>(null);

  if (requests.length === 0 && !notifyPrompt) return null;

  async function handle(action: "approve" | "deny", req: PendingRequest) {
    setPendingId(req.membership_id);
    setError(null);
    const result =
      action === "approve"
        ? await approveJoinRequest(req.membership_id, groupId)
        : await denyJoinRequest(req.membership_id, groupId);
    if (result?.error) {
      setError(result.error);
    } else {
      setNotifyPrompt({
        name: req.name,
        phone: req.phone,
        action: action === "approve" ? "approved" : "denied",
      });
    }
    setPendingId(null);
    router.refresh();
  }

  const whatsAppUrl = notifyPrompt
    ? buildWhatsAppNotifyUrl(notifyPrompt.phone, notifyMessage(groupName, notifyPrompt))
    : null;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Join requests
        {requests.length > 0 && (
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            {requests.length}
          </span>
        )}
      </h2>

      {notifyPrompt && (
        <div
          className={`mt-3 rounded-lg border p-3 ${
            notifyPrompt.action === "approved"
              ? "border-green-200 bg-green-50"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <p className="text-sm text-gray-800">
            {notifyPrompt.action === "approved"
              ? `${notifyPrompt.name} has been approved.`
              : `${notifyPrompt.name}'s request was denied.`}
          </p>
          <p className="mt-1 text-xs text-gray-500">Optionally let them know on WhatsApp.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {whatsAppUrl ? (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Notify on WhatsApp
              </a>
            ) : (
              <p className="text-xs text-gray-500">
                No phone number on file — message them manually
                {notifyPrompt.phone ? "" : "."}
              </p>
            )}
            <Button type="button" size="sm" variant="secondary" onClick={() => setNotifyPrompt(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {requests.length > 0 && (
        <div className="mt-3 space-y-2">
          {requests.map((req) => (
            <div
              key={req.membership_id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{req.name}</p>
                <p className="truncate text-xs text-gray-500">
                  {req.phone ? formatPhone(req.phone) : "Phone not available"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => handle("deny", req)}
                  loading={pendingId === req.membership_id}
                  className="text-red-700 hover:text-red-800"
                >
                  Deny
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handle("approve", req)}
                  loading={pendingId === req.membership_id}
                >
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
