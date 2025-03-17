
const User = require('../models/UserSchema');
const { USER_ERRORS, RESOURCE_ERRORS } = require('../constants');

class UserService {
    /**
     * Get user by ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User data
    */
    async getUserById(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error(USER_ERRORS.NOT_FOUND);
            }
            return user;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update user profile
     * @param {string} userId - User ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated user data
    */
    async updateProfile(userId, updateData) {
        try {
            // Prevent updating sensitive fields
            const allowedUpdates = [
                'username',
                'bio',
                'avatar_url',
                'social_links',
                'interests',
                'skills'
            ];

            const updates = {};
            Object.keys(updateData).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    updates[key] = updateData[key];
                }
            });

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: updates },
                { new: true, runValidators: true }
            );

            if (!user) {
                throw new Error(USER_ERRORS.NOT_FOUND);
            }

            return user;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Follow a user
     * @param {string} userId - Current user ID
     * @param {string} targetUserId - User to follow
     * @returns {Promise<Object>} Updated user data
    */
    async followUser(userId, targetUserId) {
        try {
            if (userId === targetUserId) {
                throw new Error(USER_ERRORS.CANNOT_FOLLOW_SELF);
            }

            const targetUser = await User.findById(targetUserId);
            if (!targetUser) {
                throw new Error(USER_ERRORS.NOT_FOUND);
            }

            const user = await User.findById(userId);
            if (user.following.includes(targetUserId)) {
                throw new Error(USER_ERRORS.ALREADY_FOLLOWING);
            }

            // Add to following list
            await User.findByIdAndUpdate(
                userId,
                { $addToSet: { following: targetUserId } }
            );

            // Add to followers list
            await User.findByIdAndUpdate(
                targetUserId,
                { $addToSet: { followers: userId } }
            );

            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Unfollow a user
     * @param {string} userId - Current user ID
     * @param {string} targetUserId - User to unfollow
     * @returns {Promise<Object>} Updated user data
    */
    async unfollowUser(userId, targetUserId) {
        try {
            const targetUser = await User.findById(targetUserId);
            if (!targetUser) {
                throw new Error(USER_ERRORS.NOT_FOUND);
            }

            const user = await User.findById(userId);
            if (!user.following.includes(targetUserId)) {
                throw new Error(USER_ERRORS.NOT_FOLLOWING);
            }

            // Remove from following list
            await User.findByIdAndUpdate(
                userId,
                { $pull: { following: targetUserId } }
            );

            // Remove from followers list
            await User.findByIdAndUpdate(
                targetUserId,
                { $pull: { followers: userId } }
            );

            return { success: true };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new UserService(); 