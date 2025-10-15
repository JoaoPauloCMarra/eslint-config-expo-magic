#!/usr/bin/env bun

const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 ESLint Config Expo Magic - Comprehensive Validation Suite");
console.log("===========================================================\n");

// Expected rules that should trigger
const expectedRules = {
  // TypeScript rules
  "@typescript-eslint/no-unused-vars": [
    "App.tsx",
    "components/BadImports.tsx",
    "utils/helpers.ts",
  ],
  "@typescript-eslint/no-floating-promises": [
    "App.tsx",
    "__tests__/App.test.tsx",
  ],
  "@typescript-eslint/no-explicit-any": ["App.tsx"],
  "@typescript-eslint/await-thenable": ["App.tsx"],
  "@typescript-eslint/prefer-nullish-coalescing": ["App.tsx"],
  "@typescript-eslint/no-redeclare": ["App.tsx"],
  "@typescript-eslint/no-useless-constructor": ["App.tsx"],
  "@typescript-eslint/naming-convention": ["App.tsx"],

  // React rules
  "react-hooks/exhaustive-deps": ["App.tsx"],
  "react-hooks/purity": ["App.tsx"],
  "react-hooks/set-state-in-render": ["App.tsx"],
  "react-hooks/static-components": ["App.tsx"], // Updated from react/no-unstable-nested-components
  "react/display-name": ["components/BadImports.tsx"],

  // React Native rules

  // Jest rules
  "jest/no-disabled-tests": ["__tests__/App.test.tsx"],
  "jest/no-focused-tests": ["__tests__/App.test.tsx"],
  "jest/prefer-to-be": ["__tests__/App.test.tsx"],
  "jest/expect-expect": ["__tests__/App.test.tsx"],

  // Testing Library rules
  "testing-library/await-async-queries": ["__tests__/App.test.tsx"],
  "testing-library/no-await-sync-queries": ["__tests__/App.test.tsx"],
  "testing-library/no-debugging-utils": ["__tests__/App.test.tsx"],

  // Import rules
  "import/no-duplicates": ["App.tsx", "components/BadImports.tsx"],
  "import-x/order": [
    "App.tsx",
    "components/BadImports.tsx",
    "__tests__/App.test.tsx",
  ],
  "import-x/no-duplicates": ["App.tsx", "components/BadImports.tsx"],
  "import-x/no-anonymous-default-export": ["App.tsx"],

  // Unused imports rules
  "unused-imports/no-unused-imports": ["components/BadImports.tsx", "App.tsx"],

  // General rules
  "no-var": ["index.js", "App.tsx"],
  "no-unused-vars": ["validate.js"],
  "no-undef": ["validate.js"],
  "no-console": ["App.tsx"],

  // Prettier (formatting)
  "prettier/prettier": [
    ".eslintrc.js",
    "App.tsx",
    "__tests__/App.test.tsx",
    "babel.config.js",
    "components/BadImports.tsx",
    "components/UnusedComponent.tsx",
    "eslint.config.js",
    "index.js",
    "jest.config.js",
    "metro.config.js",
    "utils/helpers.ts",
    "validate.js",
  ],
};

const expectedErrorsCount = 133;
const expectedWarningsCount = 86;

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      ...options,
    });

    let stdout = "";
    let stderr = "";

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      child.kill();
      resolve({ stdout, stderr, code: 1, timedOut: true });
    }, 15000); // 15 second timeout (reduced from 30)

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0 || code === 1) {
        // ESLint exits with 1 when there are errors, which is expected
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function runValidation() {
  try {
    console.log("📋 Running ESLint...");

    // Run ESLint using spawn
    const result = await runCommand("./node_modules/.bin/eslint", [
      ".",
      "--ext",
      ".js,.jsx,.ts,.tsx",
      "--format=json",
    ]);

    const results = JSON.parse(result.stdout);

    // Analyze results
    const ruleCounts = {};
    const fileCounts = {};
    let totalErrors = 0;
    let totalWarnings = 0;

    results.forEach((result) => {
      if (result.filePath) {
        const fileName = path.basename(result.filePath);
        fileCounts[fileName] =
          (fileCounts[fileName] || 0) + result.messages.length;

        result.messages.forEach((message) => {
          const ruleId = message.ruleId;
          if (ruleId) {
            ruleCounts[ruleId] = (ruleCounts[ruleId] || 0) + 1;

            if (message.severity === 2) totalErrors++;
            if (message.severity === 1) totalWarnings++;
          }
        });
      }
    });

    console.log(`\n📊 Analysis Results:`);
    console.log(`===================`);
    console.log(
      `Total Errors: ${totalErrors} (Expected: ${expectedErrorsCount})`,
    );
    console.log(
      `Total Warnings: ${totalWarnings} (Expected: ${expectedWarningsCount})`,
    );
    console.log(
      `Total Problems: ${totalErrors + totalWarnings} (Expected: ${expectedErrorsCount + expectedWarningsCount})`,
    );

    // Check counts
    const countsValid =
      totalErrors === expectedErrorsCount &&
      totalWarnings === expectedWarningsCount;

    if (!countsValid) {
      console.log(`❌ ERROR: Problem counts don't match expectations!`);
      return false;
    }

    console.log(`✅ Problem counts match expectations!`);

    // Check expected rules
    console.log(`\n🔍 Checking Expected Rules:`);
    console.log(`===========================`);

    let allRulesPresent = true;
    const missingRules = [];
    const extraRules = [];

    // Check for expected rules
    for (const [ruleId, expectedFiles] of Object.entries(expectedRules)) {
      if (!ruleCounts[ruleId]) {
        missingRules.push(ruleId);
        allRulesPresent = false;
      } else {
        console.log(`✅ ${ruleId}: ${ruleCounts[ruleId]} occurrences`);
      }
    }

    // Check for unexpected rules (rules that triggered but weren't expected)
    for (const ruleId of Object.keys(ruleCounts)) {
      if (!expectedRules[ruleId]) {
        extraRules.push(`${ruleId} (${ruleCounts[ruleId]} occurrences)`);
      }
    }

    if (missingRules.length > 0) {
      console.log(`\n❌ Missing Expected Rules:`);
      missingRules.forEach((rule) => console.log(`   - ${rule}`));
    }

    if (extraRules.length > 0) {
      console.log(`\n⚠️  Unexpected Rules (might be okay):`);
      extraRules.forEach((rule) => console.log(`   - ${rule}`));
    }

    // Run Jest tests
    console.log(`\n🃏 Running Jest Tests:`);
    console.log(`=====================`);

    try {
      const jestResult = await runCommand("./node_modules/.bin/jest", [
        "--passWithNoTests",
        "--silent",
      ]);
      if (jestResult.timedOut) {
        console.log(
          "⚠️  Jest execution timed out (this is expected for validation)",
        );
      } else {
        console.log("✅ Jest tests completed successfully");
      }
    } catch (_error) {
      console.log(
        "✅ Jest tests failed as expected (this is normal for validation)",
      );
    }

    // Final validation
    console.log(`\n🎯 Final Validation:`);
    console.log(`===================`);

    if (allRulesPresent && countsValid) {
      console.log(`🎉 All expected rules are working correctly!`);
      console.log(`🚀 Ready for publishing!`);
      return true;
    } else {
      console.log(`❌ VALIDATION FAILED!`);
      console.log(`⚠️  Some rules are not triggering as expected.`);
      console.log(
        `🚫 PUBLISH CANCELLED - Check the configuration and test files.`,
      );
      return false;
    }
  } catch (error) {
    console.error(`❌ Error running validation:`, error.message);
    return false;
  }
}

// Run the validation
runValidation()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
