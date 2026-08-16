/**
 * CareerAI Matching Service
 *
 * Two-stage matching:
 * 1. Domain relevance filter
 * 2. Skill + experience + education scoring
 */

const normalize = (str = '') =>
  String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s+#.]/g, ' ');

const EXPERIENCE_RANK = {
  entry: 1,
  junior: 2,
  mid: 3,
  senior: 4,
  lead: 5,
  executive: 6,
};

/*
|--------------------------------------------------------------------------
| Career domains
|--------------------------------------------------------------------------
*/

const DOMAIN_KEYWORDS = {
  software: [
    'software',
    'developer',
    'development',
    'programming',
    'engineer',
    'engineering',
    'full stack',
    'fullstack',
    'frontend',
    'front end',
    'backend',
    'back end',
    'web developer',
    'web development',
    'mobile developer',
    'app developer',
    'react',
    'nextjs',
    'next js',
    'node',
    'nodejs',
    'javascript',
    'typescript',
    'python',
    'java',
    'c++',
    'php',
    'laravel',
    'django',
    'flask',
    'express',
    'mongodb',
    'sql',
    'mysql',
    'postgresql',
    'database',
    'devops',
    'cloud',
    'aws',
    'azure',
    'docker',
    'kubernetes',
    'cybersecurity',
    'cyber security',
    'qa',
    'quality assurance',
    'data engineer',
    'machine learning',
    'artificial intelligence',
    'ai engineer',
  ],

  design: [
    'designer',
    'design',
    'graphic design',
    'graphic designer',
    'ui designer',
    'ux designer',
    'ui ux',
    'ui/ux',
    'product designer',
    'visual designer',
    'figma',
    'adobe',
    'photoshop',
    'illustrator',
    'indesign',
    'canva',
  ],

  fashion: [
    'fashion',
    'fashion design',
    'fashion designer',
    'apparel',
    'garment',
    'textile',
    'textiles',
    'stylist',
    'fashion stylist',
    'couture',
    'merchandising',
    'fashion merchandising',
    'pattern making',
    'pattern maker',
    'sewing',
    'clothing',
  ],

  marketing: [
    'marketing',
    'digital marketing',
    'seo',
    'sem',
    'social media marketing',
    'content marketing',
    'brand marketing',
    'growth marketing',
    'marketing manager',
    'marketing specialist',
    'copywriter',
    'copywriting',
    'content strategist',
    'public relations',
    'pr specialist',
  ],

  sales: [
    'sales',
    'sales representative',
    'sales executive',
    'business development',
    'business development representative',
    'account executive',
    'account manager',
    'sales manager',
    'customer acquisition',
  ],

  finance: [
    'finance',
    'financial',
    'accounting',
    'accountant',
    'bookkeeper',
    'bookkeeping',
    'audit',
    'auditor',
    'tax',
    'investment',
    'banking',
    'financial analyst',
    'accounts',
  ],

  hr: [
    'human resources',
    'human resource',
    'hr',
    'recruiter',
    'recruitment',
    'talent acquisition',
    'talent management',
    'people operations',
    'hr manager',
    'hr specialist',
  ],

  healthcare: [
    'healthcare',
    'health care',
    'medical',
    'doctor',
    'physician',
    'nurse',
    'nursing',
    'pharmacy',
    'pharmacist',
    'clinical',
    'hospital',
    'dentist',
    'dental',
  ],

  legal: [
    'legal',
    'lawyer',
    'attorney',
    'law',
    'paralegal',
    'legal counsel',
    'compliance',
  ],

  education: [
    'teacher',
    'teaching',
    'education',
    'educator',
    'professor',
    'lecturer',
    'tutor',
    'instructor',
    'academic',
  ],

  operations: [
    'operations',
    'operations manager',
    'operations specialist',
    'supply chain',
    'logistics',
    'procurement',
    'warehouse',
    'project manager',
    'project management',
    'product manager',
    'product management',
  ],
};

/*
|--------------------------------------------------------------------------
| Extract domains
|--------------------------------------------------------------------------
*/

function getDomains(text = '') {
  const normalized = normalize(text);
  const domains = new Set();

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const keyword of keywords) {
      const normalizedKeyword = normalize(keyword);

      if (
        normalized === normalizedKeyword ||
        normalized.includes(normalizedKeyword)
      ) {
        domains.add(domain);
        break;
      }
    }
  }

  return [...domains];
}

function getCandidateSearchText(candidateProfile) {
  const experienceText = (candidateProfile.experience || [])
    .map((exp) => `${exp.title || ''} ${exp.description || ''}`)
    .join(' ');

  const educationText = (candidateProfile.education || [])
    .map((edu) => `${edu.degree || ''} ${edu.fieldOfStudy || ''}`)
    .join(' ');

  return [
    candidateProfile.desiredJobTitle || '',
    candidateProfile.headline || '',
    candidateProfile.bio || '',
    ...(candidateProfile.skills || []),
    experienceText,
    educationText,
  ].join(' ');
}

function getJobSearchText(job) {
  return [
    job.title || '',
    job.category || '',
    job.description || '',
    ...(job.skills || []),
    ...(job.requirements || []),
    ...(job.responsibilities || []),
  ].join(' ');
}

function checkDomainRelevance(candidateProfile, job) {
  const candidateText = getCandidateSearchText(candidateProfile);
  const jobText = getJobSearchText(job);

  const candidateDomains = getDomains(candidateText);
  const jobDomains = getDomains(jobText);

  // If neither side has a recognizable domain,
  // don't incorrectly reject the job.
  if (candidateDomains.length === 0 || jobDomains.length === 0) {
    return {
      relevant: true,
      candidateDomains,
      jobDomains,
    };
  }

  const overlap = candidateDomains.filter((domain) =>
    jobDomains.includes(domain)
  );

  return {
    relevant: overlap.length > 0,
    candidateDomains,
    jobDomains,
    matchedDomains: overlap,
  };
}

/*
|--------------------------------------------------------------------------
| Skill matching
|--------------------------------------------------------------------------
*/

function skillOverlap(candidateSkills = [], jobSkills = []) {
  const candidateNormalized = candidateSkills.map(normalize);

  const matched = [];
  const missing = [];

  jobSkills.forEach((jobSkill) => {
    const normalizedJobSkill = normalize(jobSkill);

    const matchedSkill = candidateNormalized.some(
      (candidateSkill) =>
        candidateSkill === normalizedJobSkill ||
        candidateSkill.includes(normalizedJobSkill) ||
        normalizedJobSkill.includes(candidateSkill)
    );

    if (matchedSkill) {
      matched.push(jobSkill);
    } else {
      missing.push(jobSkill);
    }
  });

  return {
    matched,
    missing,
  };
}

/*
|--------------------------------------------------------------------------
| Experience
|--------------------------------------------------------------------------
*/

function experienceScore(candidateExperienceYears, jobExperienceLevel) {
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

/*
|--------------------------------------------------------------------------
| Recommendation
|--------------------------------------------------------------------------
*/

function buildRecommendation(missingSkills, matchScore) {
  if (missingSkills.length === 0 && matchScore >= 85) {
    return 'Excellent fit — your profile strongly aligns with this role. Consider applying today.';
  }

  if (missingSkills.length > 0) {
    const top = missingSkills.slice(0, 3).join(', ');

    return `Improve your chances by strengthening: ${top}.`;
  }

  if (matchScore < 50) {
    return 'This role may require more experience than your current profile shows.';
  }

  return 'Good overall fit. Tailor your application to highlight your matched skills.';
}

/*
|--------------------------------------------------------------------------
| Main matcher
|--------------------------------------------------------------------------
*/

function matchCandidateToJob(candidateProfile, job) {
  const relevance = checkDomainRelevance(candidateProfile, job);

  /*
   * HARD FILTER:
   * Wrong career domain = 0 score.
   */

  if (!relevance.relevant) {
    return {
      matchScore: 0,
      relevant: false,
      matchedSkills: [],
      missingSkills: job.skills || [],
      yearsOfExperience: estimateYearsOfExperience(
        candidateProfile.experience
      ),
      candidateDomains: relevance.candidateDomains,
      jobDomains: relevance.jobDomains,
      matchedDomains: [],
      recommendation:
        'This job is outside your career field and is not recommended for your profile.',
    };
  }

  const candidateSkills = candidateProfile.skills || [];
  const jobSkills = job.skills || [];

  const { matched, missing } = skillOverlap(
    candidateSkills,
    jobSkills
  );

  const skillMatchPercent =
    jobSkills.length > 0
      ? (matched.length / jobSkills.length) * 100
      : 50;

  const yearsExp = estimateYearsOfExperience(
    candidateProfile.experience
  );

  const expScore = experienceScore(
    yearsExp,
    job.experience
  );

  const educationScore =
    candidateProfile.education &&
      candidateProfile.education.length > 0
      ? 100
      : 40;

  const finalScore = Math.round(
    skillMatchPercent * 0.6 +
    expScore * 0.3 +
    educationScore * 0.1
  );

  const clampedScore = Math.max(
    0,
    Math.min(100, finalScore)
  );

  return {
    matchScore: clampedScore,
    relevant: true,
    matchedSkills: matched,
    missingSkills: missing,
    yearsOfExperience: yearsExp,
    candidateDomains: relevance.candidateDomains,
    jobDomains: relevance.jobDomains,
    matchedDomains: relevance.matchedDomains || [],
    recommendation: buildRecommendation(
      missing,
      clampedScore
    ),
  };
}

module.exports = {
  matchCandidateToJob,
  estimateYearsOfExperience,
  checkDomainRelevance,
};