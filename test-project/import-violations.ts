// @ts-nocheck
// Specific triggers for import rules

// ❌ import/named and import-x/named
// Importing named export that doesn't exist
import { NonExistentExport } from './no-default';
console.log(NonExistentExport);

// ❌ import/namespace and import-x/namespace
// Namespace import accessing non-existent member
import * as AllExports from './only-default';
console.log(AllExports.doesNotExist); // This export doesn't exist

// ❌ Additional named import failure
import { a, b, c } from './mixed-exports'; // b and c don't exist
console.log(a, b, c);
