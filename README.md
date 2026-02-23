# Personal CRM

A personal relationship management tool to help you stay in touch with important contacts. Get daily reminders via email, Google Calendar, or WhatsApp.

## Features

- **Contact Management**: Add contacts with name, relation, category, and desired check-in frequency
- **Dashboard**: See who you need to reach out to today
- **One-Click Logging**: Mark contacts as "reached out" with a single click
- **Daily Reminders**: Get notified at 9 AM IST via:
  - Email (Resend)
  - Google Calendar events
  - WhatsApp (Twilio)

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Database**: Turso (libSQL)
- **Email**: Resend
- **Calendar**: Google Calendar API
- **WhatsApp**: Twilio
- **Hosting**: Vercel

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Turso Database (Required)

1. Go to [turso.tech](https://turso.tech) and create a free account
2. Create a new database:
   ```bash
   turso db create personal-crm
   ```
3. Get your credentials:
   ```bash
   turso db show personal-crm
   turso db tokens create personal-crm
   ```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your credentials:

| Variable | Required | Description |
|----------|----------|-------------|
| `TURSO_DATABASE_URL` | Yes | Your Turso database URL |
| `TURSO_AUTH_TOKEN` | Yes | Your Turso auth token |
| `CRON_SECRET` | Yes | Random string for securing cron endpoints |
| `RESEND_API_KEY` | No | For email notifications (get from [resend.com](https://resend.com)) |
| `NOTIFICATION_EMAIL` | No | Email to receive daily reminders |
| `GOOGLE_CLIENT_ID` | No | Google Cloud Console OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google Cloud Console OAuth client secret |
| `GOOGLE_REFRESH_TOKEN` | No | Google OAuth refresh token |
| `TWILIO_ACCOUNT_SID` | No | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | No | Twilio WhatsApp number |
| `WHATSAPP_NUMBER` | No | Your WhatsApp number to receive reminders |

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Deployment to Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local` to Vercel's Environment Variables
4. Deploy!

### Vercel Cron Jobs

The app is configured to run daily reminders at 9 AM IST (3:30 AM UTC). The cron is defined in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/daily-reminder",
    "schedule": "0 3 * * *"
  }]
}
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/contacts` | GET, POST | List or create contacts |
| `/api/contacts/[id]` | GET, PUT, DELETE | Get, update, or delete a contact |
| `/api/interactions` | GET, POST | List or log interactions |
| `/api/settings` | GET, POST | Get or update notification settings |
| `/api/cron/daily-reminder` | GET | Trigger daily reminder (requires Bearer token) |

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── contacts/      # Contact pages
│   ├── settings/      # Settings page
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Dashboard
├── components/        # React components
├── lib/               # Utilities (db, email, calendar, whatsapp)
└── types/             # TypeScript types
```

## License

MIT
