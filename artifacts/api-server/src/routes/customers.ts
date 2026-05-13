import { Router, type IRouter } from "express";
import { db, customersTable } from "@workspace/db";
import { eq, ilike, and, type SQL } from "drizzle-orm";
import {
  ListCustomersQueryParams,
  GetCustomerParams,
  UpdateCustomerParams,
  UpdateCustomerBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatCustomer(c: typeof customersTable.$inferSelect) {
  return {
    ...c,
    lastSeen: c.lastSeen?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/customers", async (req, res): Promise<void> => {
  const params = ListCustomersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const conditions: SQL[] = [];
  if (params.data.search) {
    conditions.push(ilike(customersTable.phone, `%${params.data.search}%`));
  }
  if (params.data.vip !== undefined) {
    conditions.push(eq(customersTable.isVip, params.data.vip));
  }
  if (params.data.blocked !== undefined) {
    conditions.push(eq(customersTable.isBlocked, params.data.blocked));
  }
  const customers =
    conditions.length > 0
      ? await db.select().from(customersTable).where(and(...conditions))
      : await db.select().from(customersTable);
  res.json(customers.map(formatCustomer));
});

router.get("/customers/:id", async (req, res): Promise<void> => {
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, params.data.id));
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json(formatCustomer(customer));
});

router.patch("/customers/:id", async (req, res): Promise<void> => {
  const params = UpdateCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [customer] = await db
    .update(customersTable)
    .set(parsed.data)
    .where(eq(customersTable.id, params.data.id))
    .returning();
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json(formatCustomer(customer));
});

export default router;
