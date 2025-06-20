import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { presets } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PresetData } from '$lib/types';

export const GET: RequestHandler = async () => {
	try {
		const allPresets = await db.select().from(presets).orderBy(presets.createdAt);
		return json(allPresets);
	} catch (error) {
		console.error('Failed to get presets:', error);
		return json({ error: 'Failed to get presets' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { name, textColor, backgroundColor, isActive = false }: PresetData = await request.json();

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
			.insert(presets)
			.values({
				name: name.trim(),
				textColor: finalTextColor,
				backgroundColor: finalBackgroundColor,
				isActive,
				updatedAt: new Date()
			})
			.returning();

		return json(result[0]);
	} catch (error) {
		console.error('Failed to create preset:', error);
		return json({ error: 'Failed to create preset' }, { status: 500 });
	}
};
