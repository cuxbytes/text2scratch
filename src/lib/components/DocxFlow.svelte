<script lang="ts">
	import BlockPreview from './BlockPreview.svelte';
	import { i18n } from '#lib/i18n.svelte.ts';
	import { buildDocx, scanDocx, zipPngs, type ScannedDocx } from '#lib/docx.ts';
	import { download, toPng, type Rendered } from '#lib/scratch.ts';

	type Item = { id: string; code: string; rendered: Rendered | null; editing: boolean };

	let scanned = $state<ScannedDocx | null>(null);
	let fileName = $state('');
	let items = $state<Item[]>([]);
	let error = $state('');
	let dragging = $state(false);
	let busy = $state(false);
	let input = $state<HTMLInputElement>();

	// cards cycle through the Scratch category colours
	const tones = ['motion', 'looks', 'sound', 'events', 'control', 'sensing', 'operators', 'variables', 'myblocks'];

	const t = $derived(i18n.t);
	const step = $derived(scanned ? (items.length ? 3 : 2) : 1);

	async function load(file: Blob, name: string) {
		error = '';
		try {
			const s = await scanDocx(file);
			scanned = s;
			fileName = name.replace(/\.docx$/i, '');
			items = s.blocks.map((b) => ({ ...b, rendered: null, editing: false }));
		} catch (e) {
			error = `${t.error} ${(e as Error).message}`;
		}
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		const f = e.dataTransfer?.files[0];
		if (f) load(f, f.name);
	}

	function onPick() {
		const f = input!.files?.[0];
		if (f) load(f, f.name);
		input!.value = '';
	}

	async function loadDemo() {
		error = '';
		try {
			const res = await fetch('demo/demo-klausur.docx');
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			await load(await res.blob(), 'demo-klausur.docx');
		} catch (e) {
			error = `${t.error} ${(e as Error).message}`;
		}
	}

	async function collectPngs() {
		const done = items.filter((it) => it.rendered);
		const pngs = await Promise.all(done.map((it) => toPng(it.rendered!, 3)));
		return new Map<string, Uint8Array>(done.map((it, i) => [it.id, pngs[i]]));
	}

	// Runs an export and shows failures in the UI instead of rejecting silently
	async function run(task: () => Promise<void>) {
		busy = true;
		error = '';
		try {
			await task();
		} catch (e) {
			error = `${t.exportError} ${(e as Error).message}`;
		} finally {
			busy = false;
		}
	}

	const exportDocx = () =>
		run(async () => {
			if (!scanned) return;
			const blob = await buildDocx(scanned, await collectPngs(), 3);
			download(blob, `${fileName}-final.docx`, blob.type);
		});

	const exportZip = () =>
		run(async () => {
			download(await zipPngs(await collectPngs()), `${fileName}-blocks.zip`, 'application/zip');
		});

	const dlOne = (it: Item) =>
		run(async () => {
			if (it.rendered) download(await toPng(it.rendered, 3), `${it.id}.png`, 'image/png');
		});

	function reset() {
		scanned = null;
		items = [];
		fileName = '';
	}
</script>

<section class="flow">
	<ol class="steps" aria-label="Steps">
		{#each [t.step1, t.step2, t.step3] as label, i}
			<li class:active={step === i + 1} class:done={step > i + 1}>
				<span class="n">{i + 1}</span>{label}
			</li>
		{/each}
	</ol>

	{#if !scanned}
		<div
			class="drop sheet"
			class:dragging
			role="region"
			aria-label={t.drop}
			ondragover={(e) => {
				e.preventDefault();
				dragging = true;
			}}
			ondragleave={(e) => {
				// moving onto a child also fires dragleave; only reset when leaving the zone
				if (!e.currentTarget.contains(e.relatedTarget as Node | null)) dragging = false;
			}}
			ondrop={onDrop}
		>
			<div class="doc-icon" aria-hidden="true">
				<span></span><span></span><span class="sb"></span><span></span>
			</div>
			<h2>{t.drop}</h2>
			<div class="drop-actions">
				<button class="btn primary" onclick={() => input?.click()}>{t.dropOr}</button>
				<button class="btn accent" onclick={loadDemo}>★ {t.demoDoc}</button>
			</div>
			<p class="hint"><code>[[SB:a3_code]]</code> … <code>[[/SB]]</code> · {t.dropHint}</p>
			{#if error}<p class="err">{error}</p>{/if}
			<input type="file" accept=".docx" bind:this={input} onchange={onPick} hidden />
		</div>
	{:else}
		<div class="bar sheet">
			<div>
				<strong class="fname">{fileName}.docx</strong>
				<span class="label">{items.length ? t.found(items.length) : t.none}</span>
			</div>
			<div class="actions">
				<button class="btn" onclick={reset}>← {t.another}</button>
				<button class="btn" onclick={exportZip} disabled={!items.length || busy}>↓ {t.allPng}</button>
				<button class="btn accent" onclick={exportDocx} disabled={!items.length || busy}>
					↓ {busy ? t.building : t.build}
				</button>
			</div>
		</div>
		<p class="note">{t.exportNote}</p>
		{#if error}<p class="err">{error}</p>{/if}

		<div class="grid">
			{#each items as it, i (it.id)}
				<article class="card sheet" style="--tone: var(--{tones[i % tones.length]}); animation-delay: {i * 60}ms">
					<header>
						<code class="tag">[[SB:{it.id}]]</code>
						<div class="actions">
							<button class="btn" onclick={() => (it.editing = !it.editing)}>
								{it.editing ? t.done : t.edit}
							</button>
							<button class="btn" onclick={() => dlOne(it)} disabled={!it.rendered}>↓ PNG</button>
						</div>
					</header>
					{#if it.editing}
						<textarea bind:value={it.code} spellcheck="false" rows={it.code.split('\n').length + 1}></textarea>
					{/if}
					<div class="stage">
						<BlockPreview code={it.code} lang={i18n.lang} bind:rendered={it.rendered} />
					</div>
					{#if it.rendered?.warnings.length}
						<div class="warn"><span class="label">{t.unknown}</span> {it.rendered.warnings.join(' · ')}</div>
					{/if}
				</article>
			{/each}
		</div>
	{/if}
</section>

<style>
	.flow {
		--tone: var(--control);
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	/* steps as reporter pills joined by a connector */
	.steps {
		display: flex;
		align-items: center;
		list-style: none;
		padding: 0;
		margin: 0;
		flex-wrap: wrap;
		row-gap: 8px;
	}
	.steps li {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 14px 4px 4px;
		border-radius: 999px;
		background: var(--surface);
		border: 1px solid var(--line);
		box-shadow: inset 0 -2px 0 var(--line);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--ink-3);
	}
	.steps li + li {
		position: relative;
		margin-left: 20px;
	}
	.steps li + li::before {
		content: '';
		position: absolute;
		left: -21px;
		top: calc(50% - 1.5px);
		width: 20px;
		height: 3px;
		background: var(--line);
	}
	.n {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--canvas-2);
		font-family: var(--font-mono);
		font-size: 0.78rem;
	}
	.steps li.active {
		background: var(--control);
		border-color: var(--control-edge);
		box-shadow: inset 0 -2px 0 var(--control-edge);
		color: var(--on-tone);
	}
	.steps li.active .n {
		background: var(--surface);
		color: var(--ink);
	}
	.steps li.done {
		color: var(--ink);
	}
	.steps li.done .n {
		background: var(--operators);
		color: var(--on-tone);
	}

	.drop {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 14px;
		padding: 56px 24px;
		transition: transform 0.15s;
	}
	/* dashed inner mouth, like an empty C-block waiting for a script */
	.drop::after {
		content: '';
		position: absolute;
		inset: 14px;
		border: 2px dashed var(--line);
		border-radius: 8px;
		pointer-events: none;
		transition: border-color 0.15s;
	}
	.drop.dragging {
		transform: scale(1.01);
	}
	.drop.dragging::after {
		border-color: var(--events-edge);
		background: color-mix(in srgb, var(--events) 10%, transparent);
	}
	.drop > :global(*) {
		position: relative;
		z-index: 1;
	}
	.drop h2 {
		font-family: var(--font-display);
		font-weight: 800;
		letter-spacing: -0.03em;
		font-size: clamp(1.6rem, 4vw, 2.3rem);
		margin: 0;
	}
	.drop-actions {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
	}
	.hint {
		color: var(--ink-3);
		font-size: 0.875rem;
		max-width: 46ch;
		margin: 6px 0 0;
	}
	.hint code,
	.tag {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		color: var(--ink-2);
		font-weight: 500;
	}
	.err {
		color: var(--danger);
	}
	.doc-icon {
		width: 64px;
		height: 80px;
		background: var(--surface);
		border: 1.5px solid var(--ink-3);
		border-radius: 6px;
		padding: 14px 10px;
		display: flex;
		flex-direction: column;
		gap: 7px;
		transform: rotate(-4deg);
	}
	.doc-icon span {
		height: 4px;
		border-radius: 2px;
		background: var(--line);
	}
	.doc-icon .sb {
		height: 14px;
		width: 80%;
		background: var(--control);
		border-radius: 3px;
		box-shadow: inset 0 -2px 0 var(--control-edge);
	}

	.bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 14px;
		flex-wrap: wrap;
		padding: 16px 18px 14px;
	}
	.fname {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		margin-right: 12px;
		word-break: break-all;
	}
	.actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.note {
		margin: -8px 0 0;
		font-size: 0.875rem;
		color: var(--ink-2);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 380px), 1fr));
		gap: 18px;
	}
	.card {
		min-width: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: snap 0.45s both cubic-bezier(0.2, 0.8, 0.2, 1.25);
	}
	.card header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
		padding: 14px 12px 10px 16px;
		border-bottom: 1px solid var(--line);
	}
	.card textarea {
		border: 0;
		border-bottom: 1px solid var(--line);
		background: var(--canvas-2);
		font-family: var(--font-mono);
		font-size: 0.82rem;
		line-height: 1.6;
		padding: 12px 16px;
		resize: vertical;
		white-space: pre;
		outline: none;
	}
	.card textarea:focus-visible {
		box-shadow: inset 3px 0 0 var(--tone);
	}
	.card .stage {
		padding: 20px;
		overflow: auto;
		flex: 1;
		background-color: var(--canvas-2);
		background-image: radial-gradient(var(--dot) 1.3px, transparent 1.3px);
		background-size: 20px 20px;
	}
	/* shrink wide scripts to the card instead of clipping them */
	.card .stage :global(.blocks-stage) {
		display: block;
	}
	.card .stage :global(svg) {
		max-width: 100%;
		height: auto;
	}
	.warn {
		padding: 8px 16px;
		background: var(--danger-soft);
		font-size: 0.8rem;
		font-family: var(--font-mono);
	}
	.warn .label {
		color: var(--danger);
	}

	@keyframes snap {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.97);
		}
	}
</style>
