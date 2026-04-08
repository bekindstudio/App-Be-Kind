import { Router } from "express";
import { db, cartItemsTable, ordersTable, orderItemsTable, usersTable, loyaltyTransactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUserIdFromRequest, computeLoyaltyLevel } from "./auth";
import { getUncachableStripeClient, getStripePublishableKey } from "../stripeClient";

const router = Router();

const DELIVERY_COST = 2.50;
const FREE_DELIVERY_THRESHOLD = 25;
const IVA_RATE = 0.10;

function generateOrderNumber(): string {
  return `BK${Date.now().toString().slice(-8)}`;
}

router.get("/config", async (_req, res): Promise<void> => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (err: any) {
    res.status(500).json({ error: "Stripe non configurato" });
  }
});

router.post("/create-checkout-session", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { type, deliveryAddress, pickupTime, notes, codiceFiscale, gdprConsent } = req.body;

  if (!gdprConsent) {
    res.status(400).json({ error: "È necessario accettare l'informativa sulla privacy" });
    return;
  }

  if (!type || !["delivery", "takeaway"].includes(type)) {
    res.status(400).json({ error: "Tipo ordine non valido" });
    return;
  }

  if (type === "delivery" && !deliveryAddress) {
    res.status(400).json({ error: "Indirizzo di consegna obbligatorio" });
    return;
  }

  if (type === "takeaway" && !pickupTime) {
    res.status(400).json({ error: "Orario di ritiro obbligatorio" });
    return;
  }

  const cartItems = await db.select().from(cartItemsTable).where(eq(cartItemsTable.userId, userId));
  if (cartItems.length === 0) {
    res.status(400).json({ error: "Il carrello è vuoto" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "Utente non trovato" }); return; }

  const subtotal = cartItems.reduce((sum, i) => sum + (i.dishPrice * i.quantity), 0);
  const deliveryCost = type === "delivery" ? (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_COST) : 0;
  const total = subtotal + deliveryCost;

  try {
    const stripe = await getUncachableStripeClient();

    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost';
    const baseUrl = `https://${domain}`;

    const lineItems = cartItems.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.dishName,
          metadata: { dishId: String(item.dishId) },
        },
        unit_amount: Math.round(item.dishPrice * 100),
      },
      quantity: item.quantity,
    }));

    if (type === "delivery" && deliveryCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Costo Consegna',
            metadata: { type: 'delivery_fee' },
          },
          unit_amount: Math.round(deliveryCost * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/orders?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/order/checkout?payment=cancelled`,
      customer_email: user.email,
      metadata: {
        userId: String(userId),
        orderType: type,
        deliveryAddress: deliveryAddress || '',
        pickupTime: pickupTime || '',
        notes: notes || '',
        codiceFiscale: codiceFiscale || '',
      },
      locale: 'it',
      payment_intent_data: {
        metadata: {
          userId: String(userId),
          orderType: type,
        },
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ error: "Errore nella creazione del pagamento" });
  }
});

router.post("/confirm-order", async (req, res): Promise<void> => {
  const userId = getUserIdFromRequest(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { sessionId, type, deliveryAddress, pickupTime, notes, codiceFiscale, paymentMethod } = req.body;

  if (!type || !["delivery", "takeaway"].includes(type)) {
    res.status(400).json({ error: "Tipo ordine non valido" });
    return;
  }

  const cartItems = await db.select().from(cartItemsTable).where(eq(cartItemsTable.userId, userId));
  if (cartItems.length === 0) {
    res.status(400).json({ error: "Il carrello è vuoto" });
    return;
  }

  const subtotal = cartItems.reduce((sum, i) => sum + (i.dishPrice * i.quantity), 0);
  const deliveryCost = type === "delivery" ? (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_COST) : 0;
  const total = subtotal + deliveryCost;
  const ivaAmount = total * IVA_RATE / (1 + IVA_RATE);
  const pointsEarned = Math.floor(total);

  if (paymentMethod === "card" && sessionId) {
    try {
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid') {
        res.status(400).json({ error: "Pagamento non completato" });
        return;
      }
    } catch (err: any) {
      res.status(400).json({ error: "Sessione di pagamento non valida" });
      return;
    }
  }

  const [order] = await db.insert(ordersTable).values({
    userId,
    orderNumber: generateOrderNumber(),
    type,
    status: "received",
    subtotal,
    deliveryCost,
    total,
    deliveryAddress: deliveryAddress ?? null,
    pickupTime: pickupTime ?? null,
    estimatedDeliveryTime: type === "delivery" ? 40 : 25,
    notes: notes ?? null,
    pointsEarned,
  }).returning();

  await Promise.all(cartItems.map(item =>
    db.insert(orderItemsTable).values({
      orderId: order.id,
      dishId: item.dishId,
      dishName: item.dishName,
      quantity: item.quantity,
      unitPrice: item.dishPrice,
      subtotal: item.dishPrice * item.quantity,
      customizations: item.customizations,
    })
  ));

  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (user) {
    const newPoints = user.loyaltyPoints + pointsEarned;
    const newLevel = computeLoyaltyLevel(newPoints);
    await db.update(usersTable).set({ loyaltyPoints: newPoints, loyaltyLevel: newLevel }).where(eq(usersTable.id, userId));
    await db.insert(loyaltyTransactionsTable).values({
      userId,
      points: pointsEarned,
      type: "earned",
      reason: `Ordine #${order.orderNumber}`,
    });
  }

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));

  res.status(201).json({
    id: order.id,
    orderNumber: order.orderNumber,
    type: order.type,
    status: order.status,
    items: items.map(i => ({
      id: i.id,
      dishId: i.dishId,
      dishName: i.dishName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
      customizations: i.customizations,
    })),
    subtotal: order.subtotal,
    deliveryCost: order.deliveryCost,
    total: order.total,
    ivaAmount,
    deliveryAddress: order.deliveryAddress,
    pickupTime: order.pickupTime,
    estimatedDeliveryTime: order.estimatedDeliveryTime,
    notes: order.notes,
    pointsEarned: order.pointsEarned,
    paymentMethod: paymentMethod || "cash",
    codiceFiscale: codiceFiscale || null,
    createdAt: order.createdAt,
  });
});

export { router as paymentsRouter };
