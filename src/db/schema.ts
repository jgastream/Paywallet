import {
  pgTable,
  serial,
  varchar,
  integer,
  text,
  timestamp,
  jsonb,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Accounts — identified by a 9-char secret key (no email/password)
export const accounts = pgTable(
  "accounts",
  {
    id: serial("id").primaryKey(),
    secretKey: varchar("secret_key", { length: 9 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("secret_key_idx").on(t.secretKey)]
);

// Wallets — one per account
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id),
  balance: integer("balance").notNull().default(0),
  lockedBalance: integer("locked_balance").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id),
  type: varchar("type", { length: 50 }).notNull(),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("MWK"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  txRef: varchar("tx_ref", { length: 255 }),
  chargeId: varchar("charge_id", { length: 255 }),
  meta: jsonb("meta"),
  isLocked: boolean("is_locked").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
