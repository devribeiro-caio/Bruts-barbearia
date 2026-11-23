import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 240, default: '' },
  priceCents: { type: Number, required: true, min: 0, max: 10_000_000 },
  durationMinutes: { type: Number, required: true, min: 30, max: 240, validate: Number.isInteger },
  isActive: { type: Boolean, default: true },
  isDemo: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

serviceSchema.index({ isActive: 1, sortOrder: 1, name: 1 });

export const Service = mongoose.model('Service', serviceSchema);
