export interface DisplayData {
    content: string;
    textColor: string;
    backgroundColor: string;
}

export interface DisplayResponse extends DisplayData {
    updatedAt: Date;
} 