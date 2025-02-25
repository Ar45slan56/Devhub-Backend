const authRoutes = require('./auth/AuthRoutes');

module.exports = (app) => {
  app.use('/api/auth', authRoutes);
};
