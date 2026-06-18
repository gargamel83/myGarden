import { describe, it, expect } from 'vitest';
import sharp from 'sharp';

describe('image resize', () => {
	it('should resize image to max 1600x1200', async () => {
		const img = await sharp({
			create: { width: 4000, height: 3000, channels: 3, background: { r: 0, g: 255, b: 0 } }
		})
			.resize(1600, 1200, { fit: 'inside', withoutEnlargement: true })
			.webp({ quality: 80 })
			.toBuffer();

		const meta = await sharp(img).metadata();
		expect(meta.format).toBe('webp');
		expect(meta.width).toBeLessThanOrEqual(1600);
		expect(meta.height).toBeLessThanOrEqual(1200);
	});

	it('should keep small images unchanged', async () => {
		const img = await sharp({
			create: { width: 800, height: 600, channels: 3, background: { r: 255, g: 0, b: 0 } }
		})
			.resize(1600, 1200, { fit: 'inside', withoutEnlargement: true })
			.webp({ quality: 80 })
			.toBuffer();

		const meta = await sharp(img).metadata();
		expect(meta.width).toBe(800);
		expect(meta.height).toBe(600);
	});

	it('should output WebP format', async () => {
		const img = await sharp({
			create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 0, b: 255 } }
		})
			.webp({ quality: 80 })
			.toBuffer();

		const meta = await sharp(img).metadata();
		expect(meta.format).toBe('webp');
	});
});
