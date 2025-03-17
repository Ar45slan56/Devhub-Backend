
const WebSocketService = require('./WebSocketService');

class NotificationService {
    /**
     * Create a new notification
     * @param {string} userId - User ID to notify
     * @param {string} type - Notification type
     * @param {Object} data - Notification data
     * @param {boolean} sendRealTime - Whether to send in real-time
     */
    async createNotification(userId, type, data, sendRealTime = true) {
        try {
            // In the future, this would save to a Notification model
            const notification = {
                userId,
                type,
                data,
                read: false,
                createdAt: new Date()
            };

            // Send real-time notification if user is online
            if (sendRealTime && WebSocketService.isUserOnline(userId)) {
                WebSocketService.sendNotification(userId, notification);
            }

            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Create notifications for multiple users
     * @param {Array<string>} userIds - User IDs to notify
     * @param {string} type - Notification type
     * @param {Object} data - Notification data
     */
    async createBulkNotifications(userIds, type, data) {
        try {
            const promises = userIds.map(userId =>
                this.createNotification(userId, type, data)
            );

            await Promise.all(promises);
            return { success: true };
        } catch (error) {
            console.error('Error creating bulk notifications:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService(); 