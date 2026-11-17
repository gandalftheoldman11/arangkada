// Arangkada: faster GPS settings for the background-geolocation plugin (Android and iPhone).
// Runs as part of `npm run build`, before Capacitor copies the plugin into the native projects.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const B = 'node_modules/@capacitor-community/background-geolocation';
const edits = [
  [B + '/android/src/main/java/com/equimaps/capacitor_background_geolocation/BackgroundGeolocationService.java',
   '            locationRequest.setMaxWaitTime(1000);\n            locationRequest.setInterval(1000);',
   '            // Arangkada: deliver every GPS fix immediately, as fast as the chip produces them\n            locationRequest.setMaxWaitTime(0);\n            locationRequest.setInterval(500);\n            locationRequest.setFastestInterval(100);'],
  [B + '/ios/Plugin/Swift/Plugin.swift',
   '            manager.desiredAccuracy = (\n                externalPower\n                ? kCLLocationAccuracyBestForNavigation\n                : kCLLocationAccuracyBest\n            )',
   '            // Arangkada: always use navigation-grade GPS (fastest, sensor-assisted updates)\n            _ = externalPower\n            manager.desiredAccuracy = kCLLocationAccuracyBestForNavigation\n            manager.activityType = .otherNavigation'],
];
for (const [file, from, to] of edits) {
  if (!existsSync(file)) { console.warn('patch-native: missing ' + file); continue; }
  const src = readFileSync(file, 'utf8');
  if (src.includes(to)) continue;                       // already patched
  if (!src.includes(from)) throw new Error('patch-native: expected code not found in ' + file);
  writeFileSync(file, src.replace(from, to));
  console.log('patch-native: patched ' + file.split('/').pop());
}
