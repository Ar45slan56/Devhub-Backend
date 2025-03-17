
const BugReport = require('../models/BugReportSchema');
const { RESOURCE_ERRORS, BUG_STATUS } = require('../constants');
const NotificationService = require('./NotificationService');

class BugReportService {
    /**
     * Create a new bug report
     * @param {Object} reportData - Bug report data
     * @param {string} userId - Author ID
     * @returns {Promise<Object>} Created bug report
    */
    async createBugReport(reportData, userId) {
        try {
            const bugReport = new BugReport({
                ...reportData,
                user_id: userId
            });

            await bugReport.save();
            return bugReport;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get bug report by ID
     * @param {string} reportId - Bug report ID
     * @returns {Promise<Object>} Bug report data
     */
    async getBugReportById(reportId) {
        try {
            const bugReport = await BugReport.findById(reportId)
                .populate('user_id', 'username avatar_url')
                .populate({
                    path: 'comments',
                    populate: {
                        path: 'user',
                        select: 'username avatar_url'
                    }
                });

            if (!bugReport) {
                throw new Error(RESOURCE_ERRORS.NOT_FOUND);
            }

            return bugReport;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update bug report status
     * @param {string} reportId - Bug report ID
     * @param {string} status - New status
     * @param {string} userId - User ID (for authorization)
     * @returns {Promise<Object>} Updated bug report
     */
    async updateStatus(reportId, status, userId) {
        try {
            const bugReport = await BugReport.findById(reportId);

            if (!bugReport) {
                throw new Error(RESOURCE_ERRORS.NOT_FOUND);
            }

            // Update status
            const updatedReport = await BugReport.findByIdAndUpdate(
                reportId,
                { status },
                { new: true }
            );

            // Notify the report creator
            await NotificationService.createNotification(
                bugReport.user_id,
                'BUG_STATUS_CHANGE',
                {
                    reportId,
                    reportTitle: bugReport.title,
                    oldStatus: bugReport.status,
                    newStatus: status
                }
            );

            return updatedReport;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Watch a bug report
     * @param {string} reportId - Bug report ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated watchers list
     */
    async watchBugReport(reportId, userId) {
        try {
            const bugReport = await BugReport.findById(reportId);

            if (!bugReport) {
                throw new Error(RESOURCE_ERRORS.NOT_FOUND);
            }

            // Check if user is already watching
            const isWatching = bugReport.watchers.includes(userId);

            if (isWatching) {
                // Unwatch
                await BugReport.findByIdAndUpdate(reportId, {
                    $pull: { watchers: userId }
                });
                return { watching: false };
            } else {
                // Watch
                await BugReport.findByIdAndUpdate(reportId, {
                    $addToSet: { watchers: userId }
                });
                return { watching: true };
            }
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new BugReportService(); 