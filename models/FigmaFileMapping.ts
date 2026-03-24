import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFigmaFileMapping extends Document {
  fileId: string;
  projectSlug: string;
  createdBy: string; // OIDC subject of the user who linked it
  createdAt: Date;
  updatedAt: Date;
}

const FigmaFileMappingSchema = new Schema<IFigmaFileMapping>(
  {
    fileId: { type: String, required: true, unique: true, trim: true },
    projectSlug: { type: String, required: true, trim: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true, collection: "figma_file_mappings" }
);

if (mongoose.models["FigmaFileMapping"]) {
  mongoose.deleteModel("FigmaFileMapping");
}

const FigmaFileMapping: Model<IFigmaFileMapping> = mongoose.model<IFigmaFileMapping>(
  "FigmaFileMapping",
  FigmaFileMappingSchema
);

export default FigmaFileMapping;
