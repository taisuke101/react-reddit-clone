import {Entity as TOEntity, Column, Index, ManyToOne, JoinColumn, OneToMany} from "typeorm";

import Entity from './Entity';
import { User } from "./User";
//import { makeId, slugify } from "../utils/helpers";
import { Post } from "./Post";
import { Expose } from "class-transformer";

@TOEntity('subs')
export class Sub extends Entity {
    constructor(sub: Partial<Sub>) {
        super()
        Object.assign(this, sub)
    }

    @Index('sub_name_index')
    @Column({ unique: true })
    name: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    imageUrn: string;

    @Column({ nullable: true })
    bannerUrn: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'username', referencedColumnName: 'username'})
    user: User;

    @Column()
    username: string;

    @OneToMany(() => Post, post => post.sub)
    posts: Post[];

    @Expose()
    get imageUrl(): string {
        return this.imageUrn
        ? `${process.env.APP_URL}/images/${this.imageUrn}`
        : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
    }

    @Expose()
    get bannerUrl(): string | undefined {
        return this.bannerUrn
        ? `${process.env.APP_URL}/images/${this.bannerUrn}`
        : undefined
    }
}
