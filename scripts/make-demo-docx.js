#!/usr/bin/env node
// Builds static/demo/demo-klausur.docx (served by the app) and ../demo/demo-klausur.docx: a one-page demo worksheet with three
// [[SB:id]] … [[/SB]] code tables, laid out like the real exam sources.
// Run: npm run demo:docx
import JSZip from 'jszip';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
// The second copy only exists in the local workspace, not in the published repo
const outs = [resolve(here, '../static/demo/demo-klausur.docx')];
if (existsSync(resolve(here, '../../demo'))) outs.push(resolve(here, '../../demo/demo-klausur.docx'));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const run = (text, { bold = false, size = 22, color, font } = {}) =>
	`<w:r><w:rPr>${font ? `<w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>` : ''}${bold ? '<w:b/>' : ''}${color ? `<w:color w:val="${color}"/>` : ''}<w:sz w:val="${size}"/></w:rPr><w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;

const para = (runs, { after = 120 } = {}) =>
	`<w:p><w:pPr><w:spacing w:after="${after}"/></w:pPr>${runs}</w:p>`;

const heading = (text, size = 32) => para(run(text, { bold: true, size }), { after: 160 });

// One-cell table, light grey fill, thick Scratch-blue left border (same as the exam files)
function codeTable(id, code) {
	const lines = [`[[SB:${id}]]`, ...code.split('\n'), '[[/SB]]'];
	const paras = lines
		.map(
			(l) =>
				`<w:p><w:pPr><w:spacing w:after="0"/></w:pPr>${run(l, { font: 'Consolas', size: 20 })}</w:p>`
		)
		.join('');
	return (
		`<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/>` +
		`<w:tblBorders><w:left w:val="single" w:sz="36" w:space="0" w:color="4C97FF"/></w:tblBorders>` +
		`<w:tblCellMar><w:top w:w="120" w:type="dxa"/><w:left w:w="200" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/></w:tblCellMar>` +
		`</w:tblPr><w:tblGrid><w:gridCol w:w="9000"/></w:tblGrid>` +
		`<w:tr><w:tc><w:tcPr><w:tcW w:w="9000" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/></w:tcPr>${paras}</w:tc></w:tr></w:tbl>` +
		para('', { after: 120 })
	);
}

const body = [
	heading('Demo-Arbeitsblatt · Scratch-Grundlagen', 36),
	para(run('Name: ______________________    Klasse: ______    Datum: __________', { color: '595959' }), { after: 240 }),
	para(
		run(
			'Diese Datei ist eine Demo für text2scratch. Die grauen Kästen enthalten Scratch-Code als Text. ' +
				'Lade die Datei in den Word-Workflow der App: Jeder Kasten wird durch das gerenderte Block-Bild ersetzt.',
			{ color: '595959', size: 20 }
		),
		{ after: 240 }
	),

	heading('Aufgabe 1 · Die Katze läuft los (2 P)', 26),
	para(run('Lies das Skript. An welcher x-Position steht die Katze am Ende?')),
	codeTable(
		'a1_code',
		`Wenn @greenFlag angeklickt wird
gehe zu x: (-100) y: (0)
setze Richtung auf (90 v) Grad
gehe (50) er Schritt
gehe (30) er Schritt
sage [Geschafft!] für (2) Sekunden`
	),
	para(run('Antwort: x = __________'), { after: 240 }),

	heading('Aufgabe 2 · Ein Quadrat zeichnen (3 P)', 26),
	para(run('Dieses Skript ist in englischer Syntax geschrieben – die App rendert es trotzdem auf Deutsch. Welche Figur entsteht und warum?')),
	codeTable(
		'a2_code',
		`when flag clicked
pen down
repeat (4)
   move (100) steps
   turn right (90) degrees
end
pen up`
	),
	para(run('Antwort: ____________________________________________'), { after: 240 }),

	heading('Aufgabe 3 · Lücken füllen (3 P)', 26),
	para(run('Die Maus soll für jeden Käse einen Punkt bekommen und am Rand umdrehen. Ergänze ①, ② und ③.')),
	codeTable(
		'a3_code',
		`Wenn @greenFlag angeklickt wird
setze [Punkte v] auf (   ①   )
wiederhole fortlaufend
   gehe (10) er Schritt
   falls <wird [Käse v] berührt?>, dann
      ändere [Punkte v] um (   ②   )
   end
   falls <wird [   ③    v] berührt?>, dann
      drehe dich @turnRight um (180) Grad
   end
end`
	),
	para(run('① ________    ② ________    ③ ________'))
].join('');

const documentXml =
	`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
	`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
	`<w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`;

const stylesXml =
	`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
	`<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
	`<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:lang w:val="de-DE"/></w:rPr></w:rPrDefault></w:docDefaults>` +
	`</w:styles>`;

const zip = new JSZip();
zip.file(
	'[Content_Types].xml',
	`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
		`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
		`<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
		`<Default Extension="xml" ContentType="application/xml"/>` +
		`<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
		`<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>` +
		`</Types>`
);
zip.file(
	'_rels/.rels',
	`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
		`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
		`<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
		`</Relationships>`
);
zip.file(
	'word/_rels/document.xml.rels',
	`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
		`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
		`<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
		`</Relationships>`
);
zip.file('word/document.xml', documentXml);
zip.file('word/styles.xml', stylesXml);

const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
for (const out of outs) {
	mkdirSync(dirname(out), { recursive: true });
	writeFileSync(out, buf);
	console.log(`✓ ${out}`);
}
