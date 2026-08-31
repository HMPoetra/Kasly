// ============================================
// KASLY — Core Type Definitions
// ============================================

// ---- Enums ----

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum CashflowType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REVERSED = 'REVERSED',
}

export enum ContributionStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export enum PaymentStatus {
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  PENDING = 'PENDING',
  UNPAID = 'UNPAID',
}

export enum TargetStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ACHIEVED = 'ACHIEVED',
  CANCELLED = 'CANCELLED',
}

export enum PurchaseStatus {
  PLANNED = 'PLANNED',
  WAITING = 'WAITING',
  PURCHASED = 'PURCHASED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export enum EvidenceStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum VisibilityType {
  PUBLIC = 'PUBLIC',
  ROLE_BASED = 'ROLE_BASED',
  USER_BASED = 'USER_BASED',
  PRIVATE = 'PRIVATE',
}

export enum VisibilityRuleType {
  ROLE = 'ROLE',
  USER = 'USER',
}

export enum ClassStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum ClassMemberStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LEFT = 'LEFT',
}

export enum PaymentMethodStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum NotificationType {
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  EVIDENCE_UPLOADED = 'EVIDENCE_UPLOADED',
  EVIDENCE_REJECTED = 'EVIDENCE_REJECTED',
  TARGET_NEAR_COMPLETION = 'TARGET_NEAR_COMPLETION',
  TARGET_DEADLINE_NEAR = 'TARGET_DEADLINE_NEAR',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  PURCHASE_COMPLETED = 'PURCHASE_COMPLETED',
  USER_ADDED = 'USER_ADDED',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',
}

// ---- Resource & Action Constants ----

export const RESOURCES = [
  'users',
  'roles',
  'cashflow',
  'contribution',
  'target',
  'purchase',
  'evidence',
  'reports',
  'audit',
  'settings',
] as const;

export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = ['create', 'read', 'update', 'delete', 'export'] as const;

export type Action = (typeof ACTIONS)[number];

export type PermissionString = `${Resource}.${Action}`;

// ---- UI Types ----

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  permission?: PermissionString;
  children?: NavItem[];
}

export interface ChartFilter {
  period: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: Date;
  endDate?: Date;
  category?: string;
  paymentMethod?: string;
  status?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---- Financial Types ----

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  totalSavingsTarget: number;
  totalSavingsAchieved: number;
  totalUnpaidContributions: number;
  totalMembers: number;
}

export interface MonthlyBreakdown {
  month: number;
  year: number;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  total: number;
  percentage: number;
}

// ---- Session Types ----

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  gender: Gender;
  avatarUrl: string | null;
  classId: string | null;
  roleId: string | null;
  roleName: string | null;
  permissions: PermissionString[];
}
