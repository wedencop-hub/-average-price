export const ROLES = ['super_admin','company_owner','admin','manager','estimator','foreman','installer','accountant','warehouse_manager','production_manager','viewer'] as const;
export type Role = typeof ROLES[number];
export type UserRole = Role;

export const OBJECT_STATUSES = ['lead','measurement','estimate','contract','deposit_paid','production','ready','delivery','installation','completed','cancelled'] as const;
export type ObjectStatus = typeof OBJECT_STATUSES[number];

export const PLANS = ['FREE','PRO','BUSINESS','ENTERPRISE'] as const;
export type Plan = typeof PLANS[number];

export type Money = { amount: number; currency: 'UAH' | 'USD' | 'EUR' | 'PLN' };

export type CompanyMembership = {
  companyId: string;
  userId: string;
  role: Role;
  isActive: boolean;
};
