<script lang="ts">
	import Editor from '#lib/components/Editor.svelte';
	import DocxFlow from '#lib/components/DocxFlow.svelte';
	import { i18n } from '#lib/i18n.svelte.ts';

	let tab = $state<'editor' | 'word'>('editor');
	const t = $derived(i18n.t);
</script>

<svelte:head>
	<title>text2scratch</title>
	<meta name="description" content="Scratch-Blöcke aus Text erzeugen und in Word-Klausuren einsetzen." />
</svelte:head>

<div class="wrap">
	<header class="top">
		<div class="brand">
			<h1>text<span class="arrow">→</span><em>scratch</em></h1>
			<p class="tagline">{t.tagline}</p>
		</div>
		<div class="lang" role="group" aria-label={t.blockLang}>
			<span class="label">{t.blockLang}</span>
			<div class="seg">
				{#each ['de', 'en'] as const as l}
					<button class:on={i18n.lang === l} aria-pressed={i18n.lang === l} onclick={() => i18n.set(l)}>
						{l.toUpperCase()}
					</button>
				{/each}
			</div>
		</div>
	</header>

	<div class="tabs" role="tablist">
		<button role="tab" aria-selected={tab === 'editor'} class:on={tab === 'editor'} onclick={() => (tab = 'editor')}>
			<span class="dot" style="background:#4c97ff"></span>{t.tabEditor}
		</button>
		<button role="tab" aria-selected={tab === 'word'} class:on={tab === 'word'} onclick={() => (tab = 'word')}>
			<span class="dot" style="background:#ffab19"></span>{t.tabWord}
		</button>
	</div>

	<main>
		{#if tab === 'editor'}
			<Editor />
		{:else}
			<DocxFlow />
		{/if}
	</main>

	<footer class="foot">
		<span>{t.footer}</span>
		<span class="label">scratchblocks 3.6.4 · JSZip</span>
	</footer>
</div>

<style>
	.wrap {
		max-width: 1240px;
		margin: 0 auto;
		padding: 36px 24px 28px;
		display: flex;
		flex-direction: column;
		gap: 22px;
		min-height: 100vh;
	}
	.top {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 20px;
		flex-wrap: wrap;
		animation: fade 0.5s both;
	}
	h1 {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: clamp(2.4rem, 7vw, 4.2rem);
		line-height: 0.95;
		letter-spacing: -0.03em;
		margin: 0;
	}
	h1 em {
		font-weight: 500;
		font-style: italic;
		color: var(--pen);
	}
	.arrow {
		font-family: var(--font-body);
		font-weight: 400;
		color: var(--ink-3);
		margin: 0 0.08em;
	}
	.tagline {
		margin: 8px 0 0;
		color: var(--ink-2);
		font-size: 1.05rem;
	}
	.lang {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.seg {
		display: flex;
		border: 1px solid var(--rule);
		border-radius: 999px;
		background: var(--sheet);
		padding: 3px;
	}
	.seg button {
		border: 0;
		background: none;
		padding: 0.3em 0.9em;
		border-radius: 999px;
		font-family: var(--font-mono);
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--ink-3);
	}
	.seg button.on {
		background: var(--ink);
		color: var(--paper);
	}

	.tabs {
		display: flex;
		gap: 4px;
		border-bottom: 1px solid var(--rule);
		animation: fade 0.5s 0.08s both;
	}
	.tabs button {
		display: flex;
		align-items: center;
		gap: 8px;
		border: 0;
		background: none;
		padding: 10px 16px 12px;
		font-size: 1rem;
		font-weight: 500;
		color: var(--ink-3);
		border-bottom: 2.5px solid transparent;
		margin-bottom: -1px;
	}
	.tabs button.on {
		color: var(--ink);
		border-bottom-color: var(--pen);
	}
	.dot {
		width: 10px;
		height: 10px;
		border-radius: 3px;
	}
	main {
		flex: 1;
		animation: fade 0.5s 0.16s both;
	}
	.foot {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		font-size: 0.85rem;
		color: var(--ink-3);
		padding-top: 14px;
		border-top: 1px dashed var(--rule);
	}

	@keyframes fade {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
	}

	@media (max-width: 600px) {
		.wrap {
			padding: 24px 16px;
		}
	}
</style>
