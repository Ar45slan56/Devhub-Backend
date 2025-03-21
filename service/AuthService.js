const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/UserSchema');
const { AUTH_ERRORS } = require('../constants/messages/errors');

class AuthService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    /**
     * Generate JWT token
     * @param {string} userId - User ID
     * @returns {string} JWT token
     */
    generateToken(userId) {
        return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
            expiresIn: '24h'
        });
    }

    /**
     * Generate refresh token
     * @returns {string} Refresh token
     */
    generateRefreshToken() {
        return crypto.randomBytes(40).toString('hex');
    }

    /**
     * Send verification email
     * @param {string} email - User email
     * @param {string} otp - OTP code
     */
    async sendVerificationEmail(email, otp) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify your DevHub account',
            html: `
                <h1>Welcome to DevHub!</h1>
                <p>Your verification code is: <strong>${otp}</strong></p>
                <p>This code will expire in 5 minutes.</p>
            `
        };

        await this.transporter.sendMail(mailOptions);
    }

    /**
     * Send password reset email
     * @param {string} email - User email
     * @param {string} resetToken - Reset token
     */
    async sendPasswordResetEmail(email, resetToken) {
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Reset your DevHub password',
            html: `
                <h1>Password Reset Request</h1>
                <p>Click the link below to reset your password:</p>
                <a href="${resetUrl}">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
            `
        };

        await this.transporter.sendMail(mailOptions);
    }

    /**
     * Sign up new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Created user
     */
    async signup(userData) {
        const { email, password, username } = userData;

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                throw new Error(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
            }
            throw new Error(AUTH_ERRORS.USERNAME_ALREADY_EXISTS);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate OTP
        const emailVerificationOTP = Math.floor(100000 + Math.random() * 900000).toString();

        // Create user
        const user = await User.create({
            ...userData,
            password: hashedPassword,
            emailVerificationOTP,
            isEmailVerified: false
        });

        // Send verification email
        await this.sendVerificationEmail(email, emailVerificationOTP);

        return user;
    }

    /**
     * Login user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} User data with tokens
     */
    async login(email, password) {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
        }

        if (!user.isEmailVerified) {
            throw new Error(AUTH_ERRORS.EMAIL_NOT_VERIFIED);
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
        }

        const token = this.generateToken(user._id);
        const refreshToken = this.generateRefreshToken();

        user.refresh_token = refreshToken;
        await user.save();

        return {
            user: {
                id: user._id,
                email: user.email,
                username: user.username
            },
            token,
            refreshToken
        };
    }

    /**
     * Verify email
     * @param {string} email - User email
     * @param {string} otp - OTP code
     * @returns {Promise<Object>} Updated user
     */
    async verifyEmail(email, otp) {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
        }

        if (user.emailVerificationOTP !== otp) {
            throw new Error(AUTH_ERRORS.OTP_INVALID);
        }

        user.isEmailVerified = true;
        user.emailVerificationOTP = undefined;
        await user.save();

        return user;
    }

    /**
     * Forgot password
     * @param {string} email - User email
     * @returns {Promise<Object>} Success message
     */
    async forgotPassword(email) {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 3600000; // 1 hour

        await user.save();
        await this.sendPasswordResetEmail(email, resetToken);

        return { message: 'Password reset email sent' };
    }

    /**
     * Reset password
     * @param {string} resetToken - Reset token
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} Updated user
     */
    async resetPassword(resetToken, newPassword) {
        const user = await User.findOne({
            resetPasswordToken: resetToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            throw new Error(AUTH_ERRORS.PASSWORD_RESET_EXPIRED);
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();
        return user;
    }

    /**
     * GitHub OAuth login
     * @param {Object} profile - GitHub profile data
     * @returns {Promise<Object>} User data with tokens
     */
    async githubLogin(profile) {
        let user = await User.findOne({ github_id: profile.id });

        if (!user) {
            // Create new user if doesn't exist
            user = await User.create({
                username: profile.username,
                email: profile.emails[0].value,
                github_id: profile.id,
                github_username: profile.username,
                isEmailVerified: true, // GitHub users are pre-verified
                password: crypto.randomBytes(32).toString('hex') // Random password for GitHub users
            });
        }

        const token = this.generateToken(user._id);
        const refreshToken = this.generateRefreshToken();

        user.refresh_token = refreshToken;
        await user.save();

        return {
            user: {
                id: user._id,
                email: user.email,
                username: user.username
            },
            token,
            refreshToken
        };
    }
}

module.exports = new AuthService(); 