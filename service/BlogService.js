
const Blog = require('../models/BlogSchema');
const { RESOURCE_ERRORS, BLOG_STATUS } = require('../constants');
const NotificationService = require('./NotificationService');

class BlogService {
    /**
     * Create a new blog post
     * @param {Object} blogData - Blog data
     * @param {string} userId - Author ID
     * @returns {Promise<Object>} Created blog
     */
    async createBlog(blogData, userId) {
        try {
            const blog = new Blog({
                ...blogData,
                author: userId,
                reading_time: this.calculateReadingTime(blogData.content)
            });

            await blog.save();
            return blog;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get blog by ID
     * @param {string} blogId - Blog ID
     * @returns {Promise<Object>} Blog data
     */
    async getBlogById(blogId) {
        try {
            const blog = await Blog.findById(blogId)
                .populate('author', 'username avatar_url')
                .populate({
                    path: 'comments',
                    populate: {
                        path: 'user',
                        select: 'username avatar_url'
                    }
                });

            if (!blog) {
                throw new Error(RESOURCE_ERRORS.NOT_FOUND);
            }

            // Increment view count
            await Blog.findByIdAndUpdate(blogId, { $inc: { views: 1 } });

            return blog;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update blog post
     * @param {string} blogId - Blog ID
     * @param {Object} updateData - Data to update
     * @param {string} userId - User ID (for authorization)
     * @returns {Promise<Object>} Updated blog
     */
    async updateBlog(blogId, updateData, userId) {
        try {
            const blog = await Blog.findById(blogId);

            if (!blog) {
                throw new Error(RESOURCE_ERRORS.NOT_FOUND);
            }

            // Check if user is the author
            if (blog.author.toString() !== userId) {
                throw new Error(RESOURCE_ERRORS.FORBIDDEN);
            }

            // Update reading time if content changed
            if (updateData.content) {
                updateData.reading_time = this.calculateReadingTime(updateData.content);
            }

            const updatedBlog = await Blog.findByIdAndUpdate(
                blogId,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            return updatedBlog;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Like a blog post
     * @param {string} blogId - Blog ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated like count
     */
    async likeBlog(blogId, userId) {
        try {
            const blog = await Blog.findById(blogId);

            if (!blog) {
                throw new Error(RESOURCE_ERRORS.NOT_FOUND);
            }

            // Check if user already liked
            if (blog.liked_by.includes(userId)) {
                // Unlike
                await Blog.findByIdAndUpdate(blogId, {
                    $pull: { liked_by: userId },
                    $inc: { likes: -1 }
                });
                return { liked: false, likes: blog.likes - 1 };
            } else {
                // Like
                await Blog.findByIdAndUpdate(blogId, {
                    $addToSet: { liked_by: userId },
                    $inc: { likes: 1 }
                });

                // Notify author if it's not the same user
                if (blog.author.toString() !== userId) {
                    await NotificationService.createNotification(
                        blog.author,
                        'BLOG_LIKE',
                        { blogId, blogTitle: blog.title, userId }
                    );
                }

                return { liked: true, likes: blog.likes + 1 };
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Calculate reading time for blog content
     * @param {string} content - Blog content
     * @returns {number} Reading time in minutes
     */
    calculateReadingTime(content) {
        const wordsPerMinute = 200;
        const wordCount = content.trim().split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / wordsPerMinute);
        return Math.max(1, readingTime); // Minimum 1 minute
    }
}

module.exports = new BlogService(); 