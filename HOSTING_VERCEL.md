# Chillado: host the migrated website on Vercel

This package is the standard Next.js version of Chillado. It includes TypeScript, Tailwind CSS, shadcn component paths, Turso/libSQL database access, and Supabase email/password authentication. It replaces the Cloudflare Worker build and platform-managed ChatGPT sign-in. The existing public site has not been modified.

The code migration is complete. This ZIP does not contain credentials or production records. Database provisioning, account configuration, live-data transfer, deployment, and real-provider testing remain to be done in your accounts.

## 1. Prepare your computer and repository

Install Node.js 24 LTS, extract this ZIP, and open a terminal in its folder.

```bash
npm ci
```

Copy `.env.example` to `.env.local`. For development, keep `SITE_URL=http://localhost:3000`. Never commit `.env.local`, exported records, database backups, user mappings, passwords, or merchant secrets. Upload the source to a private GitHub repository; include `package-lock.json` and `.env.example`. Do not upload `node_modules` or `.next`.

## 2. Create a durable database

Create a Turso database in your own account: https://turso.tech
Obtain its database URL and auth token from the dashboard. Put them in your local `.env.local`:

```dotenv
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-private-token
```

Run the schema migrations once against that database:

```bash
npm run db:migrate
```

The migration runner records checksums and safely skips unchanged applied migrations. An existing database created outside this runner needs deliberate reconciliation; do not blindly run it against the old database. The intended target is a new, empty Turso database.

The schema stores bookings, slot holds, tournaments, player scores, newsletter subscriptions, and venue settings. Login accounts are stored by Supabase Auth separately. Vercel must use a remote database; a local SQLite file is only for testing/development.

## 3. Configure login

Create a Supabase project: https://supabase.com/dashboard
In the project's Connect dialog, copy the project URL and publishable key:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Use the publishable key, never a service-role key. Under Authentication:

1. Enable email/password login and keep email confirmation enabled.
2. Set the minimum password length to at least 8 characters.
3. Configure custom SMTP so signup and reset emails reach public users. Supabase's default mail service is restricted; test with actual recipient addresses.
4. Set Site URL to your final website URL.
5. Add `http://localhost:3000/auth/callback` and your final `https://your-domain/auth/callback` to allowed redirect URLs. Add exact preview URLs only if you will test previews.
6. Configure email templates to support cross-device verification. For **Confirm signup**, use a link to:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
```

For **Reset password**, use:

```html
<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery">Reset your password</a>
```

The callback also supports the standard PKCE `code` flow, which requires the originating browser's verifier cookie. Use the token-hash templates above for links that can be opened on another device. Set templates and Site URL appropriately when switching environments.

Register at `/login`, confirm the email, and sign in. To grant admin access, add your confirmed email to the server-only `STAFF_EMAILS` variable, separated by commas for multiple staff. No administrator is hardcoded in the application. `.env.example` suggests the current owner's email; change it if needed. Staff open `/admin` to enter venue details, tournaments and player scores, and review bookings. Public accounts can view their own bookings at `/account`.

The server verifies users with Supabase `getUser()`. Client metadata and the old platform authentication headers cannot grant access. The Next.js proxy refreshes cookie sessions on protected routes. Authentication failures deny access.

## 4. Optional: transfer current records

Skip this section if starting with an empty database. The source ZIP contains no live records or login accounts.

Before switching production traffic, arrange a maintenance window and stop new bookings/edits on the old site. Back up the old database through its hosting provider. Wait for active 15-minute checkout holds and outstanding payment callbacks to resolve, or reconcile those payments manually. Do not run both sites as independent booking authorities during cutover: their databases cannot lock each other's slots.

Obtain a local SQLite snapshot with the current six tables and columns. If your provider supplies a SQL export, restore it to a local SQLite file first, e.g. with the SQLite command-line tool:

```bash
sqlite3 snapshot.sqlite < old-database.sql
node scripts/export-data.mjs snapshot.sqlite records.json
```

This exports only Chillado application records, not provider metadata. Keep the snapshot and JSON private.

Existing platform user IDs differ from Supabase IDs. Users must create and confirm their new accounts. After verifying ownership outside the public app, create a private mapping from each old booking user ID to the corresponding Supabase user UUID:

```json
{
  "old-platform-user-id": "new-supabase-user-uuid"
}
```

Do not guess account ownership. The importer refuses unmapped nonempty booking user IDs. Bookings with a null user ID remain unassigned. Sign-in credentials and passwords cannot be transferred from the old platform.

With `.env.local` pointing to the new migrated, empty Turso database:

```bash
npm run db:import -- records.json user-map.json
```

The importer checks all tables are empty, runs the import in a single write transaction, preserves record IDs, payment references and confirmed slots, and remaps booking ownership. It aborts rather than merging with existing records. Import once before accepting new traffic. Large datasets may require adjustment for the provider's transaction/request limits; the included tests use a small fixture, not your production dataset.

Compare record counts, confirmed slots, player totals and payment references before opening bookings. Never put snapshots, records or mappings in GitHub or this source package.

## 5. Deploy the source

1. In Vercel, select **Add New → Project** and import the GitHub repository.
2. Choose the **Next.js** framework preset and Node.js 24. Keep the root directory at the extracted project root. `vercel.json` supplies `npm ci` and `npm run build`; leave Output Directory automatic.
3. Add environment variables in Vercel Project Settings. Set database and Supabase values above, `STAFF_EMAILS`, and `SITE_URL` to your final HTTPS URL. Set values separately for Production and Preview when using both. A preview should use a test database and sandbox payments.
4. Deploy. If the final Vercel hostname is only known after the first deployment, update `SITE_URL`, Supabase Site URL and redirect URLs, then redeploy. Changes to `NEXT_PUBLIC_*` values require a rebuild.
5. Optionally add your domain in Vercel Settings → Domains and apply the DNS records Vercel supplies.

Do not run database migration/import automatically in the Vercel build; run the scripts deliberately from your computer using the target database credentials.

Vercel plan terms apply. Hobby is for personal, noncommercial projects; a paid-booking business should use a plan permitting commercial use. Check the current policy: https://vercel.com/docs/limits/fair-use-guidelines
Database, authentication and email services have their own plans and usage limits.

## 6. Configure and test PayHere

Until merchant settings are supplied, checkout remains disabled.

```dotenv
PAYHERE_MERCHANT_ID=your-merchant-id
PAYHERE_MERCHANT_SECRET=your-merchant-secret
PAYHERE_MODE=sandbox
PAYHERE_PUBLIC_ORIGIN=https://your-final-domain
```

Set these server-only variables in Vercel and redeploy. Obtain credentials from PayHere for the approved domain. Keep `PAYHERE_PUBLIC_ORIGIN` aligned with `SITE_URL` for the deployment. The notification endpoint is `/api/payhere/notify` and must be publicly reachable without a Vercel deployment-protection sign-in wall. Do not disable protection for unrelated private projects.

Test sandbox checkout, cancellation, signed notification delivery, expiry and booking visibility. Confirmation occurs only after the server verifies merchant ID, signature, amount and currency. A late successful payment for a replaced slot becomes `payment_review`; staff must reconcile it. No automatic refund is implemented. Use live credentials and `PAYHERE_MODE=live` only after the sandbox flow and approved production domain are verified.

## 7. Validate before opening bookings

```bash
npm run build
npm test
npm run test:api
npm run dev
```

The included checks cover migrations, competing slot reservations, expiry, confirmed-slot protection, transaction rollback, late-payment review, data import with user mapping, forged platform identity rejection, admin protection, origin checks, 24-hour slot lists, assets, subscriptions and invalid payment signatures.

Your hosted validation must also cover registration/confirmation emails, session refresh, password reset, admin login, actual record transfer and PayHere callbacks. Check the rendered website on phone, tablet and laptop. Browser/device visual checks and tests with real Supabase/Turso/PayHere accounts were not completed during package preparation.

Newsletter addresses are saved with consent; outbound marketing emails still need a separate email-sending workflow. Testimonials are labelled preview content; replace them with authorised genuine reviews when available. Pricing remains Rs. 3,500 per hour / Rs. 7,000 per two-hour slot. Changing rates requires updating server checkout values, availability responses and displayed pricing together.

## Project paths

- Pages/routes: `app/`
- Shared components: `components/`
- shadcn UI components: `components/ui/` (configured in `components.json`)
- Tailwind utilities/theme: `app/globals.css`, imported by `app/layout.tsx`
- Existing venue layout styles: `public/style.css`
- Schema/migrations: `db/schema.ts`, `drizzle/`
- Database adapter: `lib/database.ts`
- Verified authentication: `lib/auth.ts`, `lib/supabase.ts`, `proxy.ts`
- Setup/data scripts: `scripts/`

No shadcn, TypeScript or Tailwind setup is required; those are already configured in this package.
