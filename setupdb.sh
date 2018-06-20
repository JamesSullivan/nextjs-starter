#!/bin/bash

mysql -uroot <<MYSQL_SCRIPT
CREATE DATABASE IF NOT EXISTS starter DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;
CREATE USER 'starter_user'@'localhost' IDENTIFIED BY 'starterPW1!';
GRANT ALL PRIVILEGES ON starter.* TO 'starter_user'@'localhost' IDENTIFIED BY 'starterPW1!';
FLUSH PRIVILEGES;
use starter;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT, `email` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '', `emailVerified` boolean NOT NULL DEFAULT 0, `name` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '', PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
MYSQL_SCRIPT

echo "MySQL database starter created."
echo "MySQL user starter_user created."
echo "Username:   starter_user"
echo "Password:   starterPW1!"


echo "MySQL database starter tables created."
