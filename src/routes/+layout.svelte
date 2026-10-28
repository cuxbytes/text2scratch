<script lang="ts">
	// Fonts are bundled with the app (no Google Fonts request, GDPR-friendly)
	import '@fontsource-variable/bricolage-grotesque/opsz.css';
	import '@fontsource/ibm-plex-mono/400.css';
	import '@fontsource/ibm-plex-mono/500.css';
	import '../app.css';
	import BlockField from '#lib/components/BlockField.svelte';

	let { children } = $props();
</script>

<BlockField />
{@render children()}
