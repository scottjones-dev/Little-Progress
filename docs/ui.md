# UI: components, theme and typography

How the website looks and how the pieces fit. Code: `packages/ui` (the shared design system), `apps/web/src/app/layout.tsx` and `apps/web/src/components` (the providers and app-level pieces).

## 1. Who uses what

|  | Website (`apps/web`) | App (`apps/native`) |
| --- | --- | --- |
| Components | shadcn/ui in `@repo/ui` (65 of them) | its own small components |
| Styling | Tailwind 4 | Tailwind through Nativewind 5 |
| Theme | `packages/ui/src/styles/globals.css` | `apps/native/src/global.css` |
| Light and dark | both, with a toggle | dark only for now |

The app must not import the website's package, so the brand colours exist in both stylesheets. They come from one source, `colors` in `packages/config/src/app.ts`, and a test in `packages/ui` fails if either stylesheet disagrees with it. When a colour changes, change all three.

## 2. The theme (Midnight Sanctuary)

| Token | Dark (the brand) | Light |
| --- | --- | --- |
| background | obsidian `#0F1012` | warm off-white `#FAF9F7` |
| card, popover | surface `#17181B` | white |
| text | mist `#E2E8F0` | `#17181B` |
| muted text | `#94A3B8` | `#5B6472` |
| primary (buttons, focus ring) | gold `#D97706` with dark text | darker gold `#B45309` with white text |
| border | `#2A2C31` | `#E3E0D8` |
| form control border | `#646B78` | `#8B8678` |

Accessibility is tested, not assumed: every text pair is at least 4.5:1, the form control border and focus ring at least 3:1 (WCAG 1.4.11), and every chart colour at least 3:1 against its card, in both themes. The chart colours are gold, sky, green, violet and rose, chosen to stay distinguishable and to keep gold as the first colour.

The theme is the `dark` class on `<html>`. `ThemeProvider` (`apps/web/src/components/theme-provider.tsx`, next-themes) starts from the device setting, and `ThemeToggle` lets anyone choose light, dark or system. The choice is kept in this browser's localStorage and is never sent anywhere.

## 3. Typography

| Use | Font | Notes |
| --- | --- | --- |
| text and headings | **Sora** (wide, calm grotesque) | loaded twice under two variable names so headings can differ later without touching components |
| times and numbers | **JetBrains Mono** | use the `font-mono` class, with `tabular-nums` where digits line up |

Both load through `next/font` with `latin` and `latin-ext`, which covers Polish, Welsh and Spanish letters. The stylesheet reads `--font-sans`, `--font-heading` and `--font-mono`; the layout sets them. Headings use the heading font by default.

The native app still uses the system font. Matching fonts there (loaded with `expo-font`) are a todo.

## 4. Rules for writing UI

- Use a component from `@repo/ui` before writing markup. They own their typography and spacing; the lint rules (`shadcn/no-restyle`, `no-raw-colors`) flag fighting them. Use the theme tokens (`bg-background`, `text-muted-foreground`, `border-border`), never raw colours.
- Text people read goes through the translation files (`docs/i18n.md`), never a string in a component. Components in `@repo/ui` are language-free: they take their text as props or children.
- The generated components (`packages/ui/src/components`) are not edited by hand. Need a different look? Add a variant in the component through the CLI-updated file only when the design calls for it, and say so in the pull request.
- Nothing about a child goes into class names, element ids or test ids.

## 5. Adding a component

See `packages/ui/README.md`. In short: `cd apps/web && pnpm dlx shadcn@latest add <name>`, then run the checks.

## 6. Known gaps

- The shadcn components contain a few English strings (for example "Close", "Toggle Sidebar", "Previous slide", pagination and breadcrumb labels). They need to take their text from the translation files before those components are used in a screen.
- The 65 components bring many libraries (recharts, embla, react-day-picker, cmdk, and others). Unused components could be removed later to shrink the dependency list; the CLI can re-add them.
- A second `ThemeToggle` pattern for the carer quick-log (large touch targets) is not designed yet.
