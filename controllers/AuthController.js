const passport = require('passport');
const AuthService = require('../service/AuthService');
const { AUTH_ERRORS } = require('../constants/messages/errors');
const { AUTH_SUCCESS } = require('../constants/messages/success');
const ResponseService = require('../utils/responseService');

class AuthController {
    async signup(req, res) {
        try {
            const { email, password, username } = req.body;
            const user = await AuthService.signup({ email, password, username });
            return ResponseService.success(res, {
                message: AUTH_SUCCESS.SIGNUP_SUCCESS,
                data: {
                    user: {
                        id: user._id,
                        email: user.email,
                        username: user.username
                    }
                },
                status: 201
            });
        } catch (error) {
            if (error.code === 11000) {
                return ResponseService.conflict(res, AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
            }
            if (error.name === 'ValidationError') {
                return ResponseService.validationError(res, Object.values(error.errors).map(err => err.message));
            }
            return ResponseService.error(res, {
                message: error.message in AUTH_ERRORS ? AUTH_ERRORS[error.message] : error.message,
                status: error.status || 400
            });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const { user, token, refreshToken } = await AuthService.login(email, password);
            return ResponseService.success(res, {
                message: AUTH_SUCCESS.LOGIN_SUCCESS,
                data: {
                    token,
                    refreshToken
                },
                status: 200
            });
        } catch (error) {
            if (error.message === AUTH_ERRORS.INVALID_CREDENTIALS) {
                return ResponseService.error(res, {
                    message: AUTH_ERRORS.INVALID_CREDENTIALS,
                    status: 400
                });
            }
            if (error.message === AUTH_ERRORS.EMAIL_NOT_VERIFIED) {
                return ResponseService.error(res, {
                    message: AUTH_ERRORS.EMAIL_NOT_VERIFIED,
                    status: 400
                });
            }
            return ResponseService.error(res, {
                message: error.message in AUTH_ERRORS ? AUTH_ERRORS[error.message] : error.message,
                status: error.status || 400
            });
        }
    }

    async verifyEmail(req, res) {
        try {
            const { email, otp } = req.body;
            await AuthService.verifyEmail(email, otp);
            return ResponseService.success(res, {
                message: AUTH_SUCCESS.EMAIL_VERIFIED,
                status: 200
            });
        } catch (error) {
            if (error.message === AUTH_ERRORS.OTP_INVALID) {
                return ResponseService.error(res, {
                    message: AUTH_ERRORS.OTP_INVALID,
                    status: 400
                });
            }
            if (error.message === AUTH_ERRORS.INVALID_CREDENTIALS) {
                return ResponseService.error(res, {
                    message: AUTH_ERRORS.INVALID_CREDENTIALS,
                    status: 400
                });
            }
            return ResponseService.error(res, {
                message: error.message in AUTH_ERRORS ? AUTH_ERRORS[error.message] : error.message,
                status: error.status || 400
            });
        }
    }

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            await AuthService.forgotPassword(email);
            return ResponseService.success(res, {
                message: AUTH_SUCCESS.PASSWORD_RESET_SENT
            });
        } catch (error) {
            if (error.message === 'USER_NOT_FOUND') {
                return ResponseService.notFound(res, AUTH_ERRORS.USER_NOT_FOUND);
            }
            return ResponseService.error(res, {
                message: error.message in AUTH_ERRORS ? AUTH_ERRORS[error.message] : error.message,
                status: error.status || 400
            });
        }
    }

    async resetPassword(req, res) {
        try {
            const { token, password } = req.body;
            await AuthService.resetPassword(token, password);
            return ResponseService.success(res, {
                message: AUTH_SUCCESS.PASSWORD_RESET_SUCCESS,
                status: 200
            });
        } catch (error) {
            if (error.message === AUTH_ERRORS.PASSWORD_RESET_EXPIRED) {
                return ResponseService.error(res, {
                    message: AUTH_ERRORS.PASSWORD_RESET_EXPIRED,
                    status: 400
                });
            }
            return ResponseService.error(res, {
                message: error.message in AUTH_ERRORS ? AUTH_ERRORS[error.message] : error.message,
                status: error.status || 400
            });
        }
    }

    async githubLogin(req, res) {
        try {
            const { code } = req.query;
            const { user, token } = await AuthService.githubLogin(code);
            return ResponseService.success(res, {
                message: AUTH_SUCCESS.GITHUB_LOGIN_SUCCESS,
                data: { user, token }
            });
        } catch (error) {
            if (error.message === 'GITHUB_AUTH_FAILED') {
                return ResponseService.unauthorized(res, AUTH_ERRORS.GITHUB_AUTH_FAILED);
            }
            return ResponseService.error(res, {
                message: error.message in AUTH_ERRORS ? AUTH_ERRORS[error.message] : error.message,
                status: error.status || 400
            });
        }
    }

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return ResponseService.error(res, {
                    message: AUTH_ERRORS.TOKEN_MISSING,
                    status: 400
                });
            }

            const { accessToken, newRefreshToken } = await AuthService.refreshToken(refreshToken);
            return ResponseService.success(res, {
                message: AUTH_SUCCESS.TOKEN_REFRESHED,
                data: { 
                    accessToken,
                    refreshToken: newRefreshToken
                },
                status: 200
            });
        } catch (error) {
            if (error.message === AUTH_ERRORS.TOKEN_EXPIRED || error.message === AUTH_ERRORS.TOKEN_INVALID) {
                return ResponseService.error(res, {
                    message: error.message,
                    status: 400
                });
            }
            return ResponseService.error(res, {
                message: error.message in AUTH_ERRORS ? AUTH_ERRORS[error.message] : error.message,
                status: error.status || 400
            });
        }
    }

    async verifyToken(req, res) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return ResponseService.error(res, {
                    message: AUTH_ERRORS.TOKEN_MISSING,
                    status: 400
                });
            }

            const decoded = await AuthService.verifyToken(token);
            return ResponseService.success(res, {
                message: AUTH_SUCCESS.TOKEN_VALID,
                data: { decoded },
                status: 200
            });
        } catch (error) {
            if (error.message === AUTH_ERRORS.TOKEN_EXPIRED || error.message === AUTH_ERRORS.TOKEN_INVALID) {
                return ResponseService.error(res, {
                    message: error.message,
                    status: 400
                });
            }
            return ResponseService.error(res, {
                message: error.message in AUTH_ERRORS ? AUTH_ERRORS[error.message] : error.message,
                status: error.status || 400
            });
        }
    }

    async logout(req, res) {
        try {
            const refreshToken = req.body.refreshToken;
            if (!refreshToken) {
                return ResponseService.error(res, {
                    message: AUTH_ERRORS.TOKEN_MISSING,
                    status: 400
                });
            }

            await AuthService.logout(refreshToken);
            return ResponseService.success(res, {
                message: AUTH_SUCCESS.LOGOUT_SUCCESS,
                status: 200
            });
        } catch (error) {
            if (error.message === AUTH_ERRORS.TOKEN_EXPIRED || error.message === AUTH_ERRORS.TOKEN_INVALID) {
                return ResponseService.error(res, {
                    message: error.message,
                    status: 400
                });
            }
            return ResponseService.error(res, {
                message: error.message in AUTH_ERRORS ? AUTH_ERRORS[error.message] : error.message,
                status: error.status || 400
            });
        }
    }
}

module.exports = new AuthController();
