const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const packagesDir = path.resolve(__dirname, 'packages');

const config = {
  watchFolders: [packagesDir],
  resolver: {
    unstable_enablePackageExports: true,
    extraNodeModules: {
      '@xpanse/native-charts': path.resolve(packagesDir, 'charts'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
