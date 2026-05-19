const { success, error } = require('../utils/apiResponse');

const generateCV = async (req, res, next) => {
  try {
    const { notes } = req.body;
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock AI response
    const generatedCv = {
      name: (req.user.firstName || 'Candidate') + ' ' + (req.user.lastName || ''),
      title: "Senior Professional",
      summary: notes ? `AI Generated Summary based on: ${notes.substring(0, 100)}... A highly skilled professional with a proven track record of delivering high-quality results.` : "A highly skilled professional with experience in modern technologies. Proven track record of delivering high-quality solutions and leading teams to success.",
      skills: ["React", "TypeScript", "Node.js", "MongoDB", "AWS", "Communication", "Leadership"],
      experience: [
        {
          title: "Senior Role",
          company: "Tech Company",
          from: "2020",
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
          year: "2018"
        }
      ]
    };

    return success(res, generatedCv);
  } catch (err) { next(err); }
};

module.exports = { generateCV };
