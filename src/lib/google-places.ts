type GoogleDisplayName = {
  text?: string;
  languageCode?: string;
};

type GoogleAddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

type GooglePlace = {
  id?: string;
  name?: string;
  displayName?: GoogleDisplayName;
  formattedAddress?: string;
  shortFormattedAddress?: string;
  addressComponents?: GoogleAddressComponent[];
  googleMapsUri?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  photos?: Array<{
    name?: string;
    widthPx?: number;
    heightPx?: number;
    authorAttributions?: Array<{
      displayName?: string;
      uri?: string;
      photoUri?: string;
    }>;
  }>;
};

export type PlaceStructuredAddress = {
  street: string;
  city: string;
  postal: string;
  country: string;
};

export type PlaceCandidate = {
  id: string;
  resourceName?: string;
  name: string;
  address?: string;
  structuredAddress?: PlaceStructuredAddress;
  googleMapsUri?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
};

function getGoogleApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY;
}

function extractComponent(components: GoogleAddressComponent[] | undefined, type: string): string {
  return components?.find((c) => c.types?.includes(type))?.longText ?? "";
}

function parseStructuredAddress(place: GooglePlace): PlaceStructuredAddress | undefined {
  const components = place.addressComponents;
  if (!components || components.length === 0) return undefined;

  const streetNumber = extractComponent(components, "street_number");
  const route = extractComponent(components, "route");
  const street = [streetNumber, route].filter(Boolean).join(" ");
  const city =
    extractComponent(components, "locality") ||
    extractComponent(components, "sublocality") ||
    extractComponent(components, "administrative_area_level_2");
  const postal = extractComponent(components, "postal_code");
  const country =
    components.find((c) => c.types?.includes("country"))?.shortText ?? "";

  return { street, city, postal, country };
}

function toCandidate(place: GooglePlace): PlaceCandidate | null {
  if (!place.id || !place.displayName?.text) return null;

  return {
    id: place.id,
    resourceName: place.name,
    name: place.displayName.text,
    address: place.formattedAddress || place.shortFormattedAddress,
    structuredAddress: parseStructuredAddress(place),
    googleMapsUri: place.googleMapsUri,
    websiteUri: place.websiteUri,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
  };
}

export async function searchGooglePlaces(input: {
  query: string;
  languageCode?: string;
  regionCode?: string;
}) {
  const apiKey = getGoogleApiKey();
  if (!apiKey) {
    return {
      configured: false,
      places: [] as PlaceCandidate[],
      message: "GOOGLE_MAPS_API_KEY is not configured.",
    };
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.name,places.displayName,places.formattedAddress,places.addressComponents,places.googleMapsUri,places.websiteUri,places.rating,places.userRatingCount",
    },
    body: JSON.stringify({
      textQuery: input.query,
      includedType: "restaurant",
      languageCode: input.languageCode || "fr",
      regionCode: input.regionCode || "FR",
      pageSize: 5,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Places search failed with ${response.status}`);
  }

  const payload = (await response.json()) as { places?: GooglePlace[] };
  return {
    configured: true,
    places: (payload.places ?? []).flatMap((place) => {
      const candidate = toCandidate(place);
      return candidate ? [candidate] : [];
    }),
  };
}

export async function getGooglePlaceDetails(input: {
  placeId: string;
  languageCode?: string;
}) {
  const apiKey = getGoogleApiKey();
  if (!apiKey) {
    return {
      configured: false,
      place: null,
      message: "GOOGLE_MAPS_API_KEY is not configured.",
    };
  }

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(input.placeId)}?languageCode=${encodeURIComponent(input.languageCode || "fr")}`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "id,name,displayName,formattedAddress,googleMapsUri,websiteUri,nationalPhoneNumber,internationalPhoneNumber,rating,userRatingCount,types,photos",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Google Place Details failed with ${response.status}`);
  }

  const place = (await response.json()) as GooglePlace;
  return {
    configured: true,
    place: {
      ...toCandidate(place),
      phone: place.internationalPhoneNumber || place.nationalPhoneNumber,
      types: place.types ?? [],
      photos: place.photos ?? [],
    },
  };
}
