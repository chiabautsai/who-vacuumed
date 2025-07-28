import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  auth0Id: text('auth0_id').unique().notNull(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  picture: text('picture'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

// Chore types table
export const choreTypes = sqliteTable('chore_types', {
  id: text('id').primaryKey(),
  name: text('name').unique().notNull(),
  description: text('description'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

// Chore entries table
export const choreEntries = sqliteTable('chore_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  choreTypeId: text('chore_type_id').notNull(),
  completionPercentage: real('completion_percentage').notNull(),
  comments: text('comments'),
  completedAt: integer('completed_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  choreEntries: many(choreEntries)
}))

export const choreTypesRelations = relations(choreTypes, ({ many }) => ({
  choreEntries: many(choreEntries)
}))

export const choreEntriesRelations = relations(choreEntries, ({ one }) => ({
  user: one(users, {
    fields: [choreEntries.userId],
    references: [users.id]
  }),
  choreType: one(choreTypes, {
    fields: [choreEntries.choreTypeId],
    references: [choreTypes.id]
  })
}))