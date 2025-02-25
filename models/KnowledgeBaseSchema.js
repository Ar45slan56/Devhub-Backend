const mongoose = require('mongoose');

const KnowledgeBaseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  description: { type: String, required: true },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: [
      'Setup Guide',
      'Best Practices',
      'Troubleshooting',
      'Security',
      'Architecture',
      'Development',
    ],
    required: true,
  },
  subcategory: { type: String },
  difficulty_level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true,
  },
  tags: [{ type: String }],
  // code_snippets: [{
  //   language: String,
  //   code: String,
  //   description: String
  // }],
  contributors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  related_articles: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeBase' },
  ],
  version: { type: String },
  last_reviewed: { type: Date },
  // reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  views: { type: Number, default: 0 },
  helpful_votes: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived', 'Under Review'],
    default: 'Draft',
  },
  attachments: [
    {
      url: String,
      filename: String,
      type: String,
    },
  ],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);
