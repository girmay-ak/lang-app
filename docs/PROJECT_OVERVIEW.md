 # Language Exchange Platform – Project Overview

 ## 1. Executive Summary
 - **Goal**: Deliver a cross-platform (web + mobile) language exchange experience that matches travelers and locals, supports guided conversations, and enables community discovery.
 - **Current State**: Marketing landing page, authentication/onboarding flows, core in-app tabs (Map, Feed, Chats, Notifications, Profile), and Expo mobile shell are implemented with Supabase scaffolding.
 - **Immediate Needs**: Harden backend integrations, finalize data contracts, flesh out feature roadmap, and formalize delivery process (issues, releases, QA).

 ## 2. Product Scope & Personas
 - **Traveling Learner**: Actively seeking local practice partners while abroad; prioritizes quick matching and safety assurances.
 - **Local Host**: Offers language practice, cultural guidance; expects scheduling tools, availability controls, reputation tracking.
 - **Community Manager**: Curates micro-events and ensures moderated, high-quality engagement; needs analytics and content tooling.

 ### Core Use Cases
 1. Sign up with email/OAuth, complete onboarding, and verify email.
 2. Mark availability/location, browse map feed of nearby partners/events.
 3. Start or continue chats with translation prompts and streak tracking.
 4. Join curated communities or micro-events; receive notifications.
 5. Mirror core flows on mobile with offline-ready experience.

 ## 3. High-Level Architecture
 - **Frontend Web**: Next.js 15 (App Router) with client/server components, Tailwind + Radix UI, state via hooks, runtime Supabase client.
 - **Frontend Mobile**: Expo React Native, React Navigation tabs, shared design language via custom components, AsyncStorage for local state.
 - **Backend**: Supabase (Postgres + Row Level Security) for auth, data, and realtime; edge functions/scripts TBD for business logic.
 - **Integrations**:
   - Supabase Auth (email/password, magic link, OAuth).
   - Supabase Realtime for chat and presence (to be wired).
   - Map providers (Mapbox/Google) via `MapView` and mobile equivalents.
   - Notifications via Supabase functions or external service (planned).

 ### Data Domains (per `docs/DATABASE_SCHEMA.md`)
 - Users & Profiles (languages, availability, location)
 - Conversations & Messages (realtime chat)
 - Events/Communities (group activities, RSVPs)
 - Gamification (streaks, badges)
 - Notifications (in-app, push, email)

 ## 4. Component Overview
 - **Landing**: `app/landing/page.tsx` – marketing hero, features, CTA.
 - **Auth Suite**: `app/auth/*` – login, signup, password flows, callbacks.
 - **App Shell**: `app/app/page.tsx` orchestrates tab navigation, onboarding state, Supabase session handling.
 - **Views**: `MapView`, `FeedView`, `ChatsView`, `NotificationsView`, `ProfileView`, `NewExchangeView`, `SetFlagModal`.
 - **Services**: `lib/services/*` and `lib/supabase/*` encapsulate data access.
 - **Mobile**: `mobile/App.tsx` mirrors tabs with `CustomBottomTabBar`, `AvailabilityModal`, and `AuthNavigator`.

 ## 5. Delivery Plan

 ### 5.1 Workstreams
 1. **Authentication Hardening**
    - Implement Supabase policies (RLS) and error handling.
    - Complete profile completion flow for missing data.
    - Tests for auth transitions and pending confirmation state.
 2. **Map & Availability**
    - Wire map pins to Supabase data, geocoding, and availability toggle.
    - Implement `SetFlagModal` backend integration.
 3. **Chat Realtime**
    - Connect Supabase realtime subscriptions for conversations/messages.
    - Implement message composer, translations, presence indicators.
    - Add optimistic updates and offline caching (mobile).
 4. **Feed & Community**
    - Replace mock data with Supabase queries, filters, pagination.
    - Add event creation/join flows, moderation tools.
 5. **Notifications**
    - Build notification service, integrate with Supabase functions.
    - Implement push notification setup for mobile (Expo).
 6. **Gamification & Analytics**
    - Hook up streak tracking, badges, and analytics events per docs.
 7. **Operations**
    - Establish CI/CD, environment secrets, QA checklists, release cadence.

 ### 5.2 Milestones
 | Milestone | Target Outcomes | Dependencies |
 |-----------|-----------------|--------------|
 | M1 – Auth & Profile | Email/OAuth flows complete; onboarding stable; profile data persisted | Supabase tables/policies |
 | M2 – Map & Matching | Live availability map, search filters, match creation | Geolocation APIs, RLS |
 | M3 – Realtime Chat | Messaging UI with realtime updates, read receipts, translations | Supabase realtime, translation service |
 | M4 – Communities & Events | Feed backed by live data, community join/host flows | Content moderation policies |
 | M5 – Notifications & Gamification | Push/email notifications, streaks, badges | Expo push, CRON jobs |
 | M6 – Production Readiness | Full QA, performance tuning, observability, release playbook | CI/CD pipelines |

 ## 6. Backlog & Priorities
 - Create GitHub (or chosen) project board with swimlanes: Backlog, In Progress, Review, QA, Done.
 - Define Issue templates for feature, bug, tech debt.
 - Immediate tickets (suggested):
   1. Configure Supabase env vars locally and in Vercel/Expo.
   2. Implement Supabase Row-Level Security policies per `docs/SECURITY_PRIVACY_GUIDE.md`.
   3. Replace mock data in `FeedView` and `ChatsView` with live queries.
   4. Implement `MapService` integration with Supabase location endpoints.
   5. Add real-time listeners in `ChatsView` for new messages/unread counts.
   6. Port shared UI primitives to a design system document.
   7. Set up automated lint/test runs via GitHub Actions.

 ## 7. System Design Details
 - **Authentication**: Supabase handles session tokens stored in browser/mobile; app uses `createClient()` for requests. Middleware in `lib/supabase/middleware.ts` ensures SSR context (review for completeness).
 - **API Access Layer**: Services in `lib/services/*` abstract Supabase interactions; extend them for caching, error handling, and domain logic.
 - **State Management**: Primarily local `useState`/`useEffect`; consider introducing Zustand or React Query for shared caches (especially for chats/feed).
 - **Realtime Messaging**: Supabase channels should mirror `conversations` and `messages` tables; implement optimistic UI + event listeners for read receipts.
 - **Map & Geo**: `MapView` relies on `MapboxMap`; finalize data schema for `users` with geo-coordinates and availability windows.
 - **Notifications**: Use Supabase functions + Expo push tokens (stored per user) to send events; maintain notification settings table.
 - **Security & Privacy**: Enforce least privilege via policies; store minimal personal data; consider encryption for sensitive fields.

 ## 8. Testing & QA Strategy
 - **Unit/Component**: Use Vitest/RTL (web) and Jest (mobile) for critical components (auth forms, chat message list, map markers).
 - **Integration**: Supabase sandbox environment with seed data; end-to-end flows via Playwright and Detox.
 - **Manual QA**: Checklist per release covering auth paths, offline states, push notifications, map interactions, chat reliability.

 ## 9. Release & Operations
 - **Environments**: Local → Staging (Supabase project + Vercel preview + Expo dev build) → Production.
 - **CI/CD**: GitHub Actions triggered on PR/merge; run lint/test/build; deploy to Vercel/Expo EAS.
 - **Monitoring**: Integrate Sentry for error tracking, Supabase logs, and analytics dashboards for user behavior.

 ## 10. Next Steps
 1. Review and adapt backlog priorities with stakeholders.
 2. Stand up project board and ticket templates.
 3. Confirm Supabase schema alignment with product needs; run migrations.
 4. Schedule architecture review to agree on realtime strategy and mobile parity timeline.
 5. Begin Milestone M1 tasks; target completion before advancing to M2.


