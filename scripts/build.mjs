// Builds the app into www/: copies the web files and bundles the native bridge.
// Used by Netlify (website) and by Capacitor (Android and iPhone apps).
import { build } from 'esbuild';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

rmSync('www', { recursive: true, force: true });
mkdirSync('www');
cpSync('web', 'www', { recursive: true });

await build({ entryPoints: ['src/native.js'], bundle: true, format: 'iife', target: 'es2020', minify: true, outfile: 'www/native.js' });

// Load native.js before the app script
const html = readFileSync('www/index.html', 'utf8');
const marker = '<script>\n(function(){';
if (!html.includes(marker)) throw new Error('index.html: app script marker not found');
writeFileSync('www/index.html', html.replace(marker, '<script src="native.js"></script>\n' + marker));
console.log('Built www/');
