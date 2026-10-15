import mongoose from 'mongoose';

const gatePassSchema = new mongoose.Schema({
  hosteller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reason: { type: String, required: true, trim: true, maxlength: 500 },
  destination: { type: String, required: true, trim: true, maxlength: 200 },
  outTime: { type: Date, required: true },
  expectedReturn: { type: Date, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'OUT', 'COMPLETED'], default: 'PENDING', index: true },
  approvals: {
    principal: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    hod: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    warden: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' }
  },
  exitCode: { type: String, default: null },
  entryCode: { type: String, default: null },
  actualExit: { type: Date, default: null },
  actualEntry: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('GatePass', gatePassSchema);
