"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Building2 } from "lucide-react";

export interface PlaceResult {
  placeName?: string;  // establishment name from Google Maps (e.g. "McDonald's")
  address: string;
  city: string;
  country: string;
  lat?: number;
  lng?: number;
}

// Shared promise — maps SDK loads once
let placesPromise: Promise<google.maps.PlacesLibrary> | null = null;

function loadPlaces(): Promise<google.maps.PlacesLibrary> {
  if (placesPromise) return placesPromise;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set"));
  }
  setOptions({ key: apiKey, v: "weekly" });
  placesPromise = importLibrary("places");
  return placesPromise;
}

function getComponent(
  components: google.maps.GeocoderAddressComponent[],
  types: string[]
): string {
  for (const type of types) {
    const c = components.find((comp) => comp.types.includes(type));
    if (c) return c.long_name;
  }
  return "";
}

// ── Address Autocomplete ─────────────────────────────────────────────────────

interface AddressAutocompleteProps {
  value: string;
  label: string;
  placeholder?: string;
  onChange: (result: PlaceResult) => void;
}

export function AddressAutocomplete({
  value,
  label,
  placeholder,
  onChange,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadPlaces()
      .then(() => { if (!cancelled) setReady(true); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current || acRef.current) return;

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["establishment", "geocode"],
      fields: ["formatted_address", "address_components", "geometry", "name"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place.geometry?.location) return;
      const comps = place.address_components ?? [];
      onChange({
        placeName: place.name || undefined,
        address: place.formatted_address ?? "",
        city: getComponent(comps, ["locality", "sublocality", "administrative_area_level_2", "administrative_area_level_1"]),
        country: getComponent(comps, ["country"]),
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
    });

    acRef.current = ac;
  }, [ready, onChange]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          defaultValue={value}
          placeholder={placeholder}
          disabled={error}
          className="rounded-xl pl-9"
        />
      </div>
      {error && (
        <p className="text-xs text-muted-foreground">
          Google Maps no disponible.
        </p>
      )}
    </div>
  );
}

// ── City Autocomplete ────────────────────────────────────────────────────────

interface CityAutocompleteProps {
  value: string;
  label: string;
  placeholder?: string;
  onChange: (city: string) => void;
}

export function CityAutocomplete({
  value,
  label,
  placeholder,
  onChange,
}: CityAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  // Keep input in sync when parent updates city (e.g. from address selection)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    loadPlaces()
      .then(() => { if (!cancelled) setReady(true); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current || acRef.current) return;

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["(cities)"],
      fields: ["address_components", "name"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const comps = place.address_components ?? [];
      const city =
        getComponent(comps, ["locality", "sublocality", "administrative_area_level_2", "administrative_area_level_1"]) ||
        place.name ||
        "";
      setInputValue(city);
      onChange(city);
    });

    acRef.current = ac;
  }, [ready, onChange]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          disabled={error}
          className="rounded-xl pl-9"
        />
      </div>
      {error && (
        <p className="text-xs text-muted-foreground">
          Google Maps no disponible.
        </p>
      )}
    </div>
  );
}

// ── City Autocomplete (bare input, no label wrapper) ─────────────────────────

interface CityFilterProps {
  value: string;
  placeholder?: string;
  className?: string;
  onChange: (city: string) => void;
  onPlaceChange?: (city: string, lat: number, lng: number) => void;
}

export function CityFilterInput({
  value,
  placeholder,
  className,
  onChange,
  onPlaceChange,
}: CityFilterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(value);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    loadPlaces()
      .then(() => { if (!cancelled) setReady(true); })
      .catch(() => { if (!cancelled) setReady(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current || acRef.current) return;

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["(cities)"],
      fields: ["address_components", "geometry", "name"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const comps = place.address_components ?? [];
      const city =
        getComponent(comps, ["locality", "sublocality", "administrative_area_level_2", "administrative_area_level_1"]) ||
        place.name ||
        "";
      setInputValue(city);
      onChange(city);
      if (onPlaceChange && place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        onPlaceChange(city, lat, lng);
      }
    });

    acRef.current = ac;
  }, [ready, onChange, onPlaceChange]);

  return (
    <Input
      ref={inputRef}
      value={inputValue}
      onChange={(e) => {
        setInputValue(e.target.value);
        // don't call onChange on every keystroke — wait for place_changed or blur
      }}
      onBlur={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onChange((e.target as HTMLInputElement).value);
      }}
      placeholder={placeholder}
      className={className}
    />
  );
}

// Default export for backwards compatibility
export default AddressAutocomplete;
