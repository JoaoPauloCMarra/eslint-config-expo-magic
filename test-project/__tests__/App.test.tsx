import React from "react";
import { View, Text } from "react-native";
import { render, screen } from "@testing-library/react-native";

// ❌ Missing jest setup (should trigger various jest rules)
describe("Test Suite", () => {
  const mockFn = jest.fn(); // Some code before hook

  // ❌ Hook not at top (should trigger jest/prefer-hooks-on-top)
  beforeEach(() => { // ❌ Hook not at top
    // Setup
  });

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

  // ❌ Test using toEqual for primitive (should trigger jest/prefer-to-be)
  it("should use toBe for primitives", () => {
    expect(1).toEqual(1); // ❌ Should use toBe
  });

  // ❌ Test awaiting sync query (should trigger testing-library/no-await-sync-queries)
  it("should not await sync queries", async () => {
    render(
      <View>
        <Text>Sync Test</Text>
      </View>,
    );
    await screen.getByText("Sync Test"); // ❌ Awaiting sync query
  });

  // ❌ Test using debug (should trigger testing-library/no-debugging-utils)
  it("should not use debug", () => {
    render(
      <View>
        <Text>Debug Test</Text>
      </View>,
    );
    screen.debug(); // ❌ Using debug
  });
});
