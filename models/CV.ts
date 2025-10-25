import mongoose, { Schema, model, models, Document } from 'mongoose'

// CV Document Interface
export interface ICV extends Document {
  userId: string
  userEmail: string
  title: string
  personalInfo: {
    fullName: string
    email: string
    phone?: string
    address?: string
    photo?: string
    linkedin?: string
    website?: string
  }
  summary?: string
  experiences: Array<{
    company: string
    position: string
    location?: string
    startDate: string
    endDate?: string
    current: boolean
    responsibilities: string[]
  }>
  education: Array<{
    institution: string
    degree: string
    field: string
    location?: string
    startDate: string
    endDate?: string
    current: boolean
    gpa?: string
  }>
  skills: Array<{
    category: string
    items: string[]
  }>
  certifications?: Array<{
    name: string
    issuer: string
    date: string
    url?: string
  }>
  languages?: Array<{
    name: string
    proficiency: string
  }>
  projects?: Array<{
    name: string
    description: string
    technologies: string[]
    url?: string
    startDate?: string
    endDate?: string
  }>
  template: {
    id: string
    name: string
    customizations?: any
  }
  metadata: {
    views: number
    lastViewed?: Date
    shared: boolean
    shareToken?: string
  }
  createdAt: Date
  updatedAt: Date
}

const CVSchema = new Schema<ICV>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: 'My CV',
    },
    personalInfo: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: String,
      address: String,
      photo: String,
      linkedin: String,
      website: String,
    },
    summary: String,
    experiences: [
      {
        company: { type: String, required: true },
        position: { type: String, required: true },
        location: String,
        startDate: { type: String, required: true },
        endDate: String,
        current: { type: Boolean, default: false },
        responsibilities: [String],
      },
    ],
    education: [
      {
        institution: { type: String, required: true },
        degree: { type: String, required: true },
        field: { type: String, required: true },
        location: String,
        startDate: { type: String, required: true },
        endDate: String,
        current: { type: Boolean, default: false },
        gpa: String,
      },
    ],
    skills: [
      {
        category: { type: String, required: true },
        items: [String],
      },
    ],
    certifications: [
      {
        name: String,
        issuer: String,
        date: String,
        url: String,
      },
    ],
    languages: [
      {
        name: String,
        proficiency: String,
      },
    ],
    projects: [
      {
        name: String,
        description: String,
        technologies: [String],
        url: String,
        startDate: String,
        endDate: String,
      },
    ],
    template: {
      id: { type: String, required: true, default: 'modern' },
      name: { type: String, default: 'Modern' },
      customizations: Schema.Types.Mixed,
    },
    metadata: {
      views: { type: Number, default: 0 },
      lastViewed: Date,
      shared: { type: Boolean, default: false },
      shareToken: String,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for better query performance
CVSchema.index({ userId: 1, createdAt: -1 })
CVSchema.index({ userEmail: 1 })
CVSchema.index({ 'metadata.shareToken': 1 })

// Text index for search functionality
CVSchema.index({
  title: 'text',
  'personalInfo.fullName': 'text',
  'experiences.company': 'text',
  'experiences.position': 'text',
})

// Export model
export const CV = models.CV || model<ICV>('CV', CVSchema)
