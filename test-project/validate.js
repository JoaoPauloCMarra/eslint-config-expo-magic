#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 ESLint Config Expo Magic - Validation Suite");
console.log("==============================================\n");

// Expected rules that should trigger errors
const expectedRules = {
  // TypeScript Rules
  "@typescript-eslint/no-explicit-any": ["App.tsx"],
  "@typescript-eslint/no-floating-promises": ["App.tsx"],
  "@typescript-eslint/no-confusing-void-expression": ["App.tsx"],
  "@typescript-eslint/no-unused-vars": [
    "App.tsx",
    "utils/helpers.ts",
    "components/UnusedComponent.tsx",
  ],
  "@typescript-eslint/consistent-type-definitions": [
    "components/BadImports.tsx",
  ],
  "react/no-unstable-nested-components": ["App.tsx"],
  "react-hooks/exhaustive-deps": ["App.tsx"],
  "react-native/no-inline-styles": ["App.tsx"],
  "no-restricted-imports": ["App.tsx"],
  "import-x/order": ["components/BadImports.tsx"],
  "import-x/no-anonymous-default-export": ["components/BadImports.tsx"],
  "unused-imports/no-unused-imports": ["App.tsx", "components/BadImports.tsx"],
  "jest/no-disabled-tests": ["__tests__/App.test.tsx"],
  "jest/no-focused-tests": ["__tests__/App.test.tsx"],
  "testing-library/await-async-queries": ["__tests__/App.test.tsx"],
  "no-console": ["App.tsx", "index.js", "metro.config.js", "babel.config.js"],
  "no-var": ["index.js"],
};

function runESLint() {
  try {
    console.log("📋 Running ESLint...");
    const output = execSync(
      "npx eslint . --ext .js,.jsx,.ts,.tsx --format=json",
      {
        encoding: "utf8",
        cwd: __dirname,
      },
    );

    const results = JSON.parse(output);
    return results;
  } catch (error) {
    // ESLint exits with code 1 when there are errors, which is expected
    if (error.stdout) {
      return JSON.parse(error.stdout);
    }
    throw error;
  }
}

function analyzeResults(results) {
  console.log("\n📊 Analysis Results:");
  console.log("==================");

  const foundRules = new Set();
  let totalErrors = 0;

  results.forEach((file) => {
    if (file.messages && file.messages.length > 0) {
      console.log(`\n📁 ${path.relative(__dirname, file.filePath)}:`);
      file.messages.forEach((message) => {
        if (message.ruleId) {
          foundRules.add(message.ruleId);
          console.log(`  ❌ ${message.ruleId}: ${message.message}`);
          totalErrors++;
        }
      });
    }
  });

  console.log(`\n📈 Summary:`);
  console.log(`   Total errors found: ${totalErrors}`);
  console.log(`   Unique rules triggered: ${foundRules.size}`);

  // Check which expected rules were found
  console.log("\n✅ Expected Rules Validation:");
  let passedRules = 0;
  let failedRules = 0;

  Object.entries(expectedRules).forEach(([rule, files]) => {
    if (foundRules.has(rule)) {
      console.log(`   ✅ ${rule} - FOUND`);
      passedRules++;
    } else {
      console.log(`   ❌ ${rule} - NOT FOUND`);
      failedRules++;
    }
  });

  console.log(`\n🎯 Validation Results:`);
  console.log(`   Rules working correctly: ${passedRules}`);
  console.log(`   Rules not triggering: ${failedRules}`);

  if (failedRules === 0) {
    console.log("\n🎉 All expected rules are working correctly!");
    return true;
  } else {
    console.log("\n⚠️  Some rules are not triggering as expected.");
    console.log("   Check the configuration and test files.");
    return false;
  }
}

function main() {
  try {
    const results = runESLint();
    const success = analyzeResults(results);

    if (success) {
      console.log("\n🚀 Ready for publishing!");
      process.exit(0);
    } else {
      console.log("\n❌ Validation failed. Please check the issues above.");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error running validation:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runESLint, analyzeResults };
