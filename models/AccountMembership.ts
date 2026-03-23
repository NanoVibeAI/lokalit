import mongoose, { Schema, Document, Model } from "mongoose";

export type AccountRole = "OWNER" | "ADMIN" | "MEMBER";

export interface IAccountMembership extends Document {
  accountId: mongoose.Types.ObjectId;
  userSub: string; // OIDC subject
  role: AccountRole;
  createdAt: Date;
  updatedAt: Date;
}

const AccountMembershipSchema = new Schema<IAccountMembership>(
  {
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    userSub: { type: String, required: true },
    role: { type: String, enum: ["OWNER", "ADMIN", "MEMBER"], required: true },
  },
  { timestamps: true, collection: "account_memberships" }
);

AccountMembershipSchema.index({ accountId: 1, userSub: 1 }, { unique: true });
AccountMembershipSchema.index({ userSub: 1 });

const AccountMembership: Model<IAccountMembership> =
  mongoose.models.AccountMembership ??
  mongoose.model<IAccountMembership>("AccountMembership", AccountMembershipSchema);

export default AccountMembership;
