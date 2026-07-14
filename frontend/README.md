# EazyRents — Frontend

A React single-page app for the EazyRents vehicle rental platform. Renters browse by type, filter by city and price, book against a live availability calendar, extend or cancel trips; hosts manage their fleet, photos, blocked dates, and extension requests. Every feature runs against the [EazyRents backend](../backend) — there is no mock layer.

**Stack:** React 19 · Vite · react-router-dom v7 · react-day-picker v9 · date-fns · plain CSS (design-token system, no framework)

---

## Architecture rules

Four disciplines shape every file; they are the frontend mirror of the backend's layered architecture:

1. **Components never call `fetch`.** All network access lives in `src/api/` — one module per resource, all funneled through `client.js`. Swapping the transport (base URL, auth header, error shape) is a one-file change. `client.js` also converts every non-OK response into a typed `ApiError { status, message, details }` and broadcasts a global `auth:expired` event on any 401, so session death is handled once, for every current and future page.

2. **The URL is the source of truth for browse state.** Filters, type, and pagination live in `useSearchParams`, not component state. A filtered search is shareable, survives refresh, and the browser's Back button is free undo. The filter form is only a typing buffer that syncs from the URL.

3. **Three-state fetching everywhere.** Every data view renders exactly one of: loading (skeleton), error (panel with Retry), or data (with a real empty state). The `useApi` hook also ignores stale responses — if dependencies change mid-flight, an out-of-order resolution can't overwrite newer data.

4. **Frontend checks are UX; the backend enforces security.** Role-based navigation, `ProtectedRoute`, and the sanitized `?role=` registration param improve the experience, but every request re-proves identity via the signed JWT. Editing `localStorage` gets you a different menu and a wall of 403s.

## Structure

```
src/
├── main.jsx                 # providers: Auth, Confirm; global day-picker CSS
├── App.jsx                  # routes, ErrorBoundary, role-protected groups
├── index.css                # entire design system (tokens → components)
├── api/                     # client.js + auth/vehicles/bookings/host modules
├── auth/                    # AuthContext (login/register/logout, session expiry),
│                            # ProtectedRoute (redirect-back + 403 view)
├── components/
│   ├── Layout.jsx           # header, role-aware nav, hamburger menu, footer
│   ├── VehicleArt.jsx       # flat SVG illustration set (all vehicle types + road motif)
│   ├── ConfirmDialog.jsx    # themed replacement for window.confirm (useConfirm hook)
│   ├── VehicleCard, FilterBar, Skeleton, ErrorBoundary
│   └── host/                # VehicleForm (create/edit), PhotoManager
├── pages/                   # Home, VehicleTypes, Vehicles, VehicleDetails,
│   │                        # Login, Register, MyBookings, NotFound
│   └── host/                # HostDashboard, HostBookings, HostExtensions, VehicleBlocks
├── hooks/                   # useApi (three-state + stale-response guard), usePageTitle
├── lib/                     # availability.js (calendar matchers, UTC helpers), authRedirect.js
└── utils/                   # imageUrl.js (photoUrl — relative upload URLs → absolute)
```

## Booking correctness in the UI

The backend guarantees no double-booking with a PostgreSQL exclusion constraint; the frontend is built to surface that guarantee gracefully:

- **Idempotent booking submission.** Each booking attempt generates one `Idempotency-Key` (a `useRef` UUID). Double-clicks and retries replay the same booking instead of creating duplicates; a rejected attempt regenerates the key ("a new attempt next time").
- **Graceful conflict handling.** A `409` from a race ("someone just booked these dates") shows the server's message, refetches `unavailable_dates`, and clears the selection — the calendar visibly updates with the loss.
- **One date convention, respected end to end.** API ranges are half-open `[start, end)`. The calendar subtracts one day from each exclusive end when disabling dates (checkout day = next check-in day), while displayed dates and the extension form show the checkout day as-is. Pricing follows the same convention: nights, not calendar days touched.
- **Calendars are locked to the future** (`startMonth`) and every instance shares one global theme.

## Design system

All styling flows from CSS custom properties in `:root` (`index.css`): a warm off-white ground, orange brand accents, green action color, deep teal display headings (Playfair Display) over Nunito Sans body. Rebranding or dark mode is a token-block change.

- **Buttons** are utility classes (`btn btn--primary/secondary/ghost/danger`, size modifiers) applied explicitly in markup — no context-selector guessing.
- **`VehicleArt`** provides flat, cartoonish SVG illustrations (car, van, suv, motorbike, scooter, tuktuk, and a dashed "journey road" motif) drawn from theme tokens, reused across type cards, photo placeholders, the hero, auth pages, and the 404.
- **`ConfirmDialog`** replaces the unstylable `window.confirm`: handlers `await confirm(message, { confirmLabel })`; Escape/backdrop mean "no"; focus starts on the safe option.
- **MyBookings hierarchy:** active rentals render large in a left column, upcoming bookings scroll in a viewport-height right column, past/cancelled collapse into a compact archive.
- Responsive to 375px (hamburger dropdown nav, stacking columns), `prefers-reduced-motion` respected, visible keyboard focus throughout.
- The JSX↔CSS contract is auditable: every `className` in the codebase has a matching rule; the stylesheet contains no dead selectors.

## Running it

```bash
cp .env.example .env       # VITE_API_URL=http://localhost:3000
npm install
npm run dev                # http://localhost:5173
```

The backend must be running with `CORS_ORIGIN=http://localhost:5173`. Seed the backend (`npm run seed`) for demo data; give seeded vehicles descriptions and photos so the details page shows its full layout.

## Routes

| Path | Access | Page |
|---|---|---|
| `/` | public (hosts redirected to `/host`) | Hero + highlights |
| `/vehicles/types` | public | Browse by type (live facet counts) |
| `/vehicles?type=&city=&minPrice=&maxPrice=&page=` | public | Filterable, paginated grid |
| `/vehicles/:id` | public | Gallery, description, availability calendar, booking panel |
| `/login`, `/register`, `/register?role=host` | public | Auth (typed input survives role switch) |
| `/my-bookings` | renter | Tiered bookings, cancel, request extension |
| `/host` | host | Fleet with live status ("Rented by X until Y"), CRUD, photos |
| `/host/bookings` | host | Current & upcoming / past, renter contact |
| `/host/extensions` | host | Approve/reject inbox (nav badge shows pending count) |
| `/host/vehicles/:id/blocks` | host | Block calendar + block list |
| `*` | public | 404 |

## Known limitations (deliberate, documented)

- **Tokens in `localStorage`** — pragmatic for this scope; readable by JS, so an XSS hole could steal them. Upgrade path: httpOnly refresh-token cookies (backend roadmap).
- **"Extension requested" badge is session-local** — `/bookings/mine` doesn't yet expose pending extension requests, so the badge doesn't survive a refresh. Backend TODO noted in code.
- **Active bookings on a removed vehicle** can link to a 404 details page until the rental completes (cancelled/completed bookings already render as plain text).
- The host nav's pending-extension count duplicates the inbox fetch — candidate for a shared context or count endpoint.