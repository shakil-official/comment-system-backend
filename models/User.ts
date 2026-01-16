import mongoose, {Schema, Document} from "mongoose";
import bcrypt from "bcryptjs";
import Post from "./Post";

export interface IUser extends Document {
    name?: string;
    email: string;
    password: string;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
    name: {type: String},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
});

userSchema.pre("save", async function (this: IUser) {
    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword: string) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Cascade delete posts when user is deleted
userSchema.pre("deleteOne", { document: true, query: false }, async function () {
    // "this" refers to the document
    const doc = this as IUser;
    await Post.deleteMany({ user: doc._id });
});

export default mongoose.model<IUser>("User", userSchema);