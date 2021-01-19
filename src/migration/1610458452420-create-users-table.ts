import {MigrationInterface, QueryRunner} from "typeorm";

export class createUsersTable1610458452420 implements MigrationInterface {
    name = 'createUsersTable1610458452420'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `users` (`id` int NOT NULL AUTO_INCREMENT, `createAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `email` varchar(255) NULL DEFAULT NULL, `username` varchar(255) NULL DEFAULT NULL, `password` varchar(255) NULL DEFAULT NULL, INDEX `IDX_97672ac88f789774dd47f7c8be` (`email`), INDEX `IDX_fe0bb3f6520ee0469504521e71` (`username`), UNIQUE INDEX `IDX_97672ac88f789774dd47f7c8be` (`email`), UNIQUE INDEX `IDX_fe0bb3f6520ee0469504521e71` (`username`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_fe0bb3f6520ee0469504521e71` ON `users`");
        await queryRunner.query("DROP INDEX `IDX_97672ac88f789774dd47f7c8be` ON `users`");
        await queryRunner.query("DROP INDEX `IDX_fe0bb3f6520ee0469504521e71` ON `users`");
        await queryRunner.query("DROP INDEX `IDX_97672ac88f789774dd47f7c8be` ON `users`");
        await queryRunner.query("DROP TABLE `users`");
    }

}
