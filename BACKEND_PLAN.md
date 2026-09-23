# ZAMANI NG MARKET HUB — Backend Implementation Plan

## 1. Purpose and scope

This plan turns the current frontend prototype into a production-ready marketplace backend. The current app already has buyer and vendor API adapters, but both primarily use seeded, in-memory data. The backend should first support the flows that are currently visible in the UI:

- Buyer registration, verification, login, profile, addresses, wishlist, catalog browsing, cart, checkout, orders, and reviews.
- Vendor onboarding, document upload/review, profile settings, product catalog, fulfillment updates, dashboard metrics, settlements, and payout requests.
- Admin approval and operational oversight (the legacy admin page exists, but does not yet have a modular API contract).

The backend must be the source of truth for price, stock, totals, vendor ownership, payment status, and authorization. The browser must never decide these values.

## 2. Recommended architecture

Start with a modular monolith rather than separate microservices. It is simpler to deploy, test, and evolve while the marketplace is being validated.

| Area | Recommended choice | Why |
| --- | --- | --- |
| API | TypeScript + NestJS (REST, OpenAPI) | Strong module boundaries, validation, guards, and generated API docs. |
| Database | PostgreSQL | Reliable transactions for checkout, stock, payments, and payouts. |
| ORM/migrations | Prisma | Type-safe schema access and repeatable migrations. |
| Cache/jobs | Redis + BullMQ | Rate limiting, sessions, webhooks, email/SMS, image processing, payout jobs. |
| File storage | S3-compatible private bucket | Vendor documents and product imagery; use signed upload/download URLs. |
| Payments | Paystack or Flutterwave | Nigerian card, transfer, USSD/payment-link support; choose one first. |
| Notifications | Email/SMS provider behind an interface | Account verification, order updates, vendor approval, payout events. |
| Deployment | Containerized API + managed Postgres/Redis/object storage | Separate dev, staging, and production environments. |

Keep API versioning from day one: `/api/v1/...`.

## 3. Modules and ownership

1. **Identity and access**: users, password login, verification, refresh tokens, roles (`buyer`, `vendor`, `admin`).
2. **Catalog**: categories, vendor-owned products, images, variants, search, stock and public vendor profiles.
3. **Buyer**: profiles, addresses, saved payment references, wishlists, carts.
4. **Orders and fulfillment**: checkout, vendor sub-orders, order timelines, stock reservation, cancellation/refunds.
5. **Payments and settlements**: payment initialization/webhooks, payment ledger, commissions, vendor balances, payouts.
6. **Vendor operations**: onboarding, compliance documents, dashboard, products and fulfillment actions.
7. **Admin operations**: vendor/product moderation, category management, order/payment/payout support queues.
8. **Notifications and audit**: email/SMS/in-app events plus immutable records for sensitive changes.

## 4. Core data model

Use UUID primary keys; store money as integer kobo (not floating point); all timestamps in UTC.

| Entity | Important fields / relationships |
| --- | --- |
| `users` | id, name, email (unique), phone (unique when verified), password_hash, role, status, email_verified_at, phone_verified_at. |
| `refresh_sessions` | user_id, hashed_refresh_token, expiry, device/IP metadata, revoked_at. |
| `verification_tokens` | user_id, purpose, hashed_code/token, expires_at, consumed_at, attempt_count. |
| `vendor_profiles` | user_id, store identity/contact/location, status, policies, payout account reference, approved/rejected metadata. |
| `vendor_documents` | vendor_id, type, private object key, status, reviewer/note; never expose public document URLs. |
| `categories` | parent_id, name, Hausa name, slug, image key, active/sort order. |
| `products` | vendor_id, category_id, sku unique per vendor, name, descriptions, price_kobo, status, stock, published_at. |
| `product_images` / `product_variants` | ordered image keys; variant SKU/value/price override/stock. |
| `carts` / `cart_items` | buyer id (or anonymous token), product/variant, quantity; merge after login. |
| `wishlists` | buyer_id + product_id unique pair. |
| `addresses` | buyer_id, recipient, phone, address lines, LGA, landmark, default flag. |
| `orders` | buyer_id, public order number, totals, address snapshot, payment/refund state, overall status. |
| `vendor_orders` | one order per vendor within a checkout; fulfillment status, delivery amount, commission, settlement state. |
| `order_items` | immutable product/vendor/price/name/image snapshots, quantity, review eligibility. |
| `order_events` | order/vendor-order status history; actor, timestamp, payload. |
| `payments` | provider, provider reference, amount_kobo, currency, status, idempotency key, raw webhook ID/reference. |
| `vendor_ledgers` | vendor_order, credit/debit/hold/release/payout entries; derives available balance. |
| `payouts` | vendor_id, amount, destination reference, provider transfer reference, status, failure reason. |
| `reviews` | buyer_id, product_id, order_item_id (unique), rating 1–5, comment, moderation status. |
| `audit_logs` | actor, action, entity, before/after metadata, correlation ID. |

### Critical modeling rules

- Split every multi-vendor checkout into `vendor_orders`; vendors must not see other vendors' buyer/order data.
- Snapshot order-item and delivery details at checkout so later catalog edits do not alter past orders.
- Derive vendor balances from the ledger rather than a mutable `balance` column.
- Store payment tokens/references only. Do not store raw card or bank credentials.
- Enforce the lifecycle/status transitions in one service, not only in the UI.

## 5. API contract (first release)

The frontend currently expects unversioned `/api/...` paths. Implement `/api/v1/...` and update `VITE_API_BASE_URL` plus the two API adapters to prepend `/api/v1`. Return JSON errors in a consistent shape:

```json
{ "error": { "code": "OUT_OF_STOCK", "message": "…", "details": [] }, "requestId": "…" }
```

| Module | Endpoint | Purpose |
| --- | --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` | Create account and maintain secure sessions. |
| Auth | `POST /auth/verify`, `POST /auth/password/forgot`, `POST /auth/password/reset` | Verification and credential recovery. |
| Me | `GET/PATCH /me` | Current user profile. |
| Catalog | `GET /categories`, `GET /products`, `GET /products/:id` | Public catalog; filter by `q`, `category`, `lga`, `minRating`, `maxPrice`, `sort`, pagination. |
| Catalog | `GET /vendors/:id` | Public vendor storefront/profile. |
| Cart | `GET/POST/PATCH/DELETE /cart/items` | Persisted buyer cart; patch by item ID, not product ID, to support variants. |
| Wishlist | `GET /wishlist`, `POST /wishlist/items`, `DELETE /wishlist/items/:productId` | Persisted favorites. |
| Addresses | `GET/POST /addresses`, `PATCH/DELETE /addresses/:id` | Buyer delivery addresses. |
| Payments | `GET /payment-methods`, `POST /payment-methods`, `DELETE /payment-methods/:id` | Saved provider references only. |
| Checkout | `POST /checkout/initialize`, `POST /payments/webhooks/:provider` | Server-calculated checkout and verified provider callback. |
| Orders | `GET /orders`, `GET /orders/:id`, `POST /orders/:id/cancel` | Buyer orders and details. |
| Reviews | `POST /products/:id/reviews` | One verified review per delivered order item. |
| Vendor | `GET/PATCH /vendor/profile`, `POST /vendor/onboarding/submit` | Vendor onboarding/settings. |
| Vendor | `POST /vendor/documents/:type/upload-url`, `POST /vendor/documents/:type/complete` | Signed uploads and safe registration. |
| Vendor | `GET /vendor/dashboard` | Aggregated dashboard metrics. |
| Vendor products | `GET/POST /vendor/products`, `GET/PATCH/DELETE /vendor/products/:id` | Vendor-owned catalog management. |
| Vendor products | `POST /vendor/products/imports` | Upload CSV; return job ID and row-level results endpoint. |
| Vendor orders | `GET /vendor/orders`, `PATCH /vendor/orders/:id/status` | Vendor-only sub-orders and validated status changes. |
| Vendor payouts | `GET /vendor/payouts`, `POST /vendor/payouts` | Ledger-based balance and payout requests. |
| Admin | `/admin/vendors`, `/admin/products`, `/admin/orders`, `/admin/payouts`, `/admin/categories` | Role-protected moderation and operations. |

Use cursor or page/limit pagination on all list endpoints. Return explicit `meta` data such as `total`, `nextCursor`, and filter values.

## 6. Checkout and payment design

1. Buyer submits a cart/item selection and an address/payment method identifier. Do **not** accept the displayed total as authoritative.
2. In one database transaction, load active products/variants, lock inventory rows, validate quantities, calculate product totals, delivery, commission, service fee, and final total.
3. Create an order, vendor sub-orders, item/address snapshots, a pending payment, and a provider payment reference/idempotency key.
4. Initialize the payment with Paystack/Flutterwave and return only the authorization URL/reference required by the browser.
5. Receive the provider webhook, verify its signature, deduplicate by provider event/reference, and mark payment paid/failed. Webhooks—not browser redirects—change paid state.
6. On success, decrement/commit stock, move the order to processing, create vendor-ledger holds, and notify buyer/vendors.
7. Release vendor funds only after the chosen delivery/return window. Payout is an asynchronous, idempotent job with provider callback reconciliation.

For pay-on-delivery, create a separate order/payment state and prevent a vendor payout until delivery confirmation and operational reconciliation.

## 7. Security and operational requirements

- Use Argon2id for passwords, HTTPS everywhere, short-lived access tokens, rotating/revocable refresh tokens, and role/ownership guards.
- Rate-limit login, registration, verification, password reset, checkout, review, and webhook endpoints.
- Validate and normalize Nigerian phone numbers; validate email and all DTOs server-side.
- Restrict document/image types, size, and content; virus-scan documents; private documents use time-limited signed URLs.
- Verify payment webhook signatures and use idempotency keys for checkout, provider calls, and payouts.
- Mask payout account numbers in every response; encrypt sensitive payout-account fields at rest if retained.
- Log authorization-sensitive actions and alert on payment/payout/review anomalies.
- Back up Postgres, test restoration, run migrations in CI, and maintain staging with separate provider credentials.

## 8. Delivery phases

### Phase 0 — Decisions and foundation (1 week)

- Confirm NestJS/Postgres/Prisma choice, payment provider, delivery model, marketplace commission, refund policy, vendor verification policy, and admin roles.
- Create the API repository (or `apps/api`), Docker development stack, environment schema, CI, migrations, OpenAPI docs, health/readiness endpoints, error format, and audit middleware.

### Phase 1 — Identity, catalog, vendor onboarding (2–3 weeks)

- Implement users, sessions, email/SMS verification, roles, categories, public product search/detail, vendor profiles, onboarding, signed document uploads, and the approval workflow.
- Replace buyer authentication/product/category mocks and vendor profile/onboarding mocks.

### Phase 2 — Buyer account and vendor catalog (2 weeks)

- Implement addresses, wishlists, persistent carts, saved payment references, vendor product CRUD, images/variants/stock, CSV import jobs, dashboard metrics.
- Update `BuyerContext` to bootstrap the session/cart from the API and persist token/session handling securely.

### Phase 3 — Checkout, orders, fulfillment (2–3 weeks)

- Implement transactional checkout, multi-vendor order split, payments/webhooks, order timelines, vendor order queue/status transitions, notifications, buyer order details, and review eligibility.
- Integrate one payment method end-to-end in staging before enabling additional methods.

### Phase 4 — Settlements, payouts, admin (2 weeks)

- Implement payment/vendor ledger, settlement window, bank-account verification, payout worker/reconciliation, admin moderation/operations APIs, and admin UI migration away from legacy in-memory state.

### Phase 5 — Hardening and launch readiness (1–2 weeks)

- Add integration/e2e tests, security/rate-limit tests, webhook replay tests, observability, backups/restore drill, load tests for catalog/checkout, UAT, data seeding, and production runbooks.

## 9. Frontend migration checklist

- Add a real token/session strategy to `buyerApiClient.ts`; the current `token` parameter is not persisted or automatically supplied.
- Replace `BuyerContext`’s local cart and wishlist state with API bootstrap/mutations. Keep optimistic updates only with rollback.
- Change cart quantity/removal actions to target a cart-item ID (products may appear in multiple variants).
- Update `buyerApi.ts` and `vendorApi.ts` response mappings to the final OpenAPI contract; do not couple UI types directly to database records.
- Add payment initialization/redirect/polling UI and clear order-success/cancel/failure states.
- Replace vendor document `File` posting with signed-upload flow.
- Extract legacy auth/admin code from `App.tsx` only after the equivalent backend endpoints and modular UI are ready.

## 10. Acceptance criteria for the first production release

- A buyer can register, verify, sign in/out, refresh a session, manage profile/addresses, browse/filter products, save items, and persist a cart across devices.
- A verified vendor can complete onboarding, upload documents, manage only their own products, and process only their own sub-orders.
- Checkout price and availability are always recalculated server-side; payment confirmation comes from a signed webhook; duplicate submissions do not create duplicate orders or charges.
- A paid multi-vendor cart creates correct buyer order and vendor sub-orders, preserves snapshots, decrements stock atomically, and exposes the appropriate data to each role.
- Reviews are limited to eligible delivered items; payouts cannot exceed settled ledger balance or target an unverified destination.
- Admins can approve/reject vendors, moderate catalog/reviews, and diagnose an order/payment/payout using audit logs and request IDs.
- API contract tests and checkout/webhook end-to-end tests pass in CI; staging has verified payment test flows.

## 11. Decisions needed before implementation

1. Which payment provider is preferred for launch: Paystack or Flutterwave?
2. Is delivery fulfilled by vendors, a platform logistics partner, or both? This determines shipping rates, tracking, COD, and settlement release rules.
3. What commission, payout schedule, minimum payout, refund, and return policies apply?
4. Which verification documents and review process are required for vendors?
5. Should buyers sign in by email, phone/OTP, or both? The present UI is email/password with a generic verification code.
6. Is the backend a new repository or a new `apps/api` workspace inside this project?
