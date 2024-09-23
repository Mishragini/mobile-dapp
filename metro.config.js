// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add polyfill resolvers
config.resolver.extraNodeModules = {
    crypto: require.resolve('expo-crypto'),   // Polyfill for crypto
    assert: require.resolve('assert'),        // Polyfill for assert
    buffer: require.resolve('buffer'),        // Polyfill for buffer
};

module.exports = config;
