const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const Company = require('../models/Company');
const Job = require('../models/Job');

const run = async () => {
  await connectDB();
  console.log('Seeding database...');

  await Promise.all([
    User.deleteMany({ email: { $regex: '@careerai-demo.com$' } }),
  ]);

  const admin = await User.create({
    name: 'Platform Admin',
    email: 'admin@careerai-demo.com',
    password: 'Admin@12345',
    role: 'admin',
    isVerified: true,
  });

  const employer1 = await User.create({
    name: 'Sarah Chen',
    email: 'employer1@careerai-demo.com',
    password: 'Employer@123',
    role: 'employer',
  });

  const company1 = await Company.create({
    ownerId: employer1._id,
    name: 'NovaTech Solutions',
    industry: 'Software Development',
    companySize: '51-200',
    description:
      'NovaTech Solutions builds AI-driven products for enterprise clients across finance and healthcare.',
    website: 'https://novatech.example.com',
    location: 'San Francisco, CA',
    verified: true,
  });

  const candidate1 = await User.create({
    name: 'Alex Rivera',
    email: 'candidate1@careerai-demo.com',
    password: 'Candidate@123',
    role: 'candidate',
    skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
  });

  await CandidateProfile.create({
    userId: candidate1._id,
    headline: 'Full Stack Developer',
    bio: 'Full stack developer with 4 years of experience building scalable web applications.',
    skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'Express'],
    experience: [
      {
        company: 'TechStart Inc',
        title: 'Frontend Developer',
        startDate: new Date('2021-01-01'),
        currentlyWorking: true,
        description: 'Built responsive UIs with React and TypeScript.',
      },
    ],
    education: [
      {
        institution: 'State University',
        degree: 'B.S. Computer Science',
        startDate: new Date('2016-09-01'),
        endDate: new Date('2020-06-01'),
      },
    ],
  });

  const jobsData = [
    {
      title: 'Senior Full Stack Engineer',
      description:
        'We are looking for a Senior Full Stack Engineer to join our growing platform team, working across our Next.js frontend and Node.js backend.',
      requirements: ['5+ years experience', 'Strong TypeScript skills'],
      skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
      salary: { min: 120000, max: 160000, currency: 'USD' },
      location: 'San Francisco, CA',
      isRemote: true,
      type: 'full-time',
      experience: 'senior',
      category: 'Engineering',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'AI/ML Engineer',
      description:
        'Join our AI team to build and deploy machine learning models that power recommendation systems.',
      requirements: ['Experience with PyTorch or TensorFlow'],
      skills: ['Python', 'PyTorch', 'Machine Learning', 'AWS'],
      salary: { min: 130000, max: 180000, currency: 'USD' },
      location: 'Remote',
      isRemote: true,
      type: 'full-time',
      experience: 'mid',
      category: 'Data Science',
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Product Designer',
      description:
        'Design intuitive, beautiful experiences for our enterprise SaaS dashboard.',
      requirements: ['Portfolio required', 'Figma expertise'],
      skills: ['Figma', 'UI/UX', 'Design Systems'],
      salary: { min: 90000, max: 130000, currency: 'USD' },
      location: 'New York, NY',
      isRemote: false,
      type: 'full-time',
      experience: 'mid',
      category: 'Design',
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const jobData of jobsData) {
    await Job.create({ ...jobData, employerId: employer1._id, companyId: company1._id });
  }

  // Sample application + interview so the Interview Management module has
  // real data to demo immediately after seeding.
  const Application = require('../models/Application');
  const Interview = require('../models/Interview');

  const firstJob = await Job.findOne({ employerId: employer1._id });
  const sampleApplication = await Application.create({
    jobId: firstJob._id,
    candidateId: candidate1._id,
    employerId: employer1._id,
    resume: { url: '/uploads/resumes/sample.pdf', fileName: 'alex-rivera-resume.pdf' },
    matchScore: 82,
    matchDetails: {
      matchedSkills: ['React', 'Node.js', 'MongoDB'],
      missingSkills: ['Docker'],
      recommendation: 'Strong fit — consider strengthening containerization skills.',
    },
    status: 'shortlisted',
    statusHistory: [{ status: 'shortlisted', note: 'Strong resume match' }],
  });

  const interviewDate = new Date();
  interviewDate.setDate(interviewDate.getDate() + 3);

  await Interview.create({
    jobId: firstJob._id,
    applicationId: sampleApplication._id,
    candidateId: candidate1._id,
    employerId: employer1._id,
    companyId: company1._id,
    interviewerIds: [employer1._id],
    interviewRound: 'round-1',
    interviewType: 'online',
    meetingPlatform: 'google-meet',
    meetingLink: 'https://meet.google.com/sample-demo-link',
    date: interviewDate,
    startTime: '14:00',
    endTime: '14:45',
    timezone: 'UTC',
    instructions: 'Please have your portfolio and recent project examples ready to discuss.',
    agenda: 'Introductions, technical walkthrough, Q&A.',
    status: 'invitation_sent',
  });

  console.log('Seeding complete.');
  console.log('----------------------------------------');
  console.log('Admin login:    admin@careerai-demo.com / Admin@12345');
  console.log('Employer login: employer1@careerai-demo.com / Employer@123');
  console.log('Candidate login:candidate1@careerai-demo.com / Candidate@123');
  console.log('----------------------------------------');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
