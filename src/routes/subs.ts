import { isEmpty } from "class-validator";
import { NextFunction, Request, Response, Router } from "express";
import { getRepository } from 'typeorm';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';

import { Post } from "../entity/Post";
import { Sub } from "../entity/Sub";
import { User } from "../entity/User";
import auth from "../middleware/auth";
import user from "../middleware/user";
import { makeId } from "../utils/helpers";

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

const ownSub = async (req: Request, res: Response, next: NextFunction) => {
    const user: User = res.locals.user;

    try {
        const sub: Sub = await Sub.findOneOrFail({ where: { name: req.params.name }});

        if (sub.username !== user.username)
        return res.status(403).json({ error: 'この投稿の投稿者ではありません！'});

        res.locals.sub = sub;
        return next();
    } catch (err) {
        return res.status(500).json({ error: 'エラーが発生しました！'})
    }
}

const upload = multer({
    storage: multer.diskStorage({
        destination: 'public/images',
        filename: (_, file, callback) => {
            const name = makeId(15);
            callback(null, name + path.extname(file.originalname))
        }
    }),
    fileFilter: (_, file: any, callback: FileFilterCallback) => {
        if(file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
            callback(null, true);
        } else {
            callback(new Error ('画像の形式ではありません！'));
        }
    }
})

const uploadSubImage = async (req: Request, res: Response) => {
    const sub: Sub = res.locals.sub;

    try {
        const type = req.body.type;

        if (type !== 'image' && type !== 'banner') {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: '無効な画像形式です！'});
        }

        let oldImageUrn: string = '';

        if (type === 'image') { 
            oldImageUrn = sub.imageUrn ?? '';
            sub.imageUrn = req.file.filename;
        }
        else if (type === 'banner'){ 
            oldImageUrn = sub.bannerUrn ?? '';
            sub.bannerUrn = req.file.filename;
        }
        await sub.save();

        if (oldImageUrn !== '') 
        fs.unlinkSync(`public/images/${oldImageUrn}`);

        return res.json(sub);

    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'エラーが発生しました！'});
    }
    
}

const router = Router();

router.post('/', user, auth, createSub);
router.get('/:name', user, getSub);
router.post('/:name/image', user, auth, ownSub, upload.single('file'), uploadSubImage);

export default router;