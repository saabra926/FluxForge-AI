import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String },
    image: { type: String },
    passwordHash: { type: String },
    emailVerified: { type: Date },
    githubId: { type: String, sparse: true, unique: true },
    githubLogin: { type: String },
    githubAvatar: { type: String },
    /** Encrypted at rest recommended in production; used server-side for GitHub API. */
    githubAccessToken: { type: String },
    googleId: { type: String, sparse: true, unique: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

const User: Model<UserDoc> = mongoose.models.User ?? mongoose.model<UserDoc>("User", UserSchema);

export default User;
