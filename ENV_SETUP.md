# Environment Variables Setup

## Frontend Configuration

This application uses environment variables for configuration. Copy `.env.example` to `.env` and fill in your values.

### Required Variables

#### API Configuration

```bash
NEXT_PUBLIC_API_BASE_URL="http://localhost:8000/api/v1"
```

Backend API endpoint URL.

#### Authentication

```bash
NEXTAUTH_SECRET="your-nextauth-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

Required for NextAuth.js authentication.

### Optional Variables

#### External Services

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="your-mapbox-token"
```

For map integration in venue locations.

#### Analytics & Monitoring

```bash
VERCEL_ANALYTICS_ID="your-vercel-analytics-id"
GOOGLE_ANALYTICS_ID="GA-MEASUREMENT-ID"
NEXT_PUBLIC_SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
```

For analytics and error monitoring.

#### Feature Flags

```bash
NEXT_PUBLIC_FEATURE_COLLABORATION="false"
NEXT_PUBLIC_FEATURE_ANALYTICS="true"
```

Enable/disable application features.

### Development vs Production

- **Development**: Use `.env` for local development
- **Production**: Use `.env.production` for production builds
- **Secrets**: Never commit actual values to version control

### Getting Started

1. Copy the example file:

   ```bash
   cp .env.example .env
   ```

2. Fill in your actual values in `.env`

3. Start the development server:
   ```bash
   pnpm dev
   ```

### Security Notes

- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Never put sensitive backend credentials in `NEXT_PUBLIC_` variables
- Use different values for development and production environments
