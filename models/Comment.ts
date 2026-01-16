import mongoose, { Schema, Document, Types } from "mongoose";

export interface IComment extends Document {
    message: string;
    user: Types.ObjectId;
    post: Types.ObjectId;
    parent?: Types.ObjectId | null;
    favorites: Types.ObjectId[];
    likes: Types.ObjectId[];
    dislikes: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
    {
        message: { type: String, required: true },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
        parent: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
        favorites: [{ type: Schema.Types.ObjectId, ref: "User" }],
        likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
        dislikes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

commentSchema.index({ post: 1 });
commentSchema.index({ parent: 1 });
commentSchema.index({ favorites: 1 });
commentSchema.index({ likes: 1 });
commentSchema.index({ dislikes: 1 });

export default mongoose.model<IComment>("Comment", commentSchema);
