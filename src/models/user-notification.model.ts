export class UserNotification {
    constructor(userId, notificationId) {
        this.UserId = userId;
        this.NotificationId = notificationId;
    }
    UserId: number;
    NotificationId: number;
}
