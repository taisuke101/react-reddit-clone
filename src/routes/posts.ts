import { Request, Response, Router } from "express";

import { Comment } from "../entity/Comment";
import { Post } from "../entity/Post";
import { Sub } from "../entity/Sub";
import { User } from "../entity/User";
import auth from '../middleware/auth';
import user from "../middleware/user";

interface PostTypes {
    title: string;
    body: string;
    sub: string;
}

const createPost = async (req: Request, res: Response) => {
    const { title, body, sub }: PostTypes = req.body;

    const user: User = res.locals.user;
    
    if (title.trim() === '')
    return res.status(400).json({ title: 'タイトルを入力して下さい！'})

    try {
        //  find sub 
        const subRecord = await Sub.findOneOrFail({ name: sub })
        const post = new Post({ title, body, user, sub: subRecord });
        await post.save();

        return res.json(post);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'エラーが発生しました！'})
    }
}

const getPosts = async (_: Request, res: Response) => {
    try {
        const posts = await Post.find({
            order: { createdAt: 'DESC'},
            relations: ['comments', 'votes', 'sub']
        }); 

        if (res.locals.user) {
            posts.forEach((p) => p.setUserVote(res.locals.user));
        }

        return res.json(posts);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'エラーが発生しました！'});
    }
}

const getPost = async (req: Request, res: Response) => {
    const { identifier, slug } = req.params;
    try {
        const post = await Post.findOneOrFail(
            { identifier, slug },
            { relations: ['sub', 'votes', 'comments'] },
        ); 

        if(res.locals.user) {
            post.setUserVote(res.locals.user);
        }
        
        return res.json(post);
    } catch (err) {
        console.log(err);
        return res.status(404).json({ error: '記事が見つかりません！'});
    }
}

const commentOnPost = async (req: Request, res: Response) => {
    const { identifier, slug } = req.params;
    const body = req.body.body;

    try {
        const post = await Post.findOneOrFail({ identifier, slug });

        const comment = new Comment({
            body,
            user: res.locals.user,
            post
        })

        await comment.save();

        return res.json(comment)

    } catch (err) {
        console.log(err);
        return res.status(404).json({ error: '記事が見つかりません！' });
    }
}

const getPostCommets = async(req: Request, res: Response) => {
    const { identifier, slug } = req.params;

    try {
        const post = await Post.findOneOrFail({ identifier, slug });

        const comments = await Comment.find({
            where: { post },
            order: { createdAt: 'DESC' },
            relations: ['votes']
        })

        if (res.locals.user)
        comments.forEach((c) => c.setUserVote(res.locals.user));

        return res.json(comments);

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'エラーが発生しました！'});
    }
}

const router = Router();

router.post('/', user, auth, createPost);
router.get('/', user, getPosts);
router.get('/:identifier/:slug', user, getPost);
router.post('/:identifier/:slug/comments', user, auth, commentOnPost);
router.get('/:identifier/:slug/comments', user, getPostCommets);

export default router;