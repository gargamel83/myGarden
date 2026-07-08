<script lang="ts">
	import { toast } from '$lib/toast.svelte';

	const WORLD = 2000;
	const GRID_BASE = 50;

	let {
		beds = [],
		photoUrl = null,
		photoNaturalW = 0,
		photoNaturalH = 0,
		onSaveBed,
		onEditBed
	}: {
		beds?: { id: number; polygon: string; color: string | null; name: string; type: string | null }[]
		photoUrl?: string | null
		photoNaturalW?: number
		photoNaturalH?: number
		onSaveBed?: (polygon: string) => void
		onEditBed?: (bedId: number) => void
	} = $props();

	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;
	let img: HTMLImageElement | null = null;

	let zoom = $state(1);
	let viewX = $state(0);
	let viewY = $state(0);
	let drawing = $state(false);
	let currentPolygon = $state<[number, number][]>([]);
	let isPanning = $state(false);
	let panStartX = $state(0);
	let panStartY = $state(0);
	let panViewX = $state(0);
	let panViewY = $state(0);

	let photoLoaded = $state(false);
	let photoScale = $state(1);
	let photoDX = $state(0);
	let photoDY = $state(0);
	let photoDW = $state(0);
	let photoDH = $state(0);

	function getSize() {
		if (!container) return { w: 800, h: 500 };
		return { w: container.clientWidth, h: container.clientHeight };
	}

	function sw(sx: number): number { return sx / zoom + viewX; }
	function sy(sy: number): number { return sy / zoom + viewY; }

	function loadPhoto(url: string) {
		const image = new Image();
		image.crossOrigin = 'anonymous';
		image.onload = () => {
			img = image;
			const { w, h } = getSize();
			const s = Math.min(w / image.naturalWidth, h / image.naturalHeight, 1);
			photoScale = s;
			photoDW = image.naturalWidth * s;
			photoDH = image.naturalHeight * s;
			photoDX = (w - photoDW) / 2;
			photoDY = (h - photoDH) / 2;
			photoLoaded = true;
			viewX = 0; viewY = 0; zoom = 1;
			render();
		};
		image.src = url;
	}

	$effect(() => {
		if (photoUrl) loadPhoto(photoUrl);
		else { photoLoaded = false; img = null; render(); }
	});

	function niceStep(): number {
		const target = 80;
		let step = GRID_BASE;
		while (step * zoom < target) step *= 2;
		while (step * zoom > target * 2 && step > 1) step /= 2;
		return step;
	}

	function drawGridLines(ctx: CanvasRenderingContext2D) {
		const { w, h } = getSize();
		const sx = viewX, sy = viewY;
		const ex = viewX + w / zoom, ey = viewY + h / zoom;
		const step = niceStep();
		const big = step * 5;

		const fx = Math.floor(sx / step) * step, fy = Math.floor(sy / step) * step;
		ctx.strokeStyle = '#d8e0d0';
		ctx.lineWidth = 0.8 / zoom;
		for (let wx = fx; wx <= ex; wx += step) {
			const px = (wx - sx) * zoom;
			ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
		}
		for (let wy = fy; wy <= ey; wy += step) {
			const py = (wy - sy) * zoom;
			ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
		}

		const bfx = Math.floor(sx / big) * big, bfy = Math.floor(sy / big) * big;
		ctx.strokeStyle = '#c8d8b8';
		ctx.lineWidth = 1.2 / zoom;
		for (let wx = bfx; wx <= ex; wx += big) {
			const px = (wx - sx) * zoom;
			ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
		}
		for (let wy = bfy; wy <= ey; wy += big) {
			const py = (wy - sy) * zoom;
			ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
		}

		ctx.fillStyle = '#a0b890';
		ctx.font = `${Math.max(10, 12 / zoom)}px sans-serif`;
		ctx.textAlign = 'center';
		const labelY = Math.max(14, (10 - sy) * zoom);
		for (let wx = bfx; wx <= ex; wx += big) {
			const px = (wx - sx) * zoom;
			if (px > 10) ctx.fillText(`${Math.round(wx / GRID_BASE)}m`, px, labelY);
		}
	}

	function drawScaleBar(ctx: CanvasRenderingContext2D) {
		const { w, h } = getSize();
		const spanWorld = 100 / zoom;
		const mag = Math.pow(10, Math.floor(Math.log10(spanWorld)));
		const norm = spanWorld / mag;
		const nice = norm < 1.5 ? mag : norm < 3.5 ? 2 * mag : norm < 7.5 ? 5 * mag : 10 * mag;
		const nicePx = nice * zoom;
		const bx = 20, by = h - 30;
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.fillStyle = 'rgba(0,0,0,0.55)';
		ctx.fillRect(bx - 2, by - 14, nicePx + 4, 22);
		ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(bx, by); ctx.lineTo(bx + nicePx, by);
		ctx.moveTo(bx, by - 4); ctx.lineTo(bx, by + 4);
		ctx.moveTo(bx + nicePx, by - 4); ctx.lineTo(bx + nicePx, by + 4);
		ctx.stroke();
		ctx.fillStyle = '#fff';
		ctx.font = '11px sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText(`${nice / GRID_BASE} m`, bx + nicePx / 2, by - 4);
		ctx.restore();
	}

	function drawPoly(ctx: CanvasRenderingContext2D, pts: [number, number][], color: string, dashed: boolean, lw: number) {
		if (pts.length < 2) return;
		ctx.beginPath();
		ctx.moveTo(pts[0][0], pts[0][1]);
		for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
		if (pts.length > 2) ctx.closePath();
		ctx.strokeStyle = color;
		ctx.lineWidth = lw;
		ctx.setLineDash(dashed ? [5 / zoom, 5 / zoom] : []);
		ctx.stroke();
		if (pts.length > 2) {
			ctx.fillStyle = '#d4c5a980';
			ctx.fill();
		}
		ctx.setLineDash([]);
	}

	function render() {
		if (!canvas) return;
		const { w, h } = getSize();
		const dpr = window.devicePixelRatio || 1;
		canvas.width = w * dpr;
		canvas.height = h * dpr;
		canvas.style.width = w + 'px';
		canvas.style.height = h + 'px';
		const ctx = canvas.getContext('2d')!;
		ctx.scale(dpr, dpr);

		ctx.fillStyle = '#f0f7e8';
		ctx.fillRect(0, 0, w, h);

		if (photoLoaded && img) {
			const s = photoScale;
			const ox = (w - photoDW) / 2;
			const oy = (h - photoDH) / 2;
			ctx.drawImage(img, ox, oy, photoDW, photoDH);
			ctx.save();
			ctx.translate(ox, oy);
			ctx.scale(s, s);
			for (const bed of beds.filter(b => b.type === 'pixel')) {
				try {
					const pts = JSON.parse(bed.polygon) as [number, number][];
					drawPoly(ctx, pts, bed.color || '#64748b', false, 2);
				} catch { /* empty */ }
			}
		if (currentPolygon.length > 0) drawPoly(ctx, currentPolygon, '#fbbf24', true, 1.5);
			ctx.restore();
		} else {
			ctx.save();
			ctx.translate(-viewX * zoom, -viewY * zoom);
			ctx.scale(zoom, zoom);
			drawGridLines(ctx);
			for (const bed of beds.filter(b => b.type === 'pixel')) {
				try {
					const pts = JSON.parse(bed.polygon) as [number, number][];
					drawPoly(ctx, pts, bed.color || '#64748b', false, 2 / zoom);
				} catch { /* empty */ }
			}
			if (currentPolygon.length > 0) drawPoly(ctx, currentPolygon, '#fbbf24', true, 2 / zoom);
			ctx.restore();
			drawScaleBar(ctx);
		}
	}

	let pending: number | null = null;
	function schedule() {
		if (pending) cancelAnimationFrame(pending);
		pending = requestAnimationFrame(() => { render(); pending = null; });
	}

	$effect(() => {
		if (!canvas) return;
		render();
		const ro = new ResizeObserver(() => render());
		ro.observe(canvas.parentElement!);
		return () => ro.disconnect();
	});

	$effect(() => { if (beds) schedule(); });
	$effect(() => { if (currentPolygon.length) schedule(); });

	function handleWheel(e: WheelEvent) {
		if (photoLoaded) return;
		e.preventDefault();
		const f = e.deltaY < 0 ? 1.15 : 1 / 1.15;
		const nz = Math.max(0.1, Math.min(50, zoom * f));
		if (nz === zoom) return;
		const { w, h } = getSize();
		const wx = e.offsetX / zoom + viewX;
		const wy = e.offsetY / zoom + viewY;
		zoom = nz;
		viewX = wx - e.offsetX / zoom;
		viewY = wy - e.offsetY / zoom;
		schedule();
	}

	function handleMouseDown(e: MouseEvent) {
		if (drawing || photoLoaded) return;
		isPanning = true;
		panStartX = e.clientX; panStartY = e.clientY;
		panViewX = viewX; panViewY = viewY;
	}

	function handleMouseMove(e: MouseEvent) {
		if (isPanning && !photoLoaded) {
			const dx = (e.clientX - panStartX) / zoom;
			const dy = (e.clientY - panStartY) / zoom;
			viewX = panViewX - dx; viewY = panViewY - dy;
			schedule();
		}
	}

	function handleMouseUp() { isPanning = false; }

	function handleClick(e: MouseEvent) {
		if (!drawing) return;
		const wx = e.offsetX / zoom + viewX;
		const wy = e.offsetY / zoom + viewY;
		currentPolygon = [...currentPolygon, [wx, wy]];
		schedule();
	}

	function finishPolygon() {
		if (currentPolygon.length < 3) return;
		onSaveBed?.(JSON.stringify(currentPolygon));
		currentPolygon = [];
		drawing = false;
		toast('Bed created — fill in the details');
	}

	function cancelDrawing() {
		currentPolygon = [];
		drawing = false;
		schedule();
	}

	function startDrawing() { drawing = true; currentPolygon = []; }

	function zoomIn() {
		if (photoLoaded) return;
		const { w, h } = getSize();
		const cx = w / 2, cy = h / 2;
		const wx = cx / zoom + viewX, wy = cy / zoom + viewY;
		zoom = Math.min(50, zoom * 1.4);
		viewX = wx - cx / zoom; viewY = wy - cy / zoom;
		schedule();
	}

	function zoomOut() {
		if (photoLoaded) return;
		const { w, h } = getSize();
		const cx = w / 2, cy = h / 2;
		const wx = cx / zoom + viewX, wy = cy / zoom + viewY;
		zoom = Math.max(0.1, zoom / 1.4);
		viewX = wx - cx / zoom; viewY = wy - cy / zoom;
		schedule();
	}
</script>

<div bind:this={container} class="relative border rounded overflow-hidden" style="height: 65vh; min-height: 400px;">
	<canvas
		bind:this={canvas}
		onclick={handleClick}
		onwheel={handleWheel}
		onmousedown={handleMouseDown}
		onmousemove={handleMouseMove}
		onmouseup={handleMouseUp}
		onmouseleave={handleMouseUp}
		class="w-full h-full cursor-crosshair block"
		style="touch-action: none;"
	></canvas>

	{#if !drawing}
		<div class="absolute top-2 left-2 flex gap-2 flex-wrap">
			<button class="bg-[var(--btn-bg)] text-white px-3 py-1 rounded text-sm shadow hover:bg-[var(--btn-hover)]" onclick={startDrawing}>
				+ Add a bed
			</button>
			{#each beds.filter(b => b.type === 'pixel') as bed}
				{#if bed.id}
					<button
						class="px-2 py-1 rounded text-xs shadow hover:bg-gray-100 bg-white/80"
						style="border-left: 3px solid {bed.color || '#64748b'}"
						onclick={() => onEditBed?.(bed.id)}
					>
						{bed.name}
					</button>
				{/if}
			{/each}
		</div>
	{:else}
		<div class="absolute top-2 left-2 bg-black/70 text-white px-3 py-1.5 rounded text-sm shadow flex items-center gap-2">
			<span>Click to draw ({currentPolygon.length} pt{currentPolygon.length > 1 ? 's' : ''})</span>
			<button class="text-slate-300 underline" onclick={finishPolygon} disabled={currentPolygon.length < 3}>Finish</button>
			<button class="text-red-300 underline ml-1" onclick={cancelDrawing}>Cancel</button>
		</div>
	{/if}

	{#if !photoLoaded}
		<div class="absolute bottom-1 left-2 text-[10px] text-gray-400 pointer-events-none select-none">
			Scroll to zoom · Drag to pan
		</div>
		<div class="absolute top-2 right-2 flex flex-col gap-1">
			<button class="w-8 h-8 bg-white/80 hover:bg-white rounded shadow flex items-center justify-center text-lg font-bold leading-none select-none" onclick={zoomIn} title="Zoom in">+</button>
			<button class="w-8 h-8 bg-white/80 hover:bg-white rounded shadow flex items-center justify-center text-lg font-bold leading-none select-none" onclick={zoomOut} title="Zoom out">−</button>
		</div>
	{/if}
</div>
