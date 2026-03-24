import mongoose, { Schema, Document } from "mongoose";

export type OAuthIntegrationKey = "figma";

export interface IOAuthIntegration extends Document {
  key: OAuthIntegrationKey;
  requestId: string;
  code: string;
  createdAt: Date;
}

const OAuthIntegrationSchema = new Schema<IOAuthIntegration>({
  key: { type: String, required: true, enum: ["figma"] as OAuthIntegrationKey[] },
  requestId: { type: String, required: true, unique: true, index: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // 10-minute TTL
}, { collection: "oauth_integrations" });

export default (mongoose.models.OAuthIntegration as mongoose.Model<IOAuthIntegration>) ||
  mongoose.model<IOAuthIntegration>("OAuthIntegration", OAuthIntegrationSchema);
