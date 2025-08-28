// ❌ This function is imported but never used (should trigger no-unused-vars)
export const HelperFunction = () => {
  return 'I am a helper function';
};

// ❌ This should trigger @typescript-eslint/no-unused-vars
export const unusedHelper = 'I am never used';