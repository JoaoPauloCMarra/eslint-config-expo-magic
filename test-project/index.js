// ❌ This should trigger no-console
console.log('Hello from index.js');

// ❌ This should trigger no-unused-vars
const unusedVariable = 'I am never used';

// ❌ This should trigger no-undef (if not using proper globals)
if (typeof window !== 'undefined') {
  window.alert('This is a browser alert');
}

// ❌ This should trigger prefer-const (not exported so ESLint sees it as unused)
let shouldBeConst = 'I never change';

// ❌ This should trigger no-var
var oldVar = 'This should be let or const';

// Use shouldBeConst to trigger prefer-const
console.log(shouldBeConst);

module.exports = {
  unusedVariable,
  oldVar,
};