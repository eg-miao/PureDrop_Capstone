const appJson = require("./app.json");

const googleMapsAndroidApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY ||
  process.env.GOOGLE_MAPS_ANDROID_API_KEY ||
  "";

module.exports = ({ config }) => ({
  ...config,
  ...appJson.expo,
  android: {
    ...appJson.expo.android,
    config: {
      ...appJson.expo.android?.config,
      googleMaps: googleMapsAndroidApiKey
        ? {
            apiKey: googleMapsAndroidApiKey,
          }
        : undefined,
    },
  },
});
