import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  avatar_url: { type: String },
  bio: { type: String },
  github_username: { type: String },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model('User', UserSchema);
