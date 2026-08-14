const { matchCandidateToJob, estimateYearsOfExperience } = require('../services/aiMatchingService');

describe('aiMatchingService.matchCandidateToJob', () => {
  const baseJob = {
    skills: ['React', 'Node.js', 'MongoDB', 'Docker'],
    experience: 'mid',
  };

  test('gives a high score when all required skills match and experience aligns', () => {
    const candidate = {
      skills: ['React', 'Node.js', 'MongoDB', 'Docker', 'TypeScript'],
      experience: [
        {
          company: 'Acme',
          title: 'Full Stack Developer',
          startDate: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000), // ~3 years ago
          currentlyWorking: true,
        },
      ],
      education: [{ institution: 'State University', degree: 'B.S. Computer Science' }],
    };

    const result = matchCandidateToJob(candidate, baseJob);

    expect(result.matchScore).toBeGreaterThanOrEqual(85);
    expect(result.matchedSkills).toEqual(expect.arrayContaining(['React', 'Node.js', 'MongoDB', 'Docker']));
    expect(result.missingSkills).toHaveLength(0);
  });

  test('flags missing skills and lowers the score accordingly', () => {
    const candidate = {
      skills: ['React'],
      experience: [],
      education: [],
    };

    const result = matchCandidateToJob(candidate, baseJob);

    expect(result.matchedSkills).toEqual(['React']);
    expect(result.missingSkills).toEqual(expect.arrayContaining(['Node.js', 'MongoDB', 'Docker']));
    expect(result.matchScore).toBeLessThan(60);
    expect(result.recommendation).toMatch(/improve your chances/i);
  });

  test('is case-insensitive when matching skills', () => {
    const candidate = { skills: ['react', 'NODE.JS'], experience: [], education: [] };
    const job = { skills: ['React', 'Node.js'], experience: 'entry' };

    const result = matchCandidateToJob(candidate, job);

    expect(result.matchedSkills).toHaveLength(2);
    expect(result.missingSkills).toHaveLength(0);
  });

  test('returns a score between 0 and 100 even for a completely empty profile', () => {
    const candidate = { skills: [], experience: [], education: [] };
    const result = matchCandidateToJob(candidate, baseJob);

    expect(result.matchScore).toBeGreaterThanOrEqual(0);
    expect(result.matchScore).toBeLessThanOrEqual(100);
    expect(result.missingSkills).toHaveLength(baseJob.skills.length);
  });

  test('handles a job with no listed skills without dividing by zero', () => {
    const candidate = { skills: ['React'], experience: [], education: [] };
    const job = { skills: [], experience: 'entry' };

    const result = matchCandidateToJob(candidate, job);

    expect(Number.isFinite(result.matchScore)).toBe(true);
  });
});

describe('aiMatchingService.estimateYearsOfExperience', () => {
  test('returns 0 for no experience entries', () => {
    expect(estimateYearsOfExperience([])).toBe(0);
  });

  test('calculates approximate years for a completed role', () => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const years = estimateYearsOfExperience([
      { startDate: twoYearsAgo, endDate: oneYearAgo, currentlyWorking: false },
    ]);

    expect(years).toBeCloseTo(1, 0);
  });

  test('treats a currently-working role as ongoing until now', () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const years = estimateYearsOfExperience([
      { startDate: oneYearAgo, currentlyWorking: true },
    ]);

    expect(years).toBeCloseTo(1, 0);
  });
});
