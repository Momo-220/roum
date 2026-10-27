import { describe, expect, it } from "vitest";
import { PERMISSIONS, PERMISSION_CODES, isPermissionCode, permissionCodeSchema } from "../src/permissions";
import { STATUS_CODE_REGEX, SYSTEM_STATUS_CODES } from "../src/statuses";

describe("catalogue des permissions", () => {
  it("ne contient aucun code en double", () => {
    expect(new Set(PERMISSION_CODES).size).toBe(PERMISSIONS.length);
  });

  it("utilise un format de code cohérent (minuscules, points)", () => {
    for (const code of PERMISSION_CODES) {
      expect(code).toMatch(/^[a-z]+(\.[a-z]+)+$/);
    }
  });

  it("n'expose aucune permission de gestion des rôles ou des employés (réservée au Super Admin)", () => {
    for (const code of PERMISSION_CODES) {
      expect(code.startsWith("roles.")).toBe(false);
      expect(code.startsWith("users.")).toBe(false);
    }
  });

  it("valide uniquement les codes du catalogue", () => {
    expect(isPermissionCode("shipments.create")).toBe(true);
    expect(isPermissionCode("roles.manage")).toBe(false);
    expect(isPermissionCode(42)).toBe(false);
    expect(permissionCodeSchema.safeParse("shipments.create").success).toBe(true);
    expect(permissionCodeSchema.safeParse("admin.all").success).toBe(false);
  });
});

describe("statuts système", () => {
  it("respectent le format des codes statut", () => {
    for (const code of SYSTEM_STATUS_CODES) {
      expect(code).toMatch(STATUS_CODE_REGEX);
    }
  });

  it.each(["draft", "1DRAFT", "D", "EN TRANSIT", "A".repeat(41)])("refuse le code %j", (code) => {
    expect(STATUS_CODE_REGEX.test(code)).toBe(false);
  });
});
