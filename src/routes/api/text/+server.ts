import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { displayText } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
    try {
        // Get the current display text
        const result = await db.select().from(displayText).limit(1);

        if (result.length === 0) {
            // Initialize with default text if no record exists
            const defaultText = 'Welcome to our display system!';
            const newRecord = await db.insert(displayText).values({
                content: defaultText,
                updatedAt: new Date()
            }).returning();

            return json({
                content: newRecord[0].content,
                updatedAt: newRecord[0].updatedAt
            });
        }

        return json({
            content: result[0].content,
            updatedAt: result[0].updatedAt
        });
    } catch (error) {
        console.error('Failed to get display text:', error);
        return json({ error: 'Failed to get display text' }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { content } = await request.json();

        if (!content || typeof content !== 'string') {
            return json({ error: 'Content is required and must be a string' }, { status: 400 });
        }

        const trimmedContent = content.trim();
        if (trimmedContent.length === 0) {
            return json({ error: 'Content cannot be empty' }, { status: 400 });
        }

        // Check if a record exists
        const existing = await db.select().from(displayText).limit(1);

        let result;
        if (existing.length === 0) {
            // Create new record
            result = await db.insert(displayText).values({
                content: trimmedContent,
                updatedAt: new Date()
            }).returning();
        } else {
            // Update existing record
            result = await db.update(displayText)
                .set({
                    content: trimmedContent,
                    updatedAt: new Date()
                })
                .where(eq(displayText.id, existing[0].id))
                .returning();
        }


        return json({
            content: result[0].content,
            updatedAt: result[0].updatedAt
        });
    } catch (error) {
        console.error('Failed to update display text:', error);
        return json({ error: 'Failed to update display text' }, { status: 500 });
    }
};
