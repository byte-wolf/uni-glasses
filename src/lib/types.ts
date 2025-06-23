export interface DisplayData {
	content: string;
	textColor: string;
	backgroundColor: string;
	fontSize: number; // Font size in pixels, reasonable range: 16-120
	textPosition?: { x: number; y: number }; // Text position relative to center (x: -100 to 100, y: -100 to 100)
	isPoweredOn?: boolean; // Whether the display is powered on or off
}

export interface DisplayResponse extends DisplayData {
	updatedAt: Date;
}

export interface PresetData {
	id?: number;
	name: string;
	textColor: string;
	backgroundColor: string;
	fontSize: number; // Font size in pixels, reasonable range: 16-120
	textPosition?: { x: number; y: number }; // Text position relative to center (x: -100 to 100, y: -100 to 100)
	isActive?: boolean;
}

export interface PresetResponse extends PresetData {
	id: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface ActivePresetResponse {
	preset: PresetResponse;
	content: string;
	updatedAt: Date;
}
