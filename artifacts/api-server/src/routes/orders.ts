import { Router, type IRouter } from "express";
import { db, ordersTable, customersTable, productsTable } from "@workspace/db";
import { eq, and, type SQL } from "drizzle-orm";
import {
  ListOrdersQueryParams,
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderParams,
  UpdateOrderBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function formatOrder(o: typeof ordersTable.$inferSelect) {
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, o.customerId));
  let product = null;
  if (o.productId) {
    [product] = await db.select().from(productsTable).where(eq(productsTable.id, o.productId));
  }
  return {
    ...o,
    totalPrice: parseFloat(o.totalPrice),
    customerPhone: customer?.phone ?? null,
    customerName: customer?.name ?? null,
    productName: product?.name ?? null,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

router.get("/orders", async (req, res): Promise<void> => {
  const params = ListOrdersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const conditions: SQL[] = [];
  if (params.data.status) conditions.push(eq(ordersTable.status, params.data.status));
  if (params.data.customerId) conditions.push(eq(ordersTable.customerId, params.data.customerId));
  const orders = conditions.length > 0
    ? await db.select().from(ordersTable).where(and(...conditions))
    : await db.select().from(ordersTable);
  const formatted = await Promise.all(orders.map(formatOrder));
  res.json(formatted);
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = { ...parsed.data, totalPrice: String(parsed.data.totalPrice) };
  const [order] = await db.insert(ordersTable).values(data).returning();
  res.status(201).json(await formatOrder(order));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(await formatOrder(order));
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const params = UpdateOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [order] = await db
    .update(ordersTable)
    .set(parsed.data)
    .where(eq(ordersTable.id, params.data.id))
    .returning();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(await formatOrder(order));
});

export default router;
