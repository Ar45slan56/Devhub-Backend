
const Discussion = require('../models/DiscussionSchema');
const { RESOURCE_ERRORS } = require('../constants');
const NotificationService = require('./NotificationService');

class DiscussionService {
    /**
     * Create a new discussion
     * @param {Object} discussionData - Discussion data
     * @param {string} userId - Author ID
     * @returns {Promise<Object>} Created discussion
     */
    async createDiscussion(discussionData, userId) {
        try {
            const discussion = new Discussion({
                ...discussionData,
                user_id: userId
            });

            await discussion.save();
            return discussion;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get discussion by ID
     * @param {string} discussionId - Discussion ID
     * @returns {Promise<Object>} Discussion data
     */
    async getDiscussionById(discussionId) {
        try {
            const discussion = await Discussion.findById(discussionId)
                .populate('user_id', 'username avatar_url')
                .populate({
                    path: 'answers',
                    populate: {
                        path: 'user',
                        select: 'username avatar_url'
                    }
                });

            if (!discussion) {
                throw new Error(RESOURCE_ERRORS.NOT_FOUND);
            }

            // Increment view count
            await Discussion.findByIdAndUpdate(discussionId, { $inc: { views: 1 } });

            return discussion;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Vote on a discussion
     * @param {string} discussionId - Discussion ID
     * @param {string} userId - User ID
     * @param {number} voteValue - Vote value (1 for upvote, -1 for downvote)
     * @returns {Promise<Object>} Updated vote counts
     */
    async voteDiscussion(discussionId, userId, voteValue) {
        try {
            if (![1, -1].includes(voteValue)) {
                throw new Error('Invalid vote value');
            }

            const discussion = await Discussion.findById(discussionId);
            if (!discussion) {
                throw new Error(RESOURCE_ERRORS.NOT_FOUND);
            }

            // Check if user already voted
            const existingVote = discussion.poll_voters.find(
                vote => vote.user.toString() === userId
            );

            if (existingVote) {
                if (existingVote.vote === voteValue) {
                    // Remove vote if same value
                    await Discussion.findByIdAndUpdate(discussionId, {
                        $pull: { poll_voters: { user: userId } },
                        $inc: {
                            upvotes: existingVote.vote === 1 ? -1 : 0,
                            downvotes: existingVote.vote === -1 ? -1 : 0
                        }
                    });
                } else {
                    // Change vote
                    await Discussion.findByIdAndUpdate(
                        {
                            _id: discussionId,
                            'poll_voters.user': userId
                        },
                        {
                            $set: { 'poll_voters.$.vote': voteValue },
                            $inc: {
                                upvotes: voteValue === 1 ? 1 : -1,
                                downvotes: voteValue === -1 ? 1 : -1
                            }
                        }
                    );
                }
            } else {
                // Add new vote
                await Discussion.findByIdAndUpdate(discussionId, {
                    $push: { poll_voters: { user: userId, vote: voteValue } },
                    $inc: {
                        upvotes: voteValue === 1 ? 1 : 0,
                        downvotes: voteValue === -1 ? 1 : 0
                    }
                });
            }

            const updatedDiscussion = await Discussion.findById(discussionId);
            return {
                upvotes: updatedDiscussion.upvotes,
                downvotes: updatedDiscussion.downvotes
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Mark a discussion as resolved
     * @param {string} discussionId - Discussion ID
     * @param {string} answerId - Accepted answer ID
     * @param {string} userId - User ID (for authorization)
     * @returns {Promise<Object>} Updated discussion
     */
    async markAsResolved(discussionId, answerId, userId) {
        try {
            const discussion = await Discussion.findById(discussionId);

            if (!discussion) {
                throw new Error(RESOURCE_ERRORS.NOT_FOUND);
            }

            // Check if user is the author
            if (discussion.user_id.toString() !== userId) {
                throw new Error(RESOURCE_ERRORS.FORBIDDEN);
            }

            // Update discussion
            const updatedDiscussion = await Discussion.findByIdAndUpdate(
                discussionId,
                {
                    is_resolved: true,
                    accepted_answer: answerId
                },
                { new: true }
            );

            return updatedDiscussion;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new DiscussionService(); 