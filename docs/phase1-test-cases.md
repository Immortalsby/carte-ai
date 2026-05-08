# CarteAI Phase 1 — Test Cases

> Generated: 2026-05-05
> Covers: FR1–FR60 + NFR key items
> Test account: `test@carte-ai.link` / `12345678` (FOUNDER_EMAILS)
> Test restaurant: `pokemi-roanne`

---

## 1. Multi-Tenant Routing (FR1–FR4)

### TC-1.1 Slug routing — valid restaurant
- **Steps:** Open `/r/pokemi-roanne`
- **Expected:** Shows restaurant name, cuisine type, and customer experience UI
- **FR:** FR1

### TC-1.2 Slug routing — invalid slug
- **Steps:** Open `/r/this-does-not-exist`
- **Expected:** 404 Not Found page
- **FR:** FR1

### TC-1.3 Create new tenant with auto slug
- **Steps:** Login → `/admin/new` → Fill: Name="Test Sushi", Slug="test-sushi", Cuisine=japanese → Submit
- **Expected:** Tenant created, redirect to `/admin/test-sushi`
- **FR:** FR2

### TC-1.4 Slug conflict auto-suffix
- **Steps:** Try creating another tenant with slug="pokemi-roanne"
- **Expected:** System auto-appends `-2` (or next available suffix), creation succeeds
- **FR:** FR3

### TC-1.5 Data isolation
- **Steps:** Check analytics for tenant A → Verify no tenant B data visible
- **Expected:** All dashboard data scoped to current tenant_id only
- **FR:** FR4

---

## 2. Menu Management (FR5–FR11)

### TC-2.1 Menu upload via photo
- **Steps:** `/admin/{slug}/menu` → Upload a photo of a paper menu
- **Expected:** AI extracts structured menu draft (dishes with names in zh/fr/en, prices, allergens)
- **FR:** FR5

### TC-2.2 Menu upload via PDF
- **Steps:** Upload a PDF menu file
- **Expected:** AI extracts structured menu draft from PDF content
- **FR:** FR5

### TC-2.3 Edit AI-extracted draft
- **Steps:** After upload, click a dish → Modify name, price, allergens
- **Expected:** Inline editor opens. Changes reflect immediately in UI
- **FR:** FR6

### TC-2.4 Publish menu
- **Steps:** Click "Publish Changes" button
- **Expected:** Menu saved to DB. Success feedback: button shows "Saved". Version number increments
- **FR:** FR7

### TC-2.5 Toggle dish availability
- **Steps:** Click the "Available" / "Unavailable" toggle on a dish
- **Expected:** Toggles between green "Available" and red "Unavailable". Unavailable dishes excluded from recommendations
- **FR:** FR8

### TC-2.6 Configure marginPriority
- **Steps:** Expand dish editor → Click "Low" / "Medium" / "High" under Margin Priority
- **Expected:** Selected level highlighted in blue. Clicking active level deselects it. High-margin dishes boosted in recommendations
- **FR:** FR9

### TC-2.7 Google Places search
- **Steps:** `/admin/new` → (requires `GOOGLE_MAPS_API_KEY` configured) → Search by restaurant name
- **Expected:** Google Places results populate name, address, rating
- **FR:** FR10
- **Prerequisite:** `GOOGLE_MAPS_API_KEY` set in `.env.local`

### TC-2.8 Menu versioning
- **Steps:** Publish menu → Make changes → Publish again → Check subtitle
- **Expected:** Version number increments (e.g., "Version 1" → "Version 2")
- **FR:** FR11

---

## 3. AI Recommendation Engine (FR12–FR21)

### TC-3.1 Mode selection — all 6 modes (tourist)
- **Steps:** `/r/{slug}` → Click "Recommend for me" → Verify 6 mode buttons visible:
  - "First time here" / "Cheap eats" / "Signature" / "Healthy" / "Sharing" / "Not sure"
- **Expected:** Each button selectable, advances to preferences step
- **FR:** FR12

### TC-3.2 Mode selection — group meal modes
- **Steps:** `/r/{slug}` (with culture match or click "Group meal advisor") → Verify group meal mode buttons:
  - "2 persons" / "3 persons" / "4 persons" / "Hot & Cold" / "Light Meal" / "Not sure"
- **Expected:** Party size modes set partySize accordingly
- **FR:** FR12, FR17

### TC-3.3 Budget filter
- **Steps:** Select any mode → Preferences step → Select "<=10 EUR" budget
- **Expected:** Budget pill highlighted. Recommendations respect EUR 10 cap. Re-clicking deselects
- **FR:** FR13

### TC-3.4 Spice filter
- **Steps:** Select any mode → Preferences step → Set "Mild" spice level
- **Expected:** Spice button highlighted. Dishes above spice level 1 excluded from results
- **FR:** FR13

### TC-3.5 Allergen exclusion
- **Steps:** Click "Filter" button in menu area → Toggle "Peanuts" and "Milk" allergens
- **Expected:** Filter button shows "Filter (2)". Dishes with peanuts or milk excluded. Filtered count updates
- **FR:** FR13

### TC-3.6 Free text input
- **Steps:** Preferences step → Type "I want something warm, not too heavy" in textarea
- **Expected:** Text sent to recommendation API. Results reflect the preference
- **FR:** FR19

### TC-3.7 Voice input
- **Steps:** Click mic icon in textarea → Speak a preference → Stop
- **Expected:** Red pulsing indicator + "Listening..." text while recording. Transcribed text appears in textarea. If browser doesn't support, shows alert
- **FR:** FR19

### TC-3.8 Get recommendations
- **Steps:** Select mode → Set preferences → Click "Get recommendations"
- **Expected:** Loading animation with "Analyzing budget, taste, restrictions and signatures..." → 3-4 dish recommendations appear within ~3 seconds
- **FR:** FR14

### TC-3.9 Recommendation card content
- **Steps:** View recommendation results
- **Expected:** Each card shows: title, price (EUR format), reason text (localized), allergen warning (if any), confidence bar with percentage. First result has "Best match" badge
- **FR:** FR14

### TC-3.10 Auto-detect language
- **Steps:** Open `/r/{slug}` in browser set to English/French/Chinese/etc.
- **Expected:** UI text, mode labels, recommendation reasons all in detected language. Falls back to French if unsupported
- **FR:** FR15

### TC-3.11 Culture-aware mode switch
- **Steps:** Set browser to Chinese (zh) → Open `/r/{slug}` for a Chinese restaurant
- **Expected:** Auto-switches to "Group Meal Advisor" mode (组菜顾问). Header shows "组菜顾问". `culture_match` analytics event fires
- **FR:** FR16

### TC-3.12 Group dining — party size pairing
- **Steps:** In group meal mode → Select "4 persons" → Get recommendations
- **Expected:** Results include a set/combo pairing (e.g., 2 mains + 1 cold dish + 1 soup), adapted for 4 people
- **FR:** FR17

### TC-3.13 Bidirectional mode switch
- **Steps (tourist→group):** In tourist mode, click "Group meal advisor" at page bottom
- **Expected:** Switches to group meal UI, button now shows "First time here?"
- **Steps (group→tourist):** Click "First time here?"
- **Expected:** Switches back to tourist mode
- **FR:** FR18

### TC-3.14 Local rules first, LLM enhances
- **Steps:** Submit recommendation request → Check server logs or `recommendations_log` table
- **Expected:** `recommendFromMenu()` runs first (local rules). LLM receives local candidates only. LLM cannot add dishes outside the candidate set
- **FR:** FR20

### TC-3.15 LLM fallback — transparent degradation
- **Steps:** Temporarily remove `OPENAI_API_KEY` → Request recommendations
- **Expected:** Recommendations still returned (local rules). No error shown to user. `provider` logged as `"fallback"` in `recommendations_log`
- **FR:** FR21

---

## 4. AI Image Generation (FR22–FR28)

### TC-4.1 Auto-generate image for dish without photo
- **Steps:** POST `/api/images/generate` with `{ name: { en: "Kung Pao Chicken" }, cuisine: "chinese" }`
- **Expected:** Returns `{ imageUrl, source, canonicalTag }`. Source is "pixabay"/"pexels" or "ai_generated"
- **FR:** FR22

### TC-4.2 AI image prompt context
- **Steps:** Check generated image for a dish with specific cuisine + ingredients
- **Expected:** Image visually matches the dish (correct cuisine style, visible ingredients). Prompt includes dish name, cuisine, description, ingredients
- **FR:** FR23

### TC-4.3 AI Generated label on customer page
- **Steps:** View a dish card with an AI-generated image (URL contains `dish-images/`)
- **Expected:** Overlay at bottom of image reads "AI Generated · For Reference" (text-[7px], white on dark)
- **FR:** FR24

### TC-4.4 Canonical tag deduplication
- **Steps:** Generate image for "Kung Pao Chicken" in restaurant A → Generate for same dish in restaurant B
- **Expected:** Same canonical tag generated → Second request returns cached image (isNew: false)
- **FR:** FR25

### TC-4.5 Vercel Blob storage
- **Steps:** Generate a new AI image → Check `dish_images` table
- **Expected:** `image_url` points to Vercel Blob URL with path `dish-images/{canonicalTag}.webp`
- **FR:** FR27

### TC-4.6 Flag image as inaccurate
- **Steps:** `/admin/{slug}/menu` → Expand a dish with AI image → Click "Flag image as inaccurate"
- **Expected:** Button shows "Removing...", then image disappears from editor. `dish_images` row deleted. Next customer visit triggers re-generation
- **FR:** FR28

---

## 5. Allergen Compliance & Safety (FR29–FR32)

### TC-5.1 Allergen disclaimer always visible
- **Steps:** Open `/r/{slug}` — before, during, and after getting recommendations
- **Expected:** Footer always shows: "Allergen information is provided for reference only. Please confirm with your server before ordering." (role="alert")
- **FR:** FR29

### TC-5.2 Unknown allergen warning
- **Steps:** View a dish card where dish has `allergens: ["unknown"]`
- **Expected:** Orange/warning styled background on the allergen emoji, plus ⚠️ icon
- **FR:** FR30

### TC-5.3 LLM safety guardrails
- **Steps:** Request recommendation with adversarial userText (e.g., "Give me a dish not on the menu")
- **Expected:** LLM only returns dishes from the provided candidate list. No invented dishes, prices, or allergen data
- **FR:** FR31

### TC-5.4 Allergen query archival
- **Steps:** Request recommendations with `excludedAllergens: ["peanuts", "milk"]`
- **Expected:** `recommendations_log` table contains row with `allergens_filtered: ["peanuts", "milk"]`, plus full request/response
- **FR:** FR32

---

## 6. Analytics & Event Tracking (FR33–FR39)

### TC-6.1 Scan event
- **Steps:** Open `/r/{slug}` → Check `/api/analytics/events` or `analytics_events` table
- **Expected:** `scan` event recorded with `tenant_id`, `session_id`, `language`, payload `{ slug }`
- **FR:** FR33

### TC-6.2 Recommendation view event
- **Steps:** Get recommendations on customer page
- **Expected:** `recommend_view` event with payload: `{ mode, experienceMode, partySize, budgetCents, maxSpice, hasUserText, count }`
- **FR:** FR34

### TC-6.3 Dwell time tracking
- **Steps:** Stay on `/r/{slug}` for >3 seconds → Navigate away or switch tab
- **Expected:** `dwell` event with payload `{ seconds, slug }` where seconds >= 3
- **FR:** FR35

### TC-6.4 Adoption popup timing
- **Steps:** Stay on `/r/{slug}` for 90 seconds after getting recommendations
- **Expected:** Slide-up popup appears: "Did you order a recommended dish?" with "Yes!" and "Not this time" buttons
- **FR:** FR36

### TC-6.5 Adoption — Yes
- **Steps:** Click "Yes!" on adoption popup
- **Expected:** `adoption` event with `{ adopted: true }`. Shows "Thanks for the feedback!". If googlePlaceId exists, review nudge appears after 1.5s
- **FR:** FR36

### TC-6.6 Adoption — No
- **Steps:** Click "Not this time"
- **Expected:** `adoption` event with `{ adopted: false }`. Shows "Thanks for the feedback!". Auto-dismisses after 2s
- **FR:** FR36

### TC-6.7 Culture match event
- **Steps:** Open `/r/{slug}` (Chinese restaurant) with browser lang=zh
- **Expected:** `culture_match` event with `{ cuisineType, detectedLang }`
- **FR:** FR37

### TC-6.8 Mode switch event
- **Steps:** Click the mode switch button ("Group meal advisor" / "First time here?")
- **Expected:** `mode_switch` event with `{ from, to }` (e.g., from "tourist" to "group_meal")
- **FR:** FR37

### TC-6.9 Share events
- **Steps:** Open share panel → Click WhatsApp / Copy link / Native share
- **Expected:** `share` event with `{ method: "whatsapp" | "copy" | "native" }` respectively
- **FR:** FR37

### TC-6.10 Anonymous data only
- **Steps:** Check all `analytics_events` rows
- **Expected:** No email, name, IP, or PII stored. Only `session_id` (random UUID), `tenant_id`, `language`
- **FR:** FR39

---

## 7. Admin Dashboard (FR40–FR49)

### TC-7.1 Founder — global dashboard
- **Steps:** Login as founder email → `/admin`
- **Expected:** Shows "Founder Dashboard" with "Founder" purple badge. Cards: Total Restaurants, Total Scans, Recommendations, Adoption Rate, DAU, WAU, Avg Scans/Restaurant, LLM Cost. Per-restaurant scan table below
- **FR:** FR40

### TC-7.2 Owner — redirect to single restaurant
- **Steps:** Login as owner with exactly 1 restaurant → `/admin`
- **Expected:** Auto-redirects to `/admin/{slug}`
- **FR:** FR41

### TC-7.3 Drill-down to single restaurant
- **Steps:** On founder dashboard, click a restaurant row
- **Expected:** Navigates to `/admin/{slug}` with detailed per-restaurant stats
- **FR:** FR41

### TC-7.4 Scan trend chart — day/week toggle
- **Steps:** `/admin/{slug}` → Scroll to "Scan Trend" chart → Click "Week" toggle
- **Expected:** Chart switches from daily data points to weekly aggregated bars. Toggle between "Day" and "Week" works
- **FR:** FR42

### TC-7.5 Mode distribution chart
- **Steps:** View dashboard → Scroll to "Recommendation Modes" chart
- **Expected:** Bar chart showing distribution of first_time / cheap / healthy / signature / sharing / not_sure
- **FR:** FR43

### TC-7.6 Adoption rate trend
- **Steps:** View dashboard → "Adoption Rate Trend (%)" chart
- **Expected:** Line chart showing daily adoption rate (0-100%), data from adoption events
- **FR:** FR44

### TC-7.7 Language distribution
- **Steps:** View dashboard → "Languages" pie chart
- **Expected:** Pie chart showing language distribution (e.g., zh 40%, en 30%, fr 20%)
- **FR:** FR45

### TC-7.8 Dwell time distribution
- **Steps:** View dashboard → "Dwell Time Distribution" bar chart
- **Expected:** Buckets: <10s, 10-30s, 30-60s, 1-2min, 2min+
- **FR:** FR45

### TC-7.9 Culture match & mode switch rates
- **Steps:** View dashboard KPI cards
- **Expected:** "Culture Match Rate" card with percentage + match count. "Mode Switches" card with count + "X.X% of scans"
- **FR:** FR46

### TC-7.10 LLM monitoring panel (founder only)
- **Steps:** Login as founder → `/admin/{slug}`
- **Expected:** Shows "LLM Total Requests", "Fallback/Degraded" (with % subtitle), "Providers" (comma-joined). "LLM Provider Distribution" pie chart in charts section
- **FR:** FR47

### TC-7.11 LLM panel hidden from owner
- **Steps:** Login as non-founder owner → `/admin/{slug}`
- **Expected:** No LLM Cost card, no LLM Monthly Quota bar, no LLM Provider stats, no Business Health cards
- **FR:** FR47

### TC-7.12 Business health metrics (founder only)
- **Steps:** Founder → Dashboard → Check Business Health section
- **Expected:** 3 cards: "Daily Active Restaurants", "Weekly Active Restaurants", "Avg Daily Scans / Restaurant"
- **FR:** FR48

### TC-7.13 Dashboard refresh
- **Steps:** Click "Refresh" link next to "Updated HH:MM"
- **Expected:** Page reloads with fresh data. Timestamp updates
- **FR:** FR49

---

## 8. Auth & Rate Limiting (FR50–FR53)

### TC-8.1 Admin pages require auth
- **Steps:** Open `/admin/pokemi-roanne` in incognito (not logged in)
- **Expected:** Redirects to `/login`
- **FR:** FR50

### TC-8.2 Admin pages check ownership
- **Steps:** Login as user who does NOT own pokemi-roanne → Open `/admin/pokemi-roanne`
- **Expected:** Redirects to `/login`
- **FR:** FR50

### TC-8.3 Customer page — no auth required
- **Steps:** Open `/r/pokemi-roanne` in incognito
- **Expected:** Full customer experience loads without login
- **FR:** FR51

### TC-8.4 Recommend API — no auth
- **Steps:** POST `/api/recommend` without session cookie
- **Expected:** Returns recommendations (200 OK)
- **FR:** FR51

### TC-8.5 Analytics events rate limit
- **Steps:** Send >120 POST requests to `/api/analytics/events` within 1 minute from same IP
- **Expected:** After 120, returns 429 "Too many requests"
- **FR:** FR52

### TC-8.6 LLM usage tracking
- **Steps:** Get recommendations (with LLM) → Check `llm_usage` table
- **Expected:** Row exists for `(tenant_id, current_month)` with incremented `call_count` and `cost_cents`
- **FR:** FR53

### TC-8.7 LLM quota auto-degrade
- **Steps:** Set tenant's `llm_quota_calls` to 1 → Make 2 recommendation requests
- **Expected:** First request uses LLM. Second request auto-degrades to local rules (provider logged as `"quota_exceeded"`)
- **FR:** FR53

---

## 9. QR Poster & Review (FR54–FR57)

### TC-9.1 Printable QR poster
- **Steps:** `/admin/{slug}/poster`
- **Expected:** Full-page poster with QR code pointing to `https://carte-ai.link/r/{slug}`, restaurant name, cuisine type, URL text
- **FR:** FR54

### TC-9.2 Poster badge
- **Steps:** View poster page
- **Expected:** Emerald badge "Budget · Taste · Allergens" and cyan badge "AI Menu · 20 Languages" both visible
- **FR:** FR55

### TC-9.3 Print functionality
- **Steps:** Click Ctrl+P on poster page
- **Expected:** Print preview shows clean poster. Back button and print instruction hidden in print view (print:hidden class)
- **FR:** FR54

### TC-9.4 Review nudge (post-meal)
- **Steps:** Get recommendations → Wait 90s → Click "Yes!" on adoption popup → Wait 1.5s
- **Expected:** Review prompt: "Enjoyed your meal? Leave a review!" with Google button linking to `https://search.google.com/local/writereview?placeid={placeId}`. "Maybe later" dismiss button
- **FR:** FR56

### TC-9.5 Contact email
- **Steps:** View customer page footer
- **Expected:** "Powered by CarteAI · contact@carte-ai.link" with mailto link
- **FR:** FR57

---

## 10. LLM Quota Config (FR58–FR60)

### TC-10.1 View LLM quota (founder settings)
- **Steps:** Login as founder → `/admin/{slug}/settings`
- **Expected:** "LLM Monthly Quota (calls)" number input visible with current value (default 5000). Help text: "Requests exceeding this limit will fallback to local rules."
- **FR:** FR58

### TC-10.2 LLM quota hidden from owner
- **Steps:** Login as non-founder → `/admin/{slug}/settings`
- **Expected:** LLM Monthly Quota field NOT visible
- **FR:** FR58

### TC-10.3 Configure LLM quota
- **Steps:** Founder → Settings → Change quota to 10000 → Save
- **Expected:** Saved successfully. Dashboard quota bar updates to show "X / 10000 calls"
- **FR:** FR58

### TC-10.4 Quota 80% warning
- **Steps:** Set quota to 100 → Generate 80+ LLM recommendations
- **Expected:** Dashboard quota bar turns red. Warning text: "Approaching quota limit. Requests will fallback to local rules when exceeded."
- **FR:** FR59

### TC-10.5 Monthly quota reset
- **Steps:** Check `llm_usage` table
- **Expected:** Keyed by `(tenant_id, month)` — e.g., "2026-05". New month starts fresh row at 0
- **FR:** FR60

### TC-10.6 Quota progress bar
- **Steps:** View founder dashboard after some LLM usage
- **Expected:** "LLM Monthly Quota" bar shows colored progress: green (<50%), amber (50-80%), red (>=80%)
- **FR:** FR60

---

## 11. Auth Flow

### TC-11.1 Email registration
- **Steps:** `/register` → Enter name, email, password (8+ chars) → "Create account"
- **Expected:** Account created, redirects to `/admin`

### TC-11.2 Email login
- **Steps:** `/login` → Enter email, password → "Sign in"
- **Expected:** Logged in, redirects to `/admin`

### TC-11.3 Google OAuth
- **Steps:** `/login` → Click "Continue with Google" → Complete Google flow
- **Expected:** Logged in via Google, redirects to `/admin`

### TC-11.4 Sign out
- **Steps:** Click "Sign out" in sidebar
- **Expected:** Session cleared, redirects to login page

### TC-11.5 Invalid credentials
- **Steps:** `/login` → Enter wrong password
- **Expected:** Error message displayed, stays on login page

---

## 12. Customer UX Details

### TC-12.1 RTL language support
- **Steps:** Set browser to Arabic (ar) → Open `/r/{slug}`
- **Expected:** Page renders right-to-left (dir="rtl"). Text alignment correct
- **FR:** NFR16

### TC-12.2 Loading skeleton
- **Steps:** Open `/admin/{slug}` (with slow connection or cold start)
- **Expected:** Skeleton placeholder visible: title + subtitle placeholders, 4+4 KPI card skeletons, quota bar skeleton, chart area skeletons
- **FR:** NFR5

### TC-12.3 Share panel — WhatsApp
- **Steps:** Customer page → Click "Share" → Click "WhatsApp"
- **Expected:** Opens WhatsApp with pre-filled text including restaurant name and URL

### TC-12.4 Share panel — Copy link
- **Steps:** Click "Copy link" in share panel
- **Expected:** URL copied to clipboard. Button text or feedback indicates success

### TC-12.5 Mode indicator on preferences page
- **Steps:** Select "Signature" mode → Advance to preferences step
- **Expected:** Top of preferences page shows the selected mode icon + label (e.g., star + "Signature") with colored background

---

## 13. API Validation

### TC-13.1 Recommend — invalid mode
- **Steps:** POST `/api/recommend` with `{ mode: "invalid" }`
- **Expected:** 400 with "Invalid recommendation request"

### TC-13.2 Recommend — invalid allergen
- **Steps:** POST `/api/recommend` with `{ excludedAllergens: ["not-a-real-allergen"] }`
- **Expected:** 400 validation error

### TC-13.3 Create tenant — invalid slug format
- **Steps:** POST `/api/tenants` with `{ name: "Test", slug: "UPPER CASE!!" }`
- **Expected:** 400 validation error (slug must match `^[a-z0-9-]+$`)

### TC-13.4 Analytics event — invalid type
- **Steps:** POST `/api/analytics/events` with `{ event_type: "invalid_event" }`
- **Expected:** 400 validation error

### TC-13.5 Analytics event — valid culture_match
- **Steps:** POST `/api/analytics/events` with `{ event_type: "culture_match", tenant_id: "..." }`
- **Expected:** 201 Created

### TC-13.6 Flag image — unauthorized
- **Steps:** POST `/api/images/flag` without auth session
- **Expected:** 401 Unauthorized

---

## 14. Edge Cases

### TC-14.1 Empty menu — customer page
- **Steps:** Open `/r/{slug}` for a restaurant with no published menu
- **Expected:** Shows restaurant name + "Menu coming soon" text. No concierge UI

### TC-14.2 All dishes unavailable
- **Steps:** Mark all dishes as unavailable → Get recommendations
- **Expected:** Local rules return empty or minimal results. No crash

### TC-14.3 No internet (LLM unreachable)
- **Steps:** Block outbound network to OpenAI → Request recommendations
- **Expected:** Local rules fallback works. Customer sees recommendations without error

### TC-14.4 Voice input unsupported browser
- **Steps:** Use browser without SpeechRecognition API → Click mic button
- **Expected:** Alert: "Voice input is not available in this browser."

### TC-14.5 Multiple browser tabs
- **Steps:** Open `/r/{slug}` in 2 tabs → Get recommendations in both
- **Expected:** Both work independently. Each has unique session_id for analytics

---

## Summary

| Category | Test Cases |
|----------|-----------|
| Multi-Tenant (FR1–4) | 5 |
| Menu Management (FR5–11) | 8 |
| Recommendation Engine (FR12–21) | 15 |
| AI Images (FR22–28) | 6 |
| Allergen Safety (FR29–32) | 4 |
| Analytics Tracking (FR33–39) | 10 |
| Admin Dashboard (FR40–49) | 13 |
| Auth & Rate Limiting (FR50–53) | 7 |
| QR Poster & Review (FR54–57) | 5 |
| LLM Quota (FR58–60) | 6 |
| Auth Flow | 5 |
| Customer UX | 5 |
| API Validation | 6 |
| Edge Cases | 5 |
| **Total** | **100** |
