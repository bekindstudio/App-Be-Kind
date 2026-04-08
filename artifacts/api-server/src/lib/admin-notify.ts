import { db, notificationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

type NotificationType = "order" | "reservation" | "promotion" | "event" | "system" | "loyalty";

export async function notifyAdmins(title: string, body: string, type: NotificationType = "system") {
  const admins = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.isAdmin, true));

  const notifications = admins.map(admin => ({
    title,
    body,
    type,
    targetUserId: admin.id,
  }));

  if (notifications.length === 0) {
    await db.insert(notificationsTable).values({ title, body, type, targetUserId: null });
    return;
  }

  await Promise.all(notifications.map(n => db.insert(notificationsTable).values(n)));
}
