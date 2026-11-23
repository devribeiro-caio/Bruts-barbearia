import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  planName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  monthlyPriceCents: { type: Number, required: true, min: 0, max: 10_000_000 },
  billingDay: { type: Number, required: true, min: 1, max: 31 },
  startedAt: { type: Date, required: true },
  status: { type: String, enum: ['active', 'paused', 'cancelled'], default: 'active' },
  notes: { type: String, trim: true, maxlength: 500, default: '' },
}, { timestamps: true });

membershipSchema.index({ status: 1, billingDay: 1 });

export const Membership = mongoose.model('Membership', membershipSchema);
