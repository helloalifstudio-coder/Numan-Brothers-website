#!/usr/bin/env node
/** Fail the release build if prerendered HTML replaces the SSR Vite shell. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const shell=readFileSync('dist/_shell.html','utf8');
const home=readFileSync('dist/index.html','utf8');
assert.match(shell,/<div\s+id=["']root["']\s*>\s*<\/div>/i);
assert.match(home,/<h1[ >]/i);
assert.match(shell,/<script[^>]+src=["'][^"']+assets\//i);
console.log('Product SEO shell and prerendered homepage are distinct and valid.');
