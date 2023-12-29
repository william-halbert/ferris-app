export default {
  expo: {
    name: "Ferris",
    slug: "essial",
    version: "1.1.1201",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "ferrisnotes",
    privacy: "unlisted",
    owner: "willhalbert",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#fff4fb",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
    },
    extra: {
      eas: {
        projectId: "d4a63a80-51a8-430b-b808-3631a643d986",
      },
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "so.ferris.ferris",
      infoPlist: {
        NSCameraUsageDescription:
          "This app requires access to the camera to take pictures of to create notes from those photos.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#fff4fb",
      },
      package: "so.ferris.ferris",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
  },
};
