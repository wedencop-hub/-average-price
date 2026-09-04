import type { UserRole } from "../lib/domain";

export type Permission =
  | "company:read" | "company:manage"
  | "objects:read" | "objects:write"
  | "estimates:read" | "estimates:write"
  | "finance:read" | "finance:write"
  | "payroll:read" | "payroll:write"
  | "warehouse:read" | "warehouse:write"
  | "production:read" | "production:write"
  | "team:read" | "team:write"
  | "admin:read" | "admin:write";

const permissions: Record<UserRole, readonly Permission[]> = {
  super_admin: ["company:read","company:manage","objects:read","objects:write","estimates:read","estimates:write","finance:read","finance:write","payroll:read","payroll:write","warehouse:read","warehouse:write","production:read","production:write","team:read","team:write","admin:read","admin:write"],
  company_owner: ["company:read","company:manage","objects:read","objects:write","estimates:read","estimates:write","finance:read","finance:write","payroll:read","payroll:write","warehouse:read","warehouse:write","production:read","production:write","team:read","team:write"],
  admin: ["company:read","company:manage","objects:read","objects:write","estimates:read","estimates:write","finance:read","finance:write","payroll:read","payroll:write","warehouse:read","warehouse:write","production:read","production:write","team:read","team:write"],
  manager: ["company:read","objects:read","objects:write","estimates:read","estimates:write","team:read"],
  estimator: ["company:read","objects:read","objects:write","estimates:read","estimates:write"],
  foreman: ["company:read","objects:read","objects:write","production:read","production:write","team:read"],
  installer: ["company:read","objects:read","production:read"],
  accountant: ["company:read","objects:read","estimates:read","finance:read","finance:write","payroll:read","payroll:write"],
  warehouse_manager: ["company:read","objects:read","warehouse:read","warehouse:write","production:read","production:write"],
  production_manager: ["company:read","objects:read","production:read","production:write","warehouse:read","warehouse:write","team:read"],
  viewer: ["company:read","objects:read","estimates:read"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return permissions[role]?.includes(permission) ?? false;
}

export function assertPermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error("FORBIDDEN");
  }
}
