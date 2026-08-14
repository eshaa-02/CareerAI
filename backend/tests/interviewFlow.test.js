const request = require('supertest');
const app = require('../app');
const CandidateProfile = require('../models/CandidateProfile');

async function registerEmployer() {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Sarah Chen',
    email: 'employer@example.com',
    password: 'Password123',
    role: 'employer',
    companyName: 'NovaTech Solutions',
  });
  return { token: res.body.token, user: res.body.user };
}

async function registerCandidateWithResume() {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Alex Rivera',
    email: 'candidate@example.com',
    password: 'Password123',
    role: 'candidate',
  });

  // Bypass the multer upload flow (not the concern of this test) by
  // setting the resume directly, matching what a real upload would leave
  // behind: a stored URL and filename on the CandidateProfile.
  await CandidateProfile.findOneAndUpdate(
    { userId: res.body.user._id },
    {
      resume: { url: '/uploads/resumes/test-resume.pdf', fileName: 'resume.pdf', uploadedAt: new Date() },
      skills: ['React', 'Node.js', 'MongoDB'],
    }
  );

  return { token: res.body.token, user: res.body.user };
}

const validJobPayload = {
  title: 'Senior Full Stack Engineer',
  description: 'We are looking for an experienced full stack engineer to join our growing platform team.',
  skills: ['React', 'Node.js', 'MongoDB'],
  location: 'San Francisco, CA',
  type: 'full-time',
  experience: 'senior',
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

describe('Job posting and public listing', () => {
  test('employer can post a job and it appears in the public listing', async () => {
    const { token } = await registerEmployer();

    const createRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send(validJobPayload);

    expect(createRes.status).toBe(201);
    expect(createRes.body.job.status).toBe('active');

    const listRes = await request(app).get('/api/jobs');
    expect(listRes.status).toBe(200);
    expect(listRes.body.jobs.some((j) => j._id === createRes.body.job._id)).toBe(true);
  });

  test('a candidate cannot post a job', async () => {
    const candidateRes = await request(app).post('/api/auth/register').send({
      name: 'Not An Employer',
      email: 'notemployer@example.com',
      password: 'Password123',
      role: 'candidate',
    });

    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${candidateRes.body.token}`)
      .send(validJobPayload);

    expect(res.status).toBe(403);
  });

  test('rejects a job with no skills listed', async () => {
    const { token } = await registerEmployer();

    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validJobPayload, skills: [] });

    expect(res.status).toBe(400);
  });
});

describe('Full application -> shortlist -> interview flow', () => {
  test('walks a candidate from application through interview scheduling and acceptance', async () => {
    const employer = await registerEmployer();
    const candidate = await registerCandidateWithResume();

    // 1. Employer posts a job
    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employer.token}`)
      .send(validJobPayload);
    expect(jobRes.status).toBe(201);
    const jobId = jobRes.body.job._id;

    // 2. Candidate applies — AI match score should be computed automatically
    const applyRes = await request(app)
      .post(`/api/applications/${jobId}`)
      .set('Authorization', `Bearer ${candidate.token}`)
      .send({ coverLetter: 'I would love to join your team.' });

    expect(applyRes.status).toBe(201);
    expect(applyRes.body.application.status).toBe('pending');
    expect(applyRes.body.application.matchScore).toBeGreaterThan(0);
    const applicationId = applyRes.body.application._id;

    // 3. Candidate cannot apply twice to the same job
    const duplicateRes = await request(app)
      .post(`/api/applications/${jobId}`)
      .set('Authorization', `Bearer ${candidate.token}`)
      .send({});
    expect(duplicateRes.status).toBe(400);

    // 4. Employer sees the applicant
    const applicantsRes = await request(app)
      .get(`/api/applications/job/${jobId}`)
      .set('Authorization', `Bearer ${employer.token}`);
    expect(applicantsRes.status).toBe(200);
    expect(applicantsRes.body.applications).toHaveLength(1);

    // 5. Employer shortlists the candidate
    const shortlistRes = await request(app)
      .put(`/api/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${employer.token}`)
      .send({ status: 'shortlisted' });
    expect(shortlistRes.status).toBe(200);
    expect(shortlistRes.body.application.status).toBe('shortlisted');

    // 6. Employer schedules an interview
    const interviewRes = await request(app)
      .post('/api/interviews')
      .set('Authorization', `Bearer ${employer.token}`)
      .send({
        applicationId,
        interviewType: 'online',
        meetingPlatform: 'google-meet',
        meetingLink: 'https://meet.google.com/test-link',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        startTime: '14:00',
        endTime: '14:45',
        timezone: 'UTC',
      });
    expect(interviewRes.status).toBe(201);
    expect(interviewRes.body.interview.status).toBe('invitation_sent');
    const interviewId = interviewRes.body.interview._id;

    // 7. Candidate sees the interview in their list
    const candidateInterviewsRes = await request(app)
      .get('/api/interviews/candidate')
      .set('Authorization', `Bearer ${candidate.token}`);
    expect(candidateInterviewsRes.status).toBe(200);
    expect(candidateInterviewsRes.body.interviews).toHaveLength(1);
    // Private employer fields must never reach the candidate
    expect(candidateInterviewsRes.body.interviews[0].employerNotes).toBeUndefined();
    expect(candidateInterviewsRes.body.interviews[0].feedback).toBeUndefined();

    // 8. Candidate accepts the interview
    const respondRes = await request(app)
      .put(`/api/interviews/${interviewId}/respond`)
      .set('Authorization', `Bearer ${candidate.token}`)
      .send({ response: 'accepted' });
    expect(respondRes.status).toBe(200);
    expect(respondRes.body.interview.status).toBe('accepted');
    expect(respondRes.body.interview.candidateResponse.status).toBe('accepted');
  });

  test('a candidate without a resume cannot apply', async () => {
    const employer = await registerEmployer();
    const candidateRes = await request(app).post('/api/auth/register').send({
      name: 'No Resume',
      email: 'noresume@example.com',
      password: 'Password123',
      role: 'candidate',
    });

    const jobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${employer.token}`)
      .send(validJobPayload);

    const applyRes = await request(app)
      .post(`/api/applications/${jobRes.body.job._id}`)
      .set('Authorization', `Bearer ${candidateRes.body.token}`)
      .send({});

    expect(applyRes.status).toBe(400);
    expect(applyRes.body.error).toMatch(/resume/i);
  });
});
