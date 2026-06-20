"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { Input } from "@/components/ui/input";

export interface SelectedLocation {
  locationName: string;
  locationAddress: string;
  googleMapsLink: string;
}

interface LocationPickerProps {
  onSelect: (location: SelectedLocation) => void;
  onClear?: () => void;
  selected?: SelectedLocation | null;
}

function buildMapsLink(lat: number, lng: number, placeId?: string): string {
  if (placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}&query_place_id=${placeId}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function LocationPicker({ onSelect, onClear, selected }: LocationPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setLoadError("Google Maps API key is not configured. Enter the address manually below.");
      setLoading(false);
      return;
    }

    if (!inputRef.current || selected) return;

    let autocomplete: google.maps.places.Autocomplete | null = null;

    setOptions({ key: apiKey, libraries: ["places"] });

    importLibrary("places")
      .then(() => {
        if (!inputRef.current) return;

        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "name", "geometry", "place_id"],
          componentRestrictions: { country: "in" },
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete?.getPlace();
          if (!place?.geometry?.location || !place.formatted_address) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const locationName = place.name ?? place.formatted_address.split(",")[0];
          const locationAddress = place.formatted_address;
          const googleMapsLink = buildMapsLink(lat, lng, place.place_id);

          onSelect({ locationName, locationAddress, googleMapsLink });
        });

        setLoading(false);
      })
      .catch(() => {
        setLoadError("Could not load Google Maps. Enter the address manually below.");
        setLoading(false);
      });

    return () => {
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [apiKey, onSelect, selected]);

  if (selected) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-gray-900">{selected.locationName}</p>
            <p className="mt-1 text-sm text-gray-600">{selected.locationAddress}</p>
            <a
              href={selected.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-green-700 hover:underline"
            >
              View on Google Maps →
            </a>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label htmlFor="location-search" className="block text-sm font-medium text-gray-700">
        Search location on Google Maps
      </label>
      <input
        ref={inputRef}
        id="location-search"
        type="text"
        placeholder={loading ? "Loading maps..." : "Search for a ground, park, or address"}
        disabled={!!loadError && !apiKey}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        autoComplete="off"
      />
      {loadError && <p className="text-xs text-amber-600">{loadError}</p>}
      {!loadError && !loading && (
        <p className="text-xs text-gray-500">Start typing to search, then pick a result from the list.</p>
      )}
    </div>
  );
}

/** Manual fallback fields when Maps is unavailable or user prefers typing */
export function LocationFields({
  locationName,
  locationAddress,
  onLocationNameChange,
  onLocationAddressChange,
  requireManual = false,
}: {
  locationName: string;
  locationAddress: string;
  onLocationNameChange: (v: string) => void;
  onLocationAddressChange: (v: string) => void;
  requireManual?: boolean;
}) {
  return (
    <>
      <Input
        label={requireManual ? "Location name" : "Location name (optional override)"}
        name="locationName"
        required
        value={locationName}
        onChange={(e) => onLocationNameChange(e.target.value)}
        placeholder="e.g. Central Ground"
      />
      <Input
        label={requireManual ? "Location address" : "Location address (optional override)"}
        name="locationAddress"
        required
        value={locationAddress}
        onChange={(e) => onLocationAddressChange(e.target.value)}
        placeholder="Full address"
      />
    </>
  );
}
