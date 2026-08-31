import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { roles } from './roles';

export const classStatusEnum = pgEnum('class_status', ['ACTIVE', 'ARCHIVED']);

export const classMemberStatusEnum = pgEnum('class_member_status', [
  'ACTIVE',
  'INACTIVE',
  'LEFT',
]);

export const classes = pgTable('classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  academicYear: varchar('academic_year', { length: 20 }),
  status: classStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const classMembers = pgTable('class_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  classId: uuid('class_id')
    .notNull()
    .references(() => classes.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id),
  status: classMemberStatusEnum('status').notNull().default('ACTIVE'),
  joinedAt: timestamp('joined_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;
export type ClassMember = typeof classMembers.$inferSelect;
export type NewClassMember = typeof classMembers.$inferInsert;
