import mongoose from "mongoose";
import dotenv from "dotenv";
import Post from "../models/Post";

dotenv.config();

const postsData = [
    {
        title: "Post 1",
        user_id: 1,
        description: "This is a sample description for post 1. ".repeat(10),
    },
    {
        title: "Post 2",
        user_id: 1,
        description: "This is a sample description for post 2. ".repeat(10),
    },
    {
        title: "Post 3",
        user_id: 1,
        description: "This is a sample description for post 3. ".repeat(10),
    },
    {
        title: "Post 4",
        user_id: 1,
        description: "This is a sample description for post 4. ".repeat(10),
    },
    {
        title: "Post 5",
        user_id: 1,
        description: "This is a sample description for post 5. ".repeat(10),
    },
    {
        title: "Post 6",
        user_id: 1,
        description: "This is a sample description for post 6. ".repeat(10),
    },
    {
        title: "Post 7",
        user_id: 1,
        description: "This is a sample description for post 7. ".repeat(10),
    },
    {
        title: "Post 8",
        user_id: 1,
        description: "This is a sample description for post 8. ".repeat(10),
    },
    {
        title: "Post 9",
        user_id: 1,
        description: "This is a sample description for post 9. ".repeat(10),
    },
    {
        title: "Post 10",
        user_id: 1,
        description: "This is a sample description for post 10. ".repeat(10),
    },
];

const seedPosts = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "");
        console.log("MongoDB connected");

        await Post.deleteMany({}); // remove old posts if needed
        const created = await Post.insertMany(postsData);
        console.log(`${created.length} posts inserted`);

        mongoose.disconnect().then(r => {
            console.log(r)
        });
    } catch (err) {
        console.error(err);
        mongoose.disconnect().then(r => {
            console.log(r)
        });
    }
};

seedPosts().then(r => {
    console.log(r);
});
