import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import GatePass from './models/GatePass.js';

await mongoose.connect(process.env.MONGODB_URI);
const demo = [
  { name: 'Demo Hosteller', username: 'student', password: 'student123', role: 'hosteller', roomNo: 'A-101', studentId: 'STU001', phone: '9876543210', email: 'student@example.com', course: 'B.Tech CSE', department: 'Computer Science', year: '3rd Year', parentName: 'Parent Name', parentPhone: '9876500000', address: 'Demo Address' },
  { name: 'Demo Warden', username: 'warden', password: 'warden123', role: 'warden' },
  { name: 'Demo HOD', username: 'hod', password: 'hod123', role: 'hod' },
  { name: 'Demo Principal', username: 'principal', password: 'principal123', role: 'principal' },
  { name: 'Demo Security', username: 'security', password: 'security123', role: 'security' }
];
for (const item of demo) {
  const passwordHash = await bcrypt.hash(item.password, 12);
  const { password, ...data } = item;
  await User.updateOne({ username: data.username }, { $set: { ...data, passwordHash } }, { upsert: true });
}
const student = await User.findOne({ username: 'student' });
if (await GatePass.countDocuments() === 0) {
  await GatePass.create({
    hosteller: student._id, reason: 'Demo family visit', destination: 'Home',
    outTime: new Date(Date.now() + 86400000), expectedReturn: new Date(Date.now() + 172800000)
  });
}
console.log('Demo accounts seeded.');
await mongoose.disconnect();
