import { Router } from "express";
import { db, ordersTable, orderItemsTable, shopOrdersTable, shopOrderItemsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getUserIdFromRequest } from "./auth";

const router = Router();

const IVA_RATE = 0.10;

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const DELIVERY_INFO = {
  name: "0541 S.R.L.S",
  address: "Via Carducci, 118",
  city: "47841 Cattolica (RN)",
  country: "Italia",
  phone: "+39 0541 830 123",
  email: "info@bekindcommunity.it",
  website: "www.bekindcommunity.it",
  piva: "IT04554910408",
  cf: "",
};

const BOTTEGA_INFO = {
  name: "Be Kind di Michael Balleroni",
  address: "Via C. Menotti, 184",
  city: "61122 Pesaro (PU)",
  country: "Italia",
  phone: "+39 0541 830 123",
  email: "info@bekindcommunity.it",
  website: "www.bekindcommunity.it",
  piva: "IT02871720419",
  cf: "BLLMHL95D22C357W",
};

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function generateReceiptNumber(orderNumber: string, createdAt: Date | string): string {
  const d = new Date(createdAt);
  const year = d.getFullYear();
  return `RIC-${year}-${orderNumber}`;
}

type BusinessInfo = typeof DELIVERY_INFO;

function generateReceiptHTML(data: {
  receiptNumber: string;
  orderNumber: string;
  date: string;
  time: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  codiceFiscale: string | null;
  billingAddress: string | null;
  orderType: string;
  paymentMethod: string | null;
  items: Array<{ name: string; quantity: number; unitPrice: number; subtotal: number }>;
  subtotal: number;
  deliveryCost?: number;
  shippingCost?: number;
  total: number;
  isShop?: boolean;
  businessInfo: BusinessInfo;
}): string {
  const ivaAmount = data.total * IVA_RATE / (1 + IVA_RATE);
  const imponibile = data.total - ivaAmount;

  const extraCostLabel = data.isShop ? "Spedizione" : "Consegna";
  const extraCost = data.isShop ? (data.shippingCost || 0) : (data.deliveryCost || 0);

  const orderTypeLabel = data.isShop
    ? "Acquisto Bottega"
    : data.orderType === "delivery" ? "Ordine con Consegna" : "Ordine da Asporto";

  const paymentLabel = data.paymentMethod === "card" ? "Carta di Credito" : data.paymentMethod === "cash" ? "Contanti" : "Non specificato";

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ricevuta ${escapeHtml(data.receiptNumber)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; background: #f5f3f0; padding: 20px; }
  .receipt { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #C09A7C 0%, #a07c5e 100%); color: white; padding: 32px 28px; text-align: center; }
  .header h1 { font-size: 24px; font-weight: 700; letter-spacing: 2px; margin-bottom: 4px; }
  .header p { font-size: 12px; opacity: 0.85; line-height: 1.6; }
  .receipt-title { text-align: center; padding: 20px 28px 0; }
  .receipt-title h2 { font-size: 18px; color: #C09A7C; font-weight: 600; }
  .receipt-title .receipt-num { font-size: 13px; color: #888; margin-top: 4px; }
  .section { padding: 16px 28px; }
  .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; font-weight: 600; margin-bottom: 10px; border-bottom: 1px solid #f0ece8; padding-bottom: 6px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .info-item { }
  .info-item .label { font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-item .value { font-size: 13px; font-weight: 500; margin-top: 2px; }
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: 600; text-align: left; padding: 8px 0; border-bottom: 1px solid #f0ece8; }
  .items-table th:last-child { text-align: right; }
  .items-table td { font-size: 13px; padding: 10px 0; border-bottom: 1px solid #f8f6f3; }
  .items-table td:last-child { text-align: right; font-weight: 500; }
  .items-table .qty { color: #C09A7C; font-weight: 600; }
  .totals { border-top: 2px solid #f0ece8; padding-top: 12px; margin-top: 4px; }
  .total-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
  .total-row.muted { color: #888; }
  .total-row.grand { font-size: 18px; font-weight: 700; color: #333; padding-top: 10px; margin-top: 6px; border-top: 2px solid #C09A7C; }
  .footer { background: #faf8f5; padding: 20px 28px; text-align: center; border-top: 1px solid #f0ece8; }
  .footer p { font-size: 11px; color: #999; line-height: 1.6; }
  .footer .legal { font-size: 9px; color: #bbb; margin-top: 12px; line-height: 1.5; }
  @media print {
    body { background: white; padding: 0; }
    .receipt { box-shadow: none; border-radius: 0; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <h1>BE KIND</h1>
    <p>${data.businessInfo.address} — ${data.businessInfo.city}<br>${data.businessInfo.phone} — ${data.businessInfo.email}</p>
  </div>

  <div class="receipt-title">
    <h2>Ricevuta Fiscale</h2>
    <div class="receipt-num">N. ${escapeHtml(data.receiptNumber)}</div>
  </div>

  <div class="section">
    <div class="section-title">Dati Ordine</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">Data</div>
        <div class="value">${escapeHtml(data.date)}</div>
      </div>
      <div class="info-item">
        <div class="label">Ora</div>
        <div class="value">${escapeHtml(data.time)}</div>
      </div>
      <div class="info-item">
        <div class="label">N. Ordine</div>
        <div class="value">${escapeHtml(data.orderNumber)}</div>
      </div>
      <div class="info-item">
        <div class="label">Tipo</div>
        <div class="value">${escapeHtml(orderTypeLabel)}</div>
      </div>
      <div class="info-item">
        <div class="label">Pagamento</div>
        <div class="value">${escapeHtml(paymentLabel)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Dati Cliente</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">Nome</div>
        <div class="value">${escapeHtml(data.customerName)}</div>
      </div>
      <div class="info-item">
        <div class="label">Email</div>
        <div class="value">${escapeHtml(data.customerEmail)}</div>
      </div>
      ${data.customerPhone ? `<div class="info-item">
        <div class="label">Telefono</div>
        <div class="value">${escapeHtml(data.customerPhone)}</div>
      </div>` : ""}
      ${data.codiceFiscale ? `<div class="info-item">
        <div class="label">Codice Fiscale / P.IVA</div>
        <div class="value" style="font-family: monospace; letter-spacing: 1px;">${escapeHtml(data.codiceFiscale)}</div>
      </div>` : ""}
      ${data.billingAddress ? `<div class="info-item" style="grid-column: span 2;">
        <div class="label">Indirizzo di Fatturazione</div>
        <div class="value">${escapeHtml(data.billingAddress)}</div>
      </div>` : ""}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Dettaglio Articoli</div>
    <table class="items-table">
      <thead>
        <tr>
          <th>Qtà</th>
          <th>Descrizione</th>
          <th>Prezzo Unit.</th>
          <th>Totale</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map(item => `
        <tr>
          <td class="qty">${item.quantity}x</td>
          <td>${escapeHtml(item.name)}</td>
          <td>€${item.unitPrice.toFixed(2)}</td>
          <td>€${item.subtotal.toFixed(2)}</td>
        </tr>`).join("")}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row muted">
        <span>Subtotale</span>
        <span>€${data.subtotal.toFixed(2)}</span>
      </div>
      ${extraCost > 0 ? `<div class="total-row muted">
        <span>${extraCostLabel}</span>
        <span>€${extraCost.toFixed(2)}</span>
      </div>` : extraCost === 0 && (data.isShop || data.orderType === "delivery") ? `<div class="total-row muted">
        <span>${extraCostLabel}</span>
        <span>Gratuita</span>
      </div>` : ""}
      <div class="total-row muted">
        <span>Imponibile</span>
        <span>€${imponibile.toFixed(2)}</span>
      </div>
      <div class="total-row muted">
        <span>IVA (10%)</span>
        <span>€${ivaAmount.toFixed(2)}</span>
      </div>
      <div class="total-row grand">
        <span>Totale (IVA incl.)</span>
        <span>€${data.total.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p><strong>${data.businessInfo.name}</strong><br>
    P.IVA: ${data.businessInfo.piva}${data.businessInfo.cf ? ` — C.F.: ${data.businessInfo.cf}` : ""}<br>
    ${data.businessInfo.address}, ${data.businessInfo.city}</p>
    <div class="legal">
      Documento fiscale emesso ai sensi del D.P.R. 633/1972 e successive modificazioni.<br>
      Questo documento non sostituisce la fattura elettronica ai fini IVA se non espressamente richiesta.
    </div>
  </div>
</div>

<div class="no-print" style="text-align: center; margin-top: 20px;">
  <button onclick="window.print()" style="background: #C09A7C; color: white; border: none; padding: 12px 32px; border-radius: 12px; font-size: 14px; cursor: pointer; font-weight: 600;">
    Stampa / Salva PDF
  </button>
</div>
</body>
</html>`;
}

router.get("/orders/:id/receipt", async (req, res): Promise<void> => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) { res.status(400).json({ error: "ID ordine non valido" }); return; }

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order || order.userId !== userId) { res.status(404).json({ error: "Ordine non trovato" }); return; }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "Utente non trovato" }); return; }

    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));

    const html = generateReceiptHTML({
      receiptNumber: generateReceiptNumber(order.orderNumber, order.createdAt),
      orderNumber: order.orderNumber,
      date: formatDate(order.createdAt),
      time: formatTime(order.createdAt),
      customerName: order.billingName || `${user.firstName} ${user.lastName}`,
      customerEmail: user.email,
      customerPhone: user.phone || "",
      codiceFiscale: order.codiceFiscale || user.codiceFiscale || null,
      billingAddress: order.billingAddress || order.deliveryAddress || null,
      orderType: order.type,
      paymentMethod: order.paymentMethod || null,
      items: items.map(i => ({
        name: i.dishName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
      })),
      subtotal: order.subtotal,
      deliveryCost: order.deliveryCost,
      total: order.total,
      businessInfo: DELIVERY_INFO,
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    console.error("Error generating restaurant receipt:", err);
    res.status(500).json({ error: "Errore nella generazione della ricevuta" });
  }
});

router.get("/shop/orders/:id/receipt", async (req, res): Promise<void> => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) { res.status(400).json({ error: "ID ordine non valido" }); return; }

    const [order] = await db.select().from(shopOrdersTable).where(eq(shopOrdersTable.id, orderId)).limit(1);
    if (!order || order.userId !== userId) { res.status(404).json({ error: "Ordine non trovato" }); return; }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "Utente non trovato" }); return; }

    const items = await db.select().from(shopOrderItemsTable).where(eq(shopOrderItemsTable.shopOrderId, orderId));

    const html = generateReceiptHTML({
      receiptNumber: generateReceiptNumber(order.orderNumber, order.createdAt),
      orderNumber: order.orderNumber,
      date: formatDate(order.createdAt),
      time: formatTime(order.createdAt),
      customerName: order.billingName || `${user.firstName} ${user.lastName}`,
      customerEmail: user.email,
      customerPhone: user.phone || "",
      codiceFiscale: order.codiceFiscale || user.codiceFiscale || null,
      billingAddress: order.billingAddress || order.shippingAddress || null,
      orderType: "shop",
      paymentMethod: order.paymentMethod || null,
      items: items.map(i => ({
        name: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      total: order.total,
      isShop: true,
      businessInfo: BOTTEGA_INFO,
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    console.error("Error generating shop receipt:", err);
    res.status(500).json({ error: "Errore nella generazione della ricevuta" });
  }
});

export { router as receiptsRouter };
