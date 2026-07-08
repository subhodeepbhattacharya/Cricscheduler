"use client";

import { useState, type FormEvent } from "react";
import { createMatch } from "@/app/groups/actions";
import { updateMatch } from "@/app/matches/actions";
import { Button } from "@/components/ui/button";
import { Input, Toggle } from "@/components/ui/input";
import {
  LocationPicker,
  LocationFields,
  type SelectedLocation,
} from "@/components/location-picker";
import { getLocalTodayDateString } from "@/lib/utils";
import type { Match } from "@/lib/types/database";

// Times on the hour or half-hour (e.g. 9 AM, 9:30 AM, 10 AM).
function formatTimeOptionLabel(hour24: number, minute: number): string {
  const period = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return minute === 0
    ? `${hour12} ${period}`
    : `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

// Playable window: 6 AM through 9 PM, on the hour or half-hour.
const EARLIEST_MATCH_HOUR = 6;
const LATEST_MATCH_HOUR = 21;

const TIME_OPTIONS = (() => {
  const options: { value: string; label: string }[] = [];
  for (let hour24 = EARLIEST_MATCH_HOUR; hour24 <= LATEST_MATCH_HOUR; hour24++) {
    const minutes = hour24 === LATEST_MATCH_HOUR ? [0] : [0, 30];
    for (const minute of minutes) {
      const value = `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      options.push({ value, label: formatTimeOptionLabel(hour24, minute) });
    }
  }
  return options;
})();

function getTimeOptions(existingValue?: string) {
  if (!existingValue || TIME_OPTIONS.some((opt) => opt.value === existingValue)) {
    return TIME_OPTIONS;
  }

  const [hourStr, minuteStr] = existingValue.split(":");
  const hour24 = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour24) || Number.isNaN(minute)) {
    return TIME_OPTIONS;
  }

  return [
    ...TIME_OPTIONS,
    { value: existingValue, label: formatTimeOptionLabel(hour24, minute) },
  ].sort((a, b) => a.value.localeCompare(b.value));
}

type MatchFormProps =
  | { mode: "create"; groupId: string; match?: never }
  | { mode: "edit"; groupId: string; match: Match };

export function MatchForm({ mode, groupId, match }: MatchFormProps) {
  const today = getLocalTodayDateString();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prepaymentRequired, setPrepaymentRequired] = useState(match?.prepayment_required ?? false);
  const [maxPlayers, setMaxPlayers] = useState<string>(String(match?.max_players ?? 12));
  const [totalAmount, setTotalAmount] = useState<string>(
    match?.prepayment_required
      ? String(Math.round(Number(match.fee_per_player) * match.max_players * 100) / 100)
      : ""
  );
  const [hostUpiVpa, setHostUpiVpa] = useState(match?.host_upi_vpa ?? "");
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(
    match
      ? {
          locationName: match.location_name,
          locationAddress: match.location_address,
          googleMapsLink: match.google_maps_link ?? "",
        }
      : null
  );
  const [manualLocation, setManualLocation] = useState({
    name: match?.location_name ?? "",
    address: match?.location_address ?? "",
  });

  const hasMapsKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const locationName = selectedLocation?.locationName ?? manualLocation.name;
  const locationAddress = selectedLocation?.locationAddress ?? manualLocation.address;
  const googleMapsLink = selectedLocation?.googleMapsLink ?? "";

  const startTimeDefault = match?.start_time?.slice(0, 5) ?? "";
  const timeOptions = getTimeOptions(startTimeDefault || undefined);
  const playersNum = parseInt(maxPlayers, 10);
  const totalNum = parseFloat(totalAmount);
  // Round each share UP to the nearest paisa so the collected total always
  // covers the entered total (never short due to rounding).
  const perPlayer =
    prepaymentRequired && playersNum > 0 && !isNaN(totalNum) && totalNum > 0
      ? Math.ceil((totalNum / playersNum) * 100) / 100
      : 0;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!locationName.trim() || !locationAddress.trim()) {
      setError("Please select a location from Google Maps or enter the address manually.");
      return;
    }

    const matchDate = formData.get("date") as string;
    if (matchDate < today) {
      setError("Match date cannot be in the past.");
      return;
    }

    if (prepaymentRequired) {
      if (!(playersNum >= 2)) {
        setError("Max players must be at least 2 to split the total.");
        return;
      }
      if (totalAmount.trim() === "" || isNaN(totalNum) || totalNum <= 0) {
        setError("Enter the total amount (greater than ₹0) when UPI prepayment is required.");
        return;
      }
      if (!hostUpiVpa.trim()) {
        setError("Enter your UPI ID (e.g. name@okicici) so players can pay you.");
        return;
      }
    }

    setLoading(true);
    setError(null);
    formData.set("locationName", locationName.trim());
    formData.set("locationAddress", locationAddress.trim());
    formData.set("googleMapsLink", googleMapsLink);
    if (prepaymentRequired) {
      formData.set("prepaymentRequired", "on");
      formData.set("feePerPlayer", String(perPlayer));
      formData.set("hostUpiVpa", hostUpiVpa.trim());
    }

    const result =
      mode === "create"
        ? await createMatch(groupId, formData)
        : await updateMatch(match.id, formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Match title"
        name="title"
        required
        placeholder="e.g. Sunday Morning Match"
        defaultValue={match?.title}
      />
      <Input
        label="Date"
        name="date"
        type="date"
        required
        min={today}
        defaultValue={match?.date}
      />
      <div className="space-y-1">
        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
          Start time
        </label>
        <select
          id="startTime"
          name="startTime"
          required
          defaultValue={startTimeDefault}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="" disabled>
            Select a time
          </option>
          {timeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Location</p>
        {hasMapsKey ? (
          <LocationPicker
            selected={selectedLocation}
            onSelect={setSelectedLocation}
            onClear={() => setSelectedLocation(null)}
          />
        ) : null}

        {(!hasMapsKey || !selectedLocation) && (
          <LocationFields
            locationName={manualLocation.name}
            locationAddress={manualLocation.address}
            onLocationNameChange={(name) => setManualLocation((m) => ({ ...m, name }))}
            onLocationAddressChange={(address) => setManualLocation((m) => ({ ...m, address }))}
            requireManual={!hasMapsKey}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Max players"
          name="maxPlayers"
          type="number"
          min={2}
          required
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(e.target.value)}
        />
        {prepaymentRequired ? (
          <Input
            label="Total amount (₹) *"
            name="totalAmount"
            type="number"
            min={1}
            step={1}
            required
            placeholder="e.g. 1200"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />
        ) : (
          <Input
            label="Fee per player (₹)"
            name="feePerPlayer"
            type="number"
            min={0}
            step={1}
            defaultValue={match?.fee_per_player ?? 0}
          />
        )}
      </div>
      <Toggle
        label="Require UPI prepayment"
        checked={prepaymentRequired}
        onChange={setPrepaymentRequired}
        description="Players must pay before their spot is confirmed"
      />
      {prepaymentRequired && (
        <>
          <Input
            label="Your UPI ID *"
            name="hostUpiVpa"
            required
            placeholder="e.g. name@okicici or 9876543210@paytm"
            value={hostUpiVpa}
            onChange={(e) => setHostUpiVpa(e.target.value)}
            autoComplete="off"
          />
          <p className="-mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
            {perPlayer > 0
              ? `Each player pays ₹${perPlayer.toFixed(2)} (₹${totalNum} ÷ ${playersNum} players, rounded up).` +
                (perPlayer * playersNum > totalNum
                  ? ` Collects ₹${(perPlayer * playersNum).toFixed(2)} if all ${playersNum} pay.`
                  : "")
              : "Each player's fee = total amount ÷ max players (rounded up)."}
            {" "}Payments go directly to your UPI ID.
          </p>
        </>
      )}
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <Button type="submit" size="lg" loading={loading}>
        {mode === "create" ? "Create match" : "Save changes"}
      </Button>
    </form>
  );
}
