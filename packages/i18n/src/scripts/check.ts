import { checkCatalogs } from "../catalog-check";

// `pnpm i18n:check`: like the unit tests, but every language must also be complete.
const problems = checkCatalogs({ requireComplete: true });

if (problems.length > 0) {
  console.error(problems.join("\n"));
  console.error(
    `\n${problems.length} problem(s). Missing translations: run pnpm i18n:translate.`
  );
  process.exit(1);
}
console.log("Catalogs are complete and consistent.");
