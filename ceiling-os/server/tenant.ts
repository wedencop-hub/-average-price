import type { Permission } from "./rbac";
import { assertPermission } from "./rbac";
import type { UserRole } from "../lib/domain";

export type TenantContext = {
  userId: string;
  companyId: string;
  role: UserRole;
};

export function assertTenantAccess(context: TenantContext, companyId: string, permission: Permission): void {
  if (context.companyId !== companyId) throw new Error("TENANT_ACCESS_DENIED");
  assertPermission(context.role, permission);
}

export function withTenant<T>(context: TenantContext, companyId: string, permission: Permission, operation: () => T): T {
  assertTenantAccess(context, companyId, permission);
  return operation();
}
