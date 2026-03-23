import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAccount extends Document {
  account_id: string; // unique slug, e.g. "acme-corp"
  name: string;       // display name, e.g. "Acme Corp"
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    account_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "account_id may only contain lowercase letters, numbers and hyphens"],
    },
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Account: Model<IAccount> =
  mongoose.models.Account ?? mongoose.model<IAccount>("Account", AccountSchema);

export default Account;
