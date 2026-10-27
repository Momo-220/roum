import { describe, expect, it } from "vitest";
import {
  QUOTE_REFERENCE_REGEX,
  REFERENCE_ALPHABET,
  formatReferencePeriod,
  generateQuoteReference,
  generateReferenceSuffix,
  generateTrackingNumber,
  isValidTrackingNumber,
  normalizeTrackingNumber,
  type TransportType,
} from "../src/references";

const fixedBytes = (values: number[]) => () => Uint8Array.from(values);

describe("alphabet des références", () => {
  it("contient exactement 32 caractères uniques", () => {
    expect(REFERENCE_ALPHABET).toHaveLength(32);
    expect(new Set(REFERENCE_ALPHABET).size).toBe(32);
  });

  it("exclut les caractères ambigus 0, O, 1, I", () => {
    for (const ambiguous of ["0", "O", "1", "I"]) {
      expect(REFERENCE_ALPHABET).not.toContain(ambiguous);
    }
  });
});

describe("generateReferenceSuffix", () => {
  it("projette chaque octet sans biais (octet & 31)", () => {
    // 0 -> '2', 31 -> 'Z', 32 -> '2' (même résidu), 255 -> 'Z'
    expect(generateReferenceSuffix(fixedBytes([0, 31, 32, 255, 1, 33]))).toBe("2Z2Z33");
  });

  it("refuse une source d'aléa qui ne fournit pas le bon nombre d'octets", () => {
    expect(() => generateReferenceSuffix(fixedBytes([1, 2, 3]))).toThrow();
  });

  it("utilise uniquement l'alphabet autorisé avec l'aléa réel", () => {
    for (let i = 0; i < 500; i++) {
      for (const char of generateReferenceSuffix()) {
        expect(REFERENCE_ALPHABET).toContain(char);
      }
    }
  });
});

describe("formatReferencePeriod", () => {
  it("formate en AAMM", () => {
    expect(formatReferencePeriod(new Date("2026-10-27T12:00:00Z"))).toBe("2610");
    expect(formatReferencePeriod(new Date("2030-01-05T12:00:00Z"))).toBe("3001");
  });

  it("utilise l'UTC (pas le fuseau local) au changement de mois", () => {
    // 31 octobre 23h30 UTC = déjà le 1er novembre à Dubaï (UTC+4).
    // La référence doit rester "2610" quel que soit le fuseau du serveur.
    expect(formatReferencePeriod(new Date("2026-10-31T23:30:00Z"))).toBe("2610");
  });

  it("refuse une date invalide", () => {
    expect(() => formatReferencePeriod(new Date("pas une date"))).toThrow();
  });
});

describe("generateTrackingNumber", () => {
  const date = new Date("2026-10-27T12:00:00Z");

  it.each(["AIR", "SEA", "ROAD"] as const)("produit un numéro valide pour %s", (type) => {
    const tracking = generateTrackingNumber(type, date);
    expect(tracking).toMatch(new RegExp(`^RM-${type}-2610-[${REFERENCE_ALPHABET}]{6}$`));
    expect(isValidTrackingNumber(tracking)).toBe(true);
  });

  it("est déterministe avec une source d'aléa fixe", () => {
    expect(generateTrackingNumber("AIR", date, fixedBytes([0, 1, 2, 3, 4, 5]))).toBe("RM-AIR-2610-234567");
  });

  it("refuse un type de transport inconnu", () => {
    expect(() => generateTrackingNumber("TRAIN" as TransportType, date)).toThrow();
  });
});

describe("isValidTrackingNumber", () => {
  it.each([
    ["RM-AIR-2610-K8P9Q2", true],
    ["RM-SEA-2601-ABCDEF", true],
    ["RM-AIR-2613-K8P9Q2", false], // mois 13
    ["RM-AIR-2600-K8P9Q2", false], // mois 00
    ["RM-AIR-2610-K8P9Q0", false], // '0' interdit dans le suffixe
    ["RM-AIR-2610-K8P9QO", false], // 'O' interdit
    ["RM-AIR-2610-k8p9q2", false], // minuscules : il faut normaliser d'abord
    ["RM-BUS-2610-K8P9Q2", false],
    ["RM-AIR-2610-K8P9Q22", false],
    ["", false],
  ])("%s -> %s", (value, expected) => {
    expect(isValidTrackingNumber(value)).toBe(expected);
  });
});

describe("normalizeTrackingNumber", () => {
  it.each([
    ["RM-AIR-2610-K8P9Q2", "RM-AIR-2610-K8P9Q2"],
    [" rm-air-2610-k8p9q2 ", "RM-AIR-2610-K8P9Q2"],
    ["rm air 2610 k8p9q2", "RM-AIR-2610-K8P9Q2"],
    ["RMAIR2610K8P9Q2", "RM-AIR-2610-K8P9Q2"],
    ["RM--SEA--2610--ABCDEF", "RM-SEA-2610-ABCDEF"],
  ])("%j -> %s", (input, expected) => {
    expect(normalizeTrackingNumber(input)).toBe(expected);
  });

  it.each(["", "RM-AIR", "RM-AIR-2610-K8P9Q0", "RM-AIR-2613-K8P9Q2", "XX-AIR-2610-K8P9Q2", "<script>"])(
    "renvoie null pour %j",
    (input) => {
      expect(normalizeTrackingNumber(input)).toBeNull();
    },
  );
});

describe("generateQuoteReference", () => {
  it("produit une référence de devis valide", () => {
    const ref = generateQuoteReference(new Date("2026-10-27T12:00:00Z"));
    expect(ref).toMatch(QUOTE_REFERENCE_REGEX);
    expect(ref.startsWith("DEV-2610-")).toBe(true);
  });
});
