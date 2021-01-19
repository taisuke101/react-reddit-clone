import { NextFunction, Request, Response } from "express";

import { User } from "../entity/User";

export default async (_: Request, res: Response, next: NextFunction) => {
    try {
        const user:User | undefined = res.locals.user;

        if (!user) throw new Error('認証されていません！')

        return next();
    } catch (err) {
        console.log(err);
        return res.status(401).json({ error: 'ログインしていません！'})
    }
}