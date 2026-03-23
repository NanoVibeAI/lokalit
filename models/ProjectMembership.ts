import mongoose, { Schema, Document, Model } from "mongoose";

export type ProjectRole = "OWNER" | "EDITOR" | "VIEWER";

export interface IProjectMembership extends Document {
  projectId: mongoose.Types.ObjectId;
  userSub: string; // OIDC subject
  role: ProjectRole;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectMembershipSchema = new Schema<IProjectMembership>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    userSub: { type: String, required: true },
    role: { type: String, enum: ["OWNER", "EDITOR", "VIEWER"], required: true },
  },
  { timestamps: true, collection: "project_memberships" }
);

ProjectMembershipSchema.index({ projectId: 1, userSub: 1 }, { unique: true });
ProjectMembershipSchema.index({ userSub: 1 });

const ProjectMembership: Model<IProjectMembership> =
  mongoose.models.ProjectMembership ??
  mongoose.model<IProjectMembership>("ProjectMembership", ProjectMembershipSchema);

export default ProjectMembership;
