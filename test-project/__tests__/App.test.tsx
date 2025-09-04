import React from "react";
import { View, Text } from "react-native";
import { render, screen } from "@testing-library/react-native";

// ❌ Missing jest setup (should trigger various jest rules)
describe("Test Suite", () => {
  // ❌ Disabled test (should trigger jest/no-disabled-tests and jest/no-test-prefixes)
  it.skip("should be disabled", () => {
    expect(true).toBe(true);
  });

  // ❌ Focused test (should trigger jest/no-focused-tests)
  it.only("should be focused", () => {
    expect(true).toBe(true);
  });

  // ❌ Async test without await (should trigger testing-library/await-async-queries)
  it("should handle async operations", async () => {
    render(
      <View>
        <Text>Test</Text>
      </View>,
    );
    // Missing await for async queries - this should trigger the rule
    const _element = screen.findByText("Test"); // ❌ Missing await
    // Don't await to trigger the linting rule
  });
});
