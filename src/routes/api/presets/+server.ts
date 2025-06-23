import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { presets } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PresetData, PresetResponse } from '$lib/types';

export const GET: RequestHandler = async () => {
	try {
		const allPresets = await db.select().from(presets).orderBy(presets.createdAt);

		const transformedResult: PresetResponse[] = allPresets.map((preset) => ({
			...preset,
			textPosition: { x: preset.textPositionX, y: preset.textPositionY }
		}));

		return json(transformedResult);
	} catch (error) {
		console.error('Failed to get presets:', error);
		return json({ error: 'Failed to get presets' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const {
			name,
			textColor,
			backgroundColor,
			fontSize,
			textPosition,
			isActive = false
		}: PresetData = await request.json();

		if (!name || typeof name !== 'string') {
			return json({ error: 'Name is required and must be a string' }, { status: 400 });
		}

		// Validate color format (simple hex validation)
		const isValidColor = (color: string) => /^#[0-9A-F]{6}$/i.test(color);

		const finalTextColor = textColor && isValidColor(textColor) ? textColor : '#ffffff';
		const finalBackgroundColor =
			backgroundColor && isValidColor(backgroundColor) ? backgroundColor : '#1f2937';
		// Validate fontSize to be within reasonable bounds (16-120px)
		const finalFontSize =
			fontSize && typeof fontSize === 'number' && fontSize >= 16 && fontSize <= 120 ? fontSize : 48;
		// Validate textPosition
		const finalTextPosition =
			textPosition &&
			typeof textPosition.x === 'number' &&
			typeof textPosition.y === 'number' &&
			textPosition.x >= -100 &&
			textPosition.x <= 100 &&
			textPosition.y >= -100 &&
			textPosition.y <= 100
				? textPosition
				: { x: 0, y: 0 };

		// If this preset is being set as active, deactivate all other presets
		if (isActive) {
			await db.update(presets).set({ isActive: false });
		}

		const result = await db
			.insert(presets)
			.values({
				name: name.trim(),
				textColor: finalTextColor,
				backgroundColor: finalBackgroundColor,
				fontSize: finalFontSize,
				textPositionX: finalTextPosition.x,
				textPositionY: finalTextPosition.y,
				isActive,
				updatedAt: new Date()
			})
			.returning();

		const transformedResult: PresetResponse = {
			...result[0],
			textPosition: { x: result[0].textPositionX, y: result[0].textPositionY }
		};

		return json(transformedResult);
	} catch (error) {
		console.error('Failed to create preset:', error);
		return json({ error: 'Failed to create preset' }, { status: 500 });
	}
};
