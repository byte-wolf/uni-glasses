// Global state management for the text content
let currentText: string = "Welcome to the display system!";

export function getCurrentText(): string {
    return currentText;
}

export function updateText(newText: string): void {
    currentText = newText;
} 