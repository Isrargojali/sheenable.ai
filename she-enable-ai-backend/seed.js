// seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

if (process.env.NODE_ENV === 'production') {
  console.error('❌ Cannot run seed script in production environment!');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./src/models/User');
  const CandidateProfile = require('./src/models/CandidateProfile');
  const EmployerProfile = require('./src/models/EmployerProfile');

  await User.deleteMany({ email: { $in: ['ayesha@test.com', 'hr@techflow.com', 'admin@SheEnableAI.pk'] } });

  const candidate = await User.create({
    firstName: 'Ayesha', lastName: 'Khan',
    email: 'ayesha@test.com', password: 'Test@1234',
    role: 'CANDIDATE', isVerified: true, isActive: true,
  });
  await CandidateProfile.create({ userId: candidate._id });

  const employer = await User.create({
    firstName: 'HR', lastName: 'TechFlow',
    email: 'hr@techflow.com', password: 'Test@1234',
    role: 'EMPLOYER', isVerified: true, isActive: true,
  });
  await EmployerProfile.create({ userId: employer._id, companyName: 'TechFlow Inc.' });

  await User.create({
    firstName: 'Admin', lastName: 'User',
    email: 'admin@SheEnableAI.pk', password: 'Admin@1234',
    role: 'ADMIN', isVerified: true, isActive: true,
  });

  console.log('✅ Demo users created!');
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });