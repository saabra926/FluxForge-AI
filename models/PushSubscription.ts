import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const PushSubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  { timestamps: true },
);

export type PushSubscriptionDoc = InferSchemaType<typeof PushSubscriptionSchema> & {
  _id: mongoose.Types.ObjectId;
};

const PushSubscriptionModel: Model<PushSubscriptionDoc> =
  mongoose.models.PushSubscription ?? mongoose.model<PushSubscriptionDoc>("PushSubscription", PushSubscriptionSchema);

export default PushSubscriptionModel;
