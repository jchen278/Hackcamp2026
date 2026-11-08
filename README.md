# SpreadTheLoaf

SpreadTheLoaf helps people find and support community fridges around Metro Vancouver. Volunteers can photograph a fridge, review the food items detected by AI, and submit an inventory update. The app brings fridge locations, current stock, and volunteer tools together in one place.

*Read our Devpost [here](https://devpost.com/software/spreadtheloaf)!*

## What it does

- Browse community fridge locations and their reported inventory.
- Sign in with Auth0 to use volunteer and administrator features.
- Upload a fridge photo for Gemini to identify food and estimate quantities.
- Review and edit the scan results before saving them to the database.
- Award volunteer points through Auth0 app metadata.
- Optionally send restock alerts through an n8n webhook when configured.
- Support Devnet SOL scan rewards when a treasury, recipient wallet, and Devnet RPC are configured.

Scan results are estimates. Volunteers review them before committing inventory changes.

## Tech stack

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Auth0 for sign-in, roles, and server-managed points
- PostgreSQL (Tiger Data) for pantry locations, inventory, and scan records
- Gemini for image-based inventory extraction
- n8n for optional restock notifications
- Solana Devnet for optional test rewards

## Run locally

### Requirements

- Node.js compatible with the installed Next.js version
- npm
- Access credentials for the services you want to use (see environment variables below)

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create a `.env.local` file in the project root. Keep it private; it is excluded from Git. Add only the credentials for services you have configured.

```dotenv
# Auth0
AUTH0_ISSUER_BASE_URL=https://YOUR_AUTH0_DOMAIN
AUTH0_DOMAIN=YOUR_AUTH0_DOMAIN
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

# PostgreSQL / Tiger Data
DATABASE_URL=

# Gemini image recognition
GEMINI_API_KEY=

# Optional: restock alert webhook
N8N_RESTOCK_WEBHOOK_URL=

# Optional: Solana Devnet rewards
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_TREASURY_SECRET=
NEXT_PUBLIC_SOLANA_REWARD_WALLET=

# Optional: image storage
VULTR_BUCKET_NAME=
VULTR_STORAGE_ACCESS_KEY=
VULTR_STORAGE_SECRET_KEY=
VULTR_STORAGE_ENDPOINT=
VULTR_STORAGE_REGION=
```

Use the exact Auth0 issuer URL and domain from your Auth0 application settings. `SOLANA_TREASURY_SECRET` is a private signing key: never put it in client code, commit it, or share it. The public reward wallet address is safe to expose. Restart the dev server after changing environment variables.

The app can run only the parts whose services are configured. For example, scanning needs a Gemini API key, and saving live inventory needs the database connection. Solana rewards and image storage are optional integrations.

## Main routes

- `/` — fridge finder and public inventory
- `/scan` — volunteer scan and inventory review
- `/admin` — administrator overview
- `/submitted` — scan submission confirmation

## Useful commands

```bash
npm run dev       # Start the local development server
npm run build     # Create a production build
npm run start     # Serve the production build
npm run lint      # Run ESLint
```

## Project status

SpreadTheLoaf is a hackathon project. Inventory accuracy depends on volunteer review and timely scans. Integrations such as authentication, database access, AI scanning, alerts, and rewards require their corresponding environment configuration.

---

**SpreadTheLoaf — Know what's there. See what's needed. Keep communities stocked.**
