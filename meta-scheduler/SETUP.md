# Meta Group Scheduler — Setup

## Prerequisites

- Node.js 20+
- A Meta Developer App with `publish_to_groups` and `groups_access_member_info` permissions approved

## 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite path, e.g. `file:./prod.db` |
| `META_APP_ID` | Your Facebook App ID |
| `META_APP_SECRET` | Your Facebook App Secret |
| `APP_URL` | Public URL of this app, e.g. `https://scheduler.yourdomain.com` |
| `SESSION_SECRET` | Random 32-char string (`openssl rand -hex 32`) |

Add `APP_URL/api/auth/callback` as a valid OAuth Redirect URI in your Meta App settings.

## 2. Install and migrate

```bash
npm install
npm run db:migrate   # creates the SQLite database
npm run build
```

## 3. Run the web app

```bash
npm run start        # production (port 3001)
# or
npm run dev          # development
```

## 4. Run the scheduler worker (VPS)

The scheduler is a **separate long-running process** that checks every minute for posts due to be published and posts them to Meta.

```bash
npm run scheduler
```

Run it under a process manager on your VPS:

```bash
# Using PM2
pm2 start "npm run scheduler" --name meta-scheduler-worker
pm2 save
```

## 5. Meta App setup checklist

- [ ] Create a Meta Developer App at https://developers.facebook.com
- [ ] Add **Facebook Login** product
- [ ] Add OAuth redirect URI: `https://yourapp.com/api/auth/callback`
- [ ] Request permissions: `publish_to_groups`, `groups_access_member_info`
- [ ] Submit for App Review (required for `publish_to_groups`)
