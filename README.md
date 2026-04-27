[AURA_README.md](https://github.com/user-attachments/files/27114857/AURA_README.md)
# Aura — Geospatial Social Discovery Platform

> A live social radar for cities.

**Aura** is a real-time location-based platform where users broadcast signals — spontaneous meetups and structured events — pinned to their real-world coordinates and visible on an interactive map. Signals appear instantly for nearby users, expire automatically, and disappear from the map without a page refresh. No algorithm, no feed curation — just what's happening near you, right now.

🔗 **Live:** [aura-web-e50.pages.dev](https://aura-web-e50.pages.dev)

---

## The Concept

Most social apps show you what people posted. Aura shows you what people are doing — and where. A user broadcasts a Moment ("anyone want to play football at Galle Face?") or an Event ("rooftop session, Friday 9pm, 20 people max"). It appears as a live pin on the map for everyone within radius. Join, chat, show up. When the time expires, it's gone.

The platform is built around ephemerality by design. Signals have a TTL. The map is a live snapshot of right now, not an archive.

---

## Signal Types

**Moments** — Spontaneous, short-lived broadcasts. Default 6-hour TTL. For impromptu meetups, open invites, or anything happening today.

**Events** — Structured gatherings with start/end times, venue, dress code, age filters, and capacity limits. For planned get-togethers that need more context.

Both types are pinned to real GPS coordinates, visible on the interactive map, and removed automatically when they expire.

---

## Architecture

### Geospatial Layer — PostGIS + Supabase RPC

Location data is stored as native PostGIS `geography(POINT, 4326)` — not as separate lat/lng columns. This enables true spherical distance calculations and allows the database to do all spatial filtering, rather than pulling rows and filtering in application code.

```sql
-- moments table
location geography(POINT, 4326) not null

-- GiST spatial index for fast radius queries
create index moments_location_idx on public.moments using gist(location);
```

Nearby queries run through a custom `nearby_moments` RPC that calculates distance server-side and returns pre-sorted results with distance_meters included. The frontend never does spatial math.

```sql
-- 003_get_moments_map.sql
CREATE OR REPLACE FUNCTION get_moments_map()
RETURNS TABLE (
  id uuid, title text, moment_type text,
  lat double precision, lng double precision,
  expires_at timestamptz, participant_count bigint, creator jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id, m.title, m.moment_type,
    ST_Y(m.location::geometry) as lat,
    ST_X(m.location::geometry) as lng,
    m.expires_at,
    (SELECT count(*) FROM participants p WHERE p.moment_id = m.id AND p.status = 'joined'),
    jsonb_build_object('id', prof.id, 'username', prof.username, 'avatar_url', prof.avatar_url)
  FROM moments m
  LEFT JOIN profiles prof ON m.creator_id = prof.id
  WHERE m.expires_at > now()
  ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Radius options range from 5KM to Global (value `0` bypasses distance filtering entirely for a worldwide view).

### Real-Time Signal Updates — Supabase Realtime

The map updates without page refresh. When any user anywhere creates, updates, or expires a Moment, every connected client's map reflects it within seconds via Supabase Realtime's `postgres_changes` subscription.

The `useRealtimeMoments` hook uses a **stable ref pattern** to prevent the common React pitfall of re-subscribing on every render:

```typescript
export function useRealtimeMoments(onInsert, onDelete) {
  const onInsertRef = useRef(onInsert)
  const onDeleteRef = useRef(onDelete)

  // Refs updated each render, but subscription created only once
  useEffect(() => { onInsertRef.current = onInsert }, [onInsert])
  useEffect(() => { onDeleteRef.current = onDelete }, [onDelete])

  useEffect(() => {
    // Unique channel name prevents collisions across component instances
    const channelName = `realtime:moments:${Math.random().toString(36).slice(2)}`
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moments' }, ...)
      .on('postgres_changes', { event: 'UPDATE', ... }, payload => {
        // If moment became inactive, treat as delete — keeps map state clean
        payload.new.is_active === false
          ? onDeleteRef.current?.(payload.new.id)
          : onInsertRef.current(payload.new)
      })
      .on('postgres_changes', { event: 'DELETE', ... }, ...)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, []) // Subscribe once per mount — refs handle handler changes
}
```

### Coordinate Deduplication

The `useNearbyMoments` hook rounds coordinates to 4 decimal places (~11 metre precision) before triggering a fetch. This prevents GPS jitter from causing redundant re-fetches as the user's location drifts slightly:

```typescript
const lat = Math.round(location.latitude * 10000) / 10000
const lng = Math.round(location.longitude * 10000) / 10000
```

A `lastFetchRef` further deduplicates by caching the last fetched `lat,lng,radius` combination and skipping identical requests.

### Automatic Expiry — Supabase Edge Function

A Supabase Edge Function (`expire-moments`) runs on a schedule and sets `is_active = false` on any moment whose `expires_at` has passed. The Realtime subscription on the client treats these `UPDATE` events as deletes, so expired signals vanish from the map automatically — no client-side polling, no stale pins.

```typescript
// supabase/functions/expire-moments/index.ts
const { data } = await supabase
  .from('moments')
  .update({ is_active: false })
  .lt('expires_at', new Date().toISOString())
  .eq('is_active', true)
  .select('id, title')
```

### Row Level Security

All tables have RLS enabled with policies that enforce:
- Moments are only visible to authenticated users when `is_active = true AND expires_at > now()`
- Participants can only see other participants of moments they've joined
- Chat messages are scoped to moment participants
- Users can only modify their own data

Six sequential migrations track schema evolution from initial setup through RLS fixes, RPC additions, and image URL support.

---

## Features

**Map**
- Interactive MapLibre GL map with live signal pins
- Two pin types: Moment and Event (distinct visual treatment)
- Real-time pin appearance/disappearance — no refresh needed
- Radius filter: 5KM / 10KM / 25KM / 50KM / 100KM / Global

**Signals**
- Create Moments (spontaneous, 6hr TTL) or Events (structured, custom time)
- Event metadata: venue, dress code, age range, capacity limit, privacy toggle, image
- Join / Leave with participant count tracking
- Per-signal chat room for participants

**Discovery**
- Signals feed filtered by user radius
- Search by title, tags, or location
- Today view — signals happening today
- Events page — structured events only

**Social**
- Follow / unfollow users
- Public profiles with signal history
- Following feed — signals from people you follow

**UX**
- Full onboarding flow with interest selection
- Page transition animations (Motion.js)
- Toast notification system
- Dark luxury UI, mobile-first down to 375px with safe area insets
- Custom Tailwind design system

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Motion.js |
| Routing | React Router v7 |
| Map | MapLibre GL |
| Database | Supabase — PostgreSQL + **PostGIS**, Realtime, RLS |
| Geospatial | PostGIS `geography(POINT, 4326)`, GiST index, custom RPCs |
| Edge Functions | Supabase Edge Functions (Deno) — moment expiry |
| Auth | Supabase Auth |
| Deployment | Cloudflare Pages |

---

## Database Schema

```
profiles          — user identity, interests, avatar
moments           — location geography(POINT,4326), TTL, type, tags, capacity
participants      — join/leave status per moment per user
chat_messages     — moment-scoped real-time chat
follows           — follower/following relationships
```

**Indexes:**
- `moments_location_idx` — GiST spatial index on `location`
- `moments_expires_at_idx` — for efficient expiry queries
- `moments_is_active_idx` — for active-only filtering
- `participants_moment_id_idx`, `participants_user_id_idx`

---

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project with PostGIS extension enabled

### Installation

```bash
git clone https://github.com/skpthiran/aura
cd aura
npm install
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup

Run the migrations in order in the Supabase SQL editor:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_fix_rls_history_signals.sql
supabase/migrations/003_get_moments_map.sql
supabase/migrations/004_fix_nearby_radius.sql
supabase/migrations/005_nearby_moments_image_url.sql
supabase/migrations/006_add_image_url_column.sql
```

PostGIS must be enabled in your Supabase project before running migrations.

### Running Locally

```bash
npm run dev
```

### Deploy Edge Function

```bash
supabase functions deploy expire-moments
```

---

## Project Structure

```
aura/
├── src/
│   ├── pages/
│   │   ├── MapPage.tsx           # Interactive MapLibre GL map
│   │   ├── SignalsPage.tsx        # Radius-filtered feed
│   │   ├── CreatePage.tsx         # Moment/Event creation
│   │   ├── EventsPage.tsx
│   │   ├── TodayPage.tsx
│   │   ├── ChatPage.tsx           # Per-signal chat
│   │   └── SearchPage.tsx
│   ├── hooks/
│   │   ├── useRealtimeMoments.ts  # Stable ref Realtime subscription
│   │   ├── useNearbyMoments.ts    # Deduped radius-aware fetching
│   │   ├── useNearbyEvents.ts
│   │   └── useUserLocation.ts
│   └── lib/
│       ├── db/moments.ts          # PostGIS RPC calls
│       ├── radius.ts              # Radius options + normalization
│       └── supabase.ts
└── supabase/
    ├── migrations/                # 6 sequential schema migrations
    └── functions/
        └── expire-moments/        # Auto-expiry Edge Function
            └── index.ts
```

---

## Built By

**Thiran Thathsara A. Wijesingha**
AI-Native Product Engineer · IIT (University of Westminster, UK)

[github.com/skpthiran](https://github.com/skpthiran) · [linkedin.com/in/skpthiran](https://linkedin.com/in/skpthiran)

---

*Built entirely independently. Original concept, architecture, and implementation — no templates, no team.*
