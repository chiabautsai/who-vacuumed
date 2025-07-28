
## Environment Setup

Copy `.env.example` to `.env.local` and configure your Auth0 settings:

```bash
cp .env.example .env.local
```

Required environment variables:
- `AUTH0_SECRET` - A long, secret value used to encrypt the session cookie
- `APP_BASE_URL` - The base URL of your application (e.g., http://localhost:3000)
- `AUTH0_DOMAIN` - Your Auth0 domain (without https://)
- `AUTH0_CLIENT_ID` - Your Auth0 application client ID
- `AUTH0_CLIENT_SECRET` - Your Auth0 application client secret

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
