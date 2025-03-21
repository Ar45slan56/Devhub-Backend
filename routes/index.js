const express = require('express');
const router = express.Router();
const AuthRoutes = require('./AuthRoutes');

// Auth routes
router.use('/auth', AuthRoutes);

// Other routes will be added here
// router.use('/users', UserRoutes);
// router.use('/posts', PostRoutes);
// etc.

module.exports = router;
