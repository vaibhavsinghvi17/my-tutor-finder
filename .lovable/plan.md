# LearnLocal — Tuitions & Activities Marketplace (v1)

A two-sided platform where local tuition centers, coaches, and activity providers (yoga, music, dance, sports, art, coding, etc.) can list their services, and learners (adults or kids) can discover relevant classes in their city, matched to what they want to learn and when they're free.

## v1 Approach

- **No login required** to start. Anyone can browse and interact (data stored locally in the browser for now).
- A first-run screen asks: **"Are you a Service Provider or a Learner?"** — this just sets the starting view; both profiles can be created later.
- A **profile switcher** in the top bar lets the user toggle between Learner mode and Provider mode anytime.
- Auth and persistent backend can be added in a later iteration.

## Core Flows

### Provider side
1. Create a Provider profile: business name, bio, photo, categories (Academics / Music / Dance / Sports / Art / Coding / Yoga / Other), city + area.
2. Add one or more **Class Listings**, each with:
   - Title, description, age group (Kids / Teens / Adults / All)
   - Mode: **Online**, **Offline**, or **Both** (offline shows venue address)
   - Price (optional), trial available?
   - **Class timings**: weekly schedule grid (days × time slots)
3. View incoming **join requests** with Approve / Decline.

### Learner side
1. Create a Learner profile: name, city + area, interests (multi-select categories), preferred mode.
2. Add **free-time slots**: weekly availability grid.
3. Optionally add **Kid profiles** under the same account (name, age, interests, free times). Switch between "Browsing for myself" and "Browsing for [kid name]" via a dropdown.
4. **Discover** page shows ranked suggestions based on:
   - Same city/area
   - Matching interest categories
   - Mode preference
   - Class timings overlap with free-time slots
5. Open a listing → view details → **Request to Join** (pick a slot, add a note).
6. **My Requests** page shows pending / approved / declined status.

## Screens

```text
/                         Onboarding: "I am a Provider" | "I am a Learner"
/discover                 Learner home: filters + suggested classes
/listing/:id              Class details + Request to Join
/requests                 Learner's join requests
/profile/learner          Edit learner profile, free times, kid profiles
/provider                 Provider dashboard: listings + incoming requests
/provider/listing/new     Create / edit a class listing
/profile/provider         Edit provider profile
```

Top bar: logo, city selector, **mode switcher (Learner ↔ Provider)**, profile menu.

## Suggestion Logic

Score each listing for the active learner profile:
- +3 city/area match
- +2 interest category match
- +2 timing overlap with at least one free slot
- +1 mode preference match
- +1 age-group match (uses kid's age if browsing for a kid)

Sort descending; show top results on Discover with badges ("Near you", "Fits your schedule", "Great for kids").

## Data (client-side for v1)

Stored in `localStorage` via a small store, structured to map cleanly onto a database later:
- `learnerProfile`, `kidProfiles[]`, `providerProfile`
- `listings[]` (provider-owned)
- `requests[]` (learner ↔ listing)
- Seeded with 8–10 sample providers across categories so Discover isn't empty.

Cities/areas: a curated dropdown (editable list, starts with a handful of major cities and "Other").

## Design

- Clean, friendly, slightly playful (works for both adult learners and parents).
- Card-based listings with category icon, mode badge (Online/Offline/Both), age-group chip, and city.
- Weekly schedule grid component reused for provider timings and learner free-times.
- Mobile-first; responsive grid on desktop.
- Light theme by default, accessible color contrast.

## Out of scope for v1 (noted for later)

- Authentication, real backend persistence, multi-device sync
- Payments / paid bookings
- Messaging, reviews/ratings
- Map view, geolocation radius search
- Notifications / email
