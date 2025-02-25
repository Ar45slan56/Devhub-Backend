const passport = require('passport');

const { sendResponse, generateToken } = require('../utils');

const githubCallback = async (req, res, next) => {
  passport.authenticate(
    'github',
    { failureRedirect: '/login' },
    async (err, user, info) => {
      if (err || !user) {
        return res.redirect('/login');
      }

      const token = generateToken({ id: user._id, email: user.email });

      return sendResponse(
        res,
        200,
        {
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
          bio: user.bio,
          github_username: user.github_username,
          token,
        },
        'GitHub login successful'
      );
    }
  )(req, res, next);
};

module.exports = {
  githubCallback,
};
