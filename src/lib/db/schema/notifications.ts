import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const notificationTypeEnum = pgEnum('notification_type', [
  'PAYMENT_RECEIVED',
  'EVIDENCE_UPLOADED',
  'EVIDENCE_REJECTED',
  'TARGET_NEAR_COMPLETION',
  'TARGET_DEADLINE_NEAR',
  'PAYMENT_OVERDUE',
  'PURCHASE_COMPLETED',
  'USER_ADDED',
  'PERMISSION_CHANGED',
]);

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: uuid('entity_id'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  readAt: timestamp('read_at', { withTimezone: true }),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
