import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: integer('id').primaryKey(),
	age: integer('age')
});

export const displayText = sqliteTable('display_text', {
	id: integer('id').primaryKey(),
	content: text('content').notNull().default('Welcome to our display system!'),
	textColor: text('text_color').notNull().default('#ffffff'),
	backgroundColor: text('background_color').notNull().default('#1f2937'),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});
