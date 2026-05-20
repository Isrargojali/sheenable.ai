const CandidateProfile = require('../models/CandidateProfile');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');

const generateCV = async (req, res, next) => {
  try {
    const { notes, prompt } = req.body;
    const input = notes || prompt;

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Fetch the candidate profile and user details
    const profile = await CandidateProfile.findOne({ userId: req.user.id })
      .populate('userId', 'firstName lastName email avatarUrl phone');

    if (!profile) {
      // Fallback if no profile is found at all
      const name = `${req.user.firstName || 'Candidate'} ${req.user.lastName || ''}`.trim();
      const generatedCv = {
        name,
        title: "Senior Professional",
        summary: input 
          ? `AI Generated Summary based on: ${input.substring(0, 100)}... A highly skilled professional with a proven track record of delivering high-quality results.`
          : "A highly skilled professional with experience in modern technologies. Proven track record of delivering high-quality solutions and leading teams to success.",
        skills: ["React", "TypeScript", "Node.js", "MongoDB", "AWS", "Communication", "Leadership"],
        experience: [
          {
            title: "Senior Role",
            company: "Tech Company",
            from: "2022",
            to: "Present",
            bullets: [
              "Led a team of professionals to ship a highly scalable product.",
              "Architected solutions that improved efficiency.",
              "Reduced processing times by 40% through optimization."
            ]
          }
        ],
        education: [
          {
            degree: "Bachelor's Degree",
            school: "University",
            year: "2020"
          }
        ],
        avatarUrl: req.user.avatarUrl || '',
        email: req.user.email || '',
        phone: req.user.phone || ''
      };
      return success(res, generatedCv);
    }

    const firstName = req.user.firstName || (profile.userId?.firstName) || 'Candidate';
    const lastName = req.user.lastName || (profile.userId?.lastName) || '';
    const name = `${firstName} ${lastName}`.trim();
    const email = req.user.email || (profile.userId?.email) || '';
    const phone = req.user.phone || (profile.userId?.phone) || '';
    const avatarUrl = req.user.avatarUrl || (profile.userId?.avatarUrl) || '';

    // Extracted details from candidate profile database records
    const profileSkills = profile.skills?.map(s => s.name) || [];
    
    const profileEducation = profile.education?.map(ed => ({
      degree: ed.field ? `${ed.degree} in ${ed.field}` : ed.degree,
      school: ed.institution || 'University',
      year: ed.year ? String(ed.year) : 'N/A'
    })) || [];

    const profileExperience = profile.experience?.map(exp => {
      // Form bullets from description
      let bullets = [];
      if (exp.description) {
        bullets = exp.description
          .split(/[\n•\-]+/g)
          .map(b => b.trim())
          .filter(Boolean);
      }
      if (bullets.length === 0) {
        bullets = [exp.description || 'Delivered key engineering components and optimized system workflows.'];
      }

      const formatDate = (d) => {
        if (!d) return 'N/A';
        const dateObj = new Date(d);
        if (isNaN(dateObj.getTime())) return 'N/A';
        return dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      };

      return {
        title: exp.title || 'Software Engineer',
        company: exp.company || 'Tech Solutions',
        from: formatDate(exp.from),
        to: exp.current ? 'Present' : formatDate(exp.to),
        bullets
      };
    }) || [];

    // Fallbacks if candidate profile arrays are empty
    const finalSkills = profileSkills.length > 0 
      ? profileSkills 
      : ["React", "TypeScript", "Node.js", "MongoDB", "AWS", "Communication", "Leadership"];

    const finalEducation = profileEducation.length > 0
      ? profileEducation
      : [{ degree: "Bachelor of Science in Computer Science", school: "LUMS", year: "2021" }];

    const finalExperience = profileExperience.length > 0
      ? profileExperience
      : [
          {
            title: "Software Engineer",
            company: "Tech Solutions Ltd",
            from: "Jan 2022",
            to: "Present",
            bullets: [
              "Led frontend feature development using modern React, TypeScript, and TailwindCSS.",
              "Architected robust, high-performance database schemas in MongoDB.",
              "Collaborated with cross-functional teams to integrate AI models and optimize site performance."
            ]
          }
        ];

    // Combine notes/prompt + profile bios for a professional summary
    let summaryParts = [];
    if (profile.bio) {
      summaryParts.push(profile.bio);
    }
    if (input) {
      summaryParts.push(`AI-Synthesized Context: ${input}.`);
    }
    summaryParts.push("A driven and detail-oriented professional with a strong track record of designing, building, and deploying scalable software systems. Experienced in working in agile teams and leveraging AI capabilities to solve complex engineering challenges.");
    
    const summary = summaryParts.join(' ').replace(/\s+/g, ' ').trim();
    const title = profile.title || (finalExperience[0]?.title ? `${finalExperience[0].title}` : 'Senior Professional');

    const generatedCv = {
      name,
      title,
      summary,
      skills: finalSkills,
      experience: finalExperience,
      education: finalEducation,
      avatarUrl,
      email,
      phone
    };

    return success(res, generatedCv);
  } catch (err) { next(err); }
};

module.exports = { generateCV };
