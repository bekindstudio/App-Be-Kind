import app from "./app";
import { logger } from "./lib/logger";
import { seedDatabase } from "./seed";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function initStripe() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) { logger.warn("DATABASE_URL not set, skipping Stripe init"); return; }

    const { runMigrations } = await import('stripe-replit-sync');
    await runMigrations({ databaseUrl });

    const { getStripeSync } = await import('./stripeClient');
    const stripeSync = await getStripeSync();

    const domain = process.env.REPLIT_DOMAINS?.split(',')[0];
    if (domain) {
      const webhookBaseUrl = `https://${domain}`;
      await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
    }

    await stripeSync.syncBackfill();
    logger.info("Stripe initialized successfully");
  } catch (err: any) {
    logger.warn({ err: err.message }, "Stripe initialization failed (non-fatal)");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  await seedDatabase();
  await initStripe();
});
