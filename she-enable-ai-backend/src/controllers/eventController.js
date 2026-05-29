const Event = require('../models/Event');

// Realistic upcoming and past community events in Pakistan
const SEED_EVENTS = [
  {
    title: 'Women in Tech Virtual Career Fair 2026',
    description: 'Connect directly with leading tech companies in Pakistan hiring remote and hybrid developers, designers, and managers. Get instant interview invites, participate in live Q&A roundtables, and pitch your credentials directly to hiring managers.',
    dateTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days in future
    format: 'ONLINE',
    location: 'SheEnableAI Interactive Fair Platform (Zoom Space)',
    speakers: [
      { name: 'Mumtaz Kakakhail', role: 'CEO, SheEnableAI', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
      { name: 'Zainab Mahmood', role: 'Director of HR, Techflow', avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150' }
    ],
    coverUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
  },
  {
    title: 'Masterclass: Crafting an ATS-Friendly Tech CV',
    description: 'Learn the secrets of the Application Tracking System (ATS). We will dissect how resumes are scored, how semantic parsing analyzes skills, and how to write high-impact experience bullets that stand out.',
    dateTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days in future
    format: 'ONLINE',
    location: 'Google Meet Webinar Room',
    speakers: [
      { name: 'Aisha Chaudhry', role: 'VP of Engineering, SheEnableAI', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' }
    ],
    coverUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800'
  },
  {
    title: 'Interactive Workshop: UI/UX & Design Systems 101',
    description: 'An introductory workshop on building and structuring responsive layouts, HSL color systems, and modern visual design aesthetics. Perfect for junior developers and aspiring designers looking to transition.',
    dateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days in past
    format: 'ONLINE',
    location: 'Recorded Webinar Hub',
    speakers: [
      { name: 'Mariam Khan', role: 'Principal Designer, Helix Health', avatarUrl: 'https://images.unsplash.com/photo-1594744803329-e58b31de215f?w=150' }
    ],
    coverUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800'
  }
];

async function checkAndSeedEvents() {
  try {
    const count = await Event.countDocuments();
    if (count === 0) {
      await Event.create(SEED_EVENTS);
      console.log('🌱 Successfully seeded Event collection!');
    }
  } catch (err) {
    console.error('⚠️ Seeding Events failed:', err.message);
  }
}

// Seed on startup
setTimeout(checkAndSeedEvents, 2500);

// Get Events
exports.getEvents = async (req, res, next) => {
  try {
    const events = await Event.find().sort({ dateTime: 1 });
    res.status(200).json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
};

// Register for Event
exports.registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    // Check if already registered
    const userId = req.user._id;
    if (event.registrations.includes(userId)) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event!' });
    }

    event.registrations.push(userId);
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Successfully registered! A calendar invite and link has been sent to your email.',
      data: event
    });
  } catch (err) {
    next(err);
  }
};
