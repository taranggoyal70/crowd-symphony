# Crowd Symphony - Production Deployment Guide

This guide covers deploying Crowd Symphony to production using Vercel with Supabase and Sentry.

## Prerequisites

- GitHub account
- Vercel account
- Supabase account (PostgreSQL)
- Sentry account (optional but recommended)
- PostHog account (optional but recommended)

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel Edge   │────▶│   Next.js App   │────▶│   Supabase      │
│   (CDN + SSR)   │     │   (React 19)    │     │   (PostgreSQL)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────────┐
                        │   Sentry +      │
                        │   PostHog       │
                        └─────────────────┘
```

## 1. Supabase Setup

### Create Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and API keys

### Run Database Migrations

```sql
-- Run the schema from lib/db/schema.sql in Supabase SQL Editor
-- This creates:
-- - sessions table (with RLS policies)
-- - users table
-- - audience_members table
-- - moments table
-- - session_events table
-- - Indexes and triggers
```

### Configure Auth (Optional)

If using Clerk for authentication:

1. Enable "Email" auth provider in Supabase
2. Or integrate with Clerk using the `clerk_id` field in users table

## 2. Vercel Deployment

### Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository: `taranggoyal70/crowd-symphony`
3. Vercel will auto-detect Next.js

### Environment Variables

Add the following in Vercel Project Settings → Environment Variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (from Supabase) | Yes |
| `NEXT_PUBLIC_APP_URL` | Production URL (e.g., `https://crowd-symphony.vercel.app`) | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | No |
| `CLERK_SECRET_KEY` | Clerk secret key | No |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for server) | Yes |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog API key | No |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host (default: `https://app.posthog.com`) | No |
| `SENTRY_DSN` | Sentry DSN | No |
| `SENTRY_ORG` | Sentry organization | No |
| `SENTRY_PROJECT` | Sentry project name | No |
| `NEXT_PUBLIC_ENABLE_WEBSOCKETS` | Enable WebSocket support (future) | No |
| `NEXT_PUBLIC_ASSET_VERSION` | Asset version for cache busting | No |

### Build Settings

- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm ci`

### Deploy

Click "Deploy" - Vercel will build and deploy automatically.

## 3. Sentry Configuration

### Create Sentry Project

1. Go to [sentry.io](https://sentry.io) and create a new project
2. Select "Next.js" as platform
3. Copy the DSN

### Configure Vercel Integration

1. In Sentry, go to Settings → Integrations → Vercel
2. Connect your Vercel account
3. Select your project

### Source Maps

Vercel automatically uploads source maps when `SENTRY_DSN` is set and `@sentry/nextjs` is installed.

## 4. PostHog Configuration

### Create PostHog Project

1. Go to [posthog.com](https://posthog.com) and create a project
2. Copy the API key and host URL

### Configure Events

The app automatically tracks:
- `session_created` - New session started
- `session_joined` - Audience joined
- `conductor_started/stopped` - Conductor activity
- `track_selected` - Music track changes
- `audio_enabled/disabled` - Audio state
- `volume_changed` - Volume adjustments
- `effect_mode_changed` - Visual effects
- `moment_triggered` - Host moments
- `qr_code_scanned` - QR code usage
- `error_occurred` - Errors

## 5. Domain & SSL

### Custom Domain

1. In Vercel, go to Settings → Domains
2. Add your custom domain (e.g., `crowd-symphony.com`)
3. Configure DNS records as instructed

### SSL

Vercel provides automatic SSL via Let's Encrypt.

## 6. Performance Optimization

### Audio Assets

- Local audio files are served with `Cache-Control: public, max-age=31536000, immutable`
- Service worker caches audio for offline playback
- CDN recommended for global distribution

### Image Optimization

- Next.js Image Optimization enabled
- Remote patterns configured for Pixabay/CDN images
- AVIF/WebP formats served automatically

### Edge Caching

- Static pages cached at edge
- API routes use `force-dynamic` for real-time data

## 7. Monitoring & Alerts

### Sentry Alerts

Configure in Sentry:
- Error rate > 1% → Alert
- Performance degradation → Alert
- New error types → Alert

### Vercel Analytics

Enable in Vercel:
- Web Vitals tracking
- Function execution metrics
- Bandwidth usage

### Database Monitoring

In Supabase:
- Connection pool usage
- Query performance
- Storage usage

## 8. CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) runs on every push:

1. **Lint & TypeCheck** - Biome + TypeScript
2. **Unit Tests** - Node.js test runner
3. **Build** - Next.js production build
4. **E2E Tests** - Playwright (Chromium, Firefox, WebKit, Mobile)
5. **Security Scan** - npm audit, Snyk, CodeQL
6. **Deploy Preview** - Vercel preview for PRs
7. **Deploy Production** - Vercel production for main branch

### Required Secrets

Add to GitHub repository settings → Secrets:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel CLI token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `SNYK_TOKEN` | Snyk API token (optional) |

## 9. Rollback Procedure

If deployment fails:

1. Go to Vercel Deployments
2. Click "..." on previous successful deployment
3. Select "Promote to Production"

Or via CLI:
```bash
vercel rollback <deployment-url>
```

## 10. Health Checks

### Manual Checks

- Home page loads: `https://your-domain.com/`
- API health: `https://your-domain.com/api/realtime?session=TEST`
- WebSocket: `https://your-domain.com/api/socket` (future)

### Automated Checks

Add to monitoring:
```bash
# Uptime check
curl -f https://your-domain.com/ || exit 1

# API check
curl -f "https://your-domain.com/api/realtime?session=HEALTHCHECK" || exit 1
```

## 11. Scaling Considerations

### Vercel

- Automatic scaling for serverless functions
- Edge Functions for middleware
- Concurrent execution limits (configure in vercel.json)

### Supabase

- Connection pooling (PgBouncer) enabled by default
- Consider read replicas for high read load
- Monitor connection count

### Audio CDN

For high traffic:
1. Upload audio to Cloudflare R2 / AWS S3
2. Configure CloudFront / Cloudflare CDN
3. Set `NEXT_PUBLIC_CDN_URL` to CDN endpoint

## 12. Troubleshooting

### Build Failures

- Check Node.js version (20.x)
- Verify all environment variables set
- Check TypeScript errors in build logs

### Runtime Errors

- Check Sentry for error details
- Verify Supabase connection
- Check Vercel Function logs

### Performance Issues

- Enable Vercel Speed Insights
- Check Supabase query performance
- Review Sentry transaction traces

### Audio Playback Issues

- Verify CORS headers on audio files
- Check service worker registration
- Test on mobile Safari/Chrome

## 13. Maintenance

### Weekly

- Review Sentry error trends
- Check Vercel analytics
- Monitor Supabase usage

### Monthly

- Rotate API keys
- Update dependencies (`npm update`)
- Review and clean old sessions

### Quarterly

- Security audit (`npm audit`)
- Dependency updates
- Performance benchmarking

## Support

- Issues: https://github.com/taranggoyal70/crowd-symphony/issues
- Docs: https://github.com/taranggoyal70/crowd-symphony/tree/main/docs