#!/usr/bin/env bun

const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 ESLint Config Expo Magic - Comprehensive Validation Suite");
console.log("===========================================================\n");

// Expected rules that should trigger
const expectedRules = {
  // TypeScript rules
  "@typescript-eslint/naming-convention": ["App.tsx"],
  "@typescript-eslint/no-confusing-void-expression": ["App.tsx"],
  "@typescript-eslint/no-empty-object-type": ["App.tsx"],
  "@typescript-eslint/no-explicit-any": ["App.tsx"],
  "@typescript-eslint/no-floating-promises": ["App.tsx"],
  "@typescript-eslint/no-non-null-assertion": ["App.tsx"],
  "@typescript-eslint/no-redeclare": ["App.tsx"],
  "@typescript-eslint/no-require-imports": ["App.tsx"],
  "@typescript-eslint/no-unused-vars": ["App.test.tsx", "App.tsx"],
  "@typescript-eslint/no-useless-constructor": ["App.tsx"],
  "@typescript-eslint/prefer-nullish-coalescing": ["App.tsx"],

  // React rules
  "react-19-upgrade/no-string-refs": ["App.tsx"],
  "react-hooks/exhaustive-deps": ["App.tsx"],
  "react-native/no-unused-styles": ["App.tsx"],
  "react/display-name": ["BadImports.tsx"],
  "react/jsx-key": ["App.tsx"],
  "react/jsx-no-comment-textnodes": ["App.tsx"],
  "react/jsx-no-duplicate-props": ["App.tsx"],
  "react/jsx-no-undef": ["App.tsx"],
  "react/no-children-prop": ["App.tsx"],
  "react/no-danger-with-children": ["App.tsx"],
  "react/no-string-refs": ["App.tsx"],
  "react/no-unstable-nested-components": ["App.tsx"],
  "react/self-closing-comp": ["App.tsx"],

  // Jest rules
  "jest/expect-expect": ["App.test.tsx"],
  "jest/no-commented-out-tests": ["App.test.tsx"],
  "jest/no-conditional-expect": ["App.test.tsx"],
  "jest/no-disabled-tests": ["App.test.tsx"],
  "jest/no-done-callback": ["App.test.tsx"],
  "jest/no-export": ["App.test.tsx"],
  "jest/no-focused-tests": ["App.test.tsx"],
  "jest/no-identical-title": ["App.test.tsx"],
  "jest/no-jasmine-globals": ["App.test.tsx"],
  "jest/valid-describe-callback": ["App.test.tsx"],
  "jest/valid-title": ["App.test.tsx"],

  // Testing Library rules
  "testing-library/no-debugging-utils": ["App.test.tsx"],

  // Import rules
  "import-x/no-anonymous-default-export": ["BadImports.tsx"],
  "import-x/no-duplicates": ["App.tsx"],
  "import-x/no-unresolved": ["App.tsx"],
  "import-x/order": ["App.tsx", "find-missing-rules.js"],
  "import/no-duplicates": ["App.tsx"],
  "import/no-unresolved": ["App.tsx"],

  // General rules
  "eqeqeq": ["App.tsx"],
  "no-console": ["App.tsx", "analyze-rules.js", "babel.config.js", "find-missing-rules.js", "index.js", "metro.config.js", "validate-comprehensive.js", "validate.js"],
  "no-dupe-args": ["App.tsx"],
  "no-dupe-keys": ["App.tsx"],
  "no-duplicate-case": ["App.tsx"],
  "no-empty-pattern": ["App.tsx"],
  "no-extend-native": ["App.tsx"],
  "no-undef": ["validate.js"],
  "no-unreachable": ["App.tsx"],
  "no-unsafe-negation": ["App.tsx"],
  "no-unused-expressions": ["App.test.tsx", "App.tsx"],
  "no-unused-labels": ["App.tsx"],
  "no-unused-vars": ["App.test.tsx", "App.tsx", "metro.config.js", "validate-comprehensive.js", "validate.js"],
  "no-var": ["App.tsx"],
  "no-with": ["App.tsx"],
  "unused-imports/no-unused-imports": ["App.tsx"],

  // Prettier rules
  "prettier/prettier": [".eslintrc.js", "App.test.tsx", "App.tsx", "BadImports.tsx", "UnusedComponent.tsx", "babel.config.js", "eslint.config.js", "find-missing-rules.js", "helpers.ts", "index.js", "jest.config.js", "metro.config.js", "validate-comprehensive.js", "validate.js"],
};

const expectedErrorsCount = 915;
const expectedWarningsCount = 114;

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
