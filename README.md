# BANCre — Commercial Real Estate Lending Platform

BANCre is a web platform that connects real estate sponsors (borrowers) with lenders for bridge and commercial real estate loans. Sponsors can submit loan requests and receive competitive quotes from lenders, while lenders can browse the marketplace, analyze deals, and submit offers. The project is live at [bancre.com](https://bancre.com).

---

## Features

**For Sponsors**
- Submit and manage commercial real estate loan requests
- Upload property documents and generate AI-powered deal memorandums
- Track loan processing status in real time
- View and compare received lender quotes
- Manage property listings and analytics
- In-app messaging with lenders
- Real-time notifications via WebSocket

**For Lenders**
- Browse active loan requests on a live property map
- Filter and analyze deals with market analytics and charts
- Submit and manage loan quotes
- View detailed property and sponsor information

**General**
- OTP-based email verification and multi-step registration
- Forgot password / password reset flow
- Dark mode support
- Responsive design across all screen sizes

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4, tw-animate-css
- **UI Components:** Radix UI primitives, shadcn/ui
- **Forms:** React Hook Form + Zod validation
- **Data Fetching:** TanStack React Query, Axios
- **Maps:** Google Maps JavaScript API (`@react-google-maps/api`, `@vis.gl/react-google-maps`)
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Real-time:** Socket.IO client
- **Auth:** JWT (`jwt-decode`)
- **Document Parsing:** Mammoth (DOCX), react-pdf
- **Notifications:** Sonner toast
- **Backend:** Django REST Framework (separate repository)

---

## Project Structure

```
app/
  (auth)/              # Authentication pages: sign in, register, OTP, password reset
  (dashboard)/
    (lander)/          # Lender dashboard: loan requests, my quotes, market analytics, property map
    (sponsor)/         # Sponsor dashboard: properties, loan requests, quotes, memorandums, analytics, messaging
  (landingPage)/       # Public marketing pages
  (download)/          # Document download pages
  api/                 # Next.js route handlers

components/            # Shared UI components (Button, Headline, PropertyCard, etc.)
  ui/                  # shadcn/ui primitives

hooks/                 # Custom React hooks
lib/                   # Utility functions and helpers
providers/             # React context providers (Auth, Query, AuthGuard)
services/              # API service layer (auth, etc.)
styles/                # Global CSS
types/                 # TypeScript type definitions
public/                # Static assets
```

---

## Installation & Setup

**Prerequisites:** Node.js 18+ and npm

1. **Clone the repository**

```bash
git clone https://github.com/Aklabu/NextJS-BANCre.git
cd NextJS-BANCre
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Copy `.env.example` to `.env` and fill in the values (see [Environment Variables](#environment-variables) below).

```bash
cp .env.example .env
```

4. **Run the development server**

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

**Other scripts**

```bash
npm run build       # Production build
npm run start       # Start production server
npm run lint        # Run ESLint
npm run type-check  # TypeScript type checking
```

---

## Environment Variables

Create a `.env` file at the project root based on `.env.example`:

```env
# Google Maps API key
# Obtain from: https://console.cloud.google.com/google/maps-apis
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""

# Django REST Framework backend base URL
NEXT_PUBLIC_BASE_URL="http://127.0.0.1:8000/"
```

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — required for the property map and location features.  
`NEXT_PUBLIC_BASE_URL` — the base URL of the Django REST Framework backend API.

---

## License & Author

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

**Md. Joni Akter Labu**  
GitHub: [github.com/Aklabu](https://github.com/Aklabu)  
LinkedIn: [linkedin.com/in/joniakterlabu](https://www.linkedin.com/in/joniakterlabu/)
