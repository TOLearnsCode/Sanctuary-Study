import { describe, it, expect } from "vitest";
import { loadApp } from "./helpers.js";

let ctx;

describe("Utility functions (app.js)", () => {
  // Load once for all tests in this file
  ctx = loadApp();

  describe("createLocalId", () => {
    it("returns a string starting with the given prefix", () => {
      const id = ctx.createLocalId("session");
      expect(id).toBeTypeOf("string");
      expect(id.startsWith("session_")).toBe(true);
    });

    it("generates unique IDs on successive calls", () => {
      const a = ctx.createLocalId("test");
      const b = ctx.createLocalId("test");
      expect(a).not.toBe(b);
    });

    it("works with an empty prefix", () => {
      const id = ctx.createLocalId("");
      expect(id).toBeTypeOf("string");
      expect(id.startsWith("_")).toBe(true);
    });
  });

  describe("shortenUrl", () => {
    it("returns short URLs unchanged", () => {
      expect(ctx.shortenUrl("https://example.com")).toBe("https://example.com");
    });

    it("returns URLs at exactly 48 chars unchanged", () => {
      const url48 = "https://example.com/path/" + "a".repeat(23);
      expect(url48.length).toBe(48);
      expect(ctx.shortenUrl(url48)).toBe(url48);
    });

    it("truncates URLs longer than 48 chars to 45 + ellipsis", () => {
      const longUrl = "https://example.com/" + "a".repeat(40);
      const result = ctx.shortenUrl(longUrl);
      expect(result.length).toBe(48);
      expect(result.endsWith("...")).toBe(true);
      expect(result).toBe(longUrl.slice(0, 45) + "...");
    });
  });

  describe("pickRandom", () => {
    it("returns an element from the given array", () => {
      const items = ["a", "b", "c", "d"];
      const result = ctx.pickRandom(items);
      expect(items).toContain(result);
    });

    it("returns the only element from a single-item array", () => {
      expect(ctx.pickRandom([42])).toBe(42);
    });
  });

  describe("shuffleCopy", () => {
    it("returns a new array (does not mutate the original)", () => {
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];
      const shuffled = ctx.shuffleCopy(original);
      expect(original).toEqual(copy); // original unchanged
      expect(shuffled).not.toBe(original); // different reference
    });

    it("returns an array of the same length with the same elements", () => {
      const items = [10, 20, 30, 40, 50];
      const shuffled = ctx.shuffleCopy(items);
      expect(shuffled).toHaveLength(items.length);
      expect(shuffled.sort((a, b) => a - b)).toEqual(items.sort((a, b) => a - b));
    });

    it("handles an empty array", () => {
      expect(ctx.shuffleCopy([])).toEqual([]);
    });

    it("handles a single-element array", () => {
      expect(ctx.shuffleCopy([99])).toEqual([99]);
    });
  });

  describe("clampMinutes", () => {
    it("returns the value when within range", () => {
      expect(ctx.clampMinutes(25, 1, 240)).toBe(25);
    });

    it("clamps to min when value is below range", () => {
      expect(ctx.clampMinutes(0, 1, 240)).toBe(1);
      expect(ctx.clampMinutes(-5, 1, 240)).toBe(1);
    });

    it("clamps to max when value is above range", () => {
      expect(ctx.clampMinutes(999, 1, 240)).toBe(240);
    });

    it("rounds to nearest integer", () => {
      expect(ctx.clampMinutes(25.7, 1, 240)).toBe(26);
      expect(ctx.clampMinutes(25.3, 1, 240)).toBe(25);
    });

    it("returns min for non-numeric input", () => {
      expect(ctx.clampMinutes("abc", 1, 240)).toBe(1);
      expect(ctx.clampMinutes(undefined, 1, 240)).toBe(1);
      expect(ctx.clampMinutes(null, 5, 120)).toBe(5);
      expect(ctx.clampMinutes(NaN, 10, 60)).toBe(10);
    });

    it("handles string numbers", () => {
      expect(ctx.clampMinutes("50", 1, 240)).toBe(50);
    });
  });

  describe("parseDateKey", () => {
    it("parses a YYYY-MM-DD string to a Date at midnight local time", () => {
      const date = ctx.parseDateKey("2026-01-15");
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getDate()).toBe(15);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
    });

    it("returns an invalid Date for garbage input", () => {
      const date = ctx.parseDateKey("not-a-date");
      expect(isNaN(date.getTime())).toBe(true);
    });
  });
});
