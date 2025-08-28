import {
  boolean,
  pgEnum,
  pgTableCreator,
  real,
  timestamp,
  uuid,
  text,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

const pgTable = pgTableCreator((name) => `who-vacuumed_${name}`);

export const roleEnum = pgEnum("role", ["admin", "member", "pending"]);

export const tenant = pgTable("tenant", {
  id: uuid().primaryKey().defaultRandom().notNull(),
  name: text().notNull(),
  description: text(),
  createdAt: timestamp().defaultNow().notNull(),
});

export const tenantMember = pgTable("tenant_member", {
  id: uuid().primaryKey().defaultRandom().notNull(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: roleEnum("role").default("pending").notNull(),
  tenantId: uuid()
    .notNull()
    .references(() => tenant.id, { onDelete: "cascade" }),
  createdAt: timestamp().defaultNow().notNull(),
});

export const choreType = pgTable("chore_type", {
  id: uuid().primaryKey().defaultRandom().notNull(),
  name: text().notNull(),
  description: text(),
  isActive: boolean().default(true).notNull(),
  tenantId: uuid()
    .notNull()
    .references(() => tenant.id, { onDelete: "cascade" }),
  createdAt: timestamp().defaultNow().notNull(),
});

export const choreEntry = pgTable("chore_entry", {
  id: uuid().primaryKey().defaultRandom().notNull(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
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
  comments: text(),
  createdAt: timestamp().defaultNow().notNull(),
});
