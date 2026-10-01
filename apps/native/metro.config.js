const { getSentryExpoConfig } = require("@sentry/react-native/metro");

// Same as Expo's default Metro config, plus the Sentry debug ids that let Sentry
// turn minified stack traces back into readable ones.
module.exports = getSentryExpoConfig(__dirname);
