# Form & Field

See [PRD.md](PRD.md) for product requirements and the current completion checklist.

A full-stack storefront foundation built with Next.js, TypeScript, Tailwind CSS, Supabase PostgreSQL, Drizzle ORM, and Paystack. The storefront uses explicitly demo-only catalog data when `DATABASE_URL` is not set. Once a database URL is configured, product reads use PostgreSQL and database errors are surfaced instead of silently switching to demo content. Products support color variants with their own SKU and stock; chosen colors stay distinct in the cart/order, and verified payments reduce stock for that color. Signed-in customers share one variant-aware cart between the web and mobile apps; successful payment clears that account cart. Working integration slices include Google sign-in through Supabase Auth, customer order views, guarded admin product/category/order APIs, Paystack transaction initialization and signature-verified webhook processing, Supabase Storage image uploads, newsletter persistence, the content/store editor at `/admin/content`, and a sitewide WhatsApp launcher. The editor manages storefront name/logo, homepage sections and images, contact details, WhatsApp business number, currency, shipping fee, and free-shipping threshold. These live flows require the corresponding credentials and migrated/seeded database.

## Stack

* Next.js App Router, React, TypeScript, Tailwind CSS
* Supabase PostgreSQL with Drizzle ORM and `postgres`
* Supabase Auth/Storage integration dependencies
* Zod and Lucide
* Vercel-compatible server-rendered routes and route handlers

## Local development

```powershell
npm install
npm run dev
```

The shop previews without credentials using the demo catalog. To use Supabase data, copy `.env.example` to `.env.local`, set `DATABASE_URL`, then generate/apply migrations and seed:

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
```

`DATABASE_URL` must be a PostgreSQL connection string from the active Supabase project. Do not put anon keys, service-role keys, or Supabase REST URLs in this variable. Use Supabase's Connect dialog to choose the direct connection or a supported pooler appropriate to the deployment runtime. The database client uses TLS and a one-connection pool for serverless compatibility. Migration `0003_tidy_skreet.sql` adds color variants and order-item color snapshots; migration `0004_vengeful_doctor_faustus.sql` enables account carts to retain selected variants and enforces one cart per account.

## Environment variables

See `.env.example`. `SUPABASE_SERVICE_ROLE_KEY` and `PAYSTACK_SECRET_KEY` are server secrets and must never use a `NEXT_PUBLIC_` prefix. Do not commit `.env.local` or place real credentials in source control.

## Google sign-in setup

1. Create a Google Cloud project and configure the OAuth consent screen.
2. Create a Web application OAuth client.
3. Configure the authorized origin for the site domain.
4. Configure the redirect URI `https://YOUR-PROJECT.supabase.co/auth/v1/callback` in Google Cloud.
5. Enable Google in Supabase Auth and enter the OAuth client ID and secret.
6. Set the site URL and allowed redirect URLs in Supabase, including the local callback.
7. Add Supabase URL and anon key to local and Vercel environments.

## Admin setup

Set `ADMIN_EMAIL` and `SUPABASE_SERVICE_ROLE_KEY` in a trusted local environment. Create that account by signing in with Google once, then run `npm run db:make-admin`. The script grants the role to that exact existing Supabase user; it does not create a password or expose the service key to the browser. Keep the Storage bucket `store-assets` public for product image delivery, or change `SUPABASE_STORAGE_BUCKET` and implement signed delivery URLs before using a private bucket.

## Paystack

Use Paystack TEST credentials during development. Payment completion is driven by a signed webhook plus server-side transaction verification, never the browser redirect. Configure the Paystack webhook to `https://YOUR-DOMAIN.com/api/paystack/webhook`. Create a public Supabase Storage bucket matching `SUPABASE_STORAGE_BUCKET` (default `store-assets`) for product images. The admin upload endpoint validates image type and size and requires the server-only service-role key.

## Vercel deployment

### 1. Prepare the production services

Create the production Supabase project before deploying. In Supabase, create the `store-assets` Storage bucket and configure Google under Authentication > Sign In / Providers. Keep the bucket public only if product image URLs are intended to be public. Verify the project URL and anon key; keep the service-role key private.

For Vercel serverless functions, use a Supabase connection string that supports serverless connections. The runtime client disables prepared statements and uses a small pool, so Supabase's transaction pooler is suitable. Use a direct or session-pooled connection for migration commands if the transaction pooler does not support the migration operation. TLS is enabled by the app.

### 2. Apply production schema and seed data

Run migrations against the production database before sending traffic. From PowerShell, prompt for the connection string so it is not written into command history, then run:

```powershell
$secureUrl = Read-Host "Production DATABASE_URL" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureUrl)
try {
	$env:DATABASE_URL = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
	npm ci
	npm run db:migrate
	if ($LASTEXITCODE -ne 0) { throw "Migration failed; stopping deployment setup." }
	npm run db:seed
	if ($LASTEXITCODE -ne 0) { throw "Seed failed; stopping deployment setup." }
} finally {
	[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
	$secureUrl.Dispose()
	Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
}
```

Do not paste a real connection string into source control, chat, or a committed `.env` file. The migration command applies the checked-in files under `drizzle/`; it does not generate migrations. `npm run db:generate` is for schema changes during development. The seed is repeatable, leaves existing product/category slugs unchanged, and adds missing category-specific color variants with stock totals matching each product.

### 3. Import the repository into Vercel

1. Push `hng-ecommerce-shop` to its own GitHub repository.
2. In Vercel, choose Add New > Project and import that repository.
3. If the app is nested in a monorepo, set Root Directory to `hng-ecommerce-shop`; otherwise leave the project root as the default.
4. Keep the detected Next.js framework and default build settings. The build command is `npm run build`; do not run migrations or seeding as part of the Vercel build.

### 4. Configure Vercel environment variables

Add these under Project > Settings > Environment Variables. Assign production values to Production. Add Preview values separately if preview deployments should connect to a non-production database and provider configuration.

| Variable                          | Where it is used   | Notes                                                                                                                               |
| --------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                    | Server only        | Supabase PostgreSQL connection string; never prefix with `NEXT_PUBLIC_`.                                                            |
| `NEXT_PUBLIC_SITE_URL`            | Browser and server | Production origin, for example `https://shop.example.com`, with no trailing slash.                                                  |
| `NEXT_PUBLIC_SUPABASE_URL`        | Browser and server | Supabase project URL.                                                                                                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Browser and server | Supabase publishable/anon key; Supabase API access is governed by RLS. Server-side SQL also checks ownership in application routes. |
| `SUPABASE_SERVICE_ROLE_KEY`       | Server only        | Required for admin image uploads; grants elevated access. Never expose it.                                                          |
| `SUPABASE_STORAGE_BUCKET`         | Server only        | Optional; defaults to `store-assets`.                                                                                               |
| `PAYSTACK_SECRET_KEY`             | Server only        | Use the Paystack TEST secret until production payments are approved.                                                                |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Browser and server | Paystack public key; the current checkout initializes payment server-side.                                                          |

Google OAuth credentials are entered in Supabase Auth's Google provider settings; they are not read directly by this app. Do not add them to Vercel unless a future integration explicitly requires that.

### 5. Configure production URLs and OAuth

1. Set `NEXT_PUBLIC_SITE_URL` in Vercel to the final production URL and redeploy after changing it.
2. In Supabase Authentication > URL Configuration, set Site URL to that same URL and add the production callback/redirect URL `https://YOUR-DOMAIN.com/auth/callback` to the allowed redirect URLs. Add the Vercel preview pattern only if preview OAuth is needed.
3. In Google Cloud Console, add the production site as an authorized JavaScript origin.
4. Set the Google authorized redirect URI to `https://YOUR-PROJECT.supabase.co/auth/v1/callback` (use the exact callback shown in Supabase).
5. Confirm the Google provider is enabled in Supabase and its client ID/secret are saved there.

### 6. Configure Paystack and Storage

* In Paystack, use TEST credentials for staging and set the webhook URL to `https://YOUR-DOMAIN.com/api/paystack/webhook`. Add a separate webhook for preview only if needed. The webhook verifies the signature and verifies the transaction with Paystack before updating the order.
* In Supabase Storage, create the bucket named by `SUPABASE_STORAGE_BUCKET` (default `store-assets`). Uploaded product images are returned as public URLs, so the bucket must be public for this implementation.

### 7. Deploy and provision the first admin

Deploy from Vercel, then sign in once with Google using the email intended for the store admin. Provision that existing Supabase user from a trusted local PowerShell session. Prompt for the two secrets rather than placing them in command history:

```powershell
function Set-ProcessSecret([string]$Name, [string]$Prompt) {
	$secret = Read-Host $Prompt -AsSecureString
	$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
	try {
		[Environment]::SetEnvironmentVariable($Name, [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer), "Process")
	} finally {
		[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
		$secret.Dispose()
	}
}
Set-ProcessSecret "DATABASE_URL" "Production DATABASE_URL"
Set-ProcessSecret "SUPABASE_SERVICE_ROLE_KEY" "Supabase service role key"
$env:NEXT_PUBLIC_SUPABASE_URL = Read-Host "Supabase project URL"
$env:ADMIN_EMAIL = Read-Host "Admin Google account email"
npm ci
npm run db:make-admin
Remove-Item Env:DATABASE_URL, Env:SUPABASE_SERVICE_ROLE_KEY, Env:NEXT_PUBLIC_SUPABASE_URL, Env:ADMIN_EMAIL -ErrorAction SilentlyContinue
```

The script grants access to the matching existing email; it does not create a user or password. Remove those temporary environment variables from the shell when finished. Visit `https://YOUR-DOMAIN.com/admin/content` to confirm the role is active.

### 8. Production smoke test

* Open the home page, `/shop`, and a product detail page; confirm catalog records come from Supabase rather than demo fallback.
* Confirm an unauthenticated request to `/admin` redirects to Google sign-in and the provisioned account can open `/admin/content`.
* Save a harmless content change and confirm it appears on the public storefront.
* Set an international WhatsApp number in Admin > Content & store and confirm the chat widget opens the correct `wa.me` conversation with the typed message.
* Test newsletter signup, product image upload, and verify the uploaded image URL loads.
* Use Paystack TEST mode to place an order. Confirm the webhook URL receives the event, the payment is verified, inventory changes once, and the order is confirmed successfully.
* Check Vercel function logs and Supabase logs for errors. Never diagnose by exposing secrets in browser output.

For a new release, push to GitHub and let Vercel build/deploy. For schema changes, generate and review a migration locally, apply it to the target database as a separate controlled step, and only then deploy application code that depends on it.

## Commands

* `npm run dev` starts development.
* `npm run build` creates the production build.
* `npm run start` serves the production build.
* `npm run lint` runs ESLint.
* `npm test` runs cart calculation and stock validation tests.
* `npm run test:smoke` checks production routes without creating an order or charging a payment. Set `SMOKE_BASE_URL` to target another deployment.
* `npm run db:generate` creates Drizzle migrations from the schema.
* `npm run db:migrate` applies generated migrations.
* `npm run db:seed` inserts five categories and fifteen demo products without overwriting existing slugs.
* `npm run db:make-admin` grants admin access to an existing Supabase Auth user matching `ADMIN_EMAIL`; sign in once with Google first.

After provisioning, open `/admin/content` to edit the live storefront. Homepage and store settings are stored in the `site_settings` table and are validated server-side; customer-facing totals are recalculated from these persisted settings and database product prices. New products created from Admin > Products receive Natural, Olive, and Charcoal color variants with stock split across them. To activate chat, enter the WhatsApp business number in international format (for example, `+234 803 555 1212`). The launcher strips formatting and opens the matching `wa.me` chat; without a configured number it offers the store email instead.
