"use client";

import {
  buildMatchCreatorContactMessage,
  buildWhatsAppNotifyUrl,
} from "@/lib/phone";

export type MatchCreatorInfo = {
  name: string;
  phone: string | null;
};

type Props = {
  creatorUserId: string;
  creator: MatchCreatorInfo | undefined;
  matchTitle: string;
  matchDateLabel: string;
  currentUserId: string;
  currentUserName?: string | null;
  className?: string;
};

export function MatchCreatorLink({
  creatorUserId,
  creator,
  matchTitle,
  matchDateLabel,
  currentUserId,
  currentUserName,
  className = "text-sm text-green-700",
}: Props) {
  const creatorName = creator?.name ?? "Unknown";
  const isSelf = creatorUserId === currentUserId;
  const whatsAppUrl =
    !isSelf && creator?.phone
      ? buildWhatsAppNotifyUrl(
          creator.phone,
          buildMatchCreatorContactMessage({
            creatorName,
            matchTitle,
            matchDateLabel,
            viewerName: currentUserName,
          })
        )
      : null;

  if (!whatsAppUrl) {
    return <p className={className}>Created by {creatorName}</p>;
  }

  return (
    <p className={className}>
      Created by{" "}
      <a
        href={whatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => event.stopPropagation()}
        className="font-medium underline decoration-green-700/40 underline-offset-2 hover:decoration-green-700"
        aria-label={`Message ${creatorName} on WhatsApp about this match`}
      >
        {creatorName}
      </a>
    </p>
  );
}
