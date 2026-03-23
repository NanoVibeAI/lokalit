import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserPreference extends Document {
  userSub: string;
  defaultAccountId: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const UserPreferenceSchema = new Schema<IUserPreference>(
  {
    userSub: { type: String, required: true, unique: true },
    defaultAccountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
  },
  { timestamps: true, collection: "user_preferences" }
);

const UserPreference: Model<IUserPreference> =
  mongoose.models.UserPreference ??
  mongoose.model<IUserPreference>("UserPreference", UserPreferenceSchema);

export default UserPreference;
