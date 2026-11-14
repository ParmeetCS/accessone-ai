const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support SVG imports via react-native-svg-transformer (optional, included for future use)
// If you add SVG file imports, install: react-native-svg-transformer
// and uncomment the transformer block below.
//
// const { transformer, resolver } = config;
// config.transformer = {
//   ...transformer,
//   babelTransformerPath: require.resolve('react-native-svg-transformer'),
// };
// config.resolver = {
//   ...resolver,
//   assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
//   sourceExts: [...resolver.sourceExts, 'svg'],
// };

module.exports = config;
