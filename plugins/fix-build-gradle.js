const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function fixBuildGradle(config) {
  return withAppBuildGradle(config, (config) => {
    config.modResults.contents = config.modResults.contents.replace(
      /enableBundleCompression\s*=\s*.*\n/g,
      ''
    );
    return config;
  });
};
