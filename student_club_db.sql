-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 20, 2025 at 05:14 AM
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
-- Database: `student_club_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `clubs`
--

CREATE TABLE `clubs` (
  `club_id` int(11) NOT NULL,
  `club_name` varchar(100) NOT NULL,
  `club_category` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `advisor_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `clubs`
--

INSERT INTO `clubs` (`club_id`, `club_name`, `club_category`, `description`, `advisor_name`, `created_at`, `updated_at`) VALUES
(3, 'Basketball Club', 'Sports', 'Play basketball and compete', 'Coach Michael Tan', '2025-11-13 07:42:06', '2025-11-13 07:42:06'),
(6, 'F1 Club', 'Sports', 'DUDUDUDU MAX VERSTAPPEN', 'Putera Adam Faisal Bin Erwan Shahrin', '2025-11-15 10:06:55', '2025-11-15 10:06:55'),
(11, 'Red Bull', 'Sports', 'Red Bull F1', 'Yuki Tsunoda', '2025-11-19 04:49:08', '2025-11-20 04:02:00'),
(12, 'FC Barcelona', 'Sports', 'Barcelona', 'Joan Laporta', '2025-11-20 03:48:56', '2025-11-20 03:48:56');

-- --------------------------------------------------------

--
-- Table structure for table `members`
--

CREATE TABLE `members` (
  `member_id` int(11) NOT NULL,
  `student_id` varchar(20) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `club_id` int(11) NOT NULL,
  `membership_type` enum('Regular','Committee','President') DEFAULT 'Regular',
  `registration_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `members`
--

INSERT INTO `members` (`member_id`, `student_id`, `full_name`, `email`, `phone`, `club_id`, `membership_type`, `registration_date`) VALUES
(4, 'AM43244324', 'Syaza', 'syaza@gmail.com', '0111111111', 3, 'Committee', '2025-11-13 09:44:42'),
(6, 'A003', 'Sarah Batrisyia', 'Sara@uni.edu.my', '0111111111', 6, 'Committee', '2025-11-15 10:13:40'),
(14, 'AB23110', 'Yamine Lamal', 'yaminelamal@gmail.com', '0982138707', 12, 'Regular', '2025-11-20 03:54:27');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `clubs`
--
ALTER TABLE `clubs`
  ADD PRIMARY KEY (`club_id`);

--
-- Indexes for table `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`member_id`),
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD KEY `club_id` (`club_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `clubs`
--
ALTER TABLE `clubs`
  MODIFY `club_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `members`
--
ALTER TABLE `members`
  MODIFY `member_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `members`
--
ALTER TABLE `members`
  ADD CONSTRAINT `members_ibfk_1` FOREIGN KEY (`club_id`) REFERENCES `clubs` (`club_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
