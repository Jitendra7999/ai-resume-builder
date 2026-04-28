import mongoose, { Schema, Document } from 'mongoose';

export interface IResume {
  id: string;
  name: string;
  content: string;
  jobTitle: string;
  createdAt: Date;
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
    skills: string;
    experience: string;
    education: string;
  };
  gmailCredentials: {
    gmailUser: string;
    gmailAppPassword: string;
  };
  resumes: IResume[];
  hrContacts: any[];
  appliedJobs: any[];
  savedJobs: string[];
}

const ResumeSchema = new Schema({
  id: String,
  name: String,
  content: String,
  jobTitle: String,
  createdAt: { type: Date, default: Date.now },
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
  appliedJobs: { type: Array, default: [] },
  savedJobs: { type: [String], default: [] },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
