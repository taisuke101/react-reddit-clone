import { isEmpty } from "class-validator";
import { Request, Response, Router } from "express";
import { getRepository } from 'typeorm';
// import multer from 'multer';

import { Post } from "../entity/Post";
import { Sub } from "../entity/Sub";
import { User } from "../entity/User";
import auth from "../middleware/auth";
import user from "../middleware/user";

const createSub = async (req: Request, res: Response) => {
    const { name, title, description }: Sub = req.body;

    const user: User = res.locals.user;

    try {
        let errors: any = {}

        if (isEmpty(name)) errors.name = '名前は必須項目です！';
        if (isEmpty(title)) errors.title = 'タイトルは必須項目です！';

        const sub = await getRepository(Sub)
        .createQueryBuilder('sub')
        .where('lower(sub.name) = :name', { name: name.toLowerCase() })
        .getOne();

        if (sub) errors.name = 'すでに存在しているタイトルです！';

        if (Object.keys(errors).length > 0) throw errors;

    } catch (err) {
        return res.status(400).json(err);
    }

    try {
        const sub = new Sub({ name, description, title, user });

        await sub.save();

        return res.json(sub);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'エラーが発生しました！'});
    }
}

const getSub = async(req: Request, res: Response) => {
    const name = req.params.name;

    try {
        const sub = await Sub.findOneOrFail({ name });
        const posts = await Post.find({
            where: { sub },
            order: { createdAt: 'DESC'},
            relations: ['comments', 'votes']
        });
        sub.posts = posts;

        if (res.locals.user)
        sub.posts.forEach(p => p.setUserVote(res.locals.user));

        return res.json(sub);
    } catch (err) {
        console.log(err);
        return res.status(404).json({ sub: 'タグが見つかりません！'})
    }
}

// const upload = multer({

// })

// const uploadSubImage = async (req: Request, res: Response) => {

// }

const router = Router();

router.post('/', user, auth, createSub);
router.get('/:name', user, getSub);
// router.post('/:name/image', user, auth, uploadSubImage);

export default router;