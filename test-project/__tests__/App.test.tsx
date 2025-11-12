import React from "react";
import { View, Text } from "react-native";
import { render, screen } from "@testing-library/react-native";

// ❌ Missing jest setup (should trigger various jest rules)
describe("Test Suite", () => {
  const mockFn = jest.fn(); // Some code before hook

  // ❌ Hook not at top (should trigger jest/prefer-hooks-on-top)
  beforeEach(() => {
    // ❌ Hook not at top
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

  // ❌ Test with conditional expect (should trigger jest/no-conditional-expect)
  it("should have conditional expect", () => {
    if (Math.random() > 0.5) {
      expect(true).toBe(true); // ❌ Conditional expect
    }
  });

  // ❌ Test using deprecated function (should trigger jest/no-deprecated-functions)
  it("should use deprecated function", () => {
    // jest.resetModules(); // This might be deprecated
    expect(true).toBe(true);
  });

  // ❌ Test with done callback (should trigger jest/no-done-callback)
  it("should use done callback", (done) => {
    setTimeout(() => {
      expect(true).toBe(true);
      done(); // ❌ Done callback
    }, 100);
  });

  // ❌ Test exporting from test file (should trigger jest/no-export)
  export const exportedValue = "test"; // ❌ Export from test file

  // ❌ Test with identical title (should trigger jest/no-identical-title)
  it("should work", () => {
    expect(true).toBe(true);
  });

  it("should work", () => { // ❌ Identical title
    expect(false).toBe(false);
  });

  // ❌ Test with interpolation in snapshot (should trigger jest/no-interpolation-in-snapshots)
  it("should have interpolation in snapshot", () => {
    const value = "test";
    expect({ value }).toMatchSnapshot(); // ❌ Interpolation in snapshot
  });

  // ❌ Test using jasmine globals (should trigger jest/no-jasmine-globals)
  it("should use jasmine globals", () => {
    spyOn(console, "log"); // ❌ Jasmine global
    expect(true).toBe(true);
  });

  // ❌ Test importing mocks (should trigger jest/no-mocks-import)
  // import mock from 'some-mock'; // This would trigger if we had it

  // ❌ Test with standalone expect (should trigger jest/no-standalone-expect)
  expect(true).toBe(true); // ❌ Standalone expect

  // ❌ Test with alias methods (should trigger jest/no-alias-methods)
  it("should use alias methods", () => {
    expect([1, 2, 3]).toContainEqual(1); // This might trigger if toContain is preferred
  });

  // ❌ Test with commented out tests (should trigger jest/no-commented-out-tests)
  // it("should be commented out", () => {
  //   expect(true).toBe(true);
  // });

  // ❌ Test with invalid describe callback (should trigger jest/valid-describe-callback)
  describe("invalid describe", "not a function"); // ❌ Invalid describe callback

  // ❌ Test with invalid expect (should trigger jest/valid-expect)
  it("should have invalid expect", () => {
    expect; // ❌ Invalid expect
  });

  // ❌ Test with invalid expect in promise (should trigger jest/valid-expect-in-promise)
  it("should have invalid expect in promise", () => {
    return Promise.resolve().then(() => {
      expect; // ❌ Invalid expect in promise
    });
  });

  // ❌ Test with invalid title (should trigger jest/valid-title)
  it(123, () => { // ❌ Invalid title
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
  });

  // ❌ Test using toEqual for primitive (should trigger jest/prefer-to-be)
  it("should use toBe for primitives", () => {
    expect(1).toBe(1); // ❌ Should use toBe
  });

  // ❌ Test awaiting sync query (should trigger testing-library/no-await-sync-queries)
  it("should not await sync queries", async () => {
    render(
      <View>
        <Text>Sync Test</Text>
      </View>,
    );
    screen.getByText("Sync Test"); // ❌ Awaiting sync query
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
