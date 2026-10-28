<script lang="ts">
	import { render, type Lang, type Rendered } from '#lib/scratch.ts';

	let {
		code,
		lang,
		zoom = 1,
		rendered = $bindable<Rendered | null>(null)
	}: { code: string; lang: Lang; zoom?: number; rendered?: Rendered | null } = $props();

	let host: HTMLDivElement;
	let error = $state('');

	$effect(() => {
		host.replaceChildren();
		error = '';
		if (!code.trim()) {
			rendered = null;
			return;
		}
		try {
			const r = render(code, lang, zoom);
			host.appendChild(r.svg);
			rendered = r;
		} catch (e) {
			rendered = null;
			error = (e as Error).message;
		}
	});
</script>

<div class="blocks-stage" bind:this={host}></div>
{#if error}<p class="err">{error}</p>{/if}

<style>
	.blocks-stage {
		display: inline-block;
	}
	.err {
		color: var(--danger);
		font-family: var(--font-mono);
		font-size: 0.8rem;
	}
</style>
