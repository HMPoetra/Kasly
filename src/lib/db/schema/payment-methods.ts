import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { classes } from './classes';
import { users } from './users';

export const paymentMethodStatusEnum = pgEnum('payment_method_status', [
  'ACTIVE',
  'INACTIVE',
]);

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  classId: uuid('class_id').references(() => classes.id),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  icon: varchar('icon', { length: 100 }),
  status: paymentMethodStatusEnum('status').notNull().default('ACTIVE'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;
