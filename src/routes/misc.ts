import { Request, Response, Router } from 'express';
import { getConnection } from 'typeorm';

import { Comment } from '../entity/Comment';
import { Post } from '../entity/Post';
import { Sub } from '../entity/Sub';
import { User } from '../entity/User';
import { Vote } from '../entity/Vote';

import auth from '../middleware/auth';
import user from '../middleware/user';

interface VoteTypes {
    identifier: string;
    slug: string;
    commentIdentifier: string;
    value: number;
}

const vote = async (req: Request, res: Response) => {
    const { identifier, slug, commentIdentifier, value }: VoteTypes = req.body;
    const user: User = res.locals.user;
    
    //validate vote value
    if (![-1, 0, 1].includes(value))
    return res.status(400).json({ value: '値は「-1, 0」もしくは「1」のどれかです！'})
    
    try {
        let post: Post = await Post.findOneOrFail({ identifier, slug });
        let vote: Vote | undefined;
        let comment: Comment | undefined;

        if(commentIdentifier) {
            // if there is a comment identifier find vote by comment
            comment = await Comment.findOneOrFail({ identifier: commentIdentifier});
            vote = await Vote.findOne({ user, comment });
        } else {
            // else find vote by post
            vote = await Vote.findOne({ user, post });
        }

        if (!vote && value === 0) {
            // if no vote and value = 0 return error
            return res.status(404).json({ error: '投票が見つかりません！'});
        } else if (!vote) {
            // if no vote create it
            vote = new Vote({ user, value })
            if (comment) vote.comment = comment;
            else vote.post = post;
            await vote.save();
        } else if(value === 0) {
            // vote exists and value = 0 remove vote from DB
            await vote.remove();
        } else if(vote.value !== value) {
            //if vote and value has changed, update vote
            vote.value = value;
            await vote.save();
        }

        post = await Post.findOneOrFail(
            { identifier, slug }, 
            {relations: ['comments', 'comments.votes', 'sub', 'votes']}
        );
        post.setUserVote(user);
        post.comments.forEach(c => c.setUserVote(user));

        return res.json(post);

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'エラーが発生しました！'})
    }
}



const topSubs = async (_: Request, res: Response) => {
    try {
    const concatUrl = `CONCAT('${process.env.APP_URL}/images/', s.imageUrn )`
    const imageUrlExp = `COALESCE( ${concatUrl} , 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y')`
    const subs = await getConnection()
        .createQueryBuilder()
        .select(
            `s.title, 
            s.name, 
            ${imageUrlExp} as imageUrl, 
            count(p.id) as postCount`
        )
        .from(Sub, 's')
        .leftJoin(Post, 'p', 's.name = p.subName')
        .groupBy('s.title, s.name, imageUrl')
        .orderBy('postCount', 'DESC')
        .limit(5)
        .execute()     

    return res.json(subs)
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'エラーが発生しました！'})
    }
}


const router = Router();
router.post('/vote', user, auth, vote);
router.get('/top-subs', topSubs);

export default router;