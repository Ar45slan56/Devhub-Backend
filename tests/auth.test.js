const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../server');
const User = require('../models/UserSchema');
const { AUTH_ERRORS } = require('../constants/messages/errors');
const { generateToken } = require('../utils');

describe('Authentication Tests', () => {
    let testUser;
    let accessToken;
    let refreshToken;
    let mongoServer;

    beforeAll(async () => {
        try {
            // Connect to test database
            await mongoose.connect(process.env.MONGODB_TEST_URI, {
                maxPoolSize: 10
            });
            
            // Clear the database
            await User.deleteMany({});
        } catch (error) {
            console.error('Database connection error:', error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            // Clean up the database
            await User.deleteMany({});
            
            // Close database connection
            await mongoose.connection.close();
            
            // Close server
            await new Promise((resolve) => {
                server.close(resolve);
            });
        } catch (error) {
            console.error('Cleanup error:', error);
            throw error;
        }
    });

    beforeEach(async () => {
        // Clear database before each test
        await User.deleteMany({});
    });

    describe('Signup', () => {
        it('should create a new user successfully', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'Test123!',
                username: 'testuser'
            };

            const response = await request(app)
                .post('/api/auth/signup')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.email).toBe(userData.email);
            expect(response.body.data.username).toBe(userData.username);
        });

        it('should not create user with existing email', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'Test123!',
                username: 'testuser'
            };

            // Create first user
            await request(app)
                .post('/api/auth/signup')
                .send(userData);

            // Try to create second user with same email
            const response = await request(app)
                .post('/api/auth/signup')
                .send(userData);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
        });

        it('should validate password requirements', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'weak',
                username: 'testuser'
            };

            const response = await request(app)
                .post('/api/auth/signup')
                .send(userData);

            expect(response.status).toBe(400);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe('Login', () => {
        beforeEach(async () => {
            // Create a verified user for login tests
            testUser = await User.create({
                email: 'test@example.com',
                password: '$2a$10$YourHashedPasswordHere', // You should hash this properly
                username: 'testuser',
                isEmailVerified: true
            });
        });

        it('should login successfully with correct credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'Test123!'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data).toHaveProperty('refreshToken');

            accessToken = response.body.data.token;
            refreshToken = response.body.data.refreshToken;
        });

        it('should not login with incorrect password', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'WrongPassword'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe(AUTH_ERRORS.INVALID_CREDENTIALS);
        });

        it('should not login with unverified email', async () => {
            // Create unverified user
            await User.create({
                email: 'unverified@example.com',
                password: '$2a$10$YourHashedPasswordHere',
                username: 'unverified',
                isEmailVerified: false
            });

            const loginData = {
                email: 'unverified@example.com',
                password: 'Test123!'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe(AUTH_ERRORS.EMAIL_NOT_VERIFIED);
        });
    });

    describe('Email Verification', () => {
        beforeEach(async () => {
            // Create an unverified user with OTP
            testUser = await User.create({
                email: 'test@example.com',
                password: '$2a$10$YourHashedPasswordHere',
                username: 'testuser',
                isEmailVerified: false,
                otp: '123456'
            });
        });

        it('should verify email with correct OTP', async () => {
            const verificationData = {
                email: 'test@example.com',
                otp: '123456'
            };

            const response = await request(app)
                .post('/api/auth/verify-email')
                .send(verificationData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Check if user is verified
            const user = await User.findOne({ email: 'test@example.com' });
            expect(user.isEmailVerified).toBe(true);
        });

        it('should not verify email with incorrect OTP', async () => {
            const verificationData = {
                email: 'test@example.com',
                otp: '000000'
            };

            const response = await request(app)
                .post('/api/auth/verify-email')
                .send(verificationData);

            expect(response.status).toBe(400);
            expect(response.body.error).toBe(AUTH_ERRORS.OTP_INVALID);
        });
    });

    describe('Password Reset', () => {
        beforeEach(async () => {
            // Create a verified user
            testUser = await User.create({
                email: 'test@example.com',
                password: '$2a$10$YourHashedPasswordHere',
                username: 'testuser',
                isEmailVerified: true
            });
        });

        it('should send password reset email', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'test@example.com' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Check if reset token is set
            const user = await User.findOne({ email: 'test@example.com' });
            expect(user.resetPasswordToken).toBeDefined();
            expect(user.resetPasswordExpire).toBeDefined();
        });

        it('should reset password with valid token', async () => {
            // First request password reset
            await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'test@example.com' });

            // Get the reset token from the database
            const user = await User.findOne({ email: 'test@example.com' });
            const resetToken = user.resetPasswordToken;

            // Reset password
            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    resetToken,
                    newPassword: 'NewTest123!'
                });

            expect(response.status).toBe(200);
        });

        it('should not reset password with expired token', async () => {
            // Set an expired token
            await User.updateOne(
                { email: 'test@example.com' },
                {
                    resetPasswordToken: 'expired-token',
                    resetPasswordExpire: Date.now() - 3600000 // 1 hour ago
                }
            );

            const response = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    resetToken: 'expired-token',
                    newPassword: 'NewTest123!'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe(AUTH_ERRORS.PASSWORD_RESET_EXPIRED);
        });
    });

    describe('Auth Routes', () => {
        describe('POST /api/auth/signup', () => {
            it('should create a new user', async () => {
                const res = await request(app)
                    .post('/api/auth/signup')
                    .send({
                        email: 'test@example.com',
                        password: 'Test123!@#',
                        username: 'testuser'
                    });

                expect(res.status).toBe(201);
                expect(res.body.success).toBe(true);
                expect(res.body.data.user).toBeDefined();
                expect(res.body.data.user.email).toBe('test@example.com');
            });

            it('should return validation error for invalid input', async () => {
                const res = await request(app)
                    .post('/api/auth/signup')
                    .send({
                        email: 'invalid-email',
                        password: 'short',
                        username: 'a'
                    });

                expect(res.status).toBe(400);
                expect(res.body.success).toBe(false);
                expect(res.body.errors).toBeDefined();
            });
        });

        describe('POST /api/auth/login', () => {
            it('should login user and return tokens', async () => {
                const res = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: 'test@example.com',
                        password: 'Test123!@#'
                    });

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                expect(res.body.data.token).toBeDefined();
                expect(res.body.data.refreshToken).toBeDefined();

                accessToken = res.body.data.token;
                refreshToken = res.body.data.refreshToken;
            });

            it('should return error for invalid credentials', async () => {
                const res = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: 'test@example.com',
                        password: 'wrongpassword'
                    });

                expect(res.status).toBe(401);
                expect(res.body.success).toBe(false);
            });
        });

        describe('POST /api/auth/verify-email', () => {
            it('should verify email with valid OTP', async () => {
                // Create a test user first
                const userData = {
                    email: 'test@example.com',
                    password: 'Test123!',
                    username: 'testuser'
                };

                await request(app)
                    .post('/api/auth/signup')
                    .send(userData);

                // Get the user and their OTP
                testUser = await User.findOne({ email: 'test@example.com' });
                const otp = testUser.emailVerificationOTP;

                const res = await request(app)
                    .post('/api/auth/verify-email')
                    .send({
                        email: 'test@example.com',
                        otp: otp
                    });

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
            });

            it('should return error for invalid OTP', async () => {
                const res = await request(app)
                    .post('/api/auth/verify-email')
                    .send({
                        email: 'test@example.com',
                        otp: '000000'
                    });

                expect(res.status).toBe(400);
                expect(res.body.success).toBe(false);
            });
        });

        describe('POST /api/auth/refresh-token', () => {
            it('should return new access token', async () => {
                const res = await request(app)
                    .post('/api/auth/refresh-token')
                    .send({ refreshToken });

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
                expect(res.body.data.accessToken).toBeDefined();
                expect(res.body.data.refreshToken).toBeDefined();
            });

            it('should return error for invalid refresh token', async () => {
                const res = await request(app)
                    .post('/api/auth/refresh-token')
                    .send({ refreshToken: 'invalid-token' });

                expect(res.status).toBe(401);
                expect(res.body.success).toBe(false);
            });
        });

        describe('GET /api/auth/verify-token', () => {
            it('should verify valid token', async () => {
                const res = await request(app)
                    .get('/api/auth/verify-token')
                    .set('Authorization', `Bearer ${accessToken}`);

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
            });

            it('should return error for invalid token', async () => {
                const res = await request(app)
                    .get('/api/auth/verify-token')
                    .set('Authorization', 'Bearer invalid-token');

                expect(res.status).toBe(401);
                expect(res.body.success).toBe(false);
            });
        });

        describe('POST /api/auth/logout', () => {
            it('should logout user successfully', async () => {
                const res = await request(app)
                    .post('/api/auth/logout')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send({ refreshToken });

                expect(res.status).toBe(200);
                expect(res.body.success).toBe(true);
            });

            it('should return error for invalid token', async () => {
                const res = await request(app)
                    .post('/api/auth/logout')
                    .set('Authorization', 'Bearer invalid-token')
                    .send({ refreshToken: 'invalid-token' });

                expect(res.status).toBe(401);
                expect(res.body.success).toBe(false);
            });
        });
    });
}); 