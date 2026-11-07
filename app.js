(function () {
  'use strict';
  const library = window.BOOK_LIBRARY;
  const store = window.ReadingStore;
  const byId = id => document.getElementById(id);
  const chapterMap = new Map(library.chapters.map(chapter => [chapter.id, chapter]));
  const chapterIndex = new Map(library.chapters.map((chapter, index) => [chapter.id, index]));
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
  const state = { chapter: null, volume: null, loading: false, generation: 0, boot: true, restoring: false, saveTimer: null, noticeTimer: null, searchLimit: 50, scrollPending: false };
  const numberLabel = value => value.toLocaleString();
  const element = (tag, className, text) => {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== undefined) result.textContent = text;
    return result;
  };

  function notice(message) {
    clearTimeout(state.noticeTimer);
    byId('notice').textContent = message;
    byId('notice').hidden = false;
    state.noticeTimer = setTimeout(() => { byId('notice').hidden = true; }, 4000);
  }

  function applyPreferences() {
    const preferences = store.data.preferences;
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.style.setProperty('--reader-size', preferences.fontSize + 'px');
    document.documentElement.style.setProperty('--reader-line', preferences.lineHeight / 100);
    document.documentElement.style.setProperty('--reader-width', preferences.textWidth + 'px');
    document.documentElement.style.setProperty('--art-opacity', preferences.artOpacity / 100);
    document.body.classList.toggle('focus-mode', preferences.focus && !byId('reader-view').hidden);
    for (const button of document.querySelectorAll('[data-theme-option]')) {
      const active = button.dataset.themeOption === preferences.theme;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active);
    }
    for (const [id, property, suffix] of [['font-size', 'fontSize', ' px'], ['line-height', 'lineHeight', ''], ['text-width', 'textWidth', ' px'], ['art-opacity', 'artOpacity', '%']]) {
      byId(id).value = preferences[property];
      byId(id + '-value').textContent = property === 'lineHeight' ? (preferences[property] / 100).toFixed(2) : preferences[property] + suffix;
    }
    byId('focus-setting').checked = preferences.focus;
    byId('focus-button').setAttribute('aria-pressed', preferences.focus);
    updateProgress();
  }

  function renderVolumes() {
    const grid = byId('volume-grid');
    grid.replaceChildren();
    for (const volume of library.volumes) {
      const completed = volume.chapters.filter(id => store.data.completed.includes(id)).length;
      const chapters = volume.chapters.map(id => chapterMap.get(id));
      const numbered = chapters.filter(chapter => chapter.number !== null);
      const card = element('a', 'volume-card'); card.href = '#/volume/' + volume.number;
      card.setAttribute('aria-label', 'Volume ' + volume.number + ': ' + volume.title);
      const cover = element('div', 'cover-image');
      const art = element('img'); art.src = volume.art; art.alt = ''; art.loading = 'lazy'; art.width = 700; art.height = 900;
      const inscription = element('div', 'cover-inscription');
      inscription.append(element('small', '', 'LORD OF THE MYSTERIES'), element('strong', '', volume.title));
      cover.append(art, element('div', 'cover-shade'), element('span', 'cover-number', roman[volume.number - 1]), inscription);
      if (completed) cover.append(element('span', 'cover-completed', completed + ' READ'));
      const info = element('div', 'volume-card-info');
      const line = element('div');
      const range = 'Chapters ' + numbered[0].number + '—' + numbered[numbered.length - 1].number;
      line.append(element('span', '', range), element('span', '', volume.chapters.length + ' reading sections ↗'));
      const progress = element('div', 'volume-read-progress');
      const bar = element('span'); bar.style.width = completed / volume.chapters.length * 100 + '%'; progress.append(bar);
      info.append(line, progress); card.append(cover, info); grid.append(card);
    }
    byId('hero-count').textContent = numberLabel(library.numberedCount);
    byId('journal-count').textContent = store.data.bookmarks.length;
    byId('journal-count').hidden = store.data.bookmarks.length === 0;
    renderContinue();
  }

  function renderContinue() {
    const section = byId('continue-section'); section.replaceChildren();
    const progress = store.data.progress;
    if (!progress || !chapterMap.has(progress.id)) { section.hidden = true; return; }
    const chapter = chapterMap.get(progress.id);
    const card = element('a', 'continue-card'); card.href = '#/read/' + chapter.id + '?resume=1';
    const art = element('img'); art.src = chapter.art; art.alt = '';
    const description = element('div');
    description.append(element('small', '', 'PICK UP THE THREAD'), element('strong', '', chapter.title), element('p', '', 'Volume ' + chapter.volume + ' · ' + chapter.label + ' · ' + Math.round(progress.ratio * 100) + '% through'));
    card.append(art, description, element('span', 'continue-arrow', '↗'));
    section.append(card); section.hidden = false;
  }

  function chapterListItem(chapter, current = false) {
    const link = element('a', 'chapter-list-item' + (current ? ' current' : ''));
    link.href = '#/read/' + chapter.id;
    const description = element('div');
    description.append(element('strong', '', chapter.title), element('small', '', chapter.minutes + ' min read · ' + numberLabel(chapter.words) + ' words'));
    link.append(element('span', 'chapter-num', chapter.number === null ? '✧' : String(chapter.number)), description);
    if (store.data.completed.includes(chapter.id)) link.append(element('span', 'chapter-check', '✓'));
    if (current) link.setAttribute('aria-current', 'page');
    return link;
  }

  function renderVolume(volume) {
    state.volume = volume.number;
    byId('volume-title').textContent = volume.title;
    byId('volume-eyebrow').textContent = 'VOLUME ' + roman[volume.number - 1] + ' · LORD OF THE MYSTERIES';
    byId('volume-art').src = volume.art;
    byId('volume-art').alt = 'A quiet symbolic illustration for ' + volume.title;
    byId('volume-summary').textContent = volume.chapters.length + ' reading sections · ' + numberLabel(volume.words) + ' words · Complete in your local library.';
    const completed = volume.chapters.filter(id => store.data.completed.includes(id)).length;
    byId('volume-progress-note').textContent = completed ? completed + ' of ' + volume.chapters.length + ' sections marked as read' : 'An unopened door, waiting for you.';
    byId('volume-start').href = '#/read/' + volume.chapters[0];
    byId('volume-pdf').href = volume.source;
    byId('volume-filter').value = '';
    filterVolume();
    document.title = volume.title + ' · Volume ' + volume.number + ' — Above the Grey';
  }

  function filterVolume() {
    if (!state.volume) return;
    const volume = library.volumes.find(item => item.number === state.volume);
    const query = byId('volume-filter').value.trim().toLocaleLowerCase();
    const chapters = volume.chapters.map(id => chapterMap.get(id)).filter(chapter => !query || (chapter.label + ' ' + chapter.title).toLocaleLowerCase().includes(query));
    byId('volume-chapters').replaceChildren(...chapters.map(chapter => chapterListItem(chapter)));
    byId('volume-empty').hidden = chapters.length !== 0;
  }

  function progressRange() {
    const body = byId('chapter-body');
    const bounds = body.getBoundingClientRect();
    const start = bounds.top + window.scrollY - document.querySelector('.site-header').offsetHeight - 20;
    const end = bounds.bottom + window.scrollY - window.innerHeight + 70;
    return { start: Math.max(0, start), length: Math.max(1, end - start) };
  }

  function progressRatio() {
    if (!state.chapter || state.loading || state.restoring) return 0;
    const range = progressRange();
    return Math.min(1, Math.max(0, (window.scrollY - range.start) / range.length));
  }

  function updateProgress() {
    if (!state.chapter || state.loading || state.restoring || byId('reader-view').hidden) return;
    const ratio = progressRatio();
    byId('reading-progress').firstElementChild.style.width = ratio * 100 + '%';
    byId('reader-progress-label').textContent = Math.round(ratio * 100) + '% through chapter';
  }

  function saveProgress() {
    clearTimeout(state.saveTimer);
    if (!state.chapter || state.loading || state.restoring || byId('reader-view').hidden) return;
    const ratio = progressRatio();
    store.data.positions[state.chapter.id] = ratio;
    store.data.progress = { id: state.chapter.id, ratio };
    store.save();
  }

  function updateBookmark() {
    if (!state.chapter) return;
    const saved = store.data.bookmarks.some(bookmark => bookmark.id === state.chapter.id);
    byId('bookmark-button').setAttribute('aria-pressed', saved);
    byId('bookmark-button').setAttribute('aria-label', saved ? 'Remove chapter bookmark' : 'Bookmark this chapter');
    byId('bookmark-button').querySelector('span').textContent = saved ? 'Saved' : 'Save';
    const completed = store.data.completed.includes(state.chapter.id);
    byId('mark-read-button').textContent = completed ? 'Marked as read ✓ · undo' : 'Mark as read ✓';
    byId('journal-count').textContent = store.data.bookmarks.length;
    byId('journal-count').hidden = store.data.bookmarks.length === 0;
  }

  function setNeighbor(anchor, chapter, label) {
    anchor.setAttribute('aria-disabled', !chapter);
    if (chapter) {
      anchor.href = '#/read/' + chapter.id;
      anchor.querySelector('strong').textContent = chapter.title;
      anchor.querySelector('small').textContent = label + ' · ' + chapter.label.toUpperCase();
    } else { anchor.removeAttribute('href'); anchor.querySelector('strong').textContent = ''; }
  }

  async function openChapter(chapter, resume) {
    const generation = ++state.generation;
    state.chapter = chapter; state.loading = true; state.restoring = true;
    const volume = library.volumes.find(item => item.number === chapter.volume);
    byId('chapter-label').textContent = 'VOLUME ' + roman[chapter.volume - 1] + ' / ' + chapter.label.toUpperCase();
    byId('chapter-title').textContent = chapter.title;
    byId('chapter-reading-time').textContent = chapter.minutes + ' minute read';
    byId('chapter-word-count').textContent = numberLabel(chapter.words) + ' words';
    byId('reader-volume-link').textContent = 'VOL. ' + roman[chapter.volume - 1] + ' · ' + volume.title;
    byId('reader-volume-link').href = '#/volume/' + chapter.volume;
    byId('reader-position').textContent = (chapterIndex.get(chapter.id) + 1) + ' / ' + library.chapters.length;
    byId('chapter-art').src = chapter.art;
    byId('chapter-art').alt = chapter.artDescription;
    byId('scene-caption').textContent = chapter.artDescription;
    byId('scene-number').textContent = chapter.label.toUpperCase() + ' / ATMOSPHERE';
    byId('chapter-pdf').href = volume.source + '#page=' + chapter.page;
    byId('chapter-body').replaceChildren();
    byId('chapter-loading').hidden = false;
    byId('chapter-error').hidden = true;
    byId('chapter-end').hidden = true;
    byId('reading-progress').firstElementChild.style.width = '0%';
    byId('reader-progress-label').textContent = 'Opening chapter…';
    updateBookmark();
    const index = chapterIndex.get(chapter.id);
    setNeighbor(byId('previous-chapter'), library.chapters[index - 1], '← PREVIOUS');
    setNeighbor(byId('next-chapter'), library.chapters[index + 1], 'NEXT →');
    byId('reader-prev-button').disabled = index === 0;
    byId('reader-next-button').disabled = index === library.chapters.length - 1;
    document.title = chapter.label + ': ' + chapter.title + ' — Above the Grey';
    window.scrollTo({ top: 0, behavior: 'instant' });
    try {
      const data = await store.loadChapter(chapter);
      if (generation !== state.generation) return;
      const fragment = document.createDocumentFragment();
      data.paragraphs.forEach((segments, paragraphIndex) => {
        const paragraph = element('p'); paragraph.id = 'paragraph-' + (paragraphIndex + 1);
        for (const segment of segments) {
          if (segment.em) paragraph.append(element('em', '', segment.t));
          else paragraph.append(document.createTextNode(segment.t));
        }
        fragment.append(paragraph);
      });
      byId('chapter-body').append(fragment);
      byId('chapter-loading').hidden = true;
      byId('chapter-end').hidden = false;
      state.loading = false;
      const targetRatio = resume ? store.data.positions[chapter.id] || 0 : 0;
      requestAnimationFrame(() => {
        if (generation !== state.generation) return;
        if (targetRatio > 0) { const range = progressRange(); window.scrollTo({ top: range.start + range.length * targetRatio, behavior: 'instant' }); }
        state.restoring = false; updateProgress(); saveProgress();
      });
    } catch (_) {
      if (generation !== state.generation) return;
      state.loading = false; state.restoring = false;
      byId('chapter-loading').hidden = true; byId('chapter-error').hidden = false;
      byId('chapter-end').hidden = false;
      notice('The original PDF link is still available below.');
    }
  }

  function showView(name) {
    byId('home-view').hidden = name !== 'home';
    byId('volume-view').hidden = name !== 'volume';
    byId('reader-view').hidden = name !== 'reader';
    byId('site-footer').hidden = name === 'reader';
    byId('reading-progress').hidden = name !== 'reader';
    applyPreferences();
  }

  function route() {
    saveProgress();
    const hash = location.hash || '#/';
    const [path, query] = hash.slice(1).split('?');
    const parts = path.split('/').filter(Boolean);
    if (parts[0] === 'read' && chapterMap.has(parts[1])) {
      const chapter = chapterMap.get(parts[1]);
      const resume = new URLSearchParams(query || '').get('resume') === '1' || state.boot && store.data.progress && store.data.progress.id === chapter.id;
      showView('reader');
      openChapter(chapter, resume);
    } else {
      state.generation++; state.chapter = null; state.loading = false; state.restoring = false;
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (parts[0] === 'volume' && library.volumes.some(volume => volume.number === Number(parts[1]))) {
        showView('volume'); renderVolume(library.volumes.find(volume => volume.number === Number(parts[1])));
      } else {
        showView('home'); renderVolumes();
        document.querySelector('.hero').hidden = parts[0] === 'library';
        document.title = 'Above the Grey — Your Personal Reading Room';
        if (parts[0] && parts[0] !== 'library') notice('That page was not found. Your collection is here.');
      }
    }
    state.boot = false;
  }

  function openDialog(id) {
    if (id === 'journal-dialog') renderJournal();
    if (id === 'contents-dialog') renderContents();
    if (id === 'search-dialog') { state.searchLimit = 50; search(); }
    byId(id).showModal();
    if (id === 'search-dialog') byId('chapter-search').focus();
  }

  function renderContents() {
    byId('contents-volume').value = state.chapter ? state.chapter.volume : state.volume || 1;
    renderContentsList();
    const selected = byId('contents-list').querySelector('.current');
    if (selected) requestAnimationFrame(() => selected.scrollIntoView({ block: 'center', behavior: 'instant' }));
  }

  function renderContentsList() {
    const volume = library.volumes.find(item => item.number === Number(byId('contents-volume').value));
    byId('contents-list').replaceChildren(...volume.chapters.map(id => chapterListItem(chapterMap.get(id), !!state.chapter && id === state.chapter.id)));
  }

  function search() {
    const query = byId('chapter-search').value.trim().toLocaleLowerCase();
    let matches = [];
    if (!query) matches = library.chapters.slice(0, 12);
    else if (/^(?:chapter\s*)?\d+$/.test(query)) {
      const number = Number(query.replace(/chapter\s*/, ''));
      matches = library.chapters.filter(chapter => chapter.number === number);
    } else matches = library.chapters.filter(chapter => (chapter.label + ' ' + chapter.title).toLocaleLowerCase().includes(query));
    const fragment = document.createDocumentFragment();
    for (const chapter of matches.slice(0, state.searchLimit)) {
      const link = element('a', 'search-result'); link.href = '#/read/' + chapter.id;
      const description = element('div');
      description.append(element('strong', '', chapter.title), element('small', '', 'Volume ' + chapter.volume + ': ' + library.volumes[chapter.volume - 1].title + ' · ' + chapter.minutes + ' min'));
      link.append(element('span', '', chapter.number === null ? '✧' : String(chapter.number)), description, element('i', '', '↗'));
      fragment.append(link);
    }
    if (!matches.length) fragment.append(element('p', 'empty-note', 'No chapters match. Try a title or exact chapter number.'));
    byId('search-results').replaceChildren(fragment);
    byId('more-search').hidden = matches.length <= state.searchLimit;
  }

  function renderJournal() {
    byId('journal-summary').replaceChildren(element('strong', '', store.data.completed.length + ' reading sections finished.'), element('p', '', 'Marked as read · ' + store.data.bookmarks.length + ' saved chapters · Everything stays on this device.'));
    const container = byId('journal-bookmarks'); container.replaceChildren();
    for (const bookmark of store.data.bookmarks) {
      const chapter = chapterMap.get(bookmark.id);
      const row = element('div', 'bookmark-row');
      const link = element('a'); link.href = '#/read/' + chapter.id + '?resume=1';
      link.append(element('strong', '', chapter.title), element('small', '', 'Volume ' + chapter.volume + ' · ' + chapter.label));
      const remove = element('button', '', '×'); remove.setAttribute('aria-label', 'Remove bookmark for ' + chapter.title);
      remove.addEventListener('click', () => { store.data.bookmarks = store.data.bookmarks.filter(item => item.id !== chapter.id); store.save(); renderJournal(); updateBookmark(); renderVolumes(); });
      row.append(link, remove); container.append(row);
    }
    if (!store.data.bookmarks.length) container.append(element('p', 'empty-note', 'Save a chapter while reading. A little thread back to a favorite place.'));
  }

  function toggleFocus() { store.data.preferences.focus = !store.data.preferences.focus; store.save(); applyPreferences(); }

  function neighbor(direction) {
    if (!state.chapter) return;
    const target = library.chapters[chapterIndex.get(state.chapter.id) + direction];
    if (target) location.hash = '#/read/' + target.id;
  }

  function downloadBackup() {
    saveProgress();
    const backup = { format: 'above-the-grey', version: 1, savedAt: new Date().toISOString(), data: store.data };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const link = element('a'); link.href = url; link.download = 'above-the-grey-reading-backup.json'; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    notice('Reading backup requested. Check your browser downloads.');
  }

  async function importBackup(file) {
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('That backup is too large. Choose a reading backup smaller than 2 MB.');
      const backup = JSON.parse(await file.text());
      if (!backup || backup.format !== 'above-the-grey' || backup.version !== 1 || !backup.data || typeof backup.data !== 'object') throw new Error('This is not a compatible Above the Grey backup.');
      store.importData(backup.data); applyPreferences(); renderVolumes(); renderJournal(); updateBookmark();
      notice('Reading preferences, bookmarks and saved positions restored.');
    } catch (error) { notice(error instanceof SyntaxError ? 'That file is not valid JSON. Choose a reading backup.' : error.message); }
    finally { byId('import-progress').value = ''; }
  }

  for (const volume of library.volumes) {
    const option = element('option', '', roman[volume.number - 1] + ' · ' + volume.title); option.value = volume.number; byId('contents-volume').append(option);
  }
  for (const [buttonId, dialogId] of [['search-button', 'search-dialog'], ['settings-button', 'settings-dialog'], ['journal-button', 'journal-dialog'], ['contents-button', 'contents-dialog'], ['about-button', 'about-dialog']]) byId(buttonId).addEventListener('click', () => openDialog(dialogId));
  for (const button of document.querySelectorAll('[data-close]')) button.addEventListener('click', () => byId(button.dataset.close).close());
  for (const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#/"]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
    if (link.getAttribute('href') === location.hash) { event.preventDefault(); route(); }
  });
  for (const button of document.querySelectorAll('[data-theme-option]')) button.addEventListener('click', () => { store.data.preferences.theme = button.dataset.themeOption; store.save(); applyPreferences(); });
  for (const [id, property] of [['font-size', 'fontSize'], ['line-height', 'lineHeight'], ['text-width', 'textWidth'], ['art-opacity', 'artOpacity']]) byId(id).addEventListener('input', () => { store.data.preferences[property] = Number(byId(id).value); store.save(); applyPreferences(); });
  byId('focus-button').addEventListener('click', toggleFocus);
  byId('focus-setting').addEventListener('change', () => { store.data.preferences.focus = byId('focus-setting').checked; store.save(); applyPreferences(); });
  byId('reset-settings').addEventListener('click', () => { store.data.preferences = { ...store.defaults }; store.save(); applyPreferences(); notice('Reading preferences reset.'); });
  byId('contents-volume').addEventListener('change', renderContentsList);
  byId('volume-filter').addEventListener('input', filterVolume);
  byId('chapter-search').addEventListener('input', () => { state.searchLimit = 50; search(); });
  byId('more-search').addEventListener('click', () => { state.searchLimit += 50; search(); });
  byId('reader-prev-button').addEventListener('click', () => neighbor(-1));
  byId('reader-next-button').addEventListener('click', () => neighbor(1));
  byId('retry-button').addEventListener('click', () => { if (state.chapter) openChapter(state.chapter, false); });
  byId('bookmark-button').addEventListener('click', () => {
    if (!state.chapter || state.loading) return;
    const id = state.chapter.id;
    const existing = store.data.bookmarks.some(bookmark => bookmark.id === id);
    if (existing) store.data.bookmarks = store.data.bookmarks.filter(bookmark => bookmark.id !== id);
    else store.data.bookmarks.push({ id, ratio: progressRatio() });
    store.save(); updateBookmark(); notice(existing ? 'Bookmark removed.' : 'Chapter saved to My reading.');
  });
  byId('mark-read-button').addEventListener('click', () => {
    if (!state.chapter || state.loading) return;
    const id = state.chapter.id;
    if (store.data.completed.includes(id)) store.data.completed = store.data.completed.filter(item => item !== id);
    else store.data.completed.push(id);
    store.save(); updateBookmark(); notice(store.data.completed.includes(id) ? 'Chapter marked as read.' : 'Read marker removed.');
  });
  byId('export-progress').addEventListener('click', downloadBackup);
  byId('import-progress').addEventListener('change', event => importBackup(event.target.files[0]));
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.target.matches('input,textarea,select,[contenteditable]')) return;
    if (document.querySelector('dialog[open]')) return;
    if (event.key === '/') { event.preventDefault(); openDialog('search-dialog'); }
    if (event.key.toLowerCase() === 'f' && state.chapter) { event.preventDefault(); toggleFocus(); }
  });
  window.addEventListener('hashchange', route);
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    byId('main-content').focus({ preventScroll: true });
    byId('main-content').scrollIntoView({ behavior: 'instant' });
  });
  window.addEventListener('scroll', () => {
    if (state.scrollPending) return;
    state.scrollPending = true;
    requestAnimationFrame(() => {
      state.scrollPending = false; updateProgress();
      clearTimeout(state.saveTimer); state.saveTimer = setTimeout(saveProgress, 600);
    });
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  window.addEventListener('pagehide', saveProgress);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveProgress(); });
  route();
  if (!store.storageAvailable) notice('Browser storage is unavailable. You can still read; use backup export to preserve this session’s progress.');
})();
