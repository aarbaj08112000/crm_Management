-- phpMyAdmin SQL Dump
-- version 5.1.1deb5ubuntu1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 07, 2026 at 12:05 PM
-- Server version: 8.0.45-0ubuntu0.22.04.1
-- PHP Version: 8.1.2-1ubuntu2.23

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `enquiry_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `enquiries`
--

CREATE TABLE `enquiries` (
  `enquiry_id` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `mobile_number` varchar(15) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text,
  `comment` text,
  `type` varchar(50) DEFAULT 'Other',
  `msg_sent` enum('No','Email','WhatsApp','Both') CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Pending',
  `added_by` int DEFAULT NULL,
  `added_date` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `enquiries`
--

INSERT INTO `enquiries` (`enquiry_id`, `name`, `contact_person`, `mobile_number`, `email`, `address`, `comment`, `type`, `msg_sent`, `status`, `added_by`, `added_date`) VALUES
(1, 'ARNIGENO Life Science Pvt Ltd_Anurag Chouske', 'Anurag Chouskey', '9098540893', NULL, 'Katni M.P.', '', 'school', 'No', 'Pending', NULL, '2026-05-06 14:44:39'),
(2, 'ACTIVE KIDS PLAY SCHOOL NAGOD_Purwar', 'Manoj Purwar Ji', '9516188690', NULL, 'Nagod, Satna', '', 'school', 'No', 'Pending', NULL, '2026-05-06 14:44:39'),
(3, 'YOUNG ACHIEVERS PUBLIC SCHOOL_Student Stationery Panna', 'Student Stationery Corner', '7067241590', NULL, 'Patna Tamoli, Panna', '', 'school', 'No', 'Pending', NULL, '2026-05-06 14:44:39'),
(4, 'Dpct Group_Syma Bee', 'Shyama Bee', '7582892105', NULL, 'V.Garh, Katni', '', 'school', 'No', 'Pending', NULL, '2026-05-06 14:44:39'),
(5, 'GLORIOUS STAR ACADEMY_Purwar Nagod', 'Manoj Purwar Ji', '8770161158', NULL, 'Chhatarpur MP', '', 'school', 'No', 'Pending', NULL, '2026-05-06 14:44:39'),
(6, 'Alpha Security & Manpower Service_Mukesh Rajak_Pawan Khare', 'Mukesh Rajak_Pawan Khare', '8770267966', NULL, 'Katni M.P.', '', 'office', 'No', 'Pending', NULL, '2026-05-06 14:44:39'),
(7, 'IRTCSO JABALPUR KATNI WCR RAILWAY', 'Satish Sharma', '9752186883', NULL, 'Katni NKJ WCR', '', 'school', 'No', 'Pending', NULL, '2026-05-06 14:44:39'),
(8, 'GOVT ITI DHIMARKHEDA_Anil Kumar Tiwati', 'Anil Kumar Tiwati', '9589691151', NULL, 'Katni M.P.', '', 'collage', 'No', 'Pending', NULL, '2026-05-06 14:44:39'),
(9, 'Staff_PM SHRI JAWAHAR NAVODAY VIDYALAYA_Badwara', 'K K Sharma Ji Badwara', '8878232431', NULL, 'Badwara, Katni', '', 'school', 'No', 'Pending', NULL, '2026-05-06 14:44:39'),
(10, 'Gayatri Narayan Hedau', 'Gayatri Narayan Hedau', '8381058482', NULL, 'Nagpur', '', 'Other', 'No', 'Pending', NULL, '2026-05-07 11:51:34');

-- --------------------------------------------------------

--
-- Table structure for table `user_master`
--

CREATE TABLE `user_master` (
  `user_id` int NOT NULL,
  `user_name` varchar(100) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `mobile` varchar(15) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` varchar(50) DEFAULT 'user',
  `status` tinyint DEFAULT '1',
  `added_date` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `user_master`
--

INSERT INTO `user_master` (`user_id`, `user_name`, `email`, `mobile`, `password`, `role`, `status`, `added_date`) VALUES
(1, 'Admin User', 'admin@gmail.com', '9876543210', '123456', 'admin', 1, '2026-05-06 14:18:16'),
(2, 'Sales User', 'sales@gmail.com', '9123456780', '123456', 'user', 1, '2026-05-06 14:18:16'),
(3, 'Manager', 'manager@gmail.com', '9988776655', '123456', 'manager', 1, '2026-05-06 14:18:16'),
(4, 'admin', 'admin@gmail.com', NULL, 'admin123', 'admin', 1, '2026-05-06 14:40:47');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `enquiries`
--
ALTER TABLE `enquiries`
  ADD PRIMARY KEY (`enquiry_id`),
  ADD KEY `added_by` (`added_by`);

--
-- Indexes for table `user_master`
--
ALTER TABLE `user_master`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `enquiries`
--
ALTER TABLE `enquiries`
  MODIFY `enquiry_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `user_master`
--
ALTER TABLE `user_master`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
