const MentorProfile = require('../models/MentorProfile');
const User = require('../models/User');

const SEED_MENTORS = [
  {
    firstName: 'Sara',
    lastName: 'Abbasi',
    email: 'sara.abbasi@atlasbank.pk',
    password: 'Password123!',
    role: 'ADMIN',
    title: 'Director of Engineering',
    company: 'Atlas Bank',
    expertise: ['System Architecture', 'Backend Engineering', 'Scalability', 'Career Transition'],
    bio: 'Sara has over 12 years of core banking backend experience. She specializes in building high-throughput payment systems and is passionate about helping women transition into senior architectural roles.',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    availability: { days: ['Tuesday', 'Thursday'], hours: '6:00 PM - 8:00 PM' }
  },
  {
    firstName: 'Mariam',
    lastName: 'Khan',
    email: 'mariam.k@helixhealth.com',
    password: 'Password123!',
    role: 'EMPLOYER',
    title: 'Principal Product Designer',
    company: 'Helix Health',
    expertise: ['UX Research', 'Design Systems', 'HCD', 'Product Strategy'],
    bio: 'Mariam guides product design teams in medical technologies. She loves coaching young designers on portfolio structures, interaction flows, and conducting user research in emerging markets.',
    avatarUrl: 'https://images.unsplash.com/photo-1594744803329-e58b31de215f?w=150',
    availability: { days: ['Monday', 'Wednesday'], hours: '5:00 PM - 7:00 PM' }
  },
  {
    firstName: 'Amna',
    lastName: 'Qureshi',
    email: 'amna.q@techflow.io',
    password: 'Password123!',
    role: 'EMPLOYER',
    title: 'Lead Frontend Architect',
    company: 'Techflow',
    expertise: ['React', 'TypeScript', 'CSS/Tailwind', 'Performance Optimization'],
    bio: 'Amna is a frontend specialist who loves clean code, fast repaints, and semantic accessibility. She guides women in coding bootcamps on technical interviewing and UI excellence.',
    avatarUrl: 'https://images.unsplash.com/photo-1534751516642-a131ffd473fd?w=150',
    availability: { days: ['Saturday'], hours: '10:00 AM - 1:00 PM' }
  }
];

async function checkAndSeedMentors() {
  try {
    const count = await MentorProfile.countDocuments();
    if (count === 0) {
      for (const item of SEED_MENTORS) {
        // Create user
        let user = await User.findOne({ email: item.email });
        if (!user) {
          user = await User.create({
            firstName: item.firstName,
            lastName: item.lastName,
            email: item.email,
            password: item.password,
            role: item.role,
            gender: 'female',
            isVerified: true
          });
        }
        
        // Create mentor profile
        await MentorProfile.create({
          userId: user._id,
          title: item.title,
          company: item.company,
          expertise: item.expertise,
          bio: item.bio,
          avatarUrl: item.avatarUrl,
          availability: item.availability
        });
      }
      console.log('🌱 Successfully seeded MentorProfile collection!');
    }
  } catch (err) {
    console.error('⚠️ Seeding MentorProfiles failed:', err.message);
  }
}

// Seed on startup
setTimeout(checkAndSeedMentors, 2500);

// Get Mentors
exports.getMentors = async (req, res, next) => {
  try {
    const { expertise, q } = req.query;
    const query = {};

    if (expertise) {
      query.expertise = { $in: [expertise] };
    }

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ];
    }

    const mentors = await MentorProfile.find(query).populate('userId', 'firstName lastName email');
    res.status(200).json({ success: true, data: mentors });
  } catch (err) {
    next(err);
  }
};

// Request session
exports.bookMentorSession = async (req, res, next) => {
  try {
    const mentor = await MentorProfile.findById(req.params.id);
    if (!mentor) {
      return res.status(404).json({ success: false, message: 'Mentor profile not found' });
    }
    
    mentor.bookingsCount++;
    await mentor.save();

    res.status(200).json({
      success: true,
      message: 'Booking request sent successfully! The mentor will contact you via email shortly.',
      data: mentor
    });
  } catch (err) {
    next(err);
  }
};
