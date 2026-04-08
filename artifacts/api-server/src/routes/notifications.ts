import { Router } from "express";
import { db, usersTable, notificationsTable, notificationReadsTable } from "@workspace/db";
import { eq, desc, sql, and, isNull, or } from "drizzle-orm";
import { getUserIdFromRequest } from "./auth";

const router = Router();

router.get("/", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Non autorizzato" }); return; }

  const rows = await db
    .select({
      id: notificationsTable.id,
      title: notificationsTable.title,
      body: notificationsTable.body,
      type: notificationsTable.type,
      createdAt: notificationsTable.createdAt,
      readAt: notificationReadsTable.readAt,
    })
    .from(notificationsTable)
    .leftJoin(
      notificationReadsTable,
      and(
        eq(notificationReadsTable.notificationId, notificationsTable.id),
        eq(notificationReadsTable.userId, userId)
      )
    )
    .where(
      or(
        isNull(notificationsTable.targetUserId),
        eq(notificationsTable.targetUserId, userId)
      )
    )
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  res.json(
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      type: r.type,
      isRead: !!r.readAt,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.get("/unread-count", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Non autorizzato" }); return; }

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notificationsTable)
    .leftJoin(
      notificationReadsTable,
      and(
        eq(notificationReadsTable.notificationId, notificationsTable.id),
        eq(notificationReadsTable.userId, userId)
      )
    )
    .where(
      and(
        or(
          isNull(notificationsTable.targetUserId),
          eq(notificationsTable.targetUserId, userId)
        ),
        isNull(notificationReadsTable.id)
      )
    );

  res.json({ count: result?.count ?? 0 });
});

router.patch("/:id/read", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Non autorizzato" }); return; }

  const notificationId = parseInt(req.params.id);
  if (isNaN(notificationId)) { res.status(400).json({ error: "ID non valido" }); return; }

  await db
    .insert(notificationReadsTable)
    .values({ notificationId, userId })
    .onConflictDoNothing();

  res.json({ success: true });
});

router.post("/read-all", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Non autorizzato" }); return; }

  const unread = await db
    .select({ id: notificationsTable.id })
    .from(notificationsTable)
    .leftJoin(
      notificationReadsTable,
      and(
        eq(notificationReadsTable.notificationId, notificationsTable.id),
        eq(notificationReadsTable.userId, userId)
      )
    )
    .where(
      and(
        or(
          isNull(notificationsTable.targetUserId),
          eq(notificationsTable.targetUserId, userId)
        ),
        isNull(notificationReadsTable.id)
      )
    );

  if (unread.length > 0) {
    await db.insert(notificationReadsTable).values(
      unread.map((n) => ({ notificationId: n.id, userId }))
    ).onConflictDoNothing();
  }

  res.json({ success: true });
});

export { router as notificationsRouter };
