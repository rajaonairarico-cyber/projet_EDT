-- Migration : ajoute la colonne "duree" (en heures) à la table EMPLOI_DU_TEMPS
-- A exécuter une seule fois sur la base de données existante (phpMyAdmin ou ligne de commande MySQL)

ALTER TABLE EMPLOI_DU_TEMPS
ADD COLUMN IF NOT EXISTS duree DECIMAL(3,1) NOT NULL DEFAULT 1.0 COMMENT 'Durée du cours en heures';
