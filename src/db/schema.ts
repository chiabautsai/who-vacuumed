import {
  boolean,
  pgEnum,
  pgTableCreator,
  real,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const pgTable = pgTableCreator((name) => `who-vacuumed_${name}`);

export const roleEnum = pgEnum("role", ["admin", "member", "pending"]);

export const tenant = pgTable("tenant", {
  id: uuid().primaryKey().defaultRandom().notNull(),
  name: varchar().notNull(),
  description: varchar(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const tenantMember = pgTable("tenant_member", {
  id: uuid().primaryKey().defaultRandom().notNull(),
  userId: varchar().notNull(),
  role: roleEnum("role").default("pending").notNull(),
  tenantId: uuid()
    .notNull()
    .references(() => tenant.id, { onDelete: "cascade" }),
  createdAt: timestamp().defaultNow().notNull(),
});

export const choreType = pgTable("chore_type", {
  id: uuid().primaryKey().defaultRandom().notNull(),
  name: varchar().notNull(),
  description: varchar(),
  isActive: boolean().default(true).notNull(),
  tenantId: uuid()
    .notNull()
    .references(() => tenant.id, { onDelete: "cascade" }),
  createdAt: timestamp().defaultNow().notNull(),
});

export const choreEntry = pgTable("chore_entry", {
  id: uuid().primaryKey().defaultRandom().notNull(),
  userId: varchar().notNull(),
  choreTypeId: uuid()
    .notNull()
    .references(() => choreType.id, {
      onDelete: "cascade",
    }),
  tenantId: uuid()
    .notNull()
    .references(() => tenant.id, {
      onDelete: "cascade",
    }),
  completionPercentage: real().notNull(),
  comments: varchar(),
  createdAt: timestamp().defaultNow().notNull(),
});
