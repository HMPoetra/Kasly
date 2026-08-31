import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  date,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { classes } from './classes';
import { users } from './users';
import { roles } from './roles';
import { savingsTargets, visibilityTypeEnum, visibilityRuleTypeEnum } from './targets';
import { paymentMethods } from './payment-methods';

export const purchaseStatusEnum = pgEnum('purchase_status', [
  'PLANNED',
  'WAITING',
  'PURCHASED',
  'RECEIVED',
  'CANCELLED',
]);

export const purchaseItemStatusEnum = pgEnum('purchase_item_status', [
  'PLANNED',
  'WAITING',
  'PURCHASED',
  'RECEIVED',
  'CANCELLED',
]);

export const purchases = pgTable('purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  classId: uuid('class_id')
    .notNull()
    .references(() => classes.id),
  targetId: uuid('target_id').references(() => savingsTargets.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  budget: numeric('budget', { precision: 15, scale: 2 }),
  actualAmount: numeric('actual_amount', { precision: 15, scale: 2 }).default('0'),
  status: purchaseStatusEnum('status').notNull().default('PLANNED'),
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

export const purchaseItems = pgTable('purchase_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  purchaseId: uuid('purchase_id')
    .notNull()
    .references(() => purchases.id, { onDelete: 'cascade' }),
  product: varchar('product', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),
  total: numeric('total', { precision: 15, scale: 2 }).notNull(),
  seller: varchar('seller', { length: 255 }),
  purchaseDate: date('purchase_date'),
  paymentMethodId: uuid('payment_method_id').references(
    () => paymentMethods.id
  ),
  status: purchaseItemStatusEnum('status').notNull().default('PLANNED'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const purchaseVisibilityRules = pgTable('purchase_visibility_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  purchaseId: uuid('purchase_id')
    .notNull()
    .references(() => purchases.id, { onDelete: 'cascade' }),
  type: visibilityRuleTypeEnum('type').notNull(),
  roleId: uuid('role_id').references(() => roles.id),
  userId: uuid('user_id').references(() => users.id),
});

export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
export type PurchaseItem = typeof purchaseItems.$inferSelect;
export type NewPurchaseItem = typeof purchaseItems.$inferInsert;
