import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { presets } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PresetData } from '$lib/types';

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

		const { name, textColor, backgroundColor, isActive }: PresetData = await request.json();

		if (!name || typeof name !== 'string') {
			return json({ error: 'Name is required and must be a string' }, { status: 400 });
		}

		// Validate color format (simple hex validation)
		const isValidColor = (color: string) => /^#[0-9A-F]{6}$/i.test(color);

		const finalTextColor = textColor && isValidColor(textColor) ? textColor : '#ffffff';
		const finalBackgroundColor =
			backgroundColor && isValidColor(backgroundColor) ? backgroundColor : '#1f2937';

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
				isActive: isActive ?? false,
				updatedAt: new Date()
			})
			.where(eq(presets.id, id))
			.returning();

		if (result.length === 0) {
			return json({ error: 'Preset not found' }, { status: 404 });
		}

		return json(result[0]);
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
