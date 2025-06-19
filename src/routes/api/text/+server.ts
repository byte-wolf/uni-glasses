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
            const defaultTextColor = '#ffffff';
            const defaultBackgroundColor = '#1f2937';
            const newRecord = await db.insert(displayText).values({
                content: defaultText,
                textColor: defaultTextColor,
                backgroundColor: defaultBackgroundColor,
                updatedAt: new Date()
            }).returning();

            return json({
                content: newRecord[0].content,
                textColor: newRecord[0].textColor,
                backgroundColor: newRecord[0].backgroundColor,
                updatedAt: newRecord[0].updatedAt
            });
        }

        return json({
            content: result[0].content,
            textColor: result[0].textColor,
            backgroundColor: result[0].backgroundColor,
            updatedAt: result[0].updatedAt
        });
    } catch (error) {
        console.error('Failed to get display text:', error);
        return json({ error: 'Failed to get display text' }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { content, textColor, backgroundColor } = await request.json();

        if (!content || typeof content !== 'string') {
            return json({ error: 'Content is required and must be a string' }, { status: 400 });
        }

        const trimmedContent = content.trim();
        if (trimmedContent.length === 0) {
            return json({ error: 'Content cannot be empty' }, { status: 400 });
        }

        // Validate color format (simple hex validation)
        const isValidColor = (color: string) => /^#[0-9A-F]{6}$/i.test(color);

        const finalTextColor = textColor && isValidColor(textColor) ? textColor : '#ffffff';
        const finalBackgroundColor = backgroundColor && isValidColor(backgroundColor) ? backgroundColor : '#1f2937';

        // Check if a record exists
        const existing = await db.select().from(displayText).limit(1);

        let result;
        if (existing.length === 0) {
            // Create new record
            result = await db.insert(displayText).values({
                content: trimmedContent,
                textColor: finalTextColor,
                backgroundColor: finalBackgroundColor,
                updatedAt: new Date()
            }).returning();
        } else {
            // Update existing record
            result = await db.update(displayText)
                .set({
                    content: trimmedContent,
                    textColor: finalTextColor,
                    backgroundColor: finalBackgroundColor,
                    updatedAt: new Date()
                })
                .where(eq(displayText.id, existing[0].id))
                .returning();
        }

        return json({
            content: result[0].content,
            textColor: result[0].textColor,
            backgroundColor: result[0].backgroundColor,
            updatedAt: result[0].updatedAt
        });
    } catch (error) {
        console.error('Failed to update display text:', error);
        return json({ error: 'Failed to update display text' }, { status: 500 });
    }
};
