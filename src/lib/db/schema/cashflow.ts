import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  timestamp,
  date,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { classes } from './classes';
import { paymentMethods } from './payment-methods';

export const cashflowTypeEnum = pgEnum('cashflow_type', ['INCOME', 'EXPENSE']);

export const transactionStatusEnum = pgEnum('transaction_status', [
  'PENDING',
  'COMPLETED',
  'CANCELLED',
  'REVERSED',
]);

export const cashflowCategories = pgTable('cashflow_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: cashflowTypeEnum('type').notNull(),
  icon: varchar('icon', { length: 100 }),
  sortOrder: integer('sort_order').notNull().default(0),
  isDefault: varchar('is_default', { length: 5 }).notNull().default('true'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const cashflowTransactions = pgTable('cashflow_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  classId: uuid('class_id')
    .notNull()
    .references(() => classes.id),
  type: cashflowTypeEnum('type').notNull(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => cashflowCategories.id),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  description: text('description'),
  transactionDate: date('transaction_date').notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  targetId: uuid('target_id'),
  purchaseId: uuid('purchase_id'),
  paymentMethodId: uuid('payment_method_id').references(
    () => paymentMethods.id
  ),
  status: transactionStatusEnum('status').notNull().default('COMPLETED'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export type CashflowCategory = typeof cashflowCategories.$inferSelect;
export type NewCashflowCategory = typeof cashflowCategories.$inferInsert;
export type CashflowTransaction = typeof cashflowTransactions.$inferSelect;
export type NewCashflowTransaction = typeof cashflowTransactions.$inferInsert;
