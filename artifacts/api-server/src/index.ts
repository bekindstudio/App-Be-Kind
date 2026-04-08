import app from "./app";
import { logger } from "./lib/logger";
import { seedDatabase } from "./seed";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

  try {
    const [adminUser] = await db.select({ id: usersTable.id, isAdmin: usersTable.isAdmin }).from(usersTable).where(eq(usersTable.email, "balleronicomunicazione@gmail.com")).limit(1);
    if (adminUser && !adminUser.isAdmin) {
      await db.update(usersTable).set({ isAdmin: true }).where(eq(usersTable.id, adminUser.id));
      logger.info("Set admin flag for balleronicomunicazione@gmail.com");
    }
  } catch (e) {}

  await initStripe();
});
