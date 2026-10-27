# text2scratch

Scratch-Code als Text schreiben und als Scratch-3-Blöcke bekommen. Läuft komplett im Browser, keine Datei verlässt den Rechner.

**Live:** https://cuxbytes.github.io/text2scratch/

- **Editor:** Text links, Blöcke rechts, live. Export als SVG oder PNG.
- **Word-Workflow:** .docx hochladen, Codeblöcke prüfen und bearbeiten, fertige .docx mit Block-Bildern herunterladen.
- Deutsche und englische Schlüsselwörter. Die Blocksprache lässt sich umschalten (DE/EN).

## Codeblöcke im Word-Dokument

Eine einzellige Tabelle, darin:

```
[[SB:a1_code]]
Wenn @greenFlag angeklickt wird
gehe (10) er Schritt
[[/SB]]
```

Jede solche Tabelle wird durch ein PNG mit 288 dpi ersetzt. Beispiel: `static/demo/demo-klausur.docx`. Syntax: https://en.scratch-wiki.info/wiki/Block_Plugin/Syntax

## Entwicklung

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # Typen
npm test           # .docx-Regressionstests
npm run build      # statische Seite in build/
npm run demo:docx  # Demo-Arbeitsblatt neu erzeugen
```

Ein Push auf `main` baut die Seite und veröffentlicht sie über GitHub Actions auf GitHub Pages.

Gebaut mit SvelteKit, [scratchblocks](https://github.com/scratchblocks/scratchblocks) (MIT) und JSZip.
