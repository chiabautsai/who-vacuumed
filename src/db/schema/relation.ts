import { relations } from "drizzle-orm";
import { user } from "./auth-schema";
import { tenant, tenantMember, choreType, choreEntry } from "./main";

// tenant -> tenantMember / choreType / choreEntry
export const tenantRelations = relations(tenant, ({ many }) => ({
  members: many(tenantMember),
  choreTypes: many(choreType),
  choreEntries: many(choreEntry),
}));

// tenantMember -> tenant / user
export const tenantMemberRelations = relations(tenantMember, ({ one }) => ({
  tenant: one(tenant, {
    fields: [tenantMember.tenantId],
    references: [tenant.id],
  }),
  user: one(user, {
    fields: [tenantMember.userId],
    references: [user.id],
  }),
}));

// choreType -> tenant / choreEntry
export const choreTypeRelations = relations(choreType, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [choreType.tenantId],
    references: [tenant.id],
  }),
  choreEntries: many(choreEntry),
}));

// choreEntry -> tenant / choreType / user
export const choreEntryRelations = relations(choreEntry, ({ one }) => ({
  tenant: one(tenant, {
    fields: [choreEntry.tenantId],
    references: [tenant.id],
  }),
  choreType: one(choreType, {
    fields: [choreEntry.choreTypeId],
    references: [choreType.id],
  }),
  user: one(user, {
    fields: [choreEntry.userId],
    references: [user.id],
  }),
}));

// user -> tenantMember / choreEntry
export const userRelations = relations(user, ({ many }) => ({
  memberships: many(tenantMember),
  choreEntries: many(choreEntry),
}));
