export interface DisplayData {
	content: string;
	textColor: string;
	backgroundColor: string;
}

export interface DisplayResponse extends DisplayData {
	updatedAt: Date;
}

export interface PresetData {
	id?: number;
	name: string;
	textColor: string;
	backgroundColor: string;
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
