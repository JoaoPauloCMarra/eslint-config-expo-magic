import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { View, Text } from 'react-native';

// ❌ Missing jest setup (should trigger various jest rules)
describe('Test Suite', () => {
  // ❌ Disabled test (should trigger jest/no-disabled-tests)
  xit('should be disabled', () => {
    expect(true).toBe(true);
  });

  // ❌ Focused test (should trigger jest/no-focused-tests)
  fit('should be focused', () => {
    expect(true).toBe(true);
  });

  // ❌ Async test without await (should trigger testing-library/await-async-queries)
  it('should handle async operations', async () => {
    render(<View><Text>Test</Text></View>);
    // Missing await for async queries
    screen.findByText('Test'); // ❌ Missing await
  });
});