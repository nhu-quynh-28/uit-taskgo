/** @type {import('jest').Config} */
export default {
  displayName: "frontend",
  testEnvironment: "node",
  testMatch: ["<rootDir>/frontend/**/*.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/setup.frontend.cjs"],
  transform: {
    "^.+\\.(tsx|ts|jsx|js)$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-react",
          "@babel/preset-typescript",
        ],
      },
    ],
  },
  moduleNameMapper: {
    "^react$": "<rootDir>/node_modules/react",
    "^react/(.*)$": "<rootDir>/node_modules/react/$1",
    "^@/(.*)$": "<rootDir>/../frontend/$1",
    "^react-native$": "<rootDir>/mocks/react-native.cjs",
    "^lucide-react-native$": "<rootDir>/mocks/empty.cjs",
    "^expo-haptics$": "<rootDir>/mocks/empty.cjs",
    "^@expo/vector-icons$": "<rootDir>/mocks/empty.cjs",
    "^nativewind$": "<rootDir>/mocks/empty.cjs",
    "^axios$": "<rootDir>/mocks/empty.cjs",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  reporters: [
    "default",
    ["<rootDir>/reporters/appendResultsReporter.cjs", { suiteName: "frontend" }],
  ],
};
