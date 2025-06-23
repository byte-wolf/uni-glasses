import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: integer('id').primaryKey(),
	age: integer('age')
});

export const presets = sqliteTable('presets', {
	id: integer('id').primaryKey(),
	name: text('name').notNull(),
	textColor: text('text_color').notNull().default('#ffffff'),
	backgroundColor: text('background_color').notNull().default('#1f2937'),
	fontSize: integer('font_size').notNull().default(48),
	textPositionX: integer('text_position_x').notNull().default(0),
	textPositionY: integer('text_position_y').notNull().default(0),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const displayText = sqliteTable('display_text', {
	id: integer('id').primaryKey(),
	content: text('content').notNull().default('Welcome to our display system!'),
	activePresetId: integer('active_preset_id').references(() => presets.id),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});
