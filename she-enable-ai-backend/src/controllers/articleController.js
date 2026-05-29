const BlogArticle = require('../models/BlogArticle');

// Rich, brand-aligned seed articles for SheEnableAI
const SEED_ARTICLES = [
  {
    title: '5 Strategies for Women Navigating Tech Salary Negotiations in Pakistan',
    slug: 'navigating-tech-salary-negotiations-pakistan',
    excerpt: 'Negotiating your salary can be daunting, but with the right data and mindset, you can close the gender pay gap. Here are five practical tips tailored for Pakistani developers.',
    content: `
      <p>Negotiating your salary is one of the most critical inflection points in your career. Studies show that women are less likely to initiate salary negotiations than men, which contributes directly to the persistent gender pay gap in Pakistan's tech sector.</p>
      
      <h3>1. Know the Local Market Benchmarks</h3>
      <p>Before entering any negotiation, research the standards for your role in major Pakistani tech hubs like Karachi, Lahore, and Islamabad. Standard software engineer roles range from PKR 80K to PKR 250K+ depending on experience. Don't rely on global averages; know the regional value of your stack.</p>

      <h3>2. Highlight Your Quantifiable Contributions</h3>
      <p>Do not speak in generalities. When negotiating, present concrete data points. For example: "I optimized our database query times by 40%, which decreased server costs by 15%." Or: "I led the development of our React-based dashboard, which increased active daily user engagement by 20%." Metrics are hard to argue with.</p>

      <h3>3. Practice Confident Communication</h3>
      <p>Practice your pitch with a peer or in front of a mirror. Use confident, direct language. Avoid qualifiers like "I feel" or "I think." Instead, say "Given my experience leading team sprints and my expertise in node.js backend design, a salary of PKR 220,000 is aligned with the value I will bring."</p>

      <h3>4. Don't Overlook Benefits and Flexibility</h3>
      <p>Remember that compensation is a bundle. If the employer has a strict budget cap on the base salary, negotiate for other high-value perks. Ask for remote work flexibility, paid wellness leave, health insurance matching for family members, or educational allowances for professional certifications.</p>

      <h3>5. Always Get the Final Offer in Writing</h3>
      <p>Once you reach an agreement, ensure the complete offer details—including base salary, allowance breakdowns, expected working hours, and review cycles—are documented in an official letter. Verbal agreements do not protect your future growth.</p>
    `,
    category: 'CAREER_ADVICE',
    author: {
      name: 'Dr. Fatima Rizwan',
      role: 'DEI Advisor & Tech Pioneer',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
    },
    coverUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
    readTime: 6,
    tags: ['Negotiation', 'Salary', 'Career Growth', 'Women In Tech'],
    isFeatured: true
  },
  {
    title: 'From Junior Dev to Team Lead: A Roadmap for Pakistani Engineers',
    slug: 'junior-dev-to-team-lead-roadmap',
    excerpt: 'Transitioning from writing code to guiding people requires a complete mindset shift. Explore the technical and soft skill blueprints needed to step into tech leadership.',
    content: `
      <p>Moving from an individual contributor to a leadership role is a massive career milestone. Many software engineers make the mistake of thinking that leadership is simply about being the best coder in the room. In reality, it requires a complete transformation of your daily focus.</p>

      <h3>Shift from "How can I solve this?" to "How can my team solve this?"</h3>
      <p>As a senior developer, your success was measured by your individual commits. As a lead, your success is measured by the velocity, quality, and morale of your team. Learn the art of delegation, conduct supportive code reviews, and act as a shield to protect your team from scope creep.</p>

      <h3>Master Stakeholder Communication</h3>
      <p>To lead effectively, you must learn to translate technical complexity into business value. When discussing issues with product managers or clients, explain the 'why' in terms of user experience, feature delivery times, and product stability rather than just database indexes or stack traces.</p>
    `,
    category: 'CAREER_ADVICE',
    author: {
      name: 'Aisha Chaudhry',
      role: 'VP of Engineering at SheEnableAI',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'
    },
    coverUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
    readTime: 8,
    tags: ['Leadership', 'Career Guide', 'Tech Management'],
    isFeatured: false
  },
  {
    title: 'Introducing SheEnableAI 2.0: Pakistan\'s Premier AI Hiring Platform',
    slug: 'introducing-sheenableai-two-point-zero',
    excerpt: 'We are thrilled to launch SheEnableAI 2.0! Discover our new features, including automated AI candidate-job matching, verified salary guides, and active mentoring systems.',
    content: `
      <p>Today marks an incredible milestone for the SheEnableAI team and the entire Pakistani tech community. We have officially launched SheEnableAI 2.0—a platform built from the ground up to empower women professionals and help inclusive employers discover extraordinary talent.</p>

      <h3>What\'s New in SheEnableAI 2.0?</h3>
      <ul>
        <li><strong>AI Matching Engine:</strong> Our semantic matching models analyze resumes and job specifications to deliver instant, unbiased suitability scores.</li>
        <li><strong>Interactive CV Builder:</strong> Build a highly optimized, single-column ATS-friendly CV dynamically.</li>
        <li><strong>DEI Inclusion Resources:</strong> Check job descriptions with our real-time Gender Decoder to attract diverse talent.</li>
        <li><strong>Salary Transparency Index:</strong> Pakistan's first interactive salary explorer to track market wages and support pay equality.</li>
      </ul>
    `,
    category: 'COMPANY_BLOG',
    author: {
      name: 'Mumtaz Kakakhail',
      role: 'CEO & Founder, SheEnableAI',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    },
    coverUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
    readTime: 4,
    tags: ['Product Update', 'SheEnableAI', 'Milestone'],
    isFeatured: true
  },
  {
    title: 'Closing the Gender Pay Gap: Insights from Our 2026 Salary Report',
    slug: 'closing-gender-pay-gap-2026-report',
    excerpt: 'Our latest research reveals a 15% gender pay gap in Pakistan\'s software engineering roles. Learn about the root causes and actionable solutions for hiring managers.',
    content: `
      <p>At SheEnableAI, we believe that transparency is the most powerful tool to drive equity. Our newly released 2026 Salary Transparency Report analyzes crowdsourced pay records across tech roles in Lahore, Karachi, and Islamabad to establish an empirical benchmark of wage disparity.</p>
      
      <h3>Key Discoveries</h3>
      <p>The average female software developer in Pakistan earns 15.4% less than their male counterparts of equal experience. The gap is narrowest in junior roles (approx. 5%) but widens significantly at the senior level (up to 22%), primarily due to a lack of negotiation support and unconscious bias in leadership tracks.</p>
    `,
    category: 'DEI_RESEARCH',
    author: {
      name: 'Zainab Mahmood',
      role: 'Lead Research Analyst',
      avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150'
    },
    coverUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800',
    readTime: 10,
    tags: ['DEI', 'Salary Gap', 'Research', 'Pakistan Tech'],
    isFeatured: false
  }
];

// Seed Helper
async function checkAndSeedArticles() {
  try {
    const count = await BlogArticle.countDocuments();
    if (count === 0) {
      await BlogArticle.create(SEED_ARTICLES);
      console.log('🌱 Successfully seeded BlogArticle collection!');
    }
  } catch (err) {
    console.error('⚠️ Seeding BlogArticles failed:', err.message);
  }
}

// Check on startup
setTimeout(checkAndSeedArticles, 2000);

// Controllers
exports.getArticles = async (req, res, next) => {
  try {
    const { category, q } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    if (q) {
      query.$text = { $search: q };
    }

    const articles = await BlogArticle.find(query).sort({ isFeatured: -1, createdAt: -1 });
    res.status(200).json({ success: true, data: articles });
  } catch (err) {
    next(err);
  }
};

exports.getArticleBySlug = async (req, res, next) => {
  try {
    const article = await BlogArticle.findOne({ slug: req.params.slug });
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }
    res.status(200).json({ success: true, data: article });
  } catch (err) {
    next(err);
  }
};
