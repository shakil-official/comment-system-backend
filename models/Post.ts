import mongoose, {Schema, Document, Types} from "mongoose";

export interface IPost extends Document {
    title: string;
    description: string;
    user: Types.ObjectId;
    date: Date;
    status: "active" | "inactive";
}

const postSchema = new Schema<IPost>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    date: { type: Date, default: Date.now },
});

export default mongoose.model<IPost>("Post", postSchema);
