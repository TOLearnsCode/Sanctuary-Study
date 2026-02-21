import { describe, it, expect } from "vitest";
import { loadWithMusic } from "./helpers.js";

let ctx;

describe("extractYouTubeVideoId (music.js)", () => {
  ctx = loadWithMusic();

  it("extracts ID from standard watch URL", () => {
    expect(ctx.extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
      .toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from watch URL without www", () => {
    expect(ctx.extractYouTubeVideoId("https://youtube.com/watch?v=dQw4w9WgXcQ"))
      .toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from short youtu.be URL", () => {
    expect(ctx.extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ"))
      .toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from embed URL", () => {
    expect(ctx.extractYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ"))
      .toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from shorts URL", () => {
    expect(ctx.extractYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"))
      .toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from live URL", () => {
    expect(ctx.extractYouTubeVideoId("https://www.youtube.com/live/dQw4w9WgXcQ"))
      .toBe("dQw4w9WgXcQ");
  });

  it("extracts ID when extra query params are present", () => {
    expect(ctx.extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120&list=PLtest"))
      .toBe("dQw4w9WgXcQ");
  });

  it("returns null for a YouTube URL with no video ID", () => {
    expect(ctx.extractYouTubeVideoId("https://www.youtube.com/")).toBeNull();
  });

  it("returns null for a non-YouTube URL", () => {
    expect(ctx.extractYouTubeVideoId("https://vimeo.com/12345")).toBeNull();
  });

  it("returns null for invalid/garbage input", () => {
    expect(ctx.extractYouTubeVideoId("not a url")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(ctx.extractYouTubeVideoId("")).toBeNull();
  });
});

describe("buildYouTubeWatchUrl (music.js)", () => {
  it("constructs a proper watch URL from a video ID", () => {
    expect(ctx.buildYouTubeWatchUrl("dQw4w9WgXcQ"))
      .toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  });
});

describe("getYouTubeWatchUrl (music.js)", () => {
  it("converts a short URL to a standard watch URL", () => {
    expect(ctx.getYouTubeWatchUrl("https://youtu.be/abc123"))
      .toBe("https://www.youtube.com/watch?v=abc123");
  });

  it("normalises an embed URL to a watch URL", () => {
    expect(ctx.getYouTubeWatchUrl("https://www.youtube.com/embed/xyz789"))
      .toBe("https://www.youtube.com/watch?v=xyz789");
  });

  it("returns null for a non-YouTube URL", () => {
    expect(ctx.getYouTubeWatchUrl("https://vimeo.com/12345")).toBeNull();
  });
});
