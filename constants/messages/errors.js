const AUTH_ERRORS = {
  // Authentication Errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again',
  TOKEN_INVALID: 'Invalid authentication token',
  TOKEN_MISSING: 'Authentication token is required',
  
  // Registration Errors
  EMAIL_ALREADY_EXISTS: 'Email is already registered',
  USERNAME_ALREADY_EXISTS: 'Username is already taken',
  INVALID_EMAIL_FORMAT: 'Please enter a valid email address',
  INVALID_USERNAME_FORMAT: 'Username can only contain letters, numbers, and underscores',
  USERNAME_TOO_SHORT: 'Username must be at least 3 characters long',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long',
  PASSWORD_MISSING_NUMBER: 'Password must contain at least one number',
  PASSWORD_MISSING_UPPERCASE: 'Password must contain at least one uppercase letter',
  PASSWORD_MISSING_LOWERCASE: 'Password must contain at least one lowercase letter',
  PASSWORD_MISSING_SPECIAL: 'Password must contain at least one special character',
  
  // Email Verification Errors
  EMAIL_NOT_VERIFIED: 'Please verify your email address before proceeding',
  OTP_INVALID: 'Invalid OTP code',
  OTP_EXPIRED: 'OTP code has expired',
  OTP_MISSING: 'OTP code is required',
  OTP_INVALID_FORMAT: 'OTP must be 6 digits',
  
  // Password Reset Errors
  PASSWORD_RESET_EXPIRED: 'Password reset link has expired',
  PASSWORD_RESET_INVALID: 'Invalid password reset token',
  PASSWORD_RESET_MISSING: 'Password reset token is required',
  PASSWORD_MISMATCH: 'Passwords do not match',
  PASSWORD_SAME_AS_OLD: 'New password cannot be the same as the old password',
  
  // Account Status Errors
  ACCOUNT_INACTIVE: 'Your account is inactive. Please contact support',
  ACCOUNT_SUSPENDED: 'Your account has been suspended. Please contact support',
  
  // GitHub OAuth Errors
  GITHUB_AUTH_FAILED: 'GitHub authentication failed',
  GITHUB_EMAIL_MISSING: 'GitHub account email is required',
  GITHUB_ACCOUNT_EXISTS: 'A GitHub account is already linked to this email',
  
  // Validation Errors
  REQUIRED_FIELDS_MISSING: 'Please fill in all required fields',
  INVALID_INPUT_FORMAT: 'Invalid input format',
  INVALID_DATE_FORMAT: 'Invalid date format',
  INVALID_PHONE_FORMAT: 'Invalid phone number format',
  
  // Rate Limiting Errors
  TOO_MANY_REQUESTS: 'Too many requests. Please try again later',
  TOO_MANY_LOGIN_ATTEMPTS: 'Too many login attempts. Please try again later',
  TOO_MANY_OTP_ATTEMPTS: 'Too many OTP attempts. Please request a new OTP'
};

const RESOURCE_ERRORS = {
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',
  FORBIDDEN: 'You do not have permission to access this resource',
  INVALID_ID: 'Invalid ID format',
  VALIDATION_ERROR: 'Validation error',
  DELETED: 'Resource has been deleted',
  ARCHIVED: 'Resource has been archived'
};

const USER_ERRORS = {
  NOT_FOUND: 'User not found',
  ALREADY_FOLLOWING: 'You are already following this user',
  NOT_FOLLOWING: 'You are not following this user',
  CANNOT_FOLLOW_SELF: 'You cannot follow yourself',
  PROFILE_PRIVATE: 'This profile is private',
  PROFILE_BLOCKED: 'You cannot view this profile'
};

module.exports = {
  AUTH_ERRORS,
  RESOURCE_ERRORS,
  USER_ERRORS,
};
