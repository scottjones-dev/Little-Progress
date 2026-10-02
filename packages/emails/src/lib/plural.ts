/*
 * Options for a translation whose wording depends on a number, e.g. "1 hour" / "24 hours".
 * `count` picks the plural form (languages differ: Polish has four, Welsh six) and
 * `amount` is the number shown. They are separate because the HTML build for non-React
 * consumers passes a placeholder token such as "{{expiresInHours}}" instead of a number,
 * and a token cannot choose a plural form: it then uses the general form.
 */
export const pluralOptions = (amount: number | string) => {
  const count = Number(amount);
  return { amount, count: Number.isNaN(count) ? 2 : count };
};
