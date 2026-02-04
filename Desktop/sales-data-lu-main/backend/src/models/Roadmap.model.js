/**
 * Roadmap Model
 * Stores counselor-generated roadmap data and inputs.
 */

const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema(
  {
    lead: {
      name: { type: String, required: true },
      currentRole: { type: String, default: '' },
      totalExperience: { type: String, default: '' },
      domain: { type: String, default: '' },
      targetOutcome: { type: String, default: '' },
    },
    inputs: {
      linkedinUrl: { type: String, default: '' },
      linkedinText: { type: String, default: '' },
      resumeFileName: { type: String, default: '' },
      resumeUsed: { type: Boolean, default: false },
      linkedinUsed: { type: Boolean, default: false },
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Roadmap', roadmapSchema);
