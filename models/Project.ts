import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProject extends Document {
  name: string;
  slug: string;
  description?: string;
  defaultLanguage: string;
  otherLanguages: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true },
    defaultLanguage: { type: String, required: true, default: "en" },
    otherLanguages: { type: [String], default: [] },
  },
  { timestamps: true }
);

if (mongoose.models["Project"]) {
  mongoose.deleteModel("Project");
}

const Project: Model<IProject> = mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
