import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { presets, displayText } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { presetId } = await request.json();

		if (!presetId || typeof presetId !== 'number') {
			return json({ error: 'Preset ID is required and must be a number' }, { status: 400 });
		}

		// Check if preset exists
		const presetExists = await db.select().from(presets).where(eq(presets.id, presetId));
		if (presetExists.length === 0) {
			return json({ error: 'Preset not found' }, { status: 404 });
		}

		// Deactivate all presets
		await db.update(presets).set({ isActive: false });

		// Activate the selected preset
		const activatedPreset = await db
			.update(presets)
			.set({ isActive: true, updatedAt: new Date() })
			.where(eq(presets.id, presetId))
			.returning();

		// Update the display text record to reference the active preset
		const displayRecord = await db.select().from(displayText).limit(1);

		if (displayRecord.length === 0) {
			// Create new display record
			await db.insert(displayText).values({
				content: 'Welcome to our display system!',
				activePresetId: presetId,
				updatedAt: new Date()
			});
		} else {
			// Update existing display record
			await db
				.update(displayText)
				.set({
					activePresetId: presetId,
					updatedAt: new Date()
				})
				.where(eq(displayText.id, displayRecord[0].id));
		}

		return json(activatedPreset[0]);
	} catch (error) {
		console.error('Failed to activate preset:', error);
		return json({ error: 'Failed to activate preset' }, { status: 500 });
	}
};
