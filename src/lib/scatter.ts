// "Scatter blocks": break a script into its single blocks and lay them out at
// random, like loose puzzle pieces. Every piece of the solution is there, but
// nothing is connected. Pieces are only moved, never rotated. C-blocks keep
// their full bracket with an empty mouth.
import { lib, type Lang } from './scratch.ts';

export interface Scattered {
	/** Standalone SVG markup (styles inlined once). */
	svg: string;
	width: number;
	height: number;
	pieces: number;
}

export interface ScatterOptions {
	/** Also pull nested reporters and conditions out, leaving empty slots. */
	detachInputs: boolean;
	seed: number;
}

const GAP = 18; // min. space between pieces
const PAD = 16; // border around the whole map
// scratchblocks draws an empty C-mouth only ~27px tall, so loops look like a
// thin sliver. Make it as tall as one stack block so the bracket reads clearly.
const MOUTH = 40;

// Small seeded PRNG so "shuffle again" is the only thing that changes the layout
function mulberry32(seed: number) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Split a parsed document into loose blocks. Mutates the parsed tree. */
function explode(doc: any, detachInputs: boolean): any[] {
	const s = lib();
	const out: any[] = [];

	function take(block: any) {
		if (!block?.isBlock) return;
		out.push(block);
		block.children = block.children.map((child: any) => {
			if (child?.isScript) {
				child.blocks.forEach(take);
				return new s.Script([]);
			}
			if (detachInputs && child?.isBlock && (child.isReporter || child.isBoolean)) {
				take(child);
				return child.isBoolean ? new s.Input('boolean') : new s.Input('number', '');
			}
			return child;
		});
	}

	doc.scripts.forEach((script: any) => script.blocks.forEach(take));
	return out;
}

/** Patch empty C-mouths in a view tree to MOUTH height (applied when the parent block draws them). */
function widenMouths(view: any) {
	for (const child of [...(view.scripts ?? []), ...(view.blocks ?? []), ...(view.children ?? [])]) {
		if (child?.isScript && !child.blocks.length) {
			const draw = child.draw.bind(child);
			child.draw = (...args: any[]) => {
				const el = draw(...args);
				child.height = MOUTH;
				return el;
			};
		}
		if (child && typeof child === 'object') widenMouths(child);
	}
}

interface Piece {
	el: SVGSVGElement;
	w: number;
	h: number;
	// top-left corner
	x: number;
	y: number;
}

function overlaps(a: Piece, b: Piece) {
	return a.x < b.x + b.w + GAP && b.x < a.x + a.w + GAP && a.y < b.y + b.h + GAP && b.y < a.y + a.h + GAP;
}

/** Random, non-overlapping placement. Grows the area until everything fits. */
function place(pieces: Piece[], rand: () => number) {
	const area = pieces.reduce((sum, p) => sum + (p.w + GAP) * (p.h + GAP), 0);
	let W = Math.max(Math.sqrt(area * 2.2 * 1.4), ...pieces.map((p) => p.w + GAP));
	let H = Math.max(W / 1.4, ...pieces.map((p) => p.h + GAP));
	// big pieces first, they are hardest to fit
	const order = [...pieces].sort((a, b) => b.w * b.h - a.w * a.h);

	for (;;) {
		const placed: Piece[] = [];
		const ok = order.every((p) => {
			for (let i = 0; i < 400; i++) {
				p.x = rand() * (W - p.w);
				p.y = rand() * (H - p.h);
				if (!placed.some((q) => overlaps(p, q))) {
					placed.push(p);
					return true;
				}
			}
			return false;
		});
		if (ok) return;
		W *= 1.12;
		H *= 1.12;
	}
}

export function scatter(code: string, lang: Lang, opts: ScatterOptions): Scattered | null {
	const s = lib();
	const doc = s.parse(code, { languages: ['en', 'de'] });
	doc.translate(s.allLanguages[lang]);
	const blocks = explode(doc, opts.detachInputs);
	if (!blocks.length) return null;

	const rand = mulberry32(opts.seed);
	let style = '';
	const pieces: Piece[] = blocks.map((block) => {
		const view = s.newView(new s.Document([new s.Script([block])]), { style: 'scratch3', scale: 1 });
		widenMouths(view);
		const el = view.render() as SVGSVGElement;
		// grab the inlined stylesheet once, every piece shares it
		if (!style) style = view.exportSVGString().match(/<style[\s\S]*?<\/style>/)?.[0] ?? '';
		return { el, w: view.width, h: view.height, x: 0, y: 0 };
	});

	place(pieces, rand);

	// crop to what is actually used
	const minX = Math.min(...pieces.map((p) => p.x)) - PAD;
	const minY = Math.min(...pieces.map((p) => p.y)) - PAD;
	const width = Math.ceil(Math.max(...pieces.map((p) => p.x + p.w)) - minX + PAD);
	const height = Math.ceil(Math.max(...pieces.map((p) => p.y + p.h)) - minY + PAD);

	const xml = new XMLSerializer();
	const body = pieces
		.map((p) => {
			const inner = xml.serializeToString(p.el).replace(/^<svg[^>]*>|<\/svg>$/g, '');
			return `<g transform="translate(${(p.x - minX).toFixed(1)} ${(p.y - minY).toFixed(1)})">${inner}</g>`;
		})
		.join('');

	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" ` +
		`width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="scratchblocks-style-scratch3">` +
		`<defs>${style}</defs>${body}</svg>`;

	return { svg, width, height, pieces: pieces.length };
}

/** Rasterize standalone SVG markup to PNG (scale 3 = 288 dpi). */
export function svgToPng(svg: string, width: number, height: number, scale = 3): Promise<Uint8Array<ArrayBuffer>> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = Math.ceil(width * scale);
			canvas.height = Math.ceil(height * scale);
			const ctx = canvas.getContext('2d')!;
			ctx.scale(scale, scale);
			ctx.drawImage(img, 0, 0, width, height);
			canvas.toBlob(async (blob) => {
				if (!blob) return reject(new Error('PNG export failed'));
				resolve(new Uint8Array(await blob.arrayBuffer()));
			}, 'image/png');
		};
		img.onerror = () => reject(new Error('PNG export failed'));
		img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
	});
}
