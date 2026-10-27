import init from 'scratchblocks/index.js';
import de from 'scratchblocks/locales/de.json';

export type Lang = 'de' | 'en';

export interface Rendered {
	svg: SVGSVGElement;
	view: any;
	warnings: string[];
}

let sb: any = null;

function lib() {
	if (!sb) {
		sb = init(window);
		sb.loadLanguages({ de });
		sb.appendStyles();
	}
	return sb;
}

// Collect blocks that scratchblocks could not match (rendered grey / "obsolete")
function findUnknown(node: any, out: string[]) {
	if (!node || typeof node !== 'object') return;
	if (node.scripts) node.scripts.forEach((s: any) => findUnknown(s, out));
	if (node.blocks) node.blocks.forEach((b: any) => findUnknown(b, out));
	if (node.child) findUnknown(node.child, out);
	if (node.info && node.info.category === 'obsolete') {
		out.push(node.stringify ? node.stringify().split('\n')[0] : '?');
	}
	if (node.children) node.children.forEach((c: any) => findUnknown(c, out));
}

/** Parse code (English or German keywords) and render it in the target language. */
export function render(code: string, lang: Lang, scale = 1): Rendered {
	const s = lib();
	const doc = s.parse(code, { languages: ['en', 'de'] });
	doc.translate(s.allLanguages[lang]);
	const warnings: string[] = [];
	findUnknown(doc, warnings);
	const view = s.newView(doc, { style: 'scratch3', scale });
	const svg = view.render() as SVGSVGElement;
	svg.classList.add('scratchblocks-style-scratch3');
	return { svg, view, warnings };
}

/** Standalone SVG markup with styles inlined. */
export function toSvgString(r: Rendered): string {
	return r.view.exportSVGString();
}

/** Rasterize to PNG at the given scale (3 = 288 dpi, same as the CLI). */
export function toPng(r: Rendered, scale = 3): Promise<Uint8Array<ArrayBuffer>> {
	return new Promise((resolve, reject) => {
		r.view.toCanvas((canvas: HTMLCanvasElement) => {
			canvas.toBlob(async (blob) => {
				if (!blob) return reject(new Error('PNG export failed'));
				resolve(new Uint8Array(await blob.arrayBuffer()));
			}, 'image/png');
		}, scale);
	});
}

export function download(data: BlobPart, filename: string, type: string) {
	const url = URL.createObjectURL(new Blob([data], { type }));
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
