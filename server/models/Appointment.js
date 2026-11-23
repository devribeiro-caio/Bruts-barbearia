import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  serviceName: { type: String, required: true, trim: true, maxlength: 80 },
  priceCents: { type: Number, required: true, min: 0 },
  durationMinutes: { type: Number, required: true, min: 30 },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  slotStarts: [{ type: Date, required: true }],
  occupiesSlot: { type: Boolean, default: true, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending', required: true },
  customerNotes: { type: String, trim: true, maxlength: 500, default: '' },
  adminNotes: { type: String, trim: true, maxlength: 500, default: '' },
}, { timestamps: true });

appointmentSchema.index({ startAt: 1, status: 1 });
appointmentSchema.index({ customerId: 1, startAt: -1 });
// A unique multikey index reserves every 30-minute segment atomically.
// Rejected appointments leave the index through occupiesSlot=false.
appointmentSchema.index({ slotStarts: 1 }, {
  unique: true,
  partialFilterExpression: { occupiesSlot: true },
  name: 'unique_active_appointment_slots',
});

export const Appointment = mongoose.model('Appointment', appointmentSchema);
