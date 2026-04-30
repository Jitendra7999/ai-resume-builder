import mongoose, { Schema, Document } from 'mongoose';

export interface IResume {
  id: string;
  name: string;
  content: string;
  jobTitle: string;
  createdAt: Date;
}

export interface IAppliedJob {
  jobId: string;
  jobTitle: string;
  company: string;
  jobUrl: string;
  appliedAt: Date;
  status: 'applied' | 'interviewing' | 'rejected' | 'offered' | 'ghosted';
  ats?: string;
  coverLetter?: string;
  interviewDate?: Date;
  interviewType?: string; // phone, video, in-person
  rejectedAt?: Date;
  rejectionReason?: string;
  offerSalary?: string;
  notes?: string;
  source?: string; // which job board
  matchScore?: number;
  resumeUsed?: string; // resume ID
  responseReceivedAt?: Date;
}

export interface IScheduledJob {
  jobId: string;
  jobTitle: string;
  company: string;
  jobUrl: string;
  scheduledApplyTime: Date;
  actualAppliedAt?: Date;
  status: 'pending' | 'applied' | 'failed';
  reason?: string;
}

export interface IUser extends Document {
  username: string;
  password: string;
  profile: {
    name: string;
    email: string;
    phone: string;
    linkedin: string;
    role: string;
    expYears: string;
    skills: string; // comma-separated
    experience: string;
    education: string;
  };
  gmailCredentials: {
    gmailUser: string;
    gmailAppPassword: string;
  };
  resumes: IResume[];
  hrContacts: any[];
  appliedJobs: IAppliedJob[];
  savedJobs: string[];
  scheduledJobs: IScheduledJob[];
  applicationAnalytics: {
    totalApplications: number;
    totalResponses: number;
    responseRate: number; // percentage
    bestApplyTimes: Array<{
      hour: number; // 0-23
      dayOfWeek?: number; // 0-6 (Mon-Sun)
      responseRate: number;
      applicationsCount: number;
    }>;
    lastUpdated: Date;
  };
  preferences: {
    autoSchedule: boolean;
    dailyApplyGoal: number; // default 100
    maxApplicationsPerHour: number; // default 10
    preferredApplyTimes?: number[]; // hours like [9, 14, 17]
  };
}

const ResumeSchema = new Schema({
  id: String,
  name: String,
  content: String,
  jobTitle: String,
  createdAt: { type: Date, default: Date.now },
});

const AppliedJobSchema = new Schema<IAppliedJob>({
  jobId: String,
  jobTitle: String,
  company: String,
  jobUrl: String,
  appliedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['applied', 'interviewing', 'rejected', 'offered', 'ghosted'], default: 'applied' },
  ats: String,
  coverLetter: String,
  interviewDate: Date,
  interviewType: String,
  rejectedAt: Date,
  rejectionReason: String,
  offerSalary: String,
  notes: String,
  source: String,
  matchScore: Number,
  resumeUsed: String,
  responseReceivedAt: Date,
});

const ScheduledJobSchema = new Schema<IScheduledJob>({
  jobId: String,
  jobTitle: String,
  company: String,
  jobUrl: String,
  scheduledApplyTime: Date,
  actualAppliedAt: Date,
  status: { type: String, enum: ['pending', 'applied', 'failed'], default: 'pending' },
  reason: String,
});

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    role: { type: String, default: 'Frontend Developer' },
    expYears: { type: String, default: '1' },
    skills: { type: String, default: '' },
    experience: { type: String, default: '' },
    education: { type: String, default: '' },
  },
  gmailCredentials: {
    gmailUser: { type: String, default: '' },
    gmailAppPassword: { type: String, default: '' },
  },
  resumes: [ResumeSchema],
  hrContacts: { type: Array, default: [] },
  appliedJobs: [AppliedJobSchema],
  savedJobs: { type: [String], default: [] },
  scheduledJobs: [ScheduledJobSchema],
  applicationAnalytics: {
    totalApplications: { type: Number, default: 0 },
    totalResponses: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 },
    bestApplyTimes: [{
      hour: Number,
      dayOfWeek: Number,
      responseRate: Number,
      applicationsCount: Number,
    }],
    lastUpdated: { type: Date, default: Date.now },
  },
  preferences: {
    autoSchedule: { type: Boolean, default: false },
    dailyApplyGoal: { type: Number, default: 100 },
    maxApplicationsPerHour: { type: Number, default: 10 },
    preferredApplyTimes: { type: [Number], default: [9, 14, 17] }, // hours
  },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
