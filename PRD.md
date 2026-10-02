# Form & Field Product Requirements

## Product

Form & Field is an online shop for considered home, clothing, lighting, and everyday accessories. Customers can browse products, choose available color variants, keep a cart between visits, check out through Paystack, and review their orders later. Store staff manage catalog and storefront content through a protected admin area.

## Users

- Shoppers browsing or purchasing as guests.
- Signed-in customers who need persistent order history.
- Store administrators who manage products, categories, orders, and storefront settings.

## MVP Requirements

1. Browse and filter published products; inspect product details, prices, stock, and active variants.
2. Persist the cart in the browser and preserve selected variants through checkout.
3. Recalculate price and stock on the server; persist orders and payment references before redirecting to Paystack.
4. Verify Paystack webhook signatures and transaction amount, currency, and reference before marking an order paid or decrementing stock.
5. Support Google sign-in/out through Supabase Auth and associate customer orders with the authenticated user when available.
6. Show customers only their own persisted order history.
7. Restrict admin pages and write APIs to provisioned admin users.
8. Send and log order-confirmation email through Mailgun after successful payment.
9. Support Vercel deployment with production-only service configuration and no credentials in Git.

## Acceptance Checklist

| Checklist item | Status | Evidence or remaining action |
| --- | --- | --- |
| Shop concept and PRD | Done | This document describes the MVP and acceptance criteria. |
| Product UI | Done | Storefront, product detail, filtering, and variants are implemented. |
| Cart | Done | Cart calculations and variant stock checks have unit tests; browser persistence is implemented. |
| Checkout | Partial | Server creates persisted orders and starts Paystack checkout; live payment is not exercised by the smoke test. |
| Supabase/Neon | Done | Supabase PostgreSQL/Auth are implemented; local configured database has all four migrations. |
| Orders persisted | Done | Checkout writes order, item, and payment records transactionally. |
| Google OAuth | Partial | OAuth routes/configuration are implemented; complete production sign-in requires provider configuration and a real browser session. |
| Sign in/out | Done | Supabase login, callback, and sign-out flows are implemented. |
| Mailgun | Partial | Sender integration and delivery logging are implemented; production credentials/domain are not verifiable from the repository. |
| Confirmation email received | Blocked | Must send a real successful test order and verify delivery in a mailbox/Mailgun logs. |
| Order history survives logout/re-entry | Done | Orders are queried by Supabase user ID from PostgreSQL, not browser storage. |
| Production deployment | Partial | Vercel deployment is live. Homepage, catalog API, and settings responded, but the production product-detail request exceeded the 15-second smoke deadline; deploy the query memoization change and rerun. |
| Production environment variables | Partial | Database-backed production endpoints responded; Paystack/Mailgun values and Vercel secret settings need owner verification. |
| End-to-end testing | Partial | `npm run test:smoke` passes locally for five read-only routes. Production product detail needs retesting after deploy; OAuth, payment, email receipt, and customer history need a controlled real-account test. |
| Git history | Done | Changes are versioned on `master`. |
| No secrets in GitHub | Done with caveat | `.env.local` is ignored and `.env.example` is the only tracked env file; run GitHub secret scanning on the remote repository as a final check. |

## Production Smoke Test Scope

The smoke test is read-only. It checks the homepage, product API, a product detail page, store settings, and that unauthenticated `/admin` redirects to login. It does not authenticate, create an order, call Paystack, or send an email. Run it locally or set `SMOKE_BASE_URL` to select another deployment.
