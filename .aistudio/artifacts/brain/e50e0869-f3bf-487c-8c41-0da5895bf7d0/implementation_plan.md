# LCCN Digital Church App — Abuja Diocese (Phase 1)

A minimalist, accessible, mobile-first Progressive Web App (PWA) for the Lutheran Church of Christ in Nigeria (LCCN), launching for Abuja Diocese with a multi-diocese-ready data architecture, scoped administration portal, and a database-grounded Smart Assistant.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> All core platform and onboarding choices were aligned in clarification and are locked into this plan. During implementation, Firebase provisioning will require one interactive confirmation step to attach Firestore and Google Authentication to your project.

- **Confirmed — Cross-Platform Delivery**: Mobile-first React Progressive Web App (`standalone` display, offline-resilient caching, install prompt, and iOS Safari installation guidance) designed for thumb ergonomics on phones while expanding cleanly on tablets and desktops.
- **Confirmed — Authentication & Onboarding**: Google Sign-In via Firebase Authentication, followed immediately by a single-step church registration form (Full Name, Phone Number, Diocese, Division, optional District, and Church) with zero administrative approval delay.
- **Confirmed — Initial Directory Seed**: Pre-seeded Abuja Diocese hierarchy (including Abuja Division and Area 1 Church, plus sibling divisions/churches in Abuja) alongside realistic starter announcements and events so every screen works immediately.
- **Confirmed — Administration Access**: Dedicated administration interface reachable via a discreet link inside the Profile view (shown only to authorized administrators) and via a direct `/admin` route, keeping the 5-tab member navigation clean.

---

## 1. Overview & Core Concept

- **What It Does**: Connects LCCN members across Abuja Diocese to their local church profile, hierarchy-filtered announcements (Diocese, Division, Church), upcoming events, and an AI Smart Assistant grounded strictly in verified church records. Provides a separate, role-scoped Administration Portal for secretaries and administrators to publish announcements, schedule events, update parish details, view members in scope, and assign administrative roles.
- **Target Audience & Accessibility**: Designed for both younger members and elderly congregants, including users with limited smartphone experience. Large tap targets (44px+), high-contrast typography, plain-language labels, and zero cluttered analytics ensure effortless navigation.
- **Key Value**: One trustworthy, fast-loading church companion that eliminates missed announcements, unifies Diocese-to-Parish communication, and keeps the architecture cleanly partitioned by `dioceseId` so additional LCCN dioceses, Hausa localization, sermons, livestreams, and giving can be added in future phases without rebuilding.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **First Launch & Registration**:
   - Unauthenticated visitors see a calm, welcoming LCCN Abuja Diocese sign-in screen with a single primary **Continue with Google** action and an optional PWA **Install App** prompt.
   - First-time members are guided into a streamlined Church Selection form: Full Name, Phone Number, Diocese (pre-selected to *Abuja Diocese* for Phase 1), Division, District (shown if the division has districts), and Church (e.g., *Area 1 Church*). Submitting takes them directly to the Home screen.
2. **Member Daily Flow (5-Tab Bottom Navigation)**:
   - **Home**: Warm personal greeting, selected church summary card (tapping opens the full Church Information view), prominent Smart Assistant quick-launch card, latest 2–3 relevant announcements, and next 2–3 upcoming events.
   - **Announcements**: Clean segmented filter (`All`, `Diocese`, `Division`, `Church`) showing announcements matching the member's exact hierarchy path. Cards display title, short summary, publish date, and publishing authority. Tapping opens a clean full-message reader.
   - **Events**: Chronological upcoming events filtered by scope (`All`, `Diocese`, `Division`, `Church`), displaying event title, date, time, location, and organizing church or authority.
   - **Assistant**: Clean messaging-style chat screen with quick-tap starter questions (*"When is our next service?"*, *"Who is our pastor?"*, *"Latest Diocese announcements?"*). Displays grounded replies based strictly on live church records.
   - **Profile**: Displays member name, phone number, and selected church, with direct actions to **Edit Profile**, **Change Church**, **View Church Info**, **Install App** (when eligible), **Administration Portal** (shown only to authorized admins), and **Sign Out**.
3. **Administrator Flow (Separate Scoped Workspace)**:
   - Authorized admins (Abuja Diocese General Secretary, Division Administrator, or Church Administrator/Secretary) open the Administration Portal from Profile or `/admin`.
   - Focused workspace tabs scoped strictly to their assigned jurisdiction: **Announcements** (create, edit, delete, pick visibility within permitted scope), **Events** (create, edit, delete), **Churches** (update pastor name, address, service days/times), **Members** (view registered members within scope), and **Admins** (Diocese-level / super-admin role assignment).

### Visual Identity & Theme

- **Aesthetic Direction**: Reverent, minimalist institutional clarity—calm editorial whitespace paired with crisp ecclesiastical structure. Zero visual clutter, no decorative status dots, no nested card boxes, and no pill-badge sandwiches.
- **Color Palette (60-30-10 Discipline)**:
  - *Main Canvas (60%)*: Pure White (`#FFFFFF`) and soft secondary Light Grey (`#F4F6F8`) for page backing and subtle section contrast.
  - *Primary Brand (30% structural)*: Deep Navy Blue (`#0F2547`) for primary headers, active navigation states, primary CTAs, and authoritative typography; muted slate (`#475569`) for secondary text and hairline borders (`#E2E8F0`).
  - *Accent (10% budget)*: Soft Gold (`#C59B38`) used sparingly for key focal highlights, active tab underlines/indicators, and the Smart Assistant callout.
- **Typography & Hierarchy**:
  - *Display & Section Titles*: `Plus Jakarta Sans` (weights 600–700) with balanced wrapping (`text-wrap: balance`).
  - *Body & Reading Prose*: `DM Sans` (weights 400–500) at 15px–16px (`1.6` line height) for effortless legibility by elderly readers, with tabular numerals (`tabular-nums`) for all dates and service times.
- **Responsive Layout & Motion**:
  - Mobile (`375px–430px`): Fixed 5-item bottom navigation bar and compact top header within the 15% sticky viewport cap, 44px+ hitboxes, and slide-up detail sheets.
  - Tablet/Desktop (`lg:`): Expands cleanly into a centered multi-column layout (`max-w-5xl` / `max-w-6xl`) with a slim persistent navigation rail so desktop users never see a cramped narrow strip.
  - Subtle, fast transitions ($\le 200\text{ms}$, `transform`/`opacity` only, honoring `prefers-reduced-motion`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Hierarchy-Tagged Announcements & Events for Fast, Secure Querying**:
  - *Chosen Approach*: Store explicit hierarchy identifiers (`dioceseId`, `divisionId`, `districtId`, `churchId`, and `visibilityScope`) on every announcement and event.
  - *Why*: Lets the client and Firestore queries fetch only items relevant to a member's Diocese, Division, or Church cleanly without scanning unrelated parishes, and allows future dioceses to be added purely as data.
  - *Alternatives Considered*: Deeply nested subcollections under each church/division, which complicates combined chronological feeds across Diocese + Division + Church.
- **Decision 2 — Privacy-First Member Storage & Role Verification**:
  - *Chosen Approach*: Protect member phone numbers and profiles in Firestore rules so members can only read/edit their own profile, while verified administrators (backed by a server-trusted `admins` document) can read members strictly within their assigned Diocese, Division, or Church scope.
  - *Why*: Prevents one member from scraping phone numbers of other congregants while giving secretaries a live directory of their flock.
- **Decision 3 — Database-Grounded Smart Assistant via Server Proxy**:
  - *Chosen Approach*: Route all chat requests through an Express backend endpoint (`/api/assistant/chat`) using `gemini-4-hydrogen` via `@google/genai`, injecting the member's live church profile, visible announcements, and upcoming events from Firestore (verified via Firebase ID token / structured context) with strict anti-hallucination instructions.
  - *Why*: Keeps the Gemini API key strictly on the server and ensures the assistant answers only from real church records—explicitly saying *"I don't have that information in the church records"* whenever data is missing.
- **Decision 4 — Future-Ready Phase 1 Boundaries**:
  - *Chosen Approach*: Model every collection with `dioceseId` (`abuja` in Phase 1), keep UI copy in centralized string dictionaries (ready for Hausa translation), and keep navigation strictly to the 5 Phase 1 tabs with no "Coming Soon" or placeholder pages for tithes, sermons, or livestreams.
  - *Why*: Delivers a focused, trustworthy Phase 1 release while ensuring Phase 2 additions plug directly into existing schemas.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                   LCCN Mobile-First PWA (React + Vite)               │
│                                                                      │
│  ┌─────────────────────────┐       ┌──────────────────────────────┐  │
│  │  Member Experience      │       │  Separate Admin Portal       │  │
│  │  • Onboarding / Church  │       │  (/admin & Profile link)     │  │
│  │  • Home  • Announcements│       │  • Diocese / Division /      │  │
│  │  • Events • Church Info │       │    Church Scoped CRUD        │  │
│  │  • Profile • Assistant  │       │  • Scoped Member Directory   │  │
│  └────────────┬────────────┘       └──────────────┬───────────────┘  │
└───────────────┼───────────────────────────────────┼──────────────────┘
                │                                   │
                ▼                                   ▼
┌───────────────────────────────┐     ┌────────────────────────────────┐
│   Firebase Auth & Firestore   │     │   Express Backend (server.ts)  │
│   • Google Auth               │     │   • POST /api/assistant/chat   │
│   • Security Rules (RBAC)     │◄────┤   • Grounds prompt in church,  │
│   • Real-time onSnapshot      │     │     announcements & events     │
│   • Offline Persistence       │     │   • Calls @google/genai        │
└───────────────────────────────┘     │     (gemini-4-hydrogen)        │
                                      └────────────────────────────────┘
```

### Data Model & Hierarchy

- **`dioceses`**: `id` (e.g., `abuja`), `name`, `bishopName`, `headquarters`, `isActive` (only `abuja` active in Phase 1).
- **`divisions`**: `id`, `dioceseId`, `name` (e.g., *Abuja Division*, *Nyanya Division*, *Kubwa Division*, *Gwagwalada Division*).
- **`districts`** *(optional layer)*: `id`, `dioceseId`, `divisionId`, `name`.
- **`churches`**: `id`, `dioceseId`, `divisionId`, `districtId` (optional), `name` (e.g., *Area 1 Church*), `pastorName`, `address`, `serviceSchedule` (array of service days & times), `updatedAt`.
- **`members`** *(PII-protected, keyed by Firebase Auth `uid`)*: `uid`, `fullName`, `phoneNumber`, `email`, `dioceseId`, `divisionId`, `districtId`, `churchId`, `createdAt`, `updatedAt`.
- **`admins`** *(RBAC authority record, keyed by `uid` or normalized email)*: `uid`, `email`, `fullName`, `role` (`diocese_secretary` | `division_admin` | `church_admin`), `dioceseId`, `divisionId` (for division/church admins), `churchId` (for church admins), `assignedBy`, `createdAt`.
- **`announcements`**: `id`, `title`, `summary`, `body`, `visibilityScope` (`diocese` | `division` | `church`), `dioceseId`, `divisionId`, `churchId`, `authorityLabel`, `authorUid`, `publishedAt`, `updatedAt`.
- **`events`**: `id`, `title`, `description`, `date`, `time`, `location`, `visibilityScope` (`diocese` | `division` | `church`), `dioceseId`, `divisionId`, `churchId`, `organizerLabel`, `authorUid`, `createdAt`, `updatedAt`.

### Interactive Component & State Mapping

- **Auth & Hierarchy Context**: Listens to Firebase `onAuthStateChanged`, loads the member's `members/{uid}` profile and `admins` authorization status, and subscribes to active `dioceses`, `divisions`, `districts`, and `churches` in Abuja Diocese (auto-seeding initial Abuja Diocese directory and starter posts on first admin/boot initialization if empty).
- **Registration & Church Picker**: Cascading dropdowns (`Diocese` locked to Abuja in Phase 1 → `Division` → optional `District` if present → `Church`), validating non-empty Full Name and Nigerian/international Phone Number before writing `members/{uid}` and routing immediately to Home.
- **Scoped Feed Filtering**: Computes visible announcements and events client-side and via Firestore queries where `visibilityScope === 'diocese'` (matching `dioceseId`), OR `visibilityScope === 'division'` (matching `divisionId`), OR `visibilityScope === 'church'` (matching `churchId`), with interactive filter tabs and empty/loading/error states.
- **Smart Assistant Chat**: Maintains conversation state, sends user query + member's verified church metadata + scoped announcements and events to `POST /api/assistant/chat`, renders streaming or crisp message bubbles with grounded citations, and handles network/API errors gracefully.
- **Administration Portal**: Enforces scope lock on all forms (e.g., a Church Administrator's visibility selector is locked to their own church; a Division Administrator can target their division or churches within it; the Diocese General Secretary can manage across Abuja Diocese and assign lower-tier admins). Every write validates field boundaries and updates Firestore immediately.
