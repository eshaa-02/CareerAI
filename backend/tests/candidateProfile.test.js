const CandidateProfile = require('../models/CandidateProfile');

describe('CandidateProfile.calculateCompletion', () => {
  test('returns a low percentage for a brand new profile with only name+email', () => {
    const profile = new CandidateProfile({ userId: '000000000000000000000000' });
    const user = { name: 'Alex Rivera', email: 'alex@example.com' };

    const percentage = profile.calculateCompletion(user);

    // Only the two required-account-field weights (name 10 + email 10) out
    // of the 100-point total should be earned.
    expect(percentage).toBe(20);
    expect(profile.completionPercentage).toBe(20);
  });

  test('increases as more sections are filled in', () => {
    const profile = new CandidateProfile({
      userId: '000000000000000000000000',
      headline: 'Full Stack Developer',
      bio: 'A bio that is definitely longer than twenty characters.',
      skills: ['React', 'Node.js', 'MongoDB'],
      resume: { url: '/uploads/resumes/resume.pdf', fileName: 'resume.pdf' },
    });
    const user = {
      name: 'Alex Rivera',
      email: 'alex@example.com',
      phone: '555-0100',
      location: 'San Francisco, CA',
      avatar: { url: '/uploads/avatars/alex.png' },
    };

    const percentage = profile.calculateCompletion(user);

    // name10+email10+phone8+location7+avatar8+headline10+bio7+resume15+skills10 = 85
    expect(percentage).toBe(85);
  });

  test('reaches 100% only when every weighted section is complete', () => {
    const profile = new CandidateProfile({
      userId: '000000000000000000000000',
      headline: 'Full Stack Developer',
      bio: 'A bio that is definitely longer than twenty characters.',
      skills: ['React', 'Node.js', 'MongoDB'],
      resume: { url: '/uploads/resumes/resume.pdf', fileName: 'resume.pdf' },
      education: [{ institution: 'State University', degree: 'B.S. CS' }],
      experience: [{ company: 'Acme', title: 'Developer' }],
    });
    const user = {
      name: 'Alex Rivera',
      email: 'alex@example.com',
      phone: '555-0100',
      location: 'San Francisco, CA',
      avatar: { url: '/uploads/avatars/alex.png' },
    };

    const percentage = profile.calculateCompletion(user);

    expect(percentage).toBe(100);
  });

  test('does not count a bio shorter than 20 characters as complete', () => {
    const profile = new CandidateProfile({ userId: '000000000000000000000000', bio: 'too short' });
    const user = { name: 'Alex', email: 'alex@example.com' };

    const withShortBio = profile.calculateCompletion(user);

    profile.bio = 'This bio is now long enough to count as a filled-in section.';
    const withLongBio = profile.calculateCompletion(user);

    expect(withLongBio).toBeGreaterThan(withShortBio);
  });

  test('does not count fewer than 3 skills as a complete skills section', () => {
    const profile = new CandidateProfile({ userId: '000000000000000000000000', skills: ['React', 'Node.js'] });
    const user = { name: 'Alex', email: 'alex@example.com' };

    const withTwoSkills = profile.calculateCompletion(user);

    profile.skills = ['React', 'Node.js', 'MongoDB'];
    const withThreeSkills = profile.calculateCompletion(user);

    expect(withThreeSkills).toBeGreaterThan(withTwoSkills);
  });
});
