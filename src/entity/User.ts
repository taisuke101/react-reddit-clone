import { IsEmail, Length } from "class-validator";
import {Entity as TOEntity, Column, Index, BeforeInsert, OneToMany} from "typeorm";
import bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';

import Entity from './Entity';
import { Post } from "./Post";
import { Vote } from "./Vote";

@TOEntity('users')
export class User extends Entity {
    constructor(user: Partial<User>) {
        super()
        Object.assign(this, user)
    }

    @Index('user_email_index')
    @IsEmail(undefined, { message: '有効なメールアドレスの形式ではありません！'})
    @Length(1, 255, { message: 'Eメールは1文字以上です！'})
    @Column({ unique: true })
    email: string;

    @Index('user_username_index')
    @Length(3, 15, { message: 'ユーザー名は3文字以上15文字以内です！'})
    @Column({ unique: true })
    username: string;

    @Exclude()
    @Length(6, 255, { message: 'パスワードは6文字以上です！'})
    @Column()
    password: string;

    @OneToMany(() => Post, post => post.user)
    posts: Post[];

    @OneToMany(() => Vote, vote => vote.user)
    votes: Vote[];


    @BeforeInsert()
    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 6)
    }
}
