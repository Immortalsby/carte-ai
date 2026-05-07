"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import type { AdminLocale } from "@/lib/admin-i18n";
import { getAdminDict } from "@/lib/admin-i18n";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const cuisineOptions = [
  "french", "italian", "chinese", "japanese", "japanese_fusion",
  "korean", "thai", "vietnamese", "indian",
  "lebanese", "moroccan", "turkish", "greek", "spanish",
  "mexican", "brazilian", "peruvian", "caribbean",
  "african", "mediterranean", "american", "fusion", "other",
];

type PlaceCandidate = {
  id: string;
  name: string;
  address?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
};

function getCuisineKey(cuisine: string): string {
  const map: Record<string, string> = {
    french: "cuisineFrench",
    italian: "cuisineItalian",
    chinese: "cuisineChinese",
    japanese: "cuisineJapanese",
    japanese_fusion: "cuisineJapaneseFusion",
    korean: "cuisineKorean",
    thai: "cuisineThai",
    vietnamese: "cuisineVietnamese",
    indian: "cuisineIndian",
    lebanese: "cuisineLebanese",
    moroccan: "cuisineMoroccan",
    turkish: "cuisineTurkish",
    greek: "cuisineGreek",
    spanish: "cuisineSpanish",
    mexican: "cuisineMexican",
    brazilian: "cuisineBrazilian",
    peruvian: "cuisinePeruvian",
    caribbean: "cuisineCaribbean",
    african: "cuisineAfrican",
    mediterranean: "cuisineMediterranean",
    american: "cuisineAmerican",
    fusion: "cuisineFusion",
    other: "cuisineOther",
  };
  return map[cuisine] ?? cuisine;
}

export default function NewRestaurantPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [locale, setLocale] = useState<AdminLocale>("en");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [cuisineType, setCuisineType] = useState("");
  const [address, setAddress] = useState("");
  const [googlePlaceId, setGooglePlaceId] = useState("");
  const [rating, setRating] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Google Places search
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeSearching, setPlaceSearching] = useState(false);
  const [placeCandidates, setPlaceCandidates] = useState<PlaceCandidate[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // Detect locale from cookie
  useEffect(() => {
    const match = document.cookie.match(/admin_locale=(en|fr|zh)/);
    if (match) setLocale(match[1] as AdminLocale);
  }, []);

  const t = getAdminDict(locale);
  const tAny = t as unknown as Record<string, string>;

  function handleNameChange(value: string) {
    setName(value);
    if (!slugManual) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManual(true);
    setSlug(slugify(value));
  }

  async function searchPlaces() {
    if (placeQuery.trim().length < 2) return;
    setPlaceSearching(true);
    setError("");
    try {
      const res = await fetch("/api/google/places/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: placeQuery,
          languageCode: locale === "zh" ? "zh-CN" : locale,
          regionCode: "FR",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.error);
      if (!json.configured) {
        toast(tAny.googlePlacesNotConfigured);
      }
      setPlaceCandidates(json.places ?? []);
      if ((json.places ?? []).length === 0 && json.configured) {
        toast(tAny.googlePlacesNoResults);
      }
    } catch {
      setError(tAny.networkError2);
    } finally {
      setPlaceSearching(false);
    }
  }

  function selectPlace(place: PlaceCandidate) {
    setSelectedPlaceId(place.id);
    setGooglePlaceId(place.id);
    setName(place.name);
    if (!slugManual) {
      setSlug(slugify(place.name));
    }
    if (place.address) setAddress(place.address);
    if (place.rating) setRating(place.rating.toFixed(1));
    toast(tAny.googlePlaceSelected, "success");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug || slugify(name),
          cuisine_type: cuisineType || undefined,
          address: address || undefined,
          google_place_id: googlePlaceId || undefined,
          rating: rating || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || tAny.saveFailed);
        return;
      }

      const tenant = await res.json();
      router.push(`/admin/${tenant.slug}`);
    } catch {
      setError(tAny.networkError2);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold">{tAny.createRestaurant}</h1>
      <p className="mt-1 text-sm text-gray-500">{tAny.createRestaurantDesc}</p>

      {/* Google Places search */}
      <div className="mt-8 rounded-xl border bg-gray-50 p-5">
        <h2 className="text-sm font-semibold text-gray-700">{tAny.searchGooglePlaces}</h2>
        <p className="mt-1 text-xs text-gray-500">{tAny.searchGooglePlacesHint}</p>
        <div className="mt-3 flex gap-2">
          <input
            value={placeQuery}
            onChange={(e) => setPlaceQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); searchPlaces(); } }}
            placeholder={tAny.googlePlacesPlaceholder}
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={searchPlaces}
            disabled={placeSearching}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {placeSearching ? tAny.googlePlacesSearching : tAny.googlePlacesSearch}
          </button>
        </div>

        {placeCandidates.length > 0 && (
          <div className="mt-3 space-y-2">
            {placeCandidates.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => selectPlace(place)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selectedPlaceId === place.id
                    ? "border-black bg-gray-100"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{place.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {place.address || ""}
                    </p>
                  </div>
                  {place.rating && (
                    <span className="shrink-0 rounded bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                      {place.rating.toFixed(1)} ({place.userRatingCount ?? 0})
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">
            {tAny.restaurantNameRequired}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder={tAny.restaurantNamePlaceholder}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            {tAny.urlSlug}
          </label>
          <div className="mt-1 flex items-center rounded-lg border">
            <span className="px-3 text-sm text-gray-400">/r/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              required
              pattern="[-a-z0-9]+"
              placeholder={tAny.slugPlaceholder}
              className="w-full rounded-r-lg border-l px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            {t.cuisineType}
          </label>
          <select
            value={cuisineType}
            onChange={(e) => setCuisineType(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">{t.select}</option>
            {cuisineOptions.map((c) => (
              <option key={c} value={c}>
                {tAny[getCuisineKey(c)] ?? c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">{t.address}</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={tAny.addressPlaceholder}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        {rating && (
          <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
            <span>Google Rating: {rating}</span>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? tAny.creating : tAny.create}
        </button>
      </form>
    </main>
  );
}
