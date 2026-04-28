# KiwiSpend — Frontend

A mobile-first Progressive Web App (PWA) for tracking personal weekly expenses. Built with React + Vite and deployed on Vercel.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build tool | Vite 5 |
| Styling | Plain CSS (custom properties, no framework) |
| Fonts | Syne (headings) + DM Mono (body) via Google Fonts |
| Deployment | Vercel (auto-detected Vite project) |
| PWA | Web App Manifest + Service Worker |

---

## Project Structure

```
frontend/
├── index.html                  # Vite entry point
├── vite.config.js
├── vercel.json                 # outputDirectory: dist, SPA rewrite rule
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker (caching + push events)
│   ├── icon-192.png
│   └── icon-512.png
└── src/
    ├── main.jsx                # React root + SW registration
    ├── App.jsx                 # Auth state, page routing, toast, header
    ├── index.css               # All styles (CSS custom properties)
    ├── api.js                  # apiFetch helper + fmt() utility
    ├── screens/
    │   └── Auth.jsx            # Login + account creation screens
    ├── pages/
    │   ├── Dashboard.jsx       # Hero card, progress, category breakdown
    │   ├── Expenses.jsx        # Expense list, add/edit modal
    │   ├── Reports.jsx         # PDF/CSV preview and download
    │   └── Settings.jsx        # Week setup, push notification toggle
    ├── components/
    │   └── Notifications.jsx   # Bell icon + in-app notification panel
    └── utils/
        └── push.js             # Push subscription helpers
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `https://kiwispend-backend.vercel.app/api` |

Set in Vercel project settings or a local `.env.local` file. The fallback hardcoded URL is used if not set.

---

## Features

### Authentication

**Login**
- Username and password login
- JWT stored in `localStorage`, verified on app load
- Enter key submits the form

**Account Creation (Slot System)**
- The app supports up to 4 user accounts, shown as a slot grid
- Users pick an available slot (1–4), then fill in display name, username, and password (min 6 chars)
- Taken slots are greyed out and unclickable

---

### Dashboard

The landing page after login. Provides an at-a-glance snapshot of the current week.

**Hero card**
- Large display of total spent this week
- Weekly Income, Remaining balance (green/red depending on sign), and Savings Rate
- Animated progress bar showing spend vs income — colour shifts green → amber → red at 70% and 90%

**Budget tiles**
- Two stat tiles side by side: Budget Target and Budget Left (also colour-coded)

**Spending by Category**
- Sorted list of categories with their total spend, transaction count, and a relative bar showing proportion of the top category
- Each category shows its emoji icon and colour from the database

**Week Selector**
- Horizontal scrolling chip row showing the last 6 weeks
- Tap any chip to switch the dashboard to that week's data

---

### Expenses

**Expense list**
- Shows all expenses for the selected week, ordered by date descending
- Each item displays: category emoji icon, description (or category name if no description), category + date metadata, formatted amount, edit and delete buttons

**Add Expense**
- Full-screen bottom-sheet modal (slides up from the bottom, dismissible by tapping the backdrop)
- Category grid with emoji chips — tap to select
- Amount input (numeric keyboard on mobile)
- Optional description
- Date picker (defaults to today)

**Edit Expense**
- Same modal, opened with the ✏️ button on any expense row
- Pre-filled with the existing category, amount, description, and date
- Calls `PUT /api/expenses` on save
- Modal title and save button change to "Edit Expense" / "Update Expense" to make the mode clear

**Delete Expense**
- 🗑 button with a browser confirm dialog before deleting

---

### Reports

**Week selector**
- Dropdown to choose which week to generate a report for

**PDF Preview & Download**
- Tap "Preview PDF" to generate the report and show a full-screen overlay
- On desktop and Android: the PDF renders inline in an `<iframe>` — scrollable, zoomable
- On iOS Safari (which cannot embed PDFs in iframes): a fallback message is shown with a Download button
- "↓ Download" button in the overlay header saves the already-fetched blob — no second network request

**CSV Preview & Download**
- Tap "Preview CSV" to generate and show the data as a scrollable, styled HTML table
- Sticky header row, alternating row shading
- "↓ Download" saves the CSV file

**Both overlays are portalled to `document.body`** to avoid iOS `position:fixed` clipping issues inside the scroll container.

**Past 8 Weeks Overview**
- Summary list of the last 8 weeks with a mini progress bar and spend/income breakdown
- Colour-coded percentage: green below 70%, amber 70–90%, red above 90%

---

### Settings

**This Week's Setup**
- Income and Budget Target fields for the current week
- "Save Week Settings" writes both values to the backend and refreshes local state

**New Week**
- "Start New Week" creates a new week starting the next Monday after the most recent week
- Automatically switches the app to the new week

**Push Notifications**
- Shows current status: Off / On / Blocked / Not supported
- "Enable Notifications" button requests browser permission, subscribes to push using the backend's VAPID public key, and registers the subscription with the backend
- "Disable Notifications" unsubscribes from the browser's push manager and removes the subscription from the backend
- If permission is denied, shows a message directing the user to their browser/OS settings
- Status is checked live on each Settings visit (not cached)

**Account**
- Displays the logged-in user's display name and username
- iOS "Install as App" reminder (Share → Add to Home Screen)

---

### In-App Notifications (Bell Icon)

A 🔔 bell icon sits in the top-right header, next to the user chip.

**Smart alerts generated from live analytics:**

| Trigger | Alert |
|---------|-------|
| Income not set | Reminder to add income in Settings |
| Spent ≥ 70% of budget | Budget check warning |
| Spent ≥ 90% of budget | Budget almost gone warning |
| Spent ≥ 100% of budget | Over budget alert with overspend amount |
| High income spend (no budget set) | High spending warning |
| Savings rate ≥ 10% | "Saving well" positive reinforcement |
| Savings rate ≥ 25% | "Great savings!" celebration |
| Any expenses this week | Top spending category highlight |

**Unread badge**
- Red badge on the bell shows the count of unseen notifications
- Badge clears when the panel is opened
- Read notification IDs are persisted in `localStorage` so the badge doesn't re-appear on reload for the same alerts

**Panel** is portalled to `document.body` for correct rendering on iOS.

---

### Device Push Notifications (PWA)

When push notifications are enabled in Settings, the app can receive native device notifications even when closed.

**Notification triggers (sent from the backend):**

| Event | Notification |
|-------|-------------|
| Expense added | `"Food & Dining — $12.50 added · $85 of $200 budget used"` |
| Budget crosses 70% | `"⚠️ Budget Check — You've used 72% of your budget"` |
| Budget crosses 90% | `"⚠️ Budget Almost Gone — Only $20 left"` |
| Budget crosses 100% | `"🚨 Over Budget! — Exceeded by $15.00"` |

Budget threshold alerts only fire once per threshold crossing — not on every subsequent expense.

Tapping a notification focuses the existing app tab or opens a new one.

---

### Progressive Web App

- Installable on iOS (Share → Add to Home Screen) and Android (browser install prompt)
- Service worker caches the app shell for offline access
- `manifest.json` configures standalone display mode, dark theme colour, and app icons
- Viewport is configured for safe-area insets (iPhone notch / Dynamic Island)

---

## Local Development

```bash
npm install
npm run dev
```

The app will start at `http://localhost:5173`. It proxies nothing — API calls go directly to the production backend URL unless you override `VITE_API_URL` in `.env.local`.

```env
# .env.local
VITE_API_URL=http://localhost:3000/api
```

## Deployment

Vercel auto-detects Vite from `package.json`. On push to `main`:

1. Vercel runs `npm run build`
2. Vite outputs to `dist/`
3. `vercel.json` rewrites all routes to `dist/index.html` for SPA navigation
4. Static assets (`manifest.json`, `sw.js`, icons) are served from `dist/` with appropriate cache headers
