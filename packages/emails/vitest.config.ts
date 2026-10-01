import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // .react-email and dist are generated output (the copied preview app has its own tests).
    exclude: [...configDefaults.exclude, ".react-email/**", "dist/**"],
  },
});
