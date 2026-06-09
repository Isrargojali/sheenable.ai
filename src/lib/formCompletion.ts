/**
 * Calculate profile completion and identify missing fields
 */

export interface CompletionStats {
  percentage: number;
  totalChecks: number;
  completedChecks: number;
  missingFields: string[];
}

export function calculateCompletion(data: {
  firstName: string;
  lastName: string;
  title: string;
  summary: string;
  phone: string;
  location: string;
  skills: string[];
  linkedin?: string;
  portfolio?: string;
  education: { degree: string | null; institution: string | null }[];
  experience: { title: string | null; company: string | null }[];
}): CompletionStats {
  const checks = [
    { name: "First Name", value: !!data.firstName },
    { name: "Last Name", value: !!data.lastName },
    { name: "Professional Title", value: !!data.title },
    { name: "Professional Summary", value: !!data.summary },
    { name: "Phone", value: !!data.phone },
    { name: "Location", value: !!data.location },
    { name: "Skills", value: (data.skills?.length ?? 0) > 0 },
    { name: "LinkedIn", value: !!data.linkedin },
    { name: "Portfolio", value: !!data.portfolio },
    { name: "Education", value: data.education?.some(e => e.degree || e.institution) ?? false },
    { name: "Experience", value: data.experience?.some(e => e.title || e.company) ?? false },
  ];

  const completedChecks = checks.filter(c => c.value).length;
  const percentage = Math.round((completedChecks / checks.length) * 100);
  const missingFields = checks.filter(c => !c.value).map(c => c.name);

  return {
    percentage,
    totalChecks: checks.length,
    completedChecks,
    missingFields,
  };
}

export function getPrimaryMissingField(missingFields: string[]): string {
  // Return the first truly critical field that's missing
  const criticalFields = ["First Name", "Last Name", "Professional Title", "Phone"];
  for (const field of criticalFields) {
    if (missingFields.includes(field)) {
      return field;
    }
  }
  return missingFields[0] || "Profile complete!";
}
