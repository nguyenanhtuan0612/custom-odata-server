export class Notification {
    constructor(type, title, content) {
        this.Type = type;
        this.Title = title;
        this.Content = content;
        this.CreatedAt = new Date();
    }
    Type: number;
    Title: string;
    Content: string;
    // TODO: populate CreatedBy
    CreatedBy: number;
    CreatedAt: Date;
}
