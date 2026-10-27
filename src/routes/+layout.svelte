<script lang="ts">
	// Fonts are bundled with the app (no Google Fonts request, GDPR-friendly)
	import '@fontsource-variable/fraunces/opsz.css';
	import '@fontsource-variable/fraunces/opsz-italic.css';
	import '@fontsource-variable/bricolage-grotesque/opsz.css';
	import '@fontsource/ibm-plex-mono/400.css';
	import '@fontsource/ibm-plex-mono/500.css';
	import '../app.css';

	let { children } = $props();
</script>

{@render children()}
