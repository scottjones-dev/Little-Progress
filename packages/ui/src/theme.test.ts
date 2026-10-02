import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { app } from "@repo/config/app";
import { describe, expect, it } from "vitest";

const read = (...parts: string[]) =>
  readFileSync(path.join(import.meta.dirname, ...parts), "utf-8");

const webCss = read("styles", "globals.css");
const nativeCss = read("..", "..", "..", "apps", "native", "src", "global.css");

/** The `--name: value` pairs inside the first block that starts with `selector {`. */
const tokens = (css: string, selector: string) => {
  const start = css.indexOf(`${selector} {`);
  const block = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries(
    [...block.matchAll(/--(?<name>[\w-]+):\s*(?<value>[^;]+);/gu)].map(
      (match) => [match.groups?.name ?? "", (match.groups?.value ?? "").trim()]
    )
  );
};

const light = tokens(webCss, ":root");
const dark = tokens(webCss, ".dark");

const luminance = (hex: string) => {
  const [red = 0, green = 0, blue = 0] = [1, 3, 5].map((index) => {
    const channel = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrast = (first: string, second: string) => {
  const [lighter = 0, darker = 0] = [
    luminance(first),
    luminance(second),
  ].toSorted((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
};

describe("brand colours", () => {
  it("the dark theme uses the colours from @repo/config", () => {
    const colors = Object.fromEntries(
      Object.entries(app.colors).map(([name, value]) => [
        name,
        value.toLowerCase(),
      ])
    );

    expect({
      background: dark.background,
      border: dark.border,
      card: dark.card,
      foreground: dark.foreground,
      mutedForeground: dark["muted-foreground"],
      primary: dark.primary,
      primaryForeground: dark["primary-foreground"],
    }).toStrictEqual({
      background: colors.obsidian,
      border: colors.border,
      card: colors.surface,
      foreground: colors.mist,
      mutedForeground: colors.muted,
      primary: colors.gold,
      primaryForeground: colors.goldText,
    });
  });

  it("the native app's tokens are the same colours", () => {
    const native = tokens(nativeCss, "@theme");
    const fromNative = Object.fromEntries(
      Object.keys(app.colors).map((name) => {
        const key = name.replaceAll(
          /[A-Z]/gu,
          (letter) => `-${letter.toLowerCase()}`
        );
        return [name, native[`color-${key}`]];
      })
    );
    const fromConfig = Object.fromEntries(
      Object.entries(app.colors).map(([name, value]) => [
        name,
        value.toLowerCase(),
      ])
    );

    expect(fromNative).toStrictEqual(fromConfig);
  });
});

describe("accessibility of the themes", () => {
  const textPairs = [
    ["foreground", "background"],
    ["card-foreground", "card"],
    ["popover-foreground", "popover"],
    ["primary-foreground", "primary"],
    ["secondary-foreground", "secondary"],
    ["muted-foreground", "muted"],
    ["muted-foreground", "background"],
    ["accent-foreground", "accent"],
    ["destructive", "background"],
    ["sidebar-foreground", "sidebar"],
    ["sidebar-primary-foreground", "sidebar-primary"],
  ] as const;

  it.each([
    ["light", light],
    ["dark", dark],
  ] as const)("every text pair in %s is at least 4.5:1", (_name, theme) => {
    const low = textPairs.filter(
      ([text, background]) =>
        contrast(theme[text] ?? "", theme[background] ?? "") < 4.5
    );

    expect(low).toStrictEqual([]);
  });

  it.each([
    ["light", light],
    ["dark", dark],
  ] as const)(
    "form control borders and focus rings in %s are at least 3:1",
    (_name, theme) => {
      expect(
        contrast(theme.input ?? "", theme.background ?? "")
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrast(theme.ring ?? "", theme.background ?? "")
      ).toBeGreaterThanOrEqual(3);
    }
  );

  it.each([
    ["light", light, "card"],
    ["dark", dark, "card"],
  ] as const)(
    "every chart colour in %s is at least 3:1 against the card",
    (_name, theme, card) => {
      const charts = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];
      const low = charts.filter(
        (name) => contrast(theme[name] ?? "", theme[card] ?? "") < 3
      );

      expect(low).toStrictEqual([]);
    }
  );
});

describe("package exports", () => {
  it("point at folders and files that exist", () => {
    // SAFETY: this is our own package.json, whose "exports" is an object of strings.
    const manifest = JSON.parse(read("..", "package.json")) as {
      exports: Record<string, string>;
    };
    const missing = Object.values(manifest.exports)
      .map((target) =>
        path.join(import.meta.dirname, "..", target.split("*")[0] ?? "")
      )
      .filter((target) => !existsSync(target));

    expect(missing).toStrictEqual([]);
  });

  it("include the helper every component and the website use", () => {
    expect(
      existsSync(path.join(import.meta.dirname, "lib", "utils.ts"))
    ).toBeTruthy();
  });
});
