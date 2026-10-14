# Arangkada

Motorcycle speed tracker with voice speed alerts, so you can keep your eyes on the road. One app, three ways to run it:

| | Website (Netlify) | Android app (APK) | iPhone app |
|---|---|---|---|
| Speed, distance, route recording | Yes | Yes | Yes |
| Tracking with the screen off or phone in pocket | No | Yes, with a "recording" notification | Yes, with the blue location indicator |
| Voice alerts ("Slow down. 95") with the screen off | No | Yes | Yes |
| Live speed on the lock screen | No | Yes, a silent notification updated every 3 s | Yes, a Live Activity on the lock screen and Dynamic Island |
| Works offline | Yes | Yes | Yes |

## Project layout

```
web/index.html        the whole app (screens, GPS filtering, alerts, ride history)
web/sw.js             offline support for the website
src/native.js         native features for the apps: background GPS, voice, keep awake,
                      lock-screen stats, file sharing, Android back button
scripts/build.mjs     builds web/ + src/native.js into www/
scripts/make-images.py  draws all icons and splash screens
android/              Capacitor Android project
ios/                  Capacitor iPhone project, plus the Live Activity widget (ios/App/ArangkadaWidget)
.github/workflows/    builds the Android APK and the iPhone app on every push
```

## 1. Put it on GitHub

1. Create a new **public** repository on GitHub (public repos get free Mac build minutes for the iPhone app).
2. Upload everything in this folder to it (or `git init`, `git add .`, `git commit`, `git push`).

## 2. Website on Netlify

Netlify: **Add new site → Import an existing project →** pick the repo. Build settings come from `netlify.toml` (build `npm run build`, publish `www`). No environment variables needed.

## 3. Android app (screen-off tracking)

No Android Studio needed. GitHub builds the APK for you.

1. Every push to `main` runs **Actions → Build Android APK**. You can also start it by hand from the Actions tab with **Run workflow**.
2. When it finishes (about 5 minutes), open the run and download **arangkada-android-N** under Artifacts. Unzip it to get `app-release.apk`.
3. Copy the APK to your phone and open it. Allow installing from that source when Android asks.
4. On your first ride, allow **Location** ("While using the app") and **Notifications**. The notification is what keeps GPS and voice alerts running with the screen off.
5. **Important on Xiaomi, Oppo, Vivo, Realme and Samsung:** go to **Settings → Apps → Arangkada → Battery** and choose **Unrestricted**. On Xiaomi also turn on **Autostart**. Otherwise the phone may kill tracking after a few minutes with the screen off.

New builds install as updates over the old one, so your rides are kept.

## 4. iPhone app (screen-off tracking)

Every run of **Actions → Build iPhone app** (about 10–15 minutes) produces an unsigned app file you can sideload for free.

### Free: sideload with your Apple ID

1. Download **arangkada-iphone-unsigned-ipa-N** from the run's Artifacts and unzip it to get `Arangkada-unsigned.ipa`. Put it on your iPhone (AirDrop, iCloud Drive or Files).
2. Install **SideStore** (sidestore.io) or **AltStore** (altstore.io) using their setup guide. It needs a computer once.
3. On the iPhone, turn on **Settings → Privacy & Security → Developer Mode** and restart.
4. In SideStore/AltStore tap **+** and choose `Arangkada-unsigned.ipa`.
5. Open Arangkada, start a ride and allow **Location** and **Precise Location**.

Free Apple ID limits:
- The app stops opening after **7 days** unless refreshed in SideStore/AltStore. Your rides are kept when you refresh.
- At most **3 sideloaded apps** at once. Arangkada uses 2 app IDs (the app and its lock-screen widget), the same as Lakad. If Lakad is also sideloaded, you'll need to stay within the weekly app ID limit; SideStore will tell you if you hit it.

### Paid: TestFlight (USD 99/year Apple Developer Program)

Same steps as Lakad: create the app in App Store Connect with bundle ID `app.arangkada.tracker`, then add the GitHub secrets `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` and `APPLE_TEAM_ID`. Builds then upload to TestFlight automatically, and they don't expire after 7 days.

## Lock-screen live speed

While recording in the apps, your current speed, distance, top speed and ride time stay visible on the lock screen, and turn red with "Slow down" when you're over your alert speed.

- **iPhone (iOS 16.2+):** a Live Activity on the lock screen, and in the Dynamic Island on iPhone 14 Pro and newer. The ride timer ticks by itself; speed updates every 5 seconds (an iPhone limit). If it doesn't appear: **iPhone Settings → Arangkada → Live Activities**.
- **Android:** a silent notification updated every 3 seconds. If the numbers are hidden on your lock screen, allow sensitive notification content in **Settings → Notifications**.

## Voice alerts with the screen off

The apps use the phone's own text-to-speech, which keeps talking with the screen locked, through your earpiece or helmet speaker. On iPhone, music is lowered while it speaks. "Beep only" mode still says "Slow down" when the screen is off, because phones don't play web beeps in the background.

## Building on your own computer (optional)

```bash
npm install
npm run build        # builds www/
npm run android      # opens Android Studio (needs Android Studio + JDK 21)
npm run ios          # opens Xcode (Mac only)
```

Re-draw icons after changing the design: `python3 scripts/make-images.py` (needs Pillow).
