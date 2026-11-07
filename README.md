# Above the Grey

An unofficial, personal, immersive reading room for your **Lord of the Mysteries** PDF collection.

## Public hosting

The hosted edition and this GitHub repository are public. Anyone can access, download or share their contents; an unadvertised link is not access control. Reading preferences, bookmarks and progress remain in each visitor's browser and are not uploaded to GitHub.

The page includes a `noindex` robots directive and a `robots.txt` request not to crawl the site. These discourage compliant search engines, but cannot guarantee that the website or public repository will remain undiscovered.

GitHub Pages serves the static files from the root of the `main` branch, with `.nojekyll` disabling unnecessary processing. Relative asset paths and hash-based routes support both the hosted project URL and direct offline reading. To use the hosted edition offline, download the complete repository ZIP, extract it and open `index.html`; simply visiting the website does not download every chapter for offline use.

Only the self-contained reading website, original PDF copies, launcher, optional local server and this guide are published. Local extraction tools, test scripts, evidence, browser profiles and caches are deliberately excluded by an allowlist in `.gitignore`. The build and test commands below describe the original local development folder, not the downloadable public edition.

## Open the website

Double-click **Start Reading.cmd**, or open **index.html** in Chrome or Edge.

**No internet, installation, server, account or API key is required.** The website works directly from the folder, even when the browser is offline. Keep the `data`, `art`, CSS and JavaScript files beside `index.html`. You can move the entire website folder, including `originals`, without breaking the collection. Browser progress may not follow a moved folder automatically; back it up first.

This website is separate from **Voice Studio**, which remains in its own folder alongside this one.

## What is included

All nine volumes are ordered using their actual PDF chapter bookmarks, not alphabetically by filename:

| Volume | Title | Numbered chapters | Reading sections |
| --- | --- | --- | --- |
| I | Clown | 1–213 | 213 |
| II | Faceless | 214–482 | 269 |
| III | Traveler | 483–732 | 250 |
| IV | Undying | 733–946 | 214 |
| V | Red Priest | 947–1150 | 204 |
| VI | Lightseeker | 1151–1266 | 116 |
| VII | The Hanged Man | 1267–1353 | 87 |
| VIII | Fool | 1354–1394 | 42, including the afterword |
| IX | Side Stories | 1395–1430 | 41, including five unnumbered extras |

That is **1,430 continuously numbered chapters, six extra reading sections, and 2,740,379 extracted words**. The original edition's numbers are preserved. Next / Previous crosses volume boundaries and includes the afterword and bonuses in their source order. The final chapter correctly has no next link.

There is a different locally generated SVG illustration for each of the **1,436 reading sections**, plus nine volume covers and a library entrance scene. The visual style is deliberately sparse: moonlight, fog, silhouettes and muted brass accents. Motifs include canes, shadows, doors, tarot cards, masks, books, candles, ships, lanterns and more. Every scene has its own composition. Illustrations appear beside the words on desktop and faintly behind the chapter heading on phones.

Themes are chosen from chapter titles and opening passages, with curated cane scenes for Chapters 23 and 43. They suggest atmosphere rather than reproduce every event literally. These are original code-generated vector scenes, not AI-generated photorealistic paintings or artwork taken from an external website.

## Reading features

- **The collection:** browse volumes in order, then filter a volume's chapters by title or chapter number.
- **Search:** use the magnifying glass or `/` to search all chapter titles and exact numbers. Future chapter titles can themselves reveal hints, so search with that in mind. Body text is not shown in search results.
- **Contents:** jump to any chapter in any volume without returning to the library.
- **Resume:** your last position is saved as you scroll. Continue on the home page or reload the current chapter to pick up where you left off.
- **Bookmarks:** Save a chapter from the reader, then find it under My reading. These are chapter bookmarks, not text highlights.
- **Reading completion:** Mark as read at the end of a chapter. This is an explicit choice, not an automatic assumption that scrolling means you finished it.
- **Preferences:** Midnight, Dusk and Parchment themes; text size, line spacing, page width and illustration presence. `F` toggles distraction-free reading. `Esc` closes a panel.
- **Backup and restore:** My reading can export or restore a JSON file containing preferences, positions, bookmarks and completion status. It does not contain book text. Back up before clearing browser data or moving to another browser.
- **Source comparison:** each volume and chapter links to a local, unchanged copy of the original PDF, with the relevant page selected. Appendices, galleries, maps and other non-narrative PDF material remain available there.

The source PDFs in `Downloads not Education\Books` have not been changed. The website's `originals` folder contains byte-identical copies so the reading room is self-contained. Their SHA-256 comparisons are recorded in `tests/output/extraction-audit.json`.

## Privacy and text fidelity

The reader has no online dependencies, trackers, accounts, external fonts, cloud processing or analytics. Preferences and progress are stored in this browser's local storage. If that storage is disabled, reading still works but automatic persistence may not; export a backup to keep the current session's data. Book text is loaded one chapter at a time, and only a small number of chapters are retained in the in-memory cache.

Paragraph boundaries and italic emphasis are retained where the PDF exposes them. Continuations across PDF pages are joined conservatively. As with any PDF extraction, occasional typography, footnote or paragraph-boundary quirks can remain. The source-page link provides an unmodified reference. Do not regard extracted typography as a newly edited edition.

This is a personal, unofficial interface. **Lord of the Mysteries** is by **Cuttlefish That Loves Diving**. Story text, translation, original PDF artwork and publishing rights remain with their respective owners. Do not publish or redistribute the included book files without the appropriate permissions.

## Tests and evidence

The completed checks include:

- **10 library integrity tests** spanning every text file, all 1,436 SVG images, all chapter ranges, nine volumes, continuous numbering, extras, source PDF hashes and runtime assets.
- **20 interactive browser checks** in T3's native browser, repeated in Chrome and Edge using direct `file://` access with network connectivity disabled: chapter navigation, all volume boundaries, search, contents, bookmarks, resume, themes, typography, focus mode, completion, safe import validation, example cane/shadow artwork, missing-file recovery, and invalid routes.
- **Six additional integration checks per browser** covering reload persistence, actual backup download, responsive layouts at 360 / 390 / 768 / 1024 / 1440 pixels, offline original PDFs, no uncaught JavaScript errors, and no external HTTP requests.

Reports, sample reading-data backups and screenshots are in **tests/output**. Those sample backups contain test data, not your reading history.

To rerun the library tests, use Python from this directory:

```
py tests/test_library.py
```

To rerun the direct-file, disconnected-browser tests, use Node.js:

```
node tests/offline.cjs
```

The browser runner uses the existing Chrome / Edge executables on this computer and the bundled optional Playwright Core testing library. It creates isolated test profiles inside `tests`, not in your normal browser profile. The testing tools are not required to use the reader. If reinstalling the optional test package, run `npm.cmd install --prefix tests/tooling --cache tests/.npm-cache --ignore-scripts --no-audit --no-fund`.

For optional HTTP preview, run `node server.cjs` and visit `http://127.0.0.1:8790`. The server is read-only and binds only to your computer. It is not needed for normal offline reading; it stops when you close its terminal or press Ctrl+C.

## Rebuilding and technical notes

`tools/build_library.py` reads the nine source PDFs, uses the chapter outlines to extract sections, preserves emphasis, copies the PDFs, verifies their hashes and writes the chapter files and catalog. `tools/build_art.py` creates the symbolic artwork and updates the catalog. Rebuilding replaces generated files in this website; it does not edit the source PDFs. The source path is recorded in the extraction script and can be changed there if your Books folder moves.

```
py tools/build_library.py
py tools/build_art.py
```

The browser app uses native HTML, CSS, JavaScript and SVG, without framework/CDN downloads. Chapter data is loaded through local classic scripts rather than fetch, so direct `file://` use works without weakening browser security or changing browser flags.

PDF extraction uses the free **PyMuPDF 1.26.7** tool, included under `tools/python` with its AGPL licensing information. Its upstream source is available at https://github.com/pymupdf/PyMuPDF/tree/1.26.7. It is used only by the build/test scripts, not by the website at runtime. Optional browser testing uses **Playwright Core**, licensed under Apache-2.0; its license is included in `tests/tooling/node_modules/playwright-core/LICENSE`. No paid services are used.
