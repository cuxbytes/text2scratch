// Browser port of Scratch_Klausur_Werkstatt/render-via-puppeteer.js:
// finds [[SB:id]] … [[/SB]] tables in word/document.xml and swaps them for PNGs.
import JSZip from 'jszip';

export interface CodeBlock {
	/** Unique per document; repeated ids get a suffix (a1_code, a1_code-2). */
	id: string;
	code: string;
}

interface TableRange {
	id: string;
	start: number;
	end: number;
}

export interface ScannedDocx {
	zip: JSZip;
	xml: string;
	relsXml: string;
	ctXml: string;
	blocks: CodeBlock[];
	tables: TableRange[];
}

const MAX_FILE = 50 * 1024 * 1024;
const MAX_XML = 50 * 1024 * 1024;

const TBL_OPEN = /<w:tbl[\s>]/g;

/** Every <w:tbl> range in the document, with nesting resolved. */
function tableRanges(xml: string) {
	const ranges: { start: number; end: number }[] = [];
	const stack: number[] = [];
	const re = /<w:tbl[\s>]|<\/w:tbl>/g;
	let m;
	while ((m = re.exec(xml)) !== null) {
		if (m[0] === '</w:tbl>') {
			const start = stack.pop();
			if (start !== undefined) ranges.push({ start, end: m.index + 8 });
		} else {
			stack.push(m.index);
		}
	}
	return ranges;
}

/** Innermost tables whose text starts with [[SB:id]]. Text is joined across
 * runs, because Word often splits typed markers over several <w:t> elements. */
function findBlockTables(xml: string) {
	const found: { id: string; start: number; end: number; code: string }[] = [];
	for (const r of tableRanges(xml)) {
		const inner = xml.substring(r.start, r.end);
		TBL_OPEN.lastIndex = 1;
		if (TBL_OPEN.test(inner)) continue; // has a nested table: only the innermost one counts
		const lines = paragraphLines(inner);
		const first = lines.findIndex((l) => l.trim() !== '');
		const m = first === -1 ? null : /^\s*\[\[SB:([a-zA-Z0-9_]+)\]\]\s*$/.exec(lines[first]);
		if (!m) continue;
		const body = lines.slice(first + 1);
		const close = body.findIndex((l) => /^\s*\[\[\/SB\]\]\s*$/.test(l));
		found.push({ id: m[1], ...r, code: (close === -1 ? body : body.slice(0, close)).join('\n') });
	}
	return found.sort((a, b) => a.start - b.start);
}

function decode(s: string) {
	return s
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&amp;/g, '&');
}

function paragraphLines(blockXml: string) {
	const paraRe = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
	const lines: string[] = [];
	let p;
	while ((p = paraRe.exec(blockXml)) !== null) {
		const textRe = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;
		let t,
			line = '';
		while ((t = textRe.exec(p[1])) !== null) line += decode(t[1]);
		lines.push(line);
	}
	return lines;
}

function pngDimensions(data: Uint8Array) {
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	return { width: view.getUint32(16), height: view.getUint32(20) };
}

function imageParagraphXml(rId: string, wPx: number, hPx: number, dpi: number, imgId: number) {
	const emuPerPx = 914400 / dpi;
	let cx = Math.round(wPx * emuPerPx);
	let cy = Math.round(hPx * emuPerPx);
	const maxCx = 5900000;
	if (cx > maxCx) {
		cy = Math.round(cy * (maxCx / cx));
		cx = maxCx;
	}
	return (
		`<w:p><w:pPr><w:spacing w:before="120" w:after="120"/></w:pPr><w:r><w:drawing>` +
		`<wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">` +
		`<wp:extent cx="${cx}" cy="${cy}"/>` +
		`<wp:effectExtent l="0" t="0" r="0" b="0"/>` +
		`<wp:docPr id="${imgId}" name="Scratchblock_${imgId}"/>` +
		`<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
		`<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
		`<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
		`<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
		`<pic:nvPicPr><pic:cNvPr id="${imgId}" name="Scratchblock_${imgId}.png"/><pic:cNvPicPr/></pic:nvPicPr>` +
		`<pic:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
		`<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
		`</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`
	);
}

async function readText(zip: JSZip, name: string) {
	const entry = zip.file(name);
	if (!entry) throw new Error(`${name} missing`);
	// Guard against zip bombs before inflating
	const size = (entry as any)._data?.uncompressedSize;
	if (typeof size === 'number' && size > MAX_XML) throw new Error(`${name} too large`);
	return entry.async('string');
}

export async function scanDocx(file: Blob): Promise<ScannedDocx> {
	if (file.size > MAX_FILE) throw new Error('file larger than 50 MB');
	const zip = await JSZip.loadAsync(await file.arrayBuffer());
	const xml = await readText(zip, 'word/document.xml');
	const relsXml = await readText(zip, 'word/_rels/document.xml.rels');
	const ctXml = await readText(zip, '[Content_Types].xml');

	const seen = new Map<string, number>();
	const blocks: CodeBlock[] = [];
	const tables: TableRange[] = [];
	for (const f of findBlockTables(xml)) {
		const n = (seen.get(f.id) ?? 0) + 1;
		seen.set(f.id, n);
		const id = n === 1 ? f.id : `${f.id}-${n}`;
		blocks.push({ id, code: f.code });
		tables.push({ id, start: f.start, end: f.end });
	}
	return { zip, xml, relsXml, ctXml, blocks, tables };
}

/**
 * Replace each [[SB:id]] table with its PNG. `pngs` maps block id to PNG bytes
 * rendered at `scale` (3 = 288 dpi). Returns the new .docx as a Blob.
 * Always starts from the original XML, so it can run again after edits.
 */
export async function buildDocx(
	scanned: ScannedDocx,
	pngs: Map<string, Uint8Array>,
	scale = 3
): Promise<Blob> {
	const { zip } = scanned;
	let documentXml = scanned.xml;
	let relsXml = scanned.relsXml;
	let ctXml = scanned.ctXml;

	let maxRid = 0;
	let rm;
	const rIdRe = /Id="rId(\d+)"/g;
	while ((rm = rIdRe.exec(relsXml)) !== null) maxRid = Math.max(maxRid, parseInt(rm[1], 10));
	let nextRid = maxRid + 1;
	let nextImgId = 5000;

	if (!/Extension="png"/i.test(ctXml)) {
		ctXml = ctXml.replace('</Types>', '<Default Extension="png" ContentType="image/png"/></Types>');
	}

	const newRels: { id: string; target: string }[] = [];
	// Tables never overlap (innermost only), so replacing back to front keeps offsets valid
	for (const tbl of [...scanned.tables].reverse()) {
		const png = pngs.get(tbl.id);
		if (!png) continue;
		const dims = pngDimensions(png);

		const pngRel = `media/scratchblock_${tbl.id}.png`;
		zip.file(`word/${pngRel}`, png);

		const rId = `rId${nextRid++}`;
		newRels.push({ id: rId, target: pngRel });

		const replacement = imageParagraphXml(rId, dims.width, dims.height, 96 * scale, nextImgId++);
		documentXml = documentXml.substring(0, tbl.start) + replacement + documentXml.substring(tbl.end);
	}

	if (newRels.length > 0) {
		const insert = newRels
			.map(
				(r) =>
					`<Relationship Id="${r.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${r.target}"/>`
			)
			.join('');
		relsXml = relsXml.replace('</Relationships>', insert + '</Relationships>');
	}

	zip.file('word/document.xml', documentXml);
	zip.file('word/_rels/document.xml.rels', relsXml);
	zip.file('[Content_Types].xml', ctXml);

	return zip.generateAsync({
		type: 'blob',
		compression: 'DEFLATE',
		mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	});
}

export async function zipPngs(pngs: Map<string, Uint8Array>): Promise<Blob> {
	const zip = new JSZip();
	for (const [id, png] of pngs) zip.file(`${id}.png`, png);
	return zip.generateAsync({ type: 'blob' });
}
