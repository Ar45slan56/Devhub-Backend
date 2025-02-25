const dotenv = require('dotenv');
const passport = require('passport');
const { Strategy: GitHubStrategy } = require('passport-github2');

const User = require('../models/UserSchema');

dotenv.config();

// GitHub OAuth configuration
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: 'http://localhost:8080/api/auth/github/callback',
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ github_username: profile.username });

        if (!user) {
          user = new User({
            username: profile.username,
            email: profile?.emails[0]?.value,
            github_username: profile.username,
            avatar_url: profile?.photos[0]?.value,
            bio: profile._json.bio,
          });

          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
