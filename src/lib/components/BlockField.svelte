<script lang="ts">
	// Decorative background: oversized Scratch block silhouettes drifting behind the app.
	// Geometry follows Scratch 3: 4px corners, connector notch 16..48 wide, 8 deep.
	const paths = {
		stack: 'M0 4a4 4 0 0 1 4-4h12l8 8h16l8-8h148a4 4 0 0 1 4 4v56a4 4 0 0 1-4 4H48l-8 8H24l-8-8H4a4 4 0 0 1-4-4z',
		hat: 'M0 20C20-6 100-6 120 20h96a4 4 0 0 1 4 4v40a4 4 0 0 1-4 4H48l-8 8H24l-8-8H4a4 4 0 0 1-4-4z',
		cblock:
			'M0 4a4 4 0 0 1 4-4h12l8 8h16l8-8h168a4 4 0 0 1 4 4v40a4 4 0 0 1-4 4H64l-8 8H40l-8-8H20a4 4 0 0 0-4 4v56a4 4 0 0 0 4 4h196a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H48l-8 8H24l-8-8H4a4 4 0 0 1-4-4z',
		bool: 'M24 0h152l24 24-24 24H24L0 24z'
	};

	type Shape = {
		kind: keyof typeof paths | 'pill' | 'slot';
		tone: string;
		cls: string;
		outline?: boolean;
	};

	const viewBoxes: Record<Shape['kind'], string> = {
		stack: '-2 -2 204 76',
		hat: '-2 -2 224 80',
		cblock: '-2 -2 224 156',
		bool: '-2 -2 204 52',
		pill: '-2 -2 204 52',
		slot: '-2 -2 52 52'
	};

	const shapes: Shape[] = [
		{ kind: 'pill', tone: 'operators', cls: 's1' },
		{ kind: 'bool', tone: 'operators', cls: 's2', outline: true },
		{ kind: 'stack', tone: 'sound', cls: 's3' },
		{ kind: 'slot', tone: 'variables', cls: 's4' },
		{ kind: 'hat', tone: 'events', cls: 's5', outline: true },
		{ kind: 'pill', tone: 'looks', cls: 's6', outline: true },
		{ kind: 'slot', tone: 'myblocks', cls: 's7', outline: true },
		{ kind: 'bool', tone: 'sensing', cls: 's8' }
	];
</script>

{#snippet shape(kind: Shape['kind'])}
	{#if kind === 'pill'}
		<rect width="200" height="48" rx="24" />
	{:else if kind === 'slot'}
		<circle cx="24" cy="24" r="24" />
	{:else}
		<path d={paths[kind]} />
	{/if}
{/snippet}

<div class="field" aria-hidden="true">
	<!-- a ghost script snapped together, cropped by the right edge -->
	<svg class="script" viewBox="-2 -2 224 354">
		<g class="events"><path d={paths.hat} /></g>
		<g class="motion" transform="translate(0 68)"><path d={paths.stack} /></g>
		<g class="control" transform="translate(0 132)"><path d={paths.cblock} /></g>
		<g class="looks" transform="translate(16 180)"><path d={paths.stack} /></g>
		<g class="sound" transform="translate(0 276)"><path d={paths.stack} /></g>
	</svg>

	{#each shapes as s}
		<svg class="loose {s.cls} {s.tone}" class:outline={s.outline} viewBox={viewBoxes[s.kind]}>
			{@render shape(s.kind)}
		</svg>
	{/each}
</div>

<style>
	.field {
		position: fixed;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
	}
	svg {
		position: absolute;
		opacity: var(--shape-opacity);
		overflow: visible;
	}
	svg :global(path),
	svg :global(rect),
	svg :global(circle) {
		fill: var(--fill);
		stroke: var(--edge);
		stroke-width: 2;
		stroke-linejoin: round;
	}
	.outline :global(path),
	.outline :global(rect),
	.outline :global(circle) {
		fill: none;
		stroke: var(--fill);
		stroke-width: 4;
	}

	.motion {
		--fill: var(--motion);
		--edge: var(--motion-edge);
	}
	.looks {
		--fill: var(--looks);
		--edge: var(--looks-edge);
	}
	.sound {
		--fill: var(--sound);
		--edge: var(--sound-edge);
	}
	.events {
		--fill: var(--events);
		--edge: var(--events-edge);
	}
	.control {
		--fill: var(--control);
		--edge: var(--control-edge);
	}
	.sensing {
		--fill: var(--sensing);
		--edge: var(--sensing-edge);
	}
	.operators {
		--fill: var(--operators);
		--edge: var(--operators-edge);
	}
	.variables {
		--fill: var(--variables);
		--edge: var(--variables-edge);
	}
	.myblocks {
		--fill: var(--myblocks);
		--edge: var(--myblocks-edge);
	}

	.script {
		width: clamp(220px, 26vw, 380px);
		right: clamp(-160px, -6vw, -60px);
		top: 14vh;
		rotate: -8deg;
		animation: drift 26s ease-in-out infinite alternate;
	}

	.loose {
		--r: 0deg;
		rotate: var(--r);
		animation: drift var(--d, 22s) ease-in-out infinite alternate;
	}
	.s1 {
		width: clamp(140px, 16vw, 240px);
		left: -60px;
		top: 9vh;
		--r: 14deg;
		--d: 24s;
	}
	.s2 {
		width: clamp(150px, 18vw, 260px);
		left: 6vw;
		bottom: 8vh;
		--r: -10deg;
		--d: 30s;
	}
	.s3 {
		width: clamp(160px, 18vw, 280px);
		right: 18vw;
		bottom: -30px;
		--r: 6deg;
		--d: 20s;
	}
	.s4 {
		width: clamp(44px, 5vw, 72px);
		left: 38vw;
		top: 4vh;
		--d: 18s;
	}
	.s5 {
		width: clamp(160px, 17vw, 260px);
		left: -70px;
		top: 46vh;
		--r: 22deg;
		--d: 28s;
	}
	.s6 {
		width: clamp(110px, 12vw, 180px);
		right: 30vw;
		top: 2vh;
		--r: -4deg;
		--d: 26s;
	}
	.s7 {
		width: clamp(36px, 4vw, 60px);
		right: 6vw;
		bottom: 14vh;
		--d: 16s;
	}
	.s8 {
		width: clamp(120px, 13vw, 200px);
		left: 46vw;
		bottom: 3vh;
		--r: -16deg;
		--d: 32s;
	}

	@keyframes drift {
		to {
			translate: 0 -18px;
			rotate: calc(var(--r, -8deg) + 4deg);
		}
	}

	@media (max-width: 700px) {
		.s4,
		.s6,
		.s8 {
			display: none;
		}
		.script {
			top: auto;
			bottom: 4vh;
			right: -120px;
		}
	}
</style>
