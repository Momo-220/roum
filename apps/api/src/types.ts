export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  APP_NAME: string;
  JWT_SECRET?: string;
}

export interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  roleId: string;
  roleName: string;
  isSuperAdmin: boolean;
  hubLocation: string | null;
  permissions: string[];
  allowedStatuses: string[];
}
