CarteAI is an AI menu concierge for restaurant QR ordering.

## Local Development

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open:

- `/` product homepage
- `/demo` customer QR experience
- `/admin` owner menu studio
- `/poster` printable QR poster

## AI Provider

The app works without an API key by using the local rules recommender. Add
`OPENAI_API_KEY` to enable LLM-assisted recommendation copy. The default model
is `gpt-5.4-mini`. The LLM only sees filtered candidate dishes and must not
invent dishes, prices, allergens, or calories.

## Current Product Scope

- Menu data source: `data/menu.json`
- Menu API: `GET /api/menu`
- Recommendation API: `POST /api/recommend`
- Upload ingestion placeholder: `POST /api/ingest`
- Google restaurant selection: `POST /api/google/places/search` and
  `POST /api/google/places/details`
- Browser local menu override: owner studio publishes to `localStorage`

The Google Places flow identifies the restaurant and can collect public place
metadata such as website, maps URL, address, phone, rating, and photos. Google
Maps pages are not scraped. To read menu items already managed in Google, the
owner must connect their Google Business Profile and grant API access.
