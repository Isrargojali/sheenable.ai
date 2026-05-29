const SalaryReport = require('../models/SalaryReport');

// Realistic seeds representing tech salaries in PKR for Pakistani hubs
const SEED_SALARIES = [
  { role: 'Senior Product Manager', industry: 'Fintech', experienceYears: 8, city: 'Karachi', salaryPKR: 250000, gender: 'FEMALE', isVerified: true },
  { role: 'Senior Product Manager', industry: 'E-commerce', experienceYears: 7, city: 'Lahore', salaryPKR: 240000, gender: 'MALE', isVerified: true },
  
  { role: 'Frontend Engineer', industry: 'SaaS', experienceYears: 4, city: 'Lahore', salaryPKR: 180000, gender: 'FEMALE', isVerified: true },
  { role: 'Frontend Engineer', industry: 'Healthtech', experienceYears: 3, city: 'Karachi', salaryPKR: 165000, gender: 'FEMALE', isVerified: true },
  { role: 'Frontend Engineer', industry: 'Fintech', experienceYears: 5, city: 'Islamabad', salaryPKR: 195000, gender: 'MALE', isVerified: true },
  
  { role: 'UX Lead', industry: 'Enterprise Softwares', experienceYears: 6, city: 'Islamabad', salaryPKR: 220000, gender: 'FEMALE', isVerified: true },
  { role: 'UX Lead', industry: 'Agency', experienceYears: 7, city: 'Karachi', salaryPKR: 235000, gender: 'MALE', isVerified: true },
  
  { role: 'Data Analyst', industry: 'Ride Hailing', experienceYears: 2, city: 'Karachi', salaryPKR: 140000, gender: 'FEMALE', isVerified: true },
  { role: 'Data Analyst', industry: 'Logistics', experienceYears: 3, city: 'Lahore', salaryPKR: 150000, gender: 'FEMALE', isVerified: true },
  { role: 'Data Analyst', industry: 'Retail', experienceYears: 2, city: 'Islamabad', salaryPKR: 135000, gender: 'MALE', isVerified: true },
  
  { role: 'Content Strategist', industry: 'Marketing', experienceYears: 3, city: 'Lahore', salaryPKR: 130000, gender: 'FEMALE', isVerified: true },
  
  { role: 'HR Business Partner', industry: 'Tech Monolith', experienceYears: 5, city: 'Karachi', salaryPKR: 200000, gender: 'FEMALE', isVerified: true },
  
  { role: 'Backend Engineer', industry: 'Blockchain', experienceYears: 5, city: 'Karachi', salaryPKR: 210000, gender: 'FEMALE', isVerified: true },
  { role: 'Backend Engineer', industry: 'SaaS', experienceYears: 6, city: 'Lahore', salaryPKR: 225000, gender: 'MALE', isVerified: true }
];

async function checkAndSeedSalaries() {
  try {
    const count = await SalaryReport.countDocuments();
    if (count === 0) {
      await SalaryReport.create(SEED_SALARIES);
      console.log('🌱 Successfully seeded SalaryReport collection!');
    }
  } catch (err) {
    console.error('⚠️ Seeding SalaryReports failed:', err.message);
  }
}

// Seed on startup
setTimeout(checkAndSeedSalaries, 2000);

// Get salary guide aggregates & records
exports.getSalaryStats = async (req, res, next) => {
  try {
    const reports = await SalaryReport.find({ isVerified: true }).sort({ createdAt: -1 });
    
    // Group and aggregate statistics programmatically
    const statsByRole = {};
    
    reports.forEach(r => {
      const role = r.role;
      if (!statsByRole[role]) {
        statsByRole[role] = {
          role,
          count: 0,
          salaries: [],
          femaleSalaries: [],
          maleSalaries: [],
          cities: new Set(),
          experienceSum: 0
        };
      }
      
      statsByRole[role].count++;
      statsByRole[role].salaries.push(r.salaryPKR);
      statsByRole[role].experienceSum += r.experienceYears;
      statsByRole[role].cities.add(r.city);
      
      if (r.gender === 'FEMALE') {
        statsByRole[role].femaleSalaries.push(r.salaryPKR);
      } else if (r.gender === 'MALE') {
        statsByRole[role].maleSalaries.push(r.salaryPKR);
      }
    });

    const formattedStats = Object.values(statsByRole).map(s => {
      const sorted = s.salaries.sort((a,b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const avgExp = Math.round(s.experienceSum / s.count * 10) / 10;
      
      // Calculate pay parity gap
      const femaleSorted = s.femaleSalaries.sort((a,b) => a - b);
      const maleSorted = s.maleSalaries.sort((a,b) => a - b);
      const femaleMed = femaleSorted.length > 0 ? femaleSorted[Math.floor(femaleSorted.length / 2)] : median;
      const maleMed = maleSorted.length > 0 ? maleSorted[Math.floor(maleSorted.length / 2)] : median;
      const ratio = maleMed > 0 ? Math.round((femaleMed / maleMed) * 100) : 100;

      return {
        role: s.role,
        count: s.count,
        min,
        median,
        max,
        avgExperience: avgExp,
        cities: Array.from(s.cities),
        femaleMedian: femaleMed,
        maleMedian: maleMed,
        parityRatio: ratio
      };
    });

    res.status(200).json({ success: true, data: formattedStats, raw: reports });
  } catch (err) {
    next(err);
  }
};

// Create anonymous salary contribution
exports.createSalaryReport = async (req, res, next) => {
  try {
    const { role, industry, experienceYears, city, salaryPKR, gender } = req.body;
    
    // Auto-approve reports from signed-in users for quick indexing, but mark clean
    const report = await SalaryReport.create({
      role,
      industry,
      experienceYears: Number(experienceYears),
      city,
      salaryPKR: Number(salaryPKR),
      gender: gender || 'FEMALE',
      isVerified: true // Auto-verify in development/mock settings
    });

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};
