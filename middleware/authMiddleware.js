const { AUTH_ERRORS } = require('../constants/messages/errors');
const ResponseService = require('../utils/responseService');
const AuthService = require('../service/AuthService');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];

        if (!token) {
            return ResponseService.unauthorized(res, AUTH_ERRORS.TOKEN_MISSING);
        }

        const decoded = await AuthService.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.message === 'TOKEN_EXPIRED') {
            return ResponseService.unauthorized(res, AUTH_ERRORS.TOKEN_EXPIRED);
        }
        if (error.message === 'TOKEN_INVALID') {
            return ResponseService.unauthorized(res, AUTH_ERRORS.TOKEN_INVALID);
        }
        return ResponseService.error(res, {
            message: error.message in AUTH_ERRORS ? AUTH_ERRORS[error.message] : error.message,
            status: error.status || 401
        });
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];

        if (token) {
            const decoded = await AuthService.verifyToken(token);
            req.user = decoded;
        }
        next();
    } catch (error) {
        // If token verification fails, continue without user
        next();
    }
};

module.exports = {
    authenticateToken,
    optionalAuth
}; 