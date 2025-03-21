const { AUTH_ERRORS } = require('../constants/messages/errors');
const ResponseService = require('../utils/responseService');

const validateSignup = (req, res, next) => {
    const { email, password, username } = req.body;
    const errors = [];

    // Email validation
    if (!email) {
        errors.push(AUTH_ERRORS.REQUIRED_FIELDS_MISSING);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(AUTH_ERRORS.INVALID_EMAIL_FORMAT);
    }

    // Password validation
    if (!password) {
        errors.push(AUTH_ERRORS.REQUIRED_FIELDS_MISSING);
    } else {
        if (password.length < 6) errors.push(AUTH_ERRORS.PASSWORD_TOO_SHORT);
        if (!/\d/.test(password)) errors.push(AUTH_ERRORS.PASSWORD_MISSING_NUMBER);
        if (!/[A-Z]/.test(password)) errors.push(AUTH_ERRORS.PASSWORD_MISSING_UPPERCASE);
        if (!/[a-z]/.test(password)) errors.push(AUTH_ERRORS.PASSWORD_MISSING_LOWERCASE);
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push(AUTH_ERRORS.PASSWORD_MISSING_SPECIAL);
    }

    // Username validation
    if (!username) {
        errors.push(AUTH_ERRORS.REQUIRED_FIELDS_MISSING);
    } else {
        if (username.length < 3) errors.push(AUTH_ERRORS.USERNAME_TOO_SHORT);
        if (!/^[a-zA-Z0-9_]+$/.test(username)) errors.push(AUTH_ERRORS.INVALID_USERNAME_FORMAT);
    }

    if (errors.length > 0) {
        return ResponseService.validationError(res, errors);
    }

    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email) errors.push(AUTH_ERRORS.REQUIRED_FIELDS_MISSING);
    if (!password) errors.push(AUTH_ERRORS.REQUIRED_FIELDS_MISSING);

    if (errors.length > 0) {
        return ResponseService.validationError(res, errors);
    }

    next();
};

const validateEmail = (req, res, next) => {
    const { email } = req.body;
    
    if (!email) {
        return ResponseService.validationError(res, AUTH_ERRORS.REQUIRED_FIELDS_MISSING);
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return ResponseService.validationError(res, AUTH_ERRORS.INVALID_EMAIL_FORMAT);
    }

    next();
};

const validatePassword = (req, res, next) => {
    const { password } = req.body;
    const errors = [];

    if (!password) {
        errors.push(AUTH_ERRORS.REQUIRED_FIELDS_MISSING);
    } else {
        if (password.length < 6) errors.push(AUTH_ERRORS.PASSWORD_TOO_SHORT);
        if (!/\d/.test(password)) errors.push(AUTH_ERRORS.PASSWORD_MISSING_NUMBER);
        if (!/[A-Z]/.test(password)) errors.push(AUTH_ERRORS.PASSWORD_MISSING_UPPERCASE);
        if (!/[a-z]/.test(password)) errors.push(AUTH_ERRORS.PASSWORD_MISSING_LOWERCASE);
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push(AUTH_ERRORS.PASSWORD_MISSING_SPECIAL);
    }

    if (errors.length > 0) {
        return ResponseService.validationError(res, errors);
    }

    next();
};

const validateOTP = (req, res, next) => {
    const { otp } = req.body;

    if (!otp) {
        return ResponseService.validationError(res, AUTH_ERRORS.OTP_MISSING);
    }

    if (!/^\d{6}$/.test(otp)) {
        return ResponseService.validationError(res, AUTH_ERRORS.OTP_INVALID_FORMAT);
    }

    next();
};

const validateRefreshToken = (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return ResponseService.validationError(res, AUTH_ERRORS.TOKEN_MISSING);
    }

    next();
};

module.exports = {
    validateSignup,
    validateLogin,
    validateEmail,
    validatePassword,
    validateOTP,
    validateRefreshToken
}; 