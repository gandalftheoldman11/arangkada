// Native features for the Android and iPhone apps (Capacitor).
// Bundled into www/native.js by scripts/build.mjs. On the website it does nothing,
// and the app falls back to browser GPS, speech and storage.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics } from '@capacitor/haptics';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { App } from '@capacitor/app';

const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform(); // 'android' | 'ios' | 'web'

if (isNative) {
  const BG = registerPlugin('BackgroundGeolocation');
  const Live = registerPlugin('ArangkadaLiveActivity');

  // ---------- GPS ----------
  // Foreground mode while idle (no notification). Background mode while recording:
  // Android shows a "recording" notification, iPhone shows the blue location pill,
  // and GPS keeps running with the screen off.
  let watchId = null;
  let watchBg = null;
  let chain = Promise.resolve();
  const queue = (fn) => (chain = chain.then(fn, fn));

  async function removeWatcher() {
    if (watchId) { const id = watchId; watchId = null; watchBg = null; try { await BG.removeWatcher({ id }); } catch (e) { /* already gone */ } }
  }

  function watch(background, onFix, onError) {
    return queue(async () => {
      if (watchId && watchBg === background) return;
      await removeWatcher();
      if (background && platform === 'android') {
        // Android 13+ needs notification permission for the notification that keeps GPS alive
        try { const p = await LocalNotifications.checkPermissions(); if (p.display !== 'granted') await LocalNotifications.requestPermissions(); } catch (e) { /* older Android */ }
      }
      const opts = { requestPermissions: true, stale: false, distanceFilter: 0 };
      if (background) {
        opts.backgroundTitle = 'Arangkada is recording your ride';
        opts.backgroundMessage = 'Speed alerts stay on. Open Arangkada to pause or finish.';
      }
      watchBg = background;
      watchId = await BG.addWatcher(opts, (loc, err) => {
        if (err) { onError(err.code === 'NOT_AUTHORIZED' ? 'denied' : 'unavailable'); return; }
        if (!loc || loc.simulated) return;
        onFix({ t: loc.time || Date.now(), lat: loc.latitude, lon: loc.longitude, acc: loc.accuracy == null ? 999 : loc.accuracy, speed: loc.speed });
      });
    });
  }
  const unwatch = () => queue(removeWatcher);

  // ---------- voice and vibration (work with the screen off) ----------
  function speak(text) {
    return TextToSpeech.speak({ text, lang: 'en-US', rate: 1.0, volume: 1.0, category: 'playback', queueStrategy: 0 }).catch(() => {});
  }
  function vibrate(ms) { return Haptics.vibrate({ duration: ms || 400 }).catch(() => {}); }
  function keepAwake(on) { return (on ? KeepAwake.keepAwake() : KeepAwake.allowSleep()).catch(() => {}); }

  // ---------- live stats on the lock screen ----------
  const NOTIF_ID = 4243;
  const CHANNEL = 'arangkada-live';
  const MIN_GAP = platform === 'ios' ? 5000 : 3000; // both systems throttle frequent updates
  let liveOn = false, lastSent = 0, lastOver = null, pending = null, flushTimer = null, channelReady = false;

  async function ensureChannel() {
    if (channelReady) return;
    try {
      await LocalNotifications.createChannel({ id: CHANNEL, name: 'Live ride stats', description: 'Speed, distance and time while Arangkada is recording', importance: 2, visibility: 1, vibration: false });
      channelReady = true;
    } catch (e) { /* older Android: default channel */ }
  }
  async function send(s) {
    lastSent = Date.now(); lastOver = s.over;
    try {
      if (platform === 'ios') await Live.update(s);
      else await LocalNotifications.schedule({ notifications: [{
        id: NOTIF_ID, channelId: CHANNEL,
        title: s.paused ? 'Ride paused, ' + s.timeText : (s.over ? 'Slow down: ' : '') + s.speed + ' ' + s.unit,
        body: s.distance + ' ' + s.distUnit + ', top ' + s.top + ' ' + s.unit + ', ' + s.timeText,
        largeBody: s.distance + ' ' + s.distUnit + '   Top ' + s.top + ' ' + s.unit + '\nAlert above ' + s.limit + ' ' + s.unit + '   Ride time ' + s.timeText,
        ongoing: true, autoCancel: false, smallIcon: 'ic_tracking', iconColor: s.over ? '#FF5A47' : '#F5A524'
      }] });
    } catch (e) { /* a missed update is harmless; the next one replaces it */ }
  }
  const live = {
    async start(s) {
      liveOn = true; lastSent = 0; pending = null;
      try {
        if (platform === 'ios') { await Live.start(s); lastSent = Date.now(); lastOver = s.over; return; }
        await ensureChannel(); await send(s);
      } catch (e) { /* Live Activities turned off: nothing to show */ }
    },
    update(s) {
      if (!liveOn) return;
      const now = Date.now();
      if (s.over !== lastOver || now - lastSent >= MIN_GAP) { pending = null; send(s); return; }
      pending = s;
      if (!flushTimer) flushTimer = setTimeout(() => { flushTimer = null; if (liveOn && pending) { const p = pending; pending = null; send(p); } }, MIN_GAP - (now - lastSent));
    },
    async end(s) {
      liveOn = false; pending = null; clearTimeout(flushTimer); flushTimer = null;
      try {
        if (platform === 'ios') await Live.end(Object.assign({}, s || {}, { immediate: !s }));
        else await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID }] });
      } catch (e) { /* nothing to end */ }
    }
  };

  // ---------- files ----------
  async function saveFile(name, text) {
    const res = await Filesystem.writeFile({ path: name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: name, files: [res.uri] });
  }

  // ---------- Android back button ----------
  let backHandler = null;
  App.addListener('backButton', () => {
    if (backHandler && backHandler()) return;  // the app closed a sheet or dialog
    App.minimizeApp();                          // never kill a ride by pressing back
  });

  window.ArkNative = {
    isNative: true, platform, watch, unwatch, speak, vibrate, keepAwake, live, saveFile,
    onBack(fn) { backHandler = fn; },
    openSettings() { return BG.openSettings().catch(() => {}); }
  };
}
