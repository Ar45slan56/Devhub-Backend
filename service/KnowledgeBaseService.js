
const KnowledgeBase = require('../models/KnowledgeBaseSchema');
const { RESOURCE_ERRORS, KB_STATUS } = require('../constants');

class KnowledgeBaseService {
    /**
     * Create a new knowledge base article
     * @param {Object} articleData - Article data
     * @param {string} userId - Author ID
     * @returns {Promise<Object>} Created article
     */
    async createArticle(articleData, userId) {
        try {
            const article = new KnowledgeBase({
                ...articleData,
                user_id: userId,
                last_reviewed: new Date()
            });

            await article.save();
            return article;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get article by ID
     * @param {string} articleId - Article ID
     * @returns {Promise<Object>} Article data
     */
    async getArticleById(articleId) {
        try {
            const article = await KnowledgeBase.findById(articleId)
                .populate('user_id', 'username avatar_url')
                .populate('contributors', 'username avatar_url');

            if (!article) {
                throw new Error(RESOURCE_ERRORS.NOT_FOUND);
            }

            // Increment view count
            await KnowledgeBase.findByIdAndUpdate(articleId, { $inc: { views: 1 } });

            return article;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update knowledge base article
     * @param {string} articleId - Article ID
     * @param {Object} updateData - Data to update
     * @param {string} userId - User ID (for authorization)
     * @returns {Promise<Object>} Updated article
     */
    async updateArticle(articleId, updateData, userId) {
        try {
            const article = await KnowledgeBase.findById(articleId);

            if (!article) {
                throw new Error(RESOURCE_ERRORS.NOT_FOUND);
            }

            // Check if user is the author or a contributor
            const isAuthor = article.user_id.toString() === userId;
            const isContributor = article.contributors.some(
                id => id.toString() === userId
            );

            if (!isAuthor && !isContributor) {
                throw new Error(RESOURCE_ERRORS.FORBIDDEN);
            }

            // Add user as contributor if not already
            if (!isAuthor && !isContributor) {
                updateData.contributors = [...article.contributors, userId];
            }

            // Update last reviewed date
            updateData.last_reviewed = new Date();

            const updatedArticle = await KnowledgeBase.findByIdAndUpdate(
                articleId,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            return updatedArticle;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Mark article as helpful
     * @param {string} articleId - Article ID
     * @returns {Promise<Object>} Updated helpful count
     */
    async markAsHelpful(articleId) {
        try {
            const article = await KnowledgeBase.findById(articleId);

            if (!article) {
                throw new Error(RESOURCE_ERRORS.NOT_FOUND);
            }

            // Increment helpful votes
            const updatedArticle = await KnowledgeBase.findByIdAndUpdate(
                articleId,
                { $inc: { helpful_votes: 1 } },
                { new: true }
            );

            return { helpful_votes: updatedArticle.helpful_votes };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new KnowledgeBaseService(); 