import {
  pgTable,
  uuid,
  integer,
  numeric,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { classes } from './classes';
import { users } from './users';
import { paymentMethods } from './payment-methods';

export const contributionStatusEnum = pgEnum('contribution_status', [
  'ACTIVE',
  'CLOSED',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PAID',
  'PARTIAL',
  'PENDING',
  'UNPAID',
]);

export const contributions = pgTable('contributions', {
  id: uuid('id').primaryKey().defaultRandom(),
  classId: uuid('class_id')
    .notNull()
    .references(() => classes.id),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  amountPerWeek: numeric('amount_per_week', { precision: 15, scale: 2 }).notNull(),
  status: contributionStatusEnum('status').notNull().default('ACTIVE'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const contributionPayments = pgTable('contribution_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  contributionId: uuid('contribution_id')
    .notNull()
    .references(() => contributions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  weekNumber: integer('week_number').notNull(),
  paymentMethodId: uuid('payment_method_id').references(
    () => paymentMethods.id
  ),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  status: paymentStatusEnum('status').notNull().default('UNPAID'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Contribution = typeof contributions.$inferSelect;
export type NewContribution = typeof contributions.$inferInsert;
export type ContributionPayment = typeof contributionPayments.$inferSelect;
export type NewContributionPayment = typeof contributionPayments.$inferInsert;
