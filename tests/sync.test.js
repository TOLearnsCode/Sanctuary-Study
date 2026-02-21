import { describe, it, expect } from "vitest";
import { loadWithSync } from "./helpers.js";

let ctx;

describe("Sync sanitize and merge functions (sync.js)", () => {
  ctx = loadWithSync();

  describe("sanitizeStudyLog", () => {
    it("returns an empty object for null/undefined", () => {
      expect(ctx.sanitizeStudyLog(null)).toEqual({});
      expect(ctx.sanitizeStudyLog(undefined)).toEqual({});
    });

    it("keeps valid date-key entries with positive minutes", () => {
      const log = { "2026-01-15": 45, "2026-01-16": 30 };
      expect(ctx.sanitizeStudyLog(log)).toEqual({ "2026-01-15": 45, "2026-01-16": 30 });
    });

    it("strips entries with invalid date keys", () => {
      const log = { "not-a-date": 10, "2026-01-15": 20 };
      expect(ctx.sanitizeStudyLog(log)).toEqual({ "2026-01-15": 20 });
    });

    it("strips entries with zero or negative minutes", () => {
      const log = { "2026-01-15": 0, "2026-01-16": -5, "2026-01-17": 10 };
      expect(ctx.sanitizeStudyLog(log)).toEqual({ "2026-01-17": 10 });
    });

    it("rounds minutes to 2 decimal places", () => {
      const log = { "2026-01-15": 25.666666 };
      expect(ctx.sanitizeStudyLog(log)).toEqual({ "2026-01-15": 25.67 });
    });

    it("strips NaN and Infinity values", () => {
      const log = { "2026-01-15": NaN, "2026-01-16": Infinity };
      expect(ctx.sanitizeStudyLog(log)).toEqual({});
    });
  });

  describe("sanitizeTagLog", () => {
    it("returns an empty object for null", () => {
      expect(ctx.sanitizeTagLog(null)).toEqual({});
    });

    it("keeps valid nested tag entries", () => {
      const input = { "2026-01-15": { "Math": 30, "Science": 15 } };
      const result = ctx.sanitizeTagLog(input);
      expect(result).toEqual({ "2026-01-15": { "Math": 30, "Science": 15 } });
    });

    it("strips days where all tags are zero or invalid", () => {
      const input = { "2026-01-15": { "Math": 0, "": 10 } };
      expect(ctx.sanitizeTagLog(input)).toEqual({});
    });

    it("strips invalid date keys", () => {
      const input = { "garbage": { "Math": 10 } };
      expect(ctx.sanitizeTagLog(input)).toEqual({});
    });
  });

  describe("sanitizeSessionHistory", () => {
    it("returns an empty array for non-array input", () => {
      expect(ctx.sanitizeSessionHistory(null)).toEqual([]);
      expect(ctx.sanitizeSessionHistory("string")).toEqual([]);
    });

    it("keeps valid session entries", () => {
      const input = [{
        id: "s1",
        timestamp: "2026-01-15T10:00:00.000Z",
        minutes: 25,
        tag: "Math",
        review: "focused"
      }];
      const result = ctx.sanitizeSessionHistory(input);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("s1");
      expect(result[0].tag).toBe("Math");
      expect(result[0].review).toBe("focused");
    });

    it("strips entries missing required fields", () => {
      const input = [
        { id: "", timestamp: "2026-01-15T10:00:00Z", minutes: 25, tag: "Math" },
        { id: "s1", timestamp: "", minutes: 25, tag: "Math" },
        { id: "s2", timestamp: "2026-01-15T10:00:00Z", minutes: 0, tag: "Math" },
        { id: "s3", timestamp: "2026-01-15T10:00:00Z", minutes: 25, tag: "" }
      ];
      expect(ctx.sanitizeSessionHistory(input)).toEqual([]);
    });

    it("normalises review to empty string if not focused/distracted", () => {
      const input = [{
        id: "s1",
        timestamp: "2026-01-15T10:00:00Z",
        minutes: 25,
        tag: "Math",
        review: "random_value"
      }];
      const result = ctx.sanitizeSessionHistory(input);
      expect(result[0].review).toBe("");
    });

    it("deduplicates by ID, keeping the richer entry", () => {
      const input = [
        { id: "s1", timestamp: "2026-01-15T10:00:00Z", minutes: 25, tag: "Math", review: "" },
        { id: "s1", timestamp: "2026-01-15T10:00:00Z", minutes: 25, tag: "Math", review: "focused" }
      ];
      const result = ctx.sanitizeSessionHistory(input);
      expect(result).toHaveLength(1);
      expect(result[0].review).toBe("focused");
    });

    it("sorts by timestamp descending (newest first)", () => {
      const input = [
        { id: "s1", timestamp: "2026-01-10T10:00:00Z", minutes: 25, tag: "A" },
        { id: "s2", timestamp: "2026-01-20T10:00:00Z", minutes: 25, tag: "B" },
        { id: "s3", timestamp: "2026-01-15T10:00:00Z", minutes: 25, tag: "C" }
      ];
      const result = ctx.sanitizeSessionHistory(input);
      expect(result.map((e) => e.id)).toEqual(["s2", "s3", "s1"]);
    });

    it("caps the result at 1200 entries", () => {
      const input = Array.from({ length: 1500 }, (_, i) => ({
        id: `s${i}`,
        timestamp: new Date(2026, 0, 1, 0, 0, i).toISOString(),
        minutes: 10,
        tag: "Test"
      }));
      const result = ctx.sanitizeSessionHistory(input);
      expect(result).toHaveLength(1200);
    });
  });

  describe("mergeStudyLogs", () => {
    it("takes the max minutes per day from local and remote", () => {
      const local = { "2026-01-15": 30, "2026-01-16": 60 };
      const remote = { "2026-01-15": 45, "2026-01-17": 20 };
      const merged = ctx.mergeStudyLogs(local, remote);
      expect(merged["2026-01-15"]).toBe(45);
      expect(merged["2026-01-16"]).toBe(60);
      expect(merged["2026-01-17"]).toBe(20);
    });

    it("handles empty local log", () => {
      const remote = { "2026-01-15": 30 };
      expect(ctx.mergeStudyLogs({}, remote)).toEqual({ "2026-01-15": 30 });
    });

    it("handles empty remote log", () => {
      const local = { "2026-01-15": 30 };
      expect(ctx.mergeStudyLogs(local, {})).toEqual({ "2026-01-15": 30 });
    });

    it("handles both null", () => {
      expect(ctx.mergeStudyLogs(null, null)).toEqual({});
    });
  });

  describe("mergeTagLogs", () => {
    it("merges tags per day, taking max minutes per tag", () => {
      const local = { "2026-01-15": { "Math": 30, "Science": 20 } };
      const remote = { "2026-01-15": { "Math": 45, "History": 15 } };
      const merged = ctx.mergeTagLogs(local, remote);
      expect(merged["2026-01-15"]["Math"]).toBe(45);
      expect(merged["2026-01-15"]["Science"]).toBe(20);
      expect(merged["2026-01-15"]["History"]).toBe(15);
    });
  });

  describe("mergeSessionHistory", () => {
    it("combines and deduplicates sessions from both sources", () => {
      const local = [
        { id: "s1", timestamp: "2026-01-15T10:00:00Z", minutes: 25, tag: "Math" }
      ];
      const remote = [
        { id: "s2", timestamp: "2026-01-16T10:00:00Z", minutes: 30, tag: "Science" }
      ];
      const merged = ctx.mergeSessionHistory(local, remote);
      expect(merged).toHaveLength(2);
      expect(merged.map((e) => e.id)).toContain("s1");
      expect(merged.map((e) => e.id)).toContain("s2");
    });

    it("deduplicates by ID across sources", () => {
      const local = [
        { id: "s1", timestamp: "2026-01-15T10:00:00Z", minutes: 25, tag: "Math", review: "focused" }
      ];
      const remote = [
        { id: "s1", timestamp: "2026-01-15T10:00:00Z", minutes: 25, tag: "Math", review: "" }
      ];
      const merged = ctx.mergeSessionHistory(local, remote);
      expect(merged).toHaveLength(1);
      // Remote is processed first, then local — local has review, so it should win
      expect(merged[0].review).toBe("focused");
    });
  });
});
