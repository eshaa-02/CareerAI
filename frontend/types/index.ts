export type UserRole = 'candidate' | 'employer' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: { url: string; publicId: string };
  phone?: string;
  location?: string;
  skills?: string[];
  isVerified: boolean;
  isActive: boolean;
  isSuspended: boolean;
  createdAt: string;
}

export interface Company {
  _id: string;
  ownerId: string;
  name: string;
  logo?: { url: string; publicId: string };
  industry?: string;
  companySize?: string;
  foundedYear?: number;
  description?: string;
  website?: string;
  location?: string;
  socialLinks?: { linkedin?: string; twitter?: string; facebook?: string };
  verified: boolean;
  openJobs?: number;
  createdAt: string;
}

export interface Job {
  _id: string;
  employerId: string;
  companyId: Company | string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  salary: { min: number; max: number; currency: string; isNegotiable: boolean };
  location: string;
  isRemote: boolean;
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
  experience: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
  category: string;
  vacancies: number;
  deadline: string;
  status: 'active' | 'closed' | 'draft';
  views: number;
  applicationsCount: number;
  featured: boolean;
  createdAt: string;
}

export interface Application {
  _id: string;
  jobId: Job | string;
  candidateId: User | string;
  employerId: string;
  resume: { url: string; fileName: string };
  coverLetter: string;
  matchScore: number;
  matchDetails: {
    matchedSkills: string[];
    missingSkills: string[];
    recommendation: string;
  };
  status: 'pending' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn';
  statusHistory: { status: string; changedAt: string; note: string }[];
  createdAt: string;
}

export interface CandidateProfile {
  _id: string;
  userId: string;
  headline: string;
  bio: string;
  resume: { url: string; fileName: string; uploadedAt: string };
  education: EducationEntry[];
  experience: ExperienceEntry[];
  certificates: CertificateEntry[];
  skills: string[];
  desiredJobTitle: string;
  desiredSalary: number;
  availability: string;
  links: { linkedin?: string; github?: string; portfolio?: string };
  savedJobs: string[];
  completionPercentage: number;
}

export interface EducationEntry {
  _id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  currentlyStudying: boolean;
  grade?: string;
}

export interface ExperienceEntry {
  _id: string;
  company: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  currentlyWorking: boolean;
  description?: string;
}

export interface CertificateEntry {
  _id: string;
  name: string;
  issuingOrganization?: string;
  issueDate?: string;
  credentialUrl?: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export type InterviewType =
  | 'online'
  | 'on-site'
  | 'phone-call'
  | 'technical-assessment'
  | 'hr-interview'
  | 'final-interview';

export type InterviewStatus =
  | 'scheduled'
  | 'invitation_sent'
  | 'accepted'
  | 'declined'
  | 'reschedule_requested'
  | 'rescheduled'
  | 'reminder_sent'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type InterviewOutcome = 'pending' | 'passed' | 'failed' | 'selected' | 'rejected' | 'on_hold' | 'next_round' | '';

export interface InterviewFeedback {
  interviewerId: string;
  strengths: string;
  weaknesses: string;
  summary: string;
  technicalRating: number;
  communicationRating: number;
  culturalFitRating: number;
  overallRating: number;
  recommendation: string;
  submittedAt: string;
}

export interface Interview {
  _id: string;
  jobId: Job | string;
  applicationId: string;
  candidateId: User | string;
  employerId: User | string;
  companyId: Company | string;
  interviewerIds: User[] | string[];
  interviewRound: string;
  interviewType: InterviewType;
  meetingPlatform: string;
  meetingLink: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  timezone: string;
  instructions: string;
  agenda: string;
  status: InterviewStatus;
  outcome: InterviewOutcome;
  candidateResponse: { status: string; note: string; respondedAt?: string };
  rescheduleRequest?: { requestedDate?: string; requestedNote?: string; requestedAt?: string };
  cancellation?: { reason?: string; cancelledAt?: string };
  employerNotes?: string;
  feedback: InterviewFeedback[];
  createdAt: string;

  attachments?: {
    _id?: string;
    fileName: string;
    url: string;
    uploadedBy?: string;
    uploadedAt?: string;
  }[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
