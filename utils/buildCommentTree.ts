import { IComment } from "../models/Comment";

export const buildCommentTree = (comments: IComment[]) => {
    // Map to hold comment id → comment object
    const map = new Map<string, IComment & { children: IComment[] }>();
    const roots: (IComment & { children: IComment[] })[] = [];

    // Initialize children array and map
    comments.forEach((comment) => {
        (comment as any).children = [];
        map.set(comment._id.toString(), comment as any);
    });

    // Attach each comment to its parent or push to roots
    comments.forEach((comment) => {
        if (comment.parent) {
            const parent = map.get(comment.parent.toString());
            if (parent) {
                (parent as any).children.push(comment as any);
            }
        } else {
            roots.push(comment as any);
        }
    });

    return roots;
};
