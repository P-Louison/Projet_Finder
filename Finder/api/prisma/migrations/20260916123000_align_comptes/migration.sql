-- Align comptes with the account data loaded by prisma/seed.js.
ALTER TABLE `comptes`
    ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'voyageur',
    ADD COLUMN `prenom` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `mot_de_passe` VARCHAR(191) NOT NULL DEFAULT '',
    MODIFY COLUMN `telephone` VARCHAR(191) NULL,
    DROP COLUMN `etoile`,
    DROP COLUMN `adresse`,
    DROP COLUMN `code_postal`,
    DROP COLUMN `ville`,
    DROP COLUMN `gerant`,
    DROP COLUMN `description`;
