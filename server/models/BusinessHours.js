import mongoose from 'mongoose';

const businessHoursSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, required: true, min: 1, max: 7 },
  isOpen: { type: Boolean, default: false },
  openTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/, default: '09:00' },
  closeTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/, default: '18:00' },
}, { timestamps: true });

businessHoursSchema.index({ dayOfWeek: 1 }, { unique: true });

export const BusinessHours = mongoose.model('BusinessHours', businessHoursSchema);
