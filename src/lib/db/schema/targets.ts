import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  date,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { classes } from './classes';
import { users } from './users';
import { roles } from './roles';

export const targetStatusEnum = pgEnum('target_status', [
  'PLANNED',
  'ACTIVE',
  'PAUSED',
  'ACHIEVED',
  'CANCELLED',
]);

export const visibilityTypeEnum = pgEnum('visibility_type', [
  'PUBLIC',
  'ROLE_BASED',
  'USER_BASED',
  'PRIVATE',
]);

export const visibilityRuleTypeEnum = pgEnum('visibility_rule_type', [
  'ROLE',
  'USER',
]);

export const savingsTargets = pgTable('savings_targets', {
  id: uuid('id').primaryKey().defaultRandom(),
  classId: uuid('class_id')
    .notNull()
    .references(() => classes.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  targetAmount: numeric('target_amount', { precision: 15, scale: 2 }).notNull(),
  currentAmount: numeric('current_amount', { precision: 15, scale: 2 })
    .notNull()
    .default('0'),
  startDate: date('start_date'),
  targetDate: date('target_date'),
  status: targetStatusEnum('status').notNull().default('PLANNED'),
  visibility: visibilityTypeEnum('visibility').notNull().default('PUBLIC'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const targetVisibilityRules = pgTable('target_visibility_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetId: uuid('target_id')
    .notNull()
    .references(() => savingsTargets.id, { onDelete: 'cascade' }),
  type: visibilityRuleTypeEnum('type').notNull(),
  roleId: uuid('role_id').references(() => roles.id),
  userId: uuid('user_id').references(() => users.id),
});

export const targetContributors = pgTable('target_contributors', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetId: uuid('target_id')
    .notNull()
    .references(() => savingsTargets.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  contributedAt: timestamp('contributed_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type SavingsTarget = typeof savingsTargets.$inferSelect;
export type NewSavingsTarget = typeof savingsTargets.$inferInsert;
