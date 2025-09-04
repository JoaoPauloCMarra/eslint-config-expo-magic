module.exports = {
  preset: "react-native",
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"],
  testEnvironment: "jsdom",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native|@testing-library)",
  ],
  // Performance optimizations
  maxWorkers: 1, // Single worker for faster startup
  cache: true,
  collectCoverage: false, // Disable coverage for faster runs
  testTimeout: 10000, // 10 second timeout
  forceExit: true, // Force exit after tests complete
  detectOpenHandles: false, // Disable open handle detection
};
