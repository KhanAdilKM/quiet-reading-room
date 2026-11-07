(function () {
  'use strict';
  const library = window.BOOK_LIBRARY;
  const validIds = new Set(library.chapters.map(chapter => chapter.id));
  const KEY = 'above-the-grey-reading-v1';
  const defaults = { theme: 'night', fontSize: 21, lineHeight: 190, textWidth: 660, artOpacity: 80, focus: false };
  const bounded = (value, minimum, maximum, fallback) => typeof value === 'number' && Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback;
  let storageAvailable = true;

  function cleanData(candidate) {
    const input = candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : {};
    const preferences = input.preferences && typeof input.preferences === 'object' ? input.preferences : {};
    const result = {
      version: 1,
      preferences: {
        theme: ['night', 'dusk', 'paper'].includes(preferences.theme) ? preferences.theme : 'night',
        fontSize: bounded(preferences.fontSize, 17, 29, 21),
        lineHeight: bounded(preferences.lineHeight, 160, 230, 190),
        textWidth: bounded(preferences.textWidth, 540, 820, 660),
        artOpacity: bounded(preferences.artOpacity, 15, 100, 80),
        focus: preferences.focus === true
      },
      positions: {}, bookmarks: [], completed: [], progress: null
    };
    if (input.positions && typeof input.positions === 'object') {
      for (const [id, ratio] of Object.entries(input.positions)) if (validIds.has(id)) result.positions[id] = bounded(ratio, 0, 1, 0);
    }
    if (Array.isArray(input.bookmarks)) {
      const seen = new Set();
      for (const bookmark of input.bookmarks) {
        if (bookmark && validIds.has(bookmark.id) && !seen.has(bookmark.id)) {
          seen.add(bookmark.id);
          result.bookmarks.push({ id: bookmark.id, ratio: bounded(bookmark.ratio, 0, 1, 0) });
        }
      }
    }
    if (Array.isArray(input.completed)) result.completed = [...new Set(input.completed.filter(id => validIds.has(id)))];
    if (input.progress && validIds.has(input.progress.id)) result.progress = { id: input.progress.id, ratio: bounded(input.progress.ratio, 0, 1, 0) };
    return result;
  }

  function read() {
    try { return cleanData(JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch (_) { storageAvailable = false; return cleanData({}); }
  }

  let data = read();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (_) { storageAvailable = false; }
  }

  const cache = new Map();
  const pending = new Map();
  window.LibraryChapter = chapter => {
    if (!chapter || !validIds.has(chapter.id) || !Array.isArray(chapter.paragraphs)) return;
    cache.set(chapter.id, chapter);
    while (cache.size > 12) cache.delete(cache.keys().next().value);
    if (pending.has(chapter.id)) {
      pending.get(chapter.id).resolve(chapter);
      pending.delete(chapter.id);
    }
  };

  function loadChapter(metadata) {
    if (cache.has(metadata.id)) return Promise.resolve(cache.get(metadata.id));
    if (pending.has(metadata.id)) return pending.get(metadata.id).promise;
    let resolvePromise, rejectPromise;
    const promise = new Promise((resolve, reject) => { resolvePromise = resolve; rejectPromise = reject; });
    pending.set(metadata.id, { promise, resolve: resolvePromise, reject: rejectPromise });
    const script = document.createElement('script');
    script.src = metadata.file;
    script.onload = () => {
      script.remove();
      if (pending.has(metadata.id)) { pending.delete(metadata.id); rejectPromise(new Error('Chapter file did not contain readable text.')); }
    };
    script.onerror = () => { script.remove(); pending.delete(metadata.id); rejectPromise(new Error('Chapter file is missing or unavailable.')); };
    document.head.appendChild(script);
    return promise;
  }

  window.ReadingStore = {
    get data() { return data; },
    get storageAvailable() { return storageAvailable; },
    defaults, cleanData, save, loadChapter,
    importData(candidate) { data = cleanData(candidate); save(); return data; }
  };
})();
