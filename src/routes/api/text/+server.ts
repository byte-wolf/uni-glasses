import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { presets, displayText } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		// Get the current display text and active preset
		const displayRecord = await db.select().from(displayText).limit(1);
		const activePreset = await db.select().from(presets).where(eq(presets.isActive, true)).limit(1);

		if (displayRecord.length === 0) {
			// Check if there are any presets at all
			const allPresets = await db.select().from(presets);

			if (allPresets.length === 0) {
				// Create a default preset if none exist
				const defaultPreset = await db
					.insert(presets)
					.values({
						name: 'Default',
						textColor: '#ffffff',
						backgroundColor: '#1f2937',
						isActive: true,
						updatedAt: new Date()
					})
					.returning();

				// Create display text record
				const newDisplayRecord = await db
					.insert(displayText)
					.values({
						content: 'Welcome to our display system!',
						activePresetId: defaultPreset[0].id,
						isPoweredOn: true,
						updatedAt: new Date()
					})
					.returning();

				return json({
					content: newDisplayRecord[0].content,
					textColor: defaultPreset[0].textColor,
					backgroundColor: defaultPreset[0].backgroundColor,
					fontSize: defaultPreset[0].fontSize,
					textPosition: { x: defaultPreset[0].textPositionX, y: defaultPreset[0].textPositionY },
					isPoweredOn: newDisplayRecord[0].isPoweredOn,
					updatedAt: newDisplayRecord[0].updatedAt
				});
			} else {
				// Activate the first preset
				const firstPreset = await db
					.update(presets)
					.set({ isActive: true, updatedAt: new Date() })
					.where(eq(presets.id, allPresets[0].id))
					.returning();

				// Create display text record
				const newDisplayRecord = await db
					.insert(displayText)
					.values({
						content: 'Welcome to our display system!',
						activePresetId: firstPreset[0].id,
						isPoweredOn: true,
						updatedAt: new Date()
					})
					.returning();

				return json({
					content: newDisplayRecord[0].content,
					textColor: firstPreset[0].textColor,
					backgroundColor: firstPreset[0].backgroundColor,
					fontSize: firstPreset[0].fontSize,
					textPosition: { x: firstPreset[0].textPositionX, y: firstPreset[0].textPositionY },
					isPoweredOn: newDisplayRecord[0].isPoweredOn,
					updatedAt: newDisplayRecord[0].updatedAt
				});
			}
		}

		// If no active preset, activate the first one
		if (activePreset.length === 0) {
			const allPresets = await db.select().from(presets);
			if (allPresets.length > 0) {
				const firstPreset = await db
					.update(presets)
					.set({ isActive: true, updatedAt: new Date() })
					.where(eq(presets.id, allPresets[0].id))
					.returning();

				// Update display record to reference the active preset
				await db
					.update(displayText)
					.set({
						activePresetId: firstPreset[0].id,
						updatedAt: new Date()
					})
					.where(eq(displayText.id, displayRecord[0].id));

				return json({
					content: displayRecord[0].content,
					textColor: firstPreset[0].textColor,
					backgroundColor: firstPreset[0].backgroundColor,
					fontSize: firstPreset[0].fontSize,
					textPosition: { x: firstPreset[0].textPositionX, y: firstPreset[0].textPositionY },
					isPoweredOn: displayRecord[0].isPoweredOn,
					updatedAt: displayRecord[0].updatedAt
				});
			}
		}

		return json({
			content: displayRecord[0].content,
			textColor: activePreset[0].textColor,
			backgroundColor: activePreset[0].backgroundColor,
			fontSize: activePreset[0].fontSize,
			textPosition: { x: activePreset[0].textPositionX, y: activePreset[0].textPositionY },
			isPoweredOn: displayRecord[0].isPoweredOn,
			updatedAt: displayRecord[0].updatedAt
		});
	} catch (error) {
		console.error('Failed to get display text:', error);
		return json({ error: 'Failed to get display text' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { content, textColor, backgroundColor, fontSize } = await request.json();

		if (!content || typeof content !== 'string') {
			return json({ error: 'Content is required and must be a string' }, { status: 400 });
		}

		const trimmedContent = content.trim();
		if (trimmedContent.length === 0) {
			return json({ error: 'Content cannot be empty' }, { status: 400 });
		}

		// Get the current display record
		const displayRecord = await db.select().from(displayText).limit(1);
		const activePreset = await db.select().from(presets).where(eq(presets.isActive, true)).limit(1);

		if (activePreset.length === 0) {
			return json({ error: 'No active preset found' }, { status: 404 });
		}

		let result;
		if (displayRecord.length === 0) {
			// Create new display record
			result = await db
				.insert(displayText)
				.values({
					content: trimmedContent,
					activePresetId: activePreset[0].id,
					updatedAt: new Date()
				})
				.returning();
		} else {
			// Update existing display record
			result = await db
				.update(displayText)
				.set({
					content: trimmedContent,
					updatedAt: new Date()
				})
				.where(eq(displayText.id, displayRecord[0].id))
				.returning();
		}

		return json({
			content: result[0].content,
			textColor: activePreset[0].textColor,
			backgroundColor: activePreset[0].backgroundColor,
			fontSize: activePreset[0].fontSize,
			textPosition: { x: activePreset[0].textPositionX, y: activePreset[0].textPositionY },
			isPoweredOn: result[0].isPoweredOn,
			updatedAt: result[0].updatedAt
		});
	} catch (error) {
		console.error('Failed to update display text:', error);
		return json({ error: 'Failed to update display text' }, { status: 500 });
	}
};
