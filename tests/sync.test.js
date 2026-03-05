import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";
import { loadWithSync } from "./helpers.js";

let ctx;
const ROOT = resolve(import.meta.dirname, "..");

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

  describe("sync regression guards", () => {
    it("uses parent-relative firebase import path in sync.js", () => {
      const source = readFileSync(resolve(ROOT, "js/sync.js"), "utf8");
      expect(source.includes('import("../firebase.js")')).toBe(true);
      expect(source.includes('import("./firebase.js")')).toBe(false);
    });

    it("returns false and sets error state when ensureCloudSyncClient fails", async () => {
      ctx.cloudSyncReady = false;
      ctx.cloudSyncDb = null;
      ctx.cloudSyncApi = null;
      ctx.currentUser = { uid: "u_1" };
      ctx.authMode = "user";
      ctx.syncIndicatorState = "idle";

      const ok = await ctx.ensureCloudSyncClient();
      expect(ok).toBe(false);
      expect(ctx.syncIndicatorState).toBe("error");
    });
  });

  describe("syncNow behavior", () => {
    it("returns false when analytics are unavailable (guest/not signed in)", async () => {
      ctx.authMode = "guest";
      ctx.currentUser = null;
      const result = await ctx.syncNow();
      expect(result).toBe(false);
    });

    it("returns true when at least one sync operation succeeds", async () => {
      const originalPushUserDocToCloud = ctx.pushUserDocToCloud;
      const originalPushAnalyticsToCloud = ctx.pushAnalyticsToCloud;
      const originalRefreshAnalyticsFromCloud = ctx.refreshAnalyticsFromCloud;

      ctx.authMode = "user";
      ctx.currentUser = { uid: "u_2" };
      ctx.pushUserDocToCloud = async () => true;
      ctx.pushAnalyticsToCloud = async () => false;
      ctx.refreshAnalyticsFromCloud = async () => false;

      const result = await ctx.syncNow();
      expect(result).toBe(true);

      ctx.pushUserDocToCloud = originalPushUserDocToCloud;
      ctx.pushAnalyticsToCloud = originalPushAnalyticsToCloud;
      ctx.refreshAnalyticsFromCloud = originalRefreshAnalyticsFromCloud;
    });

    it("returns false and sets error state when all sync operations fail", async () => {
      const originalPushUserDocToCloud = ctx.pushUserDocToCloud;
      const originalPushAnalyticsToCloud = ctx.pushAnalyticsToCloud;
      const originalRefreshAnalyticsFromCloud = ctx.refreshAnalyticsFromCloud;

      ctx.authMode = "user";
      ctx.currentUser = { uid: "u_3" };
      ctx.syncIndicatorState = "idle";
      ctx.pushUserDocToCloud = async () => false;
      ctx.pushAnalyticsToCloud = async () => false;
      ctx.refreshAnalyticsFromCloud = async () => false;

      const result = await ctx.syncNow();
      expect(result).toBe(false);
      expect(ctx.syncIndicatorState).toBe("error");

      ctx.pushUserDocToCloud = originalPushUserDocToCloud;
      ctx.pushAnalyticsToCloud = originalPushAnalyticsToCloud;
      ctx.refreshAnalyticsFromCloud = originalRefreshAnalyticsFromCloud;
    });
  });

  describe("renderSyncStatus button gating", () => {
    function makeClassList() {
      const classes = new Set();
      return {
        add: (...values) => values.forEach((v) => classes.add(v)),
        remove: (...values) => values.forEach((v) => classes.delete(v)),
        toggle: (value, force) => {
          if (force === true) {
            classes.add(value);
            return true;
          }
          if (force === false) {
            classes.delete(value);
            return false;
          }
          if (classes.has(value)) {
            classes.delete(value);
            return false;
          }
          classes.add(value);
          return true;
        },
        contains: (value) => classes.has(value)
      };
    }

    it("enables Sync Now only for signed-in, online, idle state", () => {
      ctx.syncStatusPrimary = { textContent: "" };
      ctx.syncStatusSecondary = { textContent: "" };
      ctx.syncStatusDot = { classList: makeClassList() };
      ctx.syncNowBtn = { disabled: true };
      ctx.lastSuccessfulSyncAt = "";
      ctx.navigator.onLine = true;

      ctx.authMode = "user";
      ctx.syncIndicatorState = "idle";
      ctx.renderSyncStatus();
      expect(ctx.syncNowBtn.disabled).toBe(false);

      ctx.authMode = "guest";
      ctx.syncIndicatorState = "idle";
      ctx.renderSyncStatus();
      expect(ctx.syncNowBtn.disabled).toBe(true);

      ctx.authMode = "user";
      ctx.syncIndicatorState = "syncing";
      ctx.renderSyncStatus();
      expect(ctx.syncNowBtn.disabled).toBe(true);
    });
  });
});
