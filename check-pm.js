#!/usr/bin/env node

/**
 * Package Manager Checker for eslint-config-expo-magic
 * Ensures that bun is being used instead of other package managers
 */

const { execSync } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname);
const packageJsonPath = path.join(projectRoot, 'package.json');

try {
  // Check if package.json exists
  require(packageJsonPath);

  // Check if bun lockfile exists
  const bunLockfile = path.join(projectRoot, 'bun.lock');
  const fs = require('fs');

  if (!fs.existsSync(bunLockfile)) {
    console.error('❌ No bun.lock file found!');
    console.error('🚀 Please run: bun install');
    process.exit(1);
  }

  // Check if other lockfiles exist
  const otherLockfiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
  const existingLockfiles = otherLockfiles.filter(lockfile =>
    fs.existsSync(path.join(projectRoot, lockfile))
  );

  if (existingLockfiles.length > 0) {
    console.error('❌ Found lockfiles from other package managers:');
    existingLockfiles.forEach(lockfile => console.error(`   - ${lockfile}`));
    console.error('🧹 Please remove them and use bun instead');
    console.error('💡 Run: rm package-lock.json yarn.lock pnpm-lock.yaml');
    process.exit(1);
  }

  console.log('✅ Package manager check passed! Using bun correctly.');

} catch (error) {
  console.error('❌ Error checking package manager:', error.message);
  process.exit(1);
}