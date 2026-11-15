#!/usr/bin/env bash
# Forward Stripe test-mode events to a deploy preview, so a sandbox purchase reaches the preview's database.
#   npm run stripe:preview -- 22
# Needs the Stripe CLI, signed in with `stripe login`. Leave it running while you test.
# The signing secret the CLI prints must match the preview's STRIPE_WEBHOOK_SECRET.
set -euo pipefail

pr="${1:?Give the pull request number, e.g. npm run stripe:preview -- 22}"
command -v stripe >/dev/null || { echo "Install the Stripe CLI first: brew install stripe/stripe-cli/stripe"; exit 1; }

url="https://deploy-preview-${pr}--emruz-website.netlify.app/api/stripe/webhook"
# The same events the production webhook handles (src/app/api/stripe/webhook/route.ts)
events="checkout.session.completed,invoice.paid,invoice.payment_failed,customer.subscription.updated,customer.subscription.deleted,charge.refunded,charge.dispute.closed"
echo "Forwarding Stripe test events to $url"
exec stripe listen --events "$events" --forward-to "$url"
