import { describe, it, expect } from "vitest";
import { loadConstants } from "./helpers.js";

let ctx;

describe("Constants integrity (constants.js)", () => {
  ctx = loadConstants();

  describe("DOWNLOADED_LOFI_TRACKS", () => {
    it("is a non-empty array", () => {
      expect(Array.isArray(ctx.DOWNLOADED_LOFI_TRACKS)).toBe(true);
      expect(ctx.DOWNLOADED_LOFI_TRACKS.length).toBeGreaterThan(0);
    });

    it("every track has required fields: id, title, artist, url, source, attribution", () => {
      for (const track of ctx.DOWNLOADED_LOFI_TRACKS) {
        expect(track.id).toBeTypeOf("string");
        expect(track.id.length).toBeGreaterThan(0);
        expect(track.title).toBeTypeOf("string");
        expect(track.title.length).toBeGreaterThan(0);
        expect(track.artist).toBeTypeOf("string");
        expect(track.url).toBeTypeOf("string");
        expect(track.url).toMatch(/^music\//);
        expect(track.source).toBeTypeOf("string");
        expect(track.attribution).toBeTypeOf("string");
      }
    });

    it("has no duplicate track IDs", () => {
      const ids = ctx.DOWNLOADED_LOFI_TRACKS.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("STREAK_ACHIEVEMENTS", () => {
    it("is a non-empty array", () => {
      expect(Array.isArray(ctx.STREAK_ACHIEVEMENTS)).toBe(true);
      expect(ctx.STREAK_ACHIEVEMENTS.length).toBeGreaterThan(0);
    });

    it("every achievement has id, days, title, message", () => {
      for (const a of ctx.STREAK_ACHIEVEMENTS) {
        expect(a.id).toBeTypeOf("string");
        expect(a.days).toBeTypeOf("number");
        expect(a.days).toBeGreaterThan(0);
        expect(a.title).toBeTypeOf("string");
        expect(a.message).toBeTypeOf("string");
      }
    });

    it("is sorted by ascending days", () => {
      const days = ctx.STREAK_ACHIEVEMENTS.map((a) => a.days);
      for (let i = 1; i < days.length; i++) {
        expect(days[i]).toBeGreaterThanOrEqual(days[i - 1]);
      }
    });

    it("has no duplicate IDs", () => {
      const ids = ctx.STREAK_ACHIEVEMENTS.map((a) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("RARE_ACHIEVEMENTS", () => {
    it("is a non-empty array", () => {
      expect(Array.isArray(ctx.RARE_ACHIEVEMENTS)).toBe(true);
      expect(ctx.RARE_ACHIEVEMENTS.length).toBeGreaterThan(0);
    });

    it("every achievement has id, title, message, hint, label", () => {
      for (const a of ctx.RARE_ACHIEVEMENTS) {
        expect(a.id).toBeTypeOf("string");
        expect(a.title).toBeTypeOf("string");
        expect(a.message).toBeTypeOf("string");
        expect(a.hint).toBeTypeOf("string");
        expect(a.label).toBeTypeOf("string");
      }
    });

    it("has no IDs that overlap with streak achievements", () => {
      const streakIds = new Set(ctx.STREAK_ACHIEVEMENTS.map((a) => a.id));
      for (const a of ctx.RARE_ACHIEVEMENTS) {
        expect(streakIds.has(a.id)).toBe(false);
      }
    });
  });

  describe("AVAILABLE_COLOR_THEMES", () => {
    it("includes expected themes", () => {
      expect(ctx.AVAILABLE_COLOR_THEMES).toContain("dark");
      expect(ctx.AVAILABLE_COLOR_THEMES).toContain("light");
      expect(ctx.AVAILABLE_COLOR_THEMES.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("defaultSettings", () => {
    it("is an object with expected timer properties", () => {
      const s = ctx.defaultSettings;
      expect(s).toBeDefined();
      expect(s.studyMinutes).toBeTypeOf("number");
      expect(s.breakMinutes).toBeTypeOf("number");
      expect(s.dailyGoalMinutes).toBeTypeOf("number");
      expect(s.studyMinutes).toBeGreaterThan(0);
      expect(s.breakMinutes).toBeGreaterThan(0);
    });

    it("has a valid color theme", () => {
      expect(ctx.AVAILABLE_COLOR_THEMES).toContain(ctx.defaultSettings.theme);
    });
  });

  describe("BUILTIN_MUSIC_PRESETS", () => {
    it("is a non-empty array", () => {
      expect(Array.isArray(ctx.BUILTIN_MUSIC_PRESETS)).toBe(true);
      expect(ctx.BUILTIN_MUSIC_PRESETS.length).toBeGreaterThan(0);
    });

    it("every preset has id, title, artist, mode", () => {
      for (const p of ctx.BUILTIN_MUSIC_PRESETS) {
        expect(p.id).toBeTypeOf("string");
        expect(p.title).toBeTypeOf("string");
        expect(p.artist).toBeTypeOf("string");
        expect(p.mode).toBeTypeOf("string");
      }
    });

    it("has no duplicate preset IDs", () => {
      const ids = ctx.BUILTIN_MUSIC_PRESETS.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
