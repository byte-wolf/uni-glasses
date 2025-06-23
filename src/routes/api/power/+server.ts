import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { displayText } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		const displayRecord = await db.select().from(displayText).limit(1);

		if (displayRecord.length === 0) {
			// Create default display record if none exists
			const newRecord = await db
				.insert(displayText)
				.values({
					content: 'Welcome to our display system!',
					isPoweredOn: true,
					updatedAt: new Date()
				})
				.returning();

			return json({ isPoweredOn: newRecord[0].isPoweredOn });
		}

		return json({ isPoweredOn: displayRecord[0].isPoweredOn });
	} catch (error) {
		console.error('Failed to get power state:', error);
		return json({ error: 'Failed to get power state' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { isPoweredOn } = await request.json();

		if (typeof isPoweredOn !== 'boolean') {
			return json({ error: 'isPoweredOn must be a boolean' }, { status: 400 });
		}

		const displayRecord = await db.select().from(displayText).limit(1);

		if (displayRecord.length === 0) {
			// Create new display record
			const newRecord = await db
				.insert(displayText)
				.values({
					content: 'Welcome to our display system!',
					isPoweredOn,
					updatedAt: new Date()
				})
				.returning();

			return json({ isPoweredOn: newRecord[0].isPoweredOn });
		} else {
			// Update existing display record
			const updatedRecord = await db
				.update(displayText)
				.set({
					isPoweredOn,
					updatedAt: new Date()
				})
				.where(eq(displayText.id, displayRecord[0].id))
				.returning();

			return json({ isPoweredOn: updatedRecord[0].isPoweredOn });
		}
	} catch (error) {
		console.error('Failed to set power state:', error);
		return json({ error: 'Failed to set power state' }, { status: 500 });
	}
};
