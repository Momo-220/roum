/**
 * Identifiant fixe du rôle système Super Admin.
 * Ce rôle est créé par la migration de seed, marqué `is_system = 1`, protégé en base par triggers,
 * et passe automatiquement toutes les vérifications de permissions.
 */
export const SUPER_ADMIN_ROLE_ID = "SUPER_ADMIN" as const;

export function isSuperAdminRole(roleId: string): boolean {
  return roleId === SUPER_ADMIN_ROLE_ID;
}
