// Regression checks for src/lib/docx.ts. Run: node scripts/docx-test.ts
import JSZip from 'jszip';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildDocx, scanDocx } from '../src/lib/docx.ts';

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const p = (...runs: string[]) => `<w:p>${runs.map((r) => `<w:r><w:t xml:space="preserve">${r}</w:t></w:r>`).join('')}</w:p>`;
const tbl = (inner: string) => `<w:tbl><w:tblPr/><w:tr><w:tc>${inner}</w:tc></w:tr></w:tbl>`;

async function docx(body: string) {
	const zip = new JSZip();
	zip.file('[Content_Types].xml', '<Types></Types>');
	zip.file('word/_rels/document.xml.rels', '<Relationships><Relationship Id="rId1"/></Relationships>');
	zip.file('word/document.xml', `<w:document ${W}><w:body>${body}</w:body></w:document>`);
	return new Blob([await zip.generateAsync({ type: 'uint8array' })]);
}

const open = async (b: Blob) => JSZip.loadAsync(await b.arrayBuffer());

// Minimal PNG header: signature + IHDR with width/height
function fakePng(w: number, h: number) {
	const b = new Uint8Array(24);
	const v = new DataView(b.buffer);
	v.setUint32(16, w);
	v.setUint32(20, h);
	return b;
}

// 1. marker split across runs (Word spell-check), unrelated table before it
{
	const body =
		tbl(p('Bewertung') + p('10 Punkte')) +
		p('Text') +
		tbl(p('[[SB:', 'a1_code]]') + p('move (10) steps') + p('[[/SB]]'));
	const s = await scanDocx(await docx(body));
	assert.deepEqual(s.blocks, [{ id: 'a1_code', code: 'move (10) steps' }]);
	const out = await open(await buildDocx(s, new Map([['a1_code', fakePng(300, 90)]])));
	const xml = await out.file('word/document.xml')!.async('string');
	assert.ok(xml.includes('Bewertung'), 'unrelated table must survive');
	assert.ok(!xml.includes('[[SB'), 'marker table replaced');
	assert.ok(out.file('word/media/scratchblock_a1_code.png'));
	console.log('✓ split-run marker, unrelated table kept');
}

// 2. duplicate ids get unique keys and both tables are replaced
{
	const block = tbl(p('[[SB:a1_code]]') + p('say [hi]') + p('[[/SB]]'));
	const s = await scanDocx(await docx(block + p('x') + block));
	assert.deepEqual(s.blocks.map((b) => b.id), ['a1_code', 'a1_code-2']);
	const pngs = new Map(s.blocks.map((b) => [b.id, fakePng(100, 40)]));
	const out = await open(await buildDocx(s, pngs));
	const xml = await out.file('word/document.xml')!.async('string');
	assert.equal((xml.match(/<w:drawing>/g) ?? []).length, 2);
	assert.ok(!xml.includes('<w:tbl>'));
	console.log('✓ duplicate ids');
}

// 3. building twice (after edits) starts from the original document
{
	const s = await scanDocx(await docx(tbl(p('[[SB:a]]') + p('say [x]') + p('[[/SB]]'))));
	await buildDocx(s, new Map([['a', fakePng(10, 10)]]));
	const out = await open(await buildDocx(s, new Map([['a', fakePng(10, 10)]])));
	const rels = await out.file('word/_rels/document.xml.rels')!.async('string');
	assert.equal((rels.match(/scratchblock_a\.png/g) ?? []).length, 1);
	console.log('✓ repeat export');
}

// 4. real exam fixtures still parse
for (const [f, n] of [
	['../exams/h9/klausur-h9-scratch3-v2.docx', 4],
	['../exams/h10/klausur-h10-scratch3.docx', 5],
	['static/demo/demo-klausur.docx', 3]
] as const) {
	try {
		const s = await scanDocx(new Blob([readFileSync(f)]));
		assert.equal(s.blocks.length, n, f);
		console.log(`✓ ${f}: ${s.blocks.map((b) => b.id).join(', ')}`);
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') console.log(`- skipped ${f} (not in this checkout)`);
		else throw e;
	}
}
