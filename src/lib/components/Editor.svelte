<script lang="ts">
	import BlockPreview from './BlockPreview.svelte';
	import { examples } from '#lib/examples.ts';
	import { i18n } from '#lib/i18n.svelte.ts';
	import { download, toPng, toSvgString, type Rendered } from '#lib/scratch.ts';

	let code = $state(examples[0].code);
	let debounced = $state(examples[0].code);
	let zoom = $state(1.25);
	let rendered = $state<Rendered | null>(null);
	let copied = $state(false);
	let helpOpen = $state(false);
	let gutter: HTMLDivElement;

	const t = $derived(i18n.t);
	const lineCount = $derived(code.split('\n').length);

	$effect(() => {
		const next = code;
		const id = setTimeout(() => (debounced = next), 150);
		return () => clearTimeout(id);
	});

	function pick(e: Event) {
		const ex = examples.find((x) => x.id === (e.target as HTMLSelectElement).value);
		if (ex) code = debounced = ex.code;
		(e.target as HTMLSelectElement).value = '';
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;
		e.preventDefault();
		const ta = e.target as HTMLTextAreaElement;
		const { selectionStart: s, selectionEnd: end } = ta;
		code = code.slice(0, s) + '   ' + code.slice(end);
		requestAnimationFrame(() => ta.setSelectionRange(s + 3, s + 3));
	}

	async function copySvg() {
		if (!rendered) return;
		await navigator.clipboard.writeText(toSvgString(rendered));
		copied = true;
		setTimeout(() => (copied = false), 1400);
	}

	function dlSvg() {
		if (rendered) download(toSvgString(rendered), 'scratch-blocks.svg', 'image/svg+xml');
	}

	async function dlPng() {
		if (rendered) download(await toPng(rendered, 3 / zoom), 'scratch-blocks.png', 'image/png');
	}
</script>

<section class="editor">
	<div class="pane sheet source">
		<header>
			<span class="label">01 · {t.source}</span>
			<select class="btn" onchange={pick} aria-label={t.examples}>
				<option value="">{t.examples} …</option>
				{#each examples as ex (ex.id)}
					<option value={ex.id}>{ex.title[i18n.lang]}</option>
				{/each}
			</select>
		</header>
		<div class="code">
			<div class="gutter" bind:this={gutter} aria-hidden="true">
				{#each { length: lineCount } as _, i}<span>{i + 1}</span>{/each}
			</div>
			<textarea
				bind:value={code}
				onkeydown={onKeydown}
				onscroll={(e) => (gutter.scrollTop = (e.target as HTMLElement).scrollTop)}
				spellcheck="false"
				autocapitalize="off"
				aria-label={t.source}
			></textarea>
		</div>
		<footer>
			<button class="link" onclick={() => (helpOpen = !helpOpen)} aria-expanded={helpOpen}>
				{t.syntax}
				{helpOpen ? '−' : '+'}
			</button>
			{#if helpOpen}
				<p class="help">
					{t.syntaxBody}
					<a href="https://en.scratch-wiki.info/wiki/Block_Plugin/Syntax" target="_blank" rel="noreferrer"
						>{t.syntaxLink} ↗</a
					>
				</p>
			{/if}
		</footer>
	</div>

	<div class="pane sheet preview">
		<header>
			<span class="label">02 · {t.preview}</span>
			<div class="tools">
				<label class="zoom">
					<span class="label">{Math.round(zoom * 100)}%</span>
					<input type="range" min="0.75" max="2" step="0.25" bind:value={zoom} aria-label="Zoom" />
				</label>
				<button class="btn" onclick={copySvg} disabled={!rendered}>{copied ? `✓ ${t.copied}` : t.copySvg}</button>
				<button class="btn" onclick={dlSvg} disabled={!rendered}>↓ {t.dlSvg}</button>
				<button class="btn primary" onclick={dlPng} disabled={!rendered}>↓ {t.dlPng}</button>
			</div>
		</header>
		<div class="stage">
			{#if !debounced.trim()}
				<p class="empty">{t.empty}</p>
			{/if}
			<BlockPreview code={debounced} lang={i18n.lang} {zoom} bind:rendered />
		</div>
		{#if rendered?.warnings.length}
			<div class="warn">
				<span class="label">{t.unknown}</span>
				{#each rendered.warnings as w}<code>{w}</code>{/each}
			</div>
		{/if}
	</div>
</section>

<style>
	.editor {
		display: grid;
		grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
		gap: 20px;
		min-height: 560px;
	}
	.source {
		--tone: var(--sensing);
	}
	.preview {
		--tone: var(--operators);
	}
	.pane {
		display: flex;
		flex-direction: column;
		min-width: 0;
		overflow: hidden;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		padding: 14px 14px 12px 18px;
		border-bottom: 1px solid var(--line);
	}
	.tools {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		align-items: center;
	}
	.zoom {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-right: 4px;
	}
	.zoom input {
		width: 90px;
		accent-color: var(--operators-edge);
	}
	.code {
		flex: 1;
		display: flex;
		min-height: 320px;
		position: relative;
	}
	.gutter {
		width: 48px;
		flex: none;
		overflow: hidden;
		padding: 16px 0;
		text-align: right;
		background: var(--canvas-2);
		border-right: 2px solid color-mix(in srgb, var(--tone) 55%, transparent);
		font-family: var(--font-mono);
		font-size: 0.8rem;
		line-height: 1.7rem;
		color: var(--ink-3);
		user-select: none;
	}
	.gutter span {
		display: block;
		padding-right: 10px;
	}
	textarea {
		flex: 1;
		border: 0;
		resize: none;
		background: transparent;
		padding: 16px 16px 16px 14px;
		font-family: var(--font-mono);
		font-size: 0.9rem;
		line-height: 1.7rem;
		white-space: pre;
		overflow: auto;
		outline: none;
		tab-size: 3;
	}
	footer {
		border-top: 1px solid var(--line);
		padding: 10px 18px;
		font-size: 0.875rem;
	}
	.link {
		background: none;
		border: 0;
		padding: 0;
		color: var(--link);
		font-weight: 600;
	}
	.help {
		margin: 8px 0 4px;
		color: var(--ink-2);
	}
	.help a {
		color: var(--link);
		display: inline-block;
		margin-top: 4px;
	}

	.stage {
		flex: 1;
		overflow: auto;
		padding: 28px;
		min-height: 320px;
		background-color: var(--canvas-2);
		background-image: radial-gradient(var(--dot) 1.3px, transparent 1.3px);
		background-size: 20px 20px;
	}
	.empty {
		color: var(--ink-3);
		font-size: 1.15rem;
		font-weight: 500;
		margin: 0;
	}
	.warn {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
		padding: 10px 18px;
		background: var(--danger-soft);
		border-top: 1px solid var(--line);
	}
	.warn .label {
		color: var(--danger);
	}
	.warn code {
		font-family: var(--font-mono);
		font-size: 0.8rem;
	}

	@media (max-width: 860px) {
		.editor {
			grid-template-columns: 1fr;
		}
		.code {
			min-height: 260px;
		}
	}
</style>
