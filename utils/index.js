const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'Qwerty@123';

const sendResponse = (res, statusCode, data, message) => {
  return res.status(statusCode).json({ message, data });
};

const generateToken = (data) => {
  return jwt.sign(data, SECRET_KEY, { expiresIn: process.env.JWT_EXPIRES_IN });
};

module.exports = {
  sendResponse,
  generateToken,
};
