export const app = {
  api: { basePath: "/api", port: 9000 },
  author: {
    email: "scottjones@alicesystems.co.uk",
    name: "Scott Jones",
    url: "https://alicesystems.co.uk",
  },
  backgroundColor: "#0F1012",
  colors: {
    border: "#2A2C31",
    gold: "#D97706",
    goldText: "#0F1012",
    mist: "#E2E8F0",
    muted: "#94A3B8",
    obsidian: "#0F1012",
    surface: "#17181B",
  },
  description:
    "A private family care diary for tracking feeding, sleep, nappies and development milestones, with patterns and reports to share with health professionals.",
  email: {
    from: "LittleProgress <no-reply@littleprogress.app>",
    replyTo: "support@littleprogress.app",
  },
  i18n: {
    // Cookie that remembers the language of a signed-out visitor or a carer's device.
    cookie: "lp_locale",
    defaultLocale: "en",
    locales: ["en", "pl", "es", "cy"],
    // Each language written in itself, for the language switcher.
    names: { cy: "Cymraeg", en: "English", es: "Español", pl: "Polski" },
  },
  keywords: [
    "baby feeding diary",
    "weaning tracker",
    "child development log",
    "care diary",
  ],
  links: {
    privacy: "/privacy",
    support: "mailto:support@littleprogress.app",
    terms: "/terms",
  },
  // Regional flavour used for formatting dates and numbers. Translations use language codes below.
  locale: "en-GB",
  logos: {
    favicon: "/favicon.ico",
    icon192: "/icons/icon-192.png",
    icon512: "/icons/icon-512.png",
    mark: "/logo/mark.svg",
    ogImage: "/og.png",
    wordmark: "/logo/wordmark.svg",
  },
  name: "LittleProgress",
  routes: {
    home: "/",
    quickLog: "/quick-log",
    report: "/report",
  },
  // Deep-link scheme of the Expo app (app.json "scheme"). Auth trusts it for redirects.
  scheme: "littleprogress",
  shortName: "LittleProgress",
  social: {
    github: "",
    instagram: "",
    x: "",
  },
  tagline: "A calm family care diary",
  themeColor: "#0F1012",
  url: "https://littleprogress.app",
} as const;

export type App = typeof app;
