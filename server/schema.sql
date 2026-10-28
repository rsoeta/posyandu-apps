-- ============================================================
-- Posyandu Desa - MySQL Schema (UUID PKs)
-- ============================================================

CREATE DATABASE IF NOT EXISTS posyandu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE posyandu;

CREATE TABLE IF NOT EXISTS posyandu (
  id         CHAR(36) PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  desa       VARCHAR(150),
  alamat     VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36) PRIMARY KEY,
  email         VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin_desa','kader') NOT NULL DEFAULT 'kader',
  status        ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  posyandu_id   CHAR(36),
  full_name     VARCHAR(150),
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_posyandu FOREIGN KEY (posyandu_id) REFERENCES posyandu(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS balita (
  id            CHAR(36) PRIMARY KEY,
  posyandu_id   CHAR(36) NOT NULL,
  nama          VARCHAR(150) NOT NULL,
  nik           VARCHAR(32),
  tanggal_lahir DATE,
  jenis_kelamin ENUM('L','P'),
  nama_ibu      VARCHAR(150),
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_balita_posyandu FOREIGN KEY (posyandu_id) REFERENCES posyandu(id) ON DELETE CASCADE,
  INDEX idx_balita_posyandu (posyandu_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ibu_hamil (
  id             CHAR(36) PRIMARY KEY,
  posyandu_id    CHAR(36) NOT NULL,
  nama           VARCHAR(150) NOT NULL,
  usia_kehamilan INT,
  hpht           DATE,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ibuhamil_posyandu FOREIGN KEY (posyandu_id) REFERENCES posyandu(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pengukuran (
  id             CHAR(36) PRIMARY KEY,
  balita_id      CHAR(36) NOT NULL,
  posyandu_id    CHAR(36) NOT NULL,
  tanggal_ukur   DATE NOT NULL,
  berat_badan    DECIMAL(5,2) NOT NULL,
  tinggi_badan   DECIMAL(5,2) NOT NULL,
  lingkar_kepala DECIMAL(5,2),
  catatan        TEXT,
  created_by     CHAR(36),
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pengukuran_balita FOREIGN KEY (balita_id) REFERENCES balita(id) ON DELETE CASCADE,
  CONSTRAINT fk_pengukuran_posyandu FOREIGN KEY (posyandu_id) REFERENCES posyandu(id) ON DELETE CASCADE,
  INDEX idx_pengukuran_balita (balita_id),
  INDEX idx_pengukuran_posyandu (posyandu_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS jadwal (
  id          CHAR(36) PRIMARY KEY,
  posyandu_id CHAR(36) NOT NULL,
  judul       VARCHAR(150) NOT NULL,
  tanggal     DATE NOT NULL,
  waktu       VARCHAR(50),
  tempat      VARCHAR(150),
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_jadwal_posyandu FOREIGN KEY (posyandu_id) REFERENCES posyandu(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS kegiatan (
  id               CHAR(36) PRIMARY KEY,
  posyandu_id      CHAR(36) NOT NULL,
  judul            VARCHAR(255) NOT NULL,
  deskripsi        TEXT NOT NULL,
  foto             TEXT,
  tanggal_kegiatan DATE NOT NULL,
  lokasi           VARCHAR(255),
  created_by       CHAR(36),
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_kegiatan_posyandu FOREIGN KEY (posyandu_id) REFERENCES posyandu(id) ON DELETE CASCADE,
  CONSTRAINT fk_kegiatan_users FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_kegiatan_posyandu (posyandu_id),
  INDEX idx_kegiatan_tanggal (tanggal_kegiatan)
) ENGINE=InnoDB;

