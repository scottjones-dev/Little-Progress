const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const { withNativewind } = require("nativewind/metro");

// Expo's default Metro config, plus the Sentry debug ids that let Sentry turn minified stack
// traces back into readable ones, plus Nativewind (Tailwind classes via className).
module.exports = withNativewind(getSentryExpoConfig(__dirname));
