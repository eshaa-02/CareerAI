/**
 * AI Resume Matching Service
 *
 * Produces a deterministic, explainable match score between a candidate
 * profile and a job posting based on:
 *  - Skill overlap (weighted highest)
 *  - Experience level alignment
 *  - Education presence
 *  - Desired title similarity
 *
 * This is a rules-based scoring engine (no external API dependency),
 * designed to be swapped for an LLM-based matcher later without changing
 * its calling contract: matchCandidateToJob(candidateProfile, job) => result
 */

const normalize = (str = '') =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s+#.]/g, '');

const EXPERIENCE_RANK = {
  entry: 1,
  junior: 2,
  mid: 3,
  senior: 4,
  lead: 5,
  executive: 6,
};

function skillOverlap(candidateSkills = [], jobSkills = []) {
  const candSet = new Set(candidateSkills.map(normalize));
  const jobSet = jobSkills.map(normalize);

  const matched = [];
  const missing = [];

  jobSet.forEach((skill, idx) => {
    if (candSet.has(skill)) {
      matched.push(jobSkills[idx]);
    } else {
      missing.push(jobSkills[idx]);
    }
  });

  return { matched, missing };
}

function experienceScore(candidateExperienceYears, jobExperienceLevel) {
  // Approximate years-of-experience buckets mapped to job levels
  const bucket =
    candidateExperienceYears >= 12
      ? 'executive'
      : candidateExperienceYears >= 8
      ? 'lead'
      : candidateExperienceYears >= 5
      ? 'senior'
      : candidateExperienceYears >= 2
      ? 'mid'
      : candidateExperienceYears >= 1
      ? 'junior'
      : 'entry';

  const candRank = EXPERIENCE_RANK[bucket] || 1;
  const jobRank = EXPERIENCE_RANK[jobExperienceLevel] || 1;
  const diff = Math.abs(candRank - jobRank);

  if (diff === 0) return 100;
  if (diff === 1) return 75;
  if (diff === 2) return 45;
  return 20;
}

function estimateYearsOfExperience(experienceEntries = []) {
  let totalMonths = 0;
  const now = new Date();

  experienceEntries.forEach((exp) => {
    const start = exp.startDate ? new Date(exp.startDate) : null;
    const end = exp.currentlyWorking
      ? now
      : exp.endDate
      ? new Date(exp.endDate)
      : null;
    if (start && end && end > start) {
      totalMonths +=
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
    }
  });

  return Math.round((totalMonths / 12) * 10) / 10;
}

function buildRecommendation(missingSkills, matchScore) {
  if (missingSkills.length === 0 && matchScore >= 85) {
    return 'Excellent fit — your profile strongly aligns with this role. Consider applying today.';
  }
  if (missingSkills.length > 0) {
    const top = missingSkills.slice(0, 3).join(', ');
    return `Improve your chances by strengthening: ${top}. Adding these to your skill set will raise your match score.`;
  }
  if (matchScore < 50) {
    return 'This role may require more experience than your current profile shows. Consider roles at a closer experience level.';
  }
  return 'Good overall fit. Tailor your cover letter to highlight your matched skills.';
}

function matchCandidateToJob(candidateProfile, job) {
  const candidateSkills = candidateProfile.skills || [];
  const jobSkills = job.skills || [];

  const { matched, missing } = skillOverlap(candidateSkills, jobSkills);
  const skillMatchPercent =
    jobSkills.length > 0 ? (matched.length / jobSkills.length) * 100 : 50;

  const yearsExp = estimateYearsOfExperience(candidateProfile.experience);
  const expScore = experienceScore(yearsExp, job.experience);

  const educationScore =
    candidateProfile.education && candidateProfile.education.length > 0
      ? 100
      : 40;

  // Weighted final score: skills matter most for job-fit
  const finalScore = Math.round(
    skillMatchPercent * 0.6 + expScore * 0.3 + educationScore * 0.1
  );

  const clampedScore = Math.max(0, Math.min(100, finalScore));

  return {
    matchScore: clampedScore,
    matchedSkills: matched,
    missingSkills: missing,
    yearsOfExperience: yearsExp,
    recommendation: buildRecommendation(missing, clampedScore),
  };
}

module.exports = { matchCandidateToJob, estimateYearsOfExperience };
