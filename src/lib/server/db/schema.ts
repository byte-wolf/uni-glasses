import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: integer('id').primaryKey(),
	age: integer('age')
});

export const displayText = sqliteTable('display_text', {
	id: integer('id').primaryKey(),
	content: text('content').notNull().default('Welcome to our display system!'),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});
