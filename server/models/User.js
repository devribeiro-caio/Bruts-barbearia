import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  whatsappPhone: { type: String, trim: true, maxlength: 20, default: '' },
  whatsappOptIn: { type: Boolean, default: false },
  whatsappOptInAt: { type: Date, default: null },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer', required: true },
}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 }, {
  unique: true,
  partialFilterExpression: { role: 'admin' },
  name: 'only_one_admin',
});

export const User = mongoose.model('User', userSchema);
