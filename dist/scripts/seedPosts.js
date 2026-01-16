"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Post_1 = __importDefault(require("../models/Post"));
dotenv_1.default.config();
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
        await mongoose_1.default.connect(process.env.MONGO_URI || "");
        console.log("MongoDB connected");
        await Post_1.default.deleteMany({}); // remove old posts if needed
        const created = await Post_1.default.insertMany(postsData);
        console.log(`${created.length} posts inserted`);
        mongoose_1.default.disconnect().then(r => {
            console.log(r);
        });
    }
    catch (err) {
        console.error(err);
        mongoose_1.default.disconnect().then(r => {
            console.log(r);
        });
    }
};
seedPosts().then(r => {
    console.log(r);
});
