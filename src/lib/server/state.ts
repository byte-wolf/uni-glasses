// Global state management for the display system
let currentText: string = 'Welcome to the display system!';
let isPoweredOn: boolean = true;

export function getCurrentText(): string {
	return currentText;
}

export function updateText(newText: string): void {
	currentText = newText;
}

export function isPowerOn(): boolean {
	return isPoweredOn;
}

export function setPowerState(powerState: boolean): void {
	isPoweredOn = powerState;
}
