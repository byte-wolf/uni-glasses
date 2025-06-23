import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { presets } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PresetData, PresetResponse } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const id = parseInt(params.id);
		if (isNaN(id)) {
			return json({ error: 'Invalid preset ID' }, { status: 400 });
		}

		const result = await db.select().from(presets).where(eq(presets.id, id));

		if (result.length === 0) {
			return json({ error: 'Preset not found' }, { status: 404 });
		}

		return json(result[0]);
	} catch (error) {
		console.error('Failed to get preset:', error);
		return json({ error: 'Failed to get preset' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const id = parseInt(params.id);
		if (isNaN(id)) {
			return json({ error: 'Invalid preset ID' }, { status: 400 });
		}

		const { name, textColor, backgroundColor, fontSize, textPosition, isActive }: PresetData =
			await request.json();

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
			.update(presets)
			.set({
				name: name.trim(),
				textColor: finalTextColor,
				backgroundColor: finalBackgroundColor,
				fontSize: finalFontSize,
				textPositionX: finalTextPosition.x,
				textPositionY: finalTextPosition.y,
				isActive: isActive ?? false,
				updatedAt: new Date()
			})
			.where(eq(presets.id, id))
			.returning();

		if (result.length === 0) {
			return json({ error: 'Preset not found' }, { status: 404 });
		}

		const transformedResult: PresetResponse = {
			...result[0],
			textPosition: { x: result[0].textPositionX, y: result[0].textPositionY }
		};

		return json(transformedResult);
	} catch (error) {
		console.error('Failed to update preset:', error);
		return json({ error: 'Failed to update preset' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = parseInt(params.id);
		if (isNaN(id)) {
			return json({ error: 'Invalid preset ID' }, { status: 400 });
		}

		const result = await db.delete(presets).where(eq(presets.id, id)).returning();

		if (result.length === 0) {
			return json({ error: 'Preset not found' }, { status: 404 });
		}

		return json({ message: 'Preset deleted successfully' });
	} catch (error) {
		console.error('Failed to delete preset:', error);
		return json({ error: 'Failed to delete preset' }, { status: 500 });
	}
};
