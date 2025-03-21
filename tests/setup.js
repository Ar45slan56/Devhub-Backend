require('dotenv').config();

process.env.NODE_ENV = 'test';
process.env.MONGODB_TEST_URI = 'mongodb://localhost:27017/dev-hub-test';
process.env.JWT_SECRET = 'test-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.EMAIL_FROM = 'test@example.com';
process.env.SMTP_HOST = 'smtp.mailtrap.io';
process.env.SMTP_PORT = '2525';
process.env.SMTP_USER = 'test-user';
process.env.SMTP_PASS = 'test-pass';
process.env.GITHUB_CLIENT_ID = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-client-secret'; 