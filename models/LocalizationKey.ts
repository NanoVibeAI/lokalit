import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILocalizationKey extends Document {
  projectId: mongoose.Types.ObjectId;
  key: string;
  description?: string;
  values: { [lang: string]: string };
  createdAt: Date;
  updatedAt: Date;
}

const LocalizationKeySchema = new Schema<ILocalizationKey>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    key: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    values: { type: Object, default: {} },
  },
  { timestamps: true }
);

LocalizationKeySchema.index({ projectId: 1, key: 1 }, { unique: true });

if (mongoose.models["LocalizationKey"]) {
  mongoose.deleteModel("LocalizationKey");
}

const LocalizationKey: Model<ILocalizationKey> = mongoose.model<ILocalizationKey>("LocalizationKey", LocalizationKeySchema);

export default LocalizationKey;
