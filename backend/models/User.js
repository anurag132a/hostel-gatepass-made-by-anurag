import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['hosteller', 'principal', 'hod', 'warden', 'security'], required: true },
  roomNo: String,
  studentId: { type: String, unique: true, sparse: true },
  phone: String,
  email: String,
  course: String,
  department: String,
  year: String,
  parentName: String,
  parentPhone: String,
  address: String
}, { timestamps: true });

export default mongoose.model('User', userSchema);
