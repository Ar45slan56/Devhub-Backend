const { Router } = require('express');
const passport = require('passport');

const { githubCallback } = require('../../controllers/AuthController');

const router = Router();

router.get('/github', (req, res, next) => {
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

router.get('/github/callback', githubCallback);

module.exports = router;
