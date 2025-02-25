const mongoose = require('mongoose');

const BugReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  }, // enum based on the priority
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Under Review', 'Resolved', 'Closed'],
    default: 'Open',
  }, // enum based on the status
  category: {
    type: String,
    enum: [
      'Bug',
      'Feature Request',
      'Performance',
      'Security',
      'Documentation',
    ],
    required: true,
  }, // enum based on the category
  environment: {
    os: String,
    browser: String,
    version: String,
  },
  reproduction_steps: [String],
  expected_behavior: { type: String },
  actual_behavior: { type: String },
  // code_snippets: [{
  //   language: String,
  //   code: String,
  //   description: String
  // }],
  attachments: [
    {
      url: String,
      filename: String,
      type: String,
    },
  ],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  related_issues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BugReport' }],
  tags: [String],
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  is_resolved: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BugReport', BugReportSchema);
