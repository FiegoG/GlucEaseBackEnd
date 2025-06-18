-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 18, 2025 at 04:54 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_glueaseapp`
--

-- --------------------------------------------------------

--
-- Table structure for table `articles`
--

CREATE TABLE `articles` (
  `id` bigint(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `author` varchar(50) DEFAULT NULL,
  `content` text NOT NULL,
  `genre` enum('kesehatan','lifestyle') DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `blood_sugar_records`
--

CREATE TABLE `blood_sugar_records` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `blood_sugar_level` decimal(10,0) NOT NULL,
  `check_date` date NOT NULL,
  `check_time` time NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `blood_sugar_records`
--

INSERT INTO `blood_sugar_records` (`id`, `user_id`, `blood_sugar_level`, `check_date`, `check_time`, `created_at`, `updated_at`) VALUES
(11, 4, 100, '2025-06-05', '11:23:00', '2025-06-05 04:23:34', '2025-06-05 04:23:34'),
(12, 4, 120, '2025-06-05', '13:00:00', '2025-06-05 04:24:06', '2025-06-05 04:24:06'),
(13, 4, 100, '2025-06-14', '08:10:27', '2025-06-14 02:12:03', '2025-06-14 02:12:03');

-- --------------------------------------------------------

--
-- Table structure for table `consultation_bookings`
--

CREATE TABLE `consultation_bookings` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `doctor_id` bigint(20) NOT NULL,
  `consultation_date` date NOT NULL,
  `consultation_time` time NOT NULL,
  `meeting_link` varchar(255) NOT NULL,
  `base_fee` decimal(10,0) NOT NULL,
  `discount_amount` decimal(10,0) NOT NULL DEFAULT 0,
  `total_amount` decimal(10,0) NOT NULL,
  `coupon_code` varchar(50) DEFAULT NULL,
  `status` enum('pending','completed','failed','confirmed') DEFAULT 'pending',
  `payment_status` enum('pending','paid','failed') NOT NULL DEFAULT 'pending',
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_reference` varchar(255) DEFAULT NULL,
  `booking_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `coupons`
--

CREATE TABLE `coupons` (
  `id` bigint(20) NOT NULL,
  `code` varchar(50) NOT NULL,
  `discount_type` enum('percentage','fixed') NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_amount` decimal(10,2) DEFAULT 0.00,
  `max_usage` int(11) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `expired_at` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `coupons`
--

INSERT INTO `coupons` (`id`, `code`, `discount_type`, `discount_value`, `min_amount`, `max_usage`, `is_active`, `expired_at`, `created_at`, `updated_at`) VALUES
(1, 'DISKON50', 'percentage', 50.00, 0.00, 1, 1, '2025-06-05', '2025-05-29 21:07:39', '2025-06-04 09:02:15');

-- --------------------------------------------------------

--
-- Table structure for table `daily_health_metrics`
--

CREATE TABLE `daily_health_metrics` (
  `id` bigint(20) NOT NULL,
  `weekly_report_id` bigint(20) NOT NULL,
  `date` date NOT NULL,
  `day_of_week` varchar(20) NOT NULL,
  `daily_sugar_intake` decimal(10,0) NOT NULL,
  `sugar_intake_status` varchar(50) NOT NULL,
  `daily_blood_sugar` decimal(10,0) NOT NULL,
  `blood_sugar_status` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `daily_health_metrics`
--

INSERT INTO `daily_health_metrics` (`id`, `weekly_report_id`, `date`, `day_of_week`, `daily_sugar_intake`, `sugar_intake_status`, `daily_blood_sugar`, `blood_sugar_status`, `created_at`, `updated_at`) VALUES
(1, 6, '2025-05-26', 'Senin', 26, 'Normal', 90, 'Normal', '2025-06-05 01:27:02', '2025-06-05 01:27:02'),
(2, 6, '2025-05-27', 'Selasa', 30, 'Sedang', 96, 'Normal', '2025-06-05 01:27:02', '2025-06-05 01:27:02'),
(3, 6, '2025-05-28', 'Rabu', 40, 'Tinggi', 110, 'Pre-diabetes', '2025-06-05 01:27:02', '2025-06-05 01:27:02'),
(4, 6, '2025-05-29', 'Kamis', 20, 'Rendah', 85, 'Normal', '2025-06-05 01:27:02', '2025-06-05 01:27:02'),
(5, 6, '2025-05-30', 'Jumat', 36, 'Sedang', 100, 'Normal', '2025-06-05 01:27:02', '2025-06-05 01:27:02'),
(6, 6, '2025-05-31', 'Sabtu', 50, 'Tinggi', 121, 'Pre-diabetes', '2025-06-05 01:27:02', '2025-06-05 01:27:02'),
(7, 6, '2025-06-01', 'Minggu', 28, 'Normal', 92, 'Normal', '2025-06-05 01:27:02', '2025-06-05 01:27:02'),
(8, 7, '2025-06-02', '2', 12, '', 0, '', '2025-06-14 02:17:27', '2025-06-14 02:17:27'),
(9, 7, '2025-06-05', '5', 42, '', 110, '', '2025-06-14 02:17:27', '2025-06-14 02:17:27'),
(10, 7, '2025-06-07', '7', 0, '', 0, '', '2025-06-14 02:17:27', '2025-06-14 02:17:27'),
(11, 7, '2025-06-03', '3', 0, '', 0, '', '2025-06-14 02:17:27', '2025-06-14 02:17:27'),
(12, 7, '2025-06-04', '4', 0, '', 0, '', '2025-06-14 02:17:27', '2025-06-14 02:17:27'),
(13, 7, '2025-06-06', '6', 0, '', 0, '', '2025-06-14 02:17:27', '2025-06-14 02:17:27'),
(14, 7, '2025-06-08', '1', 0, '', 0, '', '2025-06-14 02:17:27', '2025-06-14 02:17:27'),
(15, 8, '2025-06-02', '2', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(16, 8, '2025-06-08', '1', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(17, 8, '2025-06-07', '7', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(18, 8, '2025-06-03', '3', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(19, 8, '2025-06-04', '4', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(20, 8, '2025-06-05', '5', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(21, 8, '2025-06-06', '6', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(22, 9, '2025-06-02', '2', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(23, 9, '2025-06-03', '3', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(24, 9, '2025-06-04', '4', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(25, 9, '2025-06-05', '5', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(26, 9, '2025-06-06', '6', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(27, 9, '2025-06-07', '7', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(28, 9, '2025-06-08', '1', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(29, 10, '2025-06-02', '2', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(30, 10, '2025-06-03', '3', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(31, 10, '2025-06-04', '4', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(32, 10, '2025-06-05', '5', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(33, 10, '2025-06-06', '6', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(34, 10, '2025-06-07', '7', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(35, 10, '2025-06-08', '1', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(36, 11, '2025-06-02', '2', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(37, 11, '2025-06-03', '3', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(38, 11, '2025-06-04', '4', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(39, 11, '2025-06-05', '5', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(40, 11, '2025-06-06', '6', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(41, 11, '2025-06-07', '7', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(42, 11, '2025-06-08', '1', 0, '', 0, '', '2025-06-14 02:58:00', '2025-06-14 02:58:00');

-- --------------------------------------------------------

--
-- Table structure for table `daily_missions`
--

CREATE TABLE `daily_missions` (
  `id` bigint(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `reward_type` enum('discount','voucher','none','point') NOT NULL,
  `reward_value` varchar(255) DEFAULT NULL,
  `target_value` int(11) NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `mission_logic_type` varchar(50) DEFAULT NULL,
  `trigger_event_key` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `point_reward` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `daily_missions`
--

INSERT INTO `daily_missions` (`id`, `title`, `description`, `reward_type`, `reward_value`, `target_value`, `is_active`, `mission_logic_type`, `trigger_event_key`, `created_at`, `updated_at`, `point_reward`) VALUES
(5, 'Cek gula darah & input ke tracker', 'Cek gula darah Anda hari ini menggunakan glukometer dan catat hasilnya di fitur tracker untuk memantau kondisi Anda.', 'point', '100', 1, 1, 'COUNT_UP', 'log_blood_sugar', '2025-06-17 01:27:51', '2025-06-17 01:27:51', 100),
(6, 'Konsumsi gula < 35g hari ini', 'Jaga asupan gula harian Anda di bawah 35 gram. Catat setiap makanan yang Anda konsumsi di food tracker untuk memonitor progresnya.', 'point', '200', 35, 1, 'STAY_BELOW_SUM', 'log_food_item', '2025-06-17 01:27:51', '2025-06-17 01:27:51', 200),
(7, 'Tambahkan 1 makanan ke trakcer hari ini', 'Catat setidaknya satu jenis makanan atau minuman yang Anda konsumsi hari ini ke dalam fitur food tracker.', 'point', '50', 1, 1, 'COUNT_UP', 'log_food_item', '2025-06-17 01:27:51', '2025-06-17 01:27:51', 0),
(8, 'Baca 1 artikel kesehatan di GlucEase', 'Tambah wawasan Anda tentang kesehatan dengan membaca satu artikel pilihan yang ada di aplikasi GlucEase hari ini.', 'point', '50', 1, 1, 'COUNT_UP', 'read_article', '2025-06-17 01:27:51', '2025-06-17 01:27:51', 50);

-- --------------------------------------------------------

--
-- Table structure for table `doctor_profiles`
--

CREATE TABLE `doctor_profiles` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `expertise` varchar(150) NOT NULL,
  `bio` text NOT NULL,
  `rating` decimal(3,0) NOT NULL DEFAULT 5,
  `consultation_fee` decimal(10,0) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctor_profiles`
--

INSERT INTO `doctor_profiles` (`id`, `user_id`, `expertise`, `bio`, `rating`, `consultation_fee`, `is_active`, `created_at`, `updated_at`) VALUES
(7, 7, 'Organ Dalam', 'Saya dokter rudi panjaitan', 5, 100000, 1, '2025-06-14 03:45:29', '2025-06-14 03:45:29');

-- --------------------------------------------------------

--
-- Table structure for table `doctor_schedules`
--

CREATE TABLE `doctor_schedules` (
  `id` bigint(20) NOT NULL,
  `doctor_id` bigint(20) NOT NULL,
  `available_time` time NOT NULL,
  `available_date` date NOT NULL,
  `is_booked` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctor_schedules`
--

INSERT INTO `doctor_schedules` (`id`, `doctor_id`, `available_time`, `available_date`, `is_booked`, `created_at`, `updated_at`) VALUES
(4, 7, '12:45:35', '2025-06-14', 0, '2025-06-14 03:46:10', '2025-06-14 03:46:10'),
(5, 7, '12:48:05', '2025-06-15', 0, '2025-06-14 03:48:21', '2025-06-14 03:48:21'),
(7, 7, '18:48:25', '2025-06-14', 0, '2025-06-14 03:48:44', '2025-06-14 03:48:44'),
(8, 7, '08:42:06', '2025-06-15', 0, '2025-06-14 04:42:26', '2025-06-14 04:42:26'),
(9, 7, '11:50:00', '2025-06-21', 0, '2025-06-14 04:50:47', '2025-06-14 04:50:47'),
(10, 7, '15:50:02', '2025-07-02', 0, '2025-06-14 04:50:47', '2025-06-14 04:50:47');

-- --------------------------------------------------------

--
-- Table structure for table `foods`
--

CREATE TABLE `foods` (
  `id` bigint(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `portion_detail` varchar(150) NOT NULL,
  `sugar` decimal(10,2) NOT NULL,
  `carbohydrate` decimal(10,2) NOT NULL,
  `protein` decimal(10,2) NOT NULL,
  `calories` decimal(10,2) NOT NULL,
  `benefits` text NOT NULL,
  `risks` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `foods`
--

INSERT INTO `foods` (`id`, `name`, `portion_detail`, `sugar`, `carbohydrate`, `protein`, `calories`, `benefits`, `risks`, `created_at`, `updated_at`) VALUES
(1, 'Nasi Putih', '100', 0.00, 31.00, 4.00, 149.00, 'Mendukung kesehatan tulang, saraf, dan otot karena mengandung magnesium.\r\nMeningkatkan kesehatan usus besar karena mengandung pati resisten.\r\nAman untuk pengidap penyakit Celiac.\r\nMenjadi sumber energi yang cepat dan mudah diserap oleh tubuh.\r\nMudah dicerna.\r\nMendukung kesehatan otak.\r\nMeningkatkan mood.\r\nAlternatif sumber folat.', 'Meningkatkan gula darah\r\nMencegah penyerapan vitamin dan mineral\r\nMemengaruhi metabolisme glukosa dalam tubuh\r\nMemicu sembelit\r\nTidak sesuai pola diet seimbang', '2025-05-25 15:43:02', '2025-05-25 15:43:02'),
(2, 'Mie Instan', '80', 6.00, 52.00, 8.00, 350.00, 'Sumber energi darurat dan murah\r\nPraktis', 'Kurang Gizi\r\nKanker\r\nGangguan metabolisme tubuh\r\nMasalah pencernaan\r\nObesitas', '2025-05-25 15:43:02', '2025-05-25 15:43:02');

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` bigint(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `password_resets`
--

INSERT INTO `password_resets` (`id`, `email`, `token`, `expires_at`, `created_at`) VALUES
(1, 'johndoe@example.com', 'hq2JFe', '2025-05-26 22:39:31', '2025-05-24 01:54:36');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `payment_type` varchar(100) NOT NULL,
  `related_id` bigint(20) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(100) NOT NULL,
  `payment_status` enum('pending','paid','failed') NOT NULL,
  `payment_reference` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pemium_features`
--

CREATE TABLE `pemium_features` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `is_premium` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `point_transactions`
--

CREATE TABLE `point_transactions` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `type` enum('mission_complete','reward_claim') DEFAULT NULL,
  `source_id` bigint(20) DEFAULT NULL,
  `points` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `point_transactions`
--

INSERT INTO `point_transactions` (`id`, `user_id`, `type`, `source_id`, `points`, `created_at`) VALUES
(1, 4, '', 0, 300, '2025-06-04 11:46:26');

-- --------------------------------------------------------

--
-- Table structure for table `premium_packacges`
--

CREATE TABLE `premium_packacges` (
  `id` bigint(20) NOT NULL,
  `package_name` varchar(100) NOT NULL,
  `duration_monts` int(11) NOT NULL,
  `price` decimal(10,0) NOT NULL,
  `description` text NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `premium_packacges`
--

INSERT INTO `premium_packacges` (`id`, `package_name`, `duration_monts`, `price`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Langganan Bulanan', 1, 30000, 'Nikmati semua fitur premium GlucEase selama 1 bulan penuh! \r\nTermasuk akses misi harian premium, \r\ntukar poin dengan reward eksklusif, \r\ndan konsultasi gratis 1x.\'', 1, '2025-06-04 15:02:02', '2025-06-04 15:02:02'),
(2, 'Langganan Tahunan', 12, 300000, 'Dapatkan akses tanpa batas ke semua fitur premium GlucEase selama 1 tahun dengan harga lebih hemat (Diskon 20% dibandingkan bulanan)! \r\nNikmati semua benefit: misi harian premium, tukar poin, dan konsultasi gratis 1x per 3 bulan.', 1, '2025-06-04 15:02:02', '2025-06-04 15:02:02');

-- --------------------------------------------------------

--
-- Table structure for table `reminders`
--

CREATE TABLE `reminders` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `reminder_time` time NOT NULL,
  `reminder_days` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`reminder_days`)),
  `message` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rewards_catalog`
--

CREATE TABLE `rewards_catalog` (
  `id` bigint(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `point_cost` int(11) NOT NULL,
  `reward_type` enum('coupon','virtual_item','direct_points_back') NOT NULL,
  `linked_coupon_id` bigint(20) DEFAULT NULL,
  `stock` int(11) NOT NULL,
  `is_active_in_store` tinyint(1) NOT NULL DEFAULT 1,
  `validity_days_after_claim` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sugar_intake_records`
--

CREATE TABLE `sugar_intake_records` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `food_id` bigint(20) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sugar_intake_records`
--

INSERT INTO `sugar_intake_records` (`id`, `user_id`, `food_id`, `quantity`, `date`, `created_at`, `updated_at`) VALUES
(2, 4, 2, 1, '2025-06-01', '2025-05-31 21:26:58', '2025-05-31 21:26:58'),
(3, 4, 1, 1, '2025-06-01', '2025-06-01 12:56:28', '2025-06-01 12:56:28'),
(4, 4, 1, 1, '2025-06-02', '2025-06-01 19:23:38', '2025-06-01 19:23:38'),
(5, 4, 2, 2, '2025-06-02', '2025-06-02 07:38:09', '2025-06-02 07:38:29'),
(6, 4, 2, 7, '2025-06-05', '2025-06-04 21:56:58', '2025-06-05 04:36:08'),
(7, 4, 1, 4, '2025-06-05', '2025-06-04 21:57:20', '2025-06-05 04:32:15'),
(8, 4, 2, 1, '2025-06-14', '2025-06-14 02:12:38', '2025-06-14 02:12:38');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) NOT NULL,
  `role` enum('user','doctor') NOT NULL DEFAULT 'user',
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `province` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `login_method` enum('email','google') NOT NULL DEFAULT 'email',
  `verify_token` varchar(100) NOT NULL,
  `email_verified_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `role`, `name`, `email`, `province`, `city`, `password`, `created_at`, `updated_at`, `login_method`, `verify_token`, `email_verified_at`) VALUES
(1, 'user', 'andik', 'andik@gmail.com', 'sumatra', 'lampung', 'andik123', '2025-04-28 07:02:06', '2025-04-28 07:02:06', 'email', '', '2025-05-20 00:28:12'),
(2, 'user', 'Budi Santoso', 'budi.santoso@example.com', 'Jawa Timur', 'Malang', '$2b$12$L8SLHHInhoX84lRc5RCtXepx9/AVlynvxXZFd2mQs7RXuBRQxdvia', '2025-05-20 00:54:20', '2025-05-20 00:54:20', 'email', '', '2025-05-24 01:53:44'),
(3, 'user', 'John Doe', 'johndoe@example.com', 'Jawa Timur', 'Malang', '$2b$12$REKCOcYTCvFv7RhBhu2GquefOZ7cFJw38trjSTKbqnKnBIZLXFwpy', '2025-05-24 01:50:33', '2025-05-24 01:50:33', 'email', '', '2025-05-24 01:53:25'),
(4, 'user', 'Fxepher', 'fotoxepher@gmail.com', 'Jawa Timur', 'Malang', '$2b$12$8cmTyr6imBuIby0GOXwYoO3rVADgvan.7GwKkCsNp7p.LE5//3Taa', '2025-05-26 22:26:16', '2025-05-26 22:43:46', 'email', '', '2025-05-26 22:34:38'),
(6, 'user', 'safer', 'gameplaysafer@gmail.com', 'Jatim', 'malang', '$2b$12$ztPyR4Ajvfg.jlIWP7Jwy.TDJ9eQmOKqpwTB8LDJ18iAAxS3Z4YAq', '2025-05-30 18:18:17', '2025-05-30 18:18:17', 'email', 'gKCpkYtkZlMejGdoMBN4q', '2025-05-30 18:18:17'),
(7, 'doctor', 'Rudi', 'rudi@gmail.com', 'Jawa Timur', 'Malang', 'rudibotak', '2025-06-14 03:44:53', '2025-06-14 03:44:53', 'email', '', '2025-06-14 03:44:53');

-- --------------------------------------------------------

--
-- Table structure for table `user_claimed_rewards`
--

CREATE TABLE `user_claimed_rewards` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `reward_catalog_id` bigint(20) NOT NULL,
  `claimed_coupon_id` bigint(20) DEFAULT NULL,
  `coupon_code_instance` varchar(50) DEFAULT NULL,
  `claimed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `point_transaction_id` bigint(20) NOT NULL,
  `status` enum('active','used','expired') NOT NULL,
  `instance_expired_at` timestamp NULL DEFAULT NULL,
  `used_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_coupons`
--

CREATE TABLE `user_coupons` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `coupon_code` varchar(50) NOT NULL,
  `used_count` int(11) DEFAULT 0,
  `last_used_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_mission_records`
--

CREATE TABLE `user_mission_records` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `mission_id` bigint(20) NOT NULL,
  `status` enum('in_progress','completed','failed') NOT NULL DEFAULT 'in_progress',
  `reward_claimed` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `progress` int(11) DEFAULT 0,
  `completed_at` timestamp NULL DEFAULT NULL,
  `available_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_points`
--

CREATE TABLE `user_points` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `total_points` int(11) NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_points`
--

INSERT INTO `user_points` (`id`, `user_id`, `total_points`, `updated_at`) VALUES
(1, 4, 300, '2025-06-04 11:46:26');

-- --------------------------------------------------------

--
-- Table structure for table `user_premium_subscriptions`
--

CREATE TABLE `user_premium_subscriptions` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `package_id` bigint(20) NOT NULL,
  `transaction_id` bigint(20) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(4) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_premium_subscriptions`
--

INSERT INTO `user_premium_subscriptions` (`id`, `user_id`, `package_id`, `transaction_id`, `start_date`, `end_date`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 4, 1, 1, '2025-06-04', '2025-06-04', 0, '2025-06-04 15:12:35', '2025-06-04 15:13:25'),
(2, 4, 1, 2, '2025-06-05', '2025-07-05', 0, '2025-06-04 19:41:01', '2025-06-05 04:08:40'),
(3, 4, 1, 3, '2025-06-05', '2025-07-05', 0, '2025-06-05 04:08:40', '2025-06-05 04:09:07'),
(4, 4, 2, 4, '2025-06-05', '2026-06-05', 0, '2025-06-05 04:09:07', '2025-06-05 04:11:36'),
(5, 4, 1, 5, '2025-06-05', '2025-07-05', 1, '2025-06-05 04:11:36', '2025-06-05 04:11:36');

-- --------------------------------------------------------

--
-- Table structure for table `user_premium_transactions`
--

CREATE TABLE `user_premium_transactions` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `package_id` bigint(20) NOT NULL,
  `transaction_amount` decimal(10,0) NOT NULL,
  `transaction_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `payment_method` varchar(50) NOT NULL,
  `payment_status` enum('pending','completed','failed') NOT NULL,
  `payment_reference` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_premium_transactions`
--

INSERT INTO `user_premium_transactions` (`id`, `user_id`, `package_id`, `transaction_amount`, `transaction_date`, `payment_method`, `payment_status`, `payment_reference`, `created_at`, `updated_at`) VALUES
(1, 4, 1, 30000, '2025-06-04 15:12:35', 'bypassed', 'completed', 'BYPASS_SYSTEM', '2025-06-04 15:12:35', '2025-06-04 15:12:35'),
(2, 4, 1, 30000, '2025-06-04 19:41:01', 'bypassed', 'completed', 'BYPASS_SYSTEM', '2025-06-04 19:41:01', '2025-06-04 19:41:01'),
(3, 4, 1, 30000, '2025-06-05 04:08:40', 'bypassed', 'completed', 'BYPASS_SYSTEM', '2025-06-05 04:08:40', '2025-06-05 04:08:40'),
(4, 4, 2, 300000, '2025-06-05 04:09:07', 'bypassed', 'completed', 'BYPASS_SYSTEM', '2025-06-05 04:09:07', '2025-06-05 04:09:07'),
(5, 4, 1, 30000, '2025-06-05 04:11:36', 'bypassed', 'completed', 'BYPASS_SYSTEM', '2025-06-05 04:11:36', '2025-06-05 04:11:36');

-- --------------------------------------------------------

--
-- Table structure for table `user_profiles`
--

CREATE TABLE `user_profiles` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `gender` enum('man','woman') NOT NULL,
  `age` int(11) NOT NULL,
  `weight` decimal(10,0) NOT NULL,
  `height` decimal(10,0) NOT NULL,
  `exercise_intensity` enum('jarang','kadang','sering','rutin') NOT NULL,
  `last_sugar_check` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `fasting_behaviour` varchar(100) DEFAULT NULL,
  `medical_history` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_profiles`
--

INSERT INTO `user_profiles` (`id`, `user_id`, `gender`, `age`, `weight`, `height`, `exercise_intensity`, `last_sugar_check`, `created_at`, `updated_at`, `fasting_behaviour`, `medical_history`) VALUES
(2, 3, 'man', 30, 75, 175, 'jarang', '2025-05-20', '2025-05-24 02:06:04', '2025-05-24 02:06:04', 'regular', 'diabetes type 2');

-- --------------------------------------------------------

--
-- Table structure for table `weekly_reports`
--

CREATE TABLE `weekly_reports` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `week_start_date` date NOT NULL,
  `week_end_date` date NOT NULL,
  `sugar_intake_summary` text NOT NULL,
  `blood_sugar_summary` text NOT NULL,
  `blood_sugar_recomendation` text NOT NULL,
  `sugar_intake_recomendations` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `weekly_reports`
--

INSERT INTO `weekly_reports` (`id`, `user_id`, `week_start_date`, `week_end_date`, `sugar_intake_summary`, `blood_sugar_summary`, `blood_sugar_recomendation`, `sugar_intake_recomendations`, `created_at`, `updated_at`) VALUES
(1, 4, '2025-05-25', '2025-05-31', '{\"kesimpulan\":\"Tidak ada data asupan gula yang tercatat minggu ini.\",\"saran\":[\"Mulai mencatat asupan makanan harian\",\"Perhatikan kandungan gula dalam makanan\",\"Konsultasikan pola makan dengan ahli gizi\"],\"peringatan\":null}', '{\"kesimpulan\":\"Terjadi kesalahan dalam menganalisis data gula darah.\",\"saran\":[\"Konsultasikan dengan dokter untuk evaluasi lebih lanjut\"],\"peringatan\":\"Selalu konsultasikan hasil dengan tenaga medis profesional\"}', '', '', '2025-06-03 20:19:30', '2025-06-03 20:19:30'),
(2, 4, '2025-05-25', '2025-05-31', '{\"kesimpulan\":\"Tidak ada data asupan gula yang tercatat minggu ini.\",\"saran\":[\"Mulai mencatat asupan makanan harian\",\"Perhatikan kandungan gula dalam makanan\",\"Konsultasikan pola makan dengan ahli gizi\"],\"peringatan\":null}', '{\"kesimpulan\":\"Terjadi kesalahan dalam menganalisis data gula darah.\",\"saran\":[\"Konsultasikan dengan dokter untuk evaluasi lebih lanjut\"],\"peringatan\":\"Selalu konsultasikan hasil dengan tenaga medis profesional\"}', '', '', '2025-06-03 20:29:24', '2025-06-03 20:29:24'),
(3, 4, '2025-05-25', '2025-05-31', '{\"kesimpulan\":\"Tidak ada data asupan gula yang tercatat minggu ini.\",\"saran\":[\"Mulai mencatat asupan makanan harian\",\"Perhatikan kandungan gula dalam makanan\",\"Konsultasikan pola makan dengan ahli gizi\"],\"peringatan\":null}', '{\"kesimpulan\":\"Terjadi kesalahan dalam menganalisis data gula darah.\",\"saran\":[\"Konsultasikan dengan dokter untuk evaluasi lebih lanjut\"],\"peringatan\":\"Selalu konsultasikan hasil dengan tenaga medis profesional\"}', '', '', '2025-06-03 20:35:42', '2025-06-03 20:35:42'),
(4, 4, '2025-05-25', '2025-05-31', '{\"kesimpulan\":\"Tidak ada data asupan gula yang tercatat minggu ini.\",\"saran\":[\"Mulai mencatat asupan makanan harian\",\"Perhatikan kandungan gula dalam makanan\",\"Konsultasikan pola makan dengan ahli gizi\"],\"peringatan\":null}', '{\"kesimpulan\":\"Terjadi kesalahan dalam menganalisis data gula darah.\",\"saran\":[\"Konsultasikan dengan dokter untuk evaluasi lebih lanjut\"],\"peringatan\":\"Selalu konsultasikan hasil dengan tenaga medis profesional\"}', '', '', '2025-06-03 20:49:46', '2025-06-03 20:49:46'),
(5, 1, '2025-05-25', '2025-05-31', '{\"kesimpulan\":\"AI under construction\",\"saran\":[\"AI under construction\"],\"peringatan\":\"AI under construction\"}', '{\"kesimpulan\":\"AI under construction\",\"saran\":[\"AI under construction\"],\"peringatan\":\"AI under construction\"}', '', '', '2025-06-03 22:10:00', '2025-06-03 22:10:00'),
(6, 4, '2025-05-26', '2025-06-01', '{\"kesimpulan\":\"AI under construction\",\"saran\":[\"AI under construction\"],\"peringatan\":\"AI under construction\"}', '{\"kesimpulan\":\"AI under construction\",\"saran\":[\"AI under construction\"],\"peringatan\":\"AI under construction\"}', '', '', '2025-06-04 07:02:07', '2025-06-04 07:02:07'),
(7, 4, '2025-06-02', '2025-06-08', 'AI under construction', 'AI under construction', 'AI under construction', 'AI under construction', '2025-06-14 02:17:27', '2025-06-14 02:17:27'),
(8, 1, '2025-06-02', '2025-06-08', 'AI under construction', 'AI under construction', 'AI under construction', 'AI under construction', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(9, 2, '2025-06-02', '2025-06-08', 'AI under construction', 'AI under construction', 'AI under construction', 'AI under construction', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(10, 3, '2025-06-02', '2025-06-08', 'AI under construction', 'AI under construction', 'AI under construction', 'AI under construction', '2025-06-14 02:58:00', '2025-06-14 02:58:00'),
(11, 6, '2025-06-02', '2025-06-08', 'AI under construction', 'AI under construction', 'AI under construction', 'AI under construction', '2025-06-14 02:58:00', '2025-06-14 02:58:00');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `articles`
--
ALTER TABLE `articles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `blood_sugar_records`
--
ALTER TABLE `blood_sugar_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `consultation_bookings`
--
ALTER TABLE `consultation_bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `daily_health_metrics`
--
ALTER TABLE `daily_health_metrics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `weekly_report_id` (`weekly_report_id`);

--
-- Indexes for table `daily_missions`
--
ALTER TABLE `daily_missions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `doctor_profiles`
--
ALTER TABLE `doctor_profiles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `doctor_schedules`
--
ALTER TABLE `doctor_schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `doctor_id` (`doctor_id`);

--
-- Indexes for table `foods`
--
ALTER TABLE `foods`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `pemium_features`
--
ALTER TABLE `pemium_features`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `point_transactions`
--
ALTER TABLE `point_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `premium_packacges`
--
ALTER TABLE `premium_packacges`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reminders`
--
ALTER TABLE `reminders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `rewards_catalog`
--
ALTER TABLE `rewards_catalog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `linked_coupon_id` (`linked_coupon_id`);

--
-- Indexes for table `sugar_intake_records`
--
ALTER TABLE `sugar_intake_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `food_id` (`food_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_claimed_rewards`
--
ALTER TABLE `user_claimed_rewards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `reward_catalog_id` (`reward_catalog_id`),
  ADD KEY `claimed_coupon_id` (`claimed_coupon_id`),
  ADD KEY `point_transaction_id` (`point_transaction_id`);

--
-- Indexes for table `user_coupons`
--
ALTER TABLE `user_coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_coupon` (`user_id`,`coupon_code`);

--
-- Indexes for table `user_mission_records`
--
ALTER TABLE `user_mission_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `mission_id` (`mission_id`);

--
-- Indexes for table `user_points`
--
ALTER TABLE `user_points`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `user_premium_subscriptions`
--
ALTER TABLE `user_premium_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `package_id` (`package_id`),
  ADD KEY `transaction_id` (`transaction_id`);

--
-- Indexes for table `user_premium_transactions`
--
ALTER TABLE `user_premium_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `package_id` (`package_id`);

--
-- Indexes for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `weekly_reports`
--
ALTER TABLE `weekly_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `articles`
--
ALTER TABLE `articles`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `blood_sugar_records`
--
ALTER TABLE `blood_sugar_records`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `consultation_bookings`
--
ALTER TABLE `consultation_bookings`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `coupons`
--
ALTER TABLE `coupons`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `daily_health_metrics`
--
ALTER TABLE `daily_health_metrics`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `daily_missions`
--
ALTER TABLE `daily_missions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `doctor_profiles`
--
ALTER TABLE `doctor_profiles`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `doctor_schedules`
--
ALTER TABLE `doctor_schedules`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `foods`
--
ALTER TABLE `foods`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pemium_features`
--
ALTER TABLE `pemium_features`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `point_transactions`
--
ALTER TABLE `point_transactions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `premium_packacges`
--
ALTER TABLE `premium_packacges`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `reminders`
--
ALTER TABLE `reminders`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rewards_catalog`
--
ALTER TABLE `rewards_catalog`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sugar_intake_records`
--
ALTER TABLE `sugar_intake_records`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `user_claimed_rewards`
--
ALTER TABLE `user_claimed_rewards`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_coupons`
--
ALTER TABLE `user_coupons`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_mission_records`
--
ALTER TABLE `user_mission_records`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_points`
--
ALTER TABLE `user_points`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `user_premium_subscriptions`
--
ALTER TABLE `user_premium_subscriptions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `user_premium_transactions`
--
ALTER TABLE `user_premium_transactions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `user_profiles`
--
ALTER TABLE `user_profiles`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `weekly_reports`
--
ALTER TABLE `weekly_reports`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `blood_sugar_records`
--
ALTER TABLE `blood_sugar_records`
  ADD CONSTRAINT `blood_sugar_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `consultation_bookings`
--
ALTER TABLE `consultation_bookings`
  ADD CONSTRAINT `consultation_bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `consultation_bookings_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `daily_health_metrics`
--
ALTER TABLE `daily_health_metrics`
  ADD CONSTRAINT `daily_health_metrics_ibfk_1` FOREIGN KEY (`weekly_report_id`) REFERENCES `weekly_reports` (`id`);

--
-- Constraints for table `doctor_profiles`
--
ALTER TABLE `doctor_profiles`
  ADD CONSTRAINT `doctor_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `doctor_schedules`
--
ALTER TABLE `doctor_schedules`
  ADD CONSTRAINT `doctor_schedules_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `point_transactions`
--
ALTER TABLE `point_transactions`
  ADD CONSTRAINT `point_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `reminders`
--
ALTER TABLE `reminders`
  ADD CONSTRAINT `reminders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `rewards_catalog`
--
ALTER TABLE `rewards_catalog`
  ADD CONSTRAINT `rewards_catalog_ibfk_1` FOREIGN KEY (`linked_coupon_id`) REFERENCES `coupons` (`id`);

--
-- Constraints for table `sugar_intake_records`
--
ALTER TABLE `sugar_intake_records`
  ADD CONSTRAINT `sugar_intake_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `sugar_intake_records_ibfk_2` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`);

--
-- Constraints for table `user_claimed_rewards`
--
ALTER TABLE `user_claimed_rewards`
  ADD CONSTRAINT `user_claimed_rewards_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `user_claimed_rewards_ibfk_2` FOREIGN KEY (`reward_catalog_id`) REFERENCES `rewards_catalog` (`id`),
  ADD CONSTRAINT `user_claimed_rewards_ibfk_3` FOREIGN KEY (`claimed_coupon_id`) REFERENCES `coupons` (`id`),
  ADD CONSTRAINT `user_claimed_rewards_ibfk_4` FOREIGN KEY (`point_transaction_id`) REFERENCES `point_transactions` (`id`);

--
-- Constraints for table `user_coupons`
--
ALTER TABLE `user_coupons`
  ADD CONSTRAINT `user_coupons_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_mission_records`
--
ALTER TABLE `user_mission_records`
  ADD CONSTRAINT `user_mission_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `user_mission_records_ibfk_2` FOREIGN KEY (`mission_id`) REFERENCES `daily_missions` (`id`);

--
-- Constraints for table `user_points`
--
ALTER TABLE `user_points`
  ADD CONSTRAINT `user_points_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `user_premium_subscriptions`
--
ALTER TABLE `user_premium_subscriptions`
  ADD CONSTRAINT `user_premium_subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `user_premium_subscriptions_ibfk_2` FOREIGN KEY (`transaction_id`) REFERENCES `user_premium_transactions` (`id`),
  ADD CONSTRAINT `user_premium_subscriptions_ibfk_3` FOREIGN KEY (`package_id`) REFERENCES `premium_packacges` (`id`);

--
-- Constraints for table `user_premium_transactions`
--
ALTER TABLE `user_premium_transactions`
  ADD CONSTRAINT `user_premium_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `user_premium_transactions_ibfk_2` FOREIGN KEY (`package_id`) REFERENCES `premium_packacges` (`id`);

--
-- Constraints for table `user_profiles`
--
ALTER TABLE `user_profiles`
  ADD CONSTRAINT `user_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `weekly_reports`
--
ALTER TABLE `weekly_reports`
  ADD CONSTRAINT `weekly_reports_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
