# Pantolingo Stripe Integration

## Design Decisions

- **Stripe isolation**: Stripe IDs stored in `stripe_account`, not on `account` — vendor-agnostic
- **Plan expiry**: `account.plan_expires_at` updated on each `invoice.paid` webhook
- **Free tier**: Every account defaults to Free plan; no `stripe_account` row needed

## Schema

### New table: `stripe_plan`

Maps our plans to Stripe Product/Price IDs. One row per plan. Only needed for paid plans.

```sql
stripe_plan (
  plan_code text PRIMARY KEY REFERENCES plan(code),
  stripe_product_id text NOT NULL,
  stripe_price_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

### New table: `stripe_account`

Stripe billing details per account. One row per account, created only when account interacts with Stripe. Free tier accounts have no row.

```sql
stripe_account (
  account_id integer PRIMARY KEY REFERENCES account(id),
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

### New table: `stripe_payment`

Invoice ledger — one row per Stripe payment event. Populated via `invoice.paid` webhook.

```sql
stripe_payment (
  id serial PRIMARY KEY,
  account_id integer NOT NULL REFERENCES account(id),
  plan_code text NOT NULL REFERENCES plan(code),
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL,            -- 'paid', 'open', 'void', 'uncollectible'
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  stripe_invoice_id text,
  stripe_hosted_url text,
  billing_reason text,             -- 'subscription_create', 'subscription_cycle', 'subscription_update'
  created_at timestamptz DEFAULT now()
)
```

### Stripe Webhook Flow

1. `invoice.paid` → Insert `stripe_payment` row, update `account.plan_expires_at` to `period_end`
2. `invoice.payment_failed` → Notify customer
3. `customer.subscription.updated` → Update `account.plan_code` if plan changed, update `stripe_account.stripe_subscription_id`
4. `customer.subscription.deleted` → Set `account.plan_code` to Free plan
