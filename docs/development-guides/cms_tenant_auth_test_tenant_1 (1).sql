-- phpMyAdmin SQL Dump
-- version 5.2.1deb1ubuntu0.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Feb 17, 2026 at 01:03 PM
-- Server version: 8.0.35-0ubuntu0.23.04.1
-- PHP Version: 8.1.12-1ubuntu4.3

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cms_tenant_auth_test_tenant_1`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity`
--

DROP TABLE IF EXISTS `activity`;
CREATE TABLE `activity` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Project scope for faster filtering',
  `action` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'create, update, delete, login, comment, authenticate, run, etc.',
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `collection` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Item ID',
  `comment` text COLLATE utf8mb4_unicode_ci COMMENT 'User comment on action',
  `origin` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'web, api, app, webhook, flow, etc.'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `api_keys`
--

DROP TABLE IF EXISTS `api_keys`;
CREATE TABLE `api_keys` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope` enum('draft','published') COLLATE utf8mb4_unicode_ci NOT NULL,
  `environment` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'prod',
  `permissions` json DEFAULT NULL COMMENT 'Scoped permissions for this key',
  `rate_limit` int DEFAULT NULL COMMENT 'Requests per hour',
  `expires_at` timestamp NULL DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `last_used_ip` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `api_rate_limits`
--

DROP TABLE IF EXISTS `api_rate_limits`;
CREATE TABLE `api_rate_limits` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `identifier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'API key hash, IP address, or user ID',
  `identifier_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'api_key, ip, user',
  `endpoint` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Specific endpoint path',
  `hits` int NOT NULL DEFAULT '0',
  `window_start` timestamp NOT NULL,
  `window_end` timestamp NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Project scope for faster filtering',
  `collection` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_created` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_updated` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_updated` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `content_entries`
--

DROP TABLE IF EXISTS `content_entries`;
CREATE TABLE `content_entries` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('draft','review','approved','published') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `published_version_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `scheduled_publish_at` timestamp NULL DEFAULT NULL,
  `scheduled_unpublish_at` timestamp NULL DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Extracted for search/display',
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'URL-friendly identifier',
  `search_index` text COLLATE utf8mb4_unicode_ci COMMENT 'Full-text searchable content',
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `content_entries_localized`
--

DROP TABLE IF EXISTS `content_entries_localized`;
CREATE TABLE `content_entries_localized` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entry_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `content_types`
--

DROP TABLE IF EXISTS `content_types`;
CREATE TABLE `content_types` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `collection` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `schema` json NOT NULL COMMENT 'Legacy - migrate to fields table',
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `display_template` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Directus: template for list display',
  `singleton` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Single item per collection',
  `archive_field` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Field name for soft-delete/archive',
  `sort_field` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Default sort field',
  `note` text COLLATE utf8mb4_unicode_ci COMMENT 'Collection description',
  `hidden` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Hide from explore/sidebar',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `content_types`
--

INSERT INTO `content_types` (`id`, `project_id`, `name`, `collection`, `icon`, `schema`, `is_system`, `display_template`, `singleton`, `archive_field`, `sort_field`, `note`, `hidden`, `created_at`, `updated_at`) VALUES
('a973fdc6-889b-4437-b1ef-372869ae384f', '389a0749-434d-49e6-9b05-7173dd086afe', 'blog', 'blog_demo', 'Mail', '{}', 0, NULL, 0, NULL, NULL, 'Description (optional) Description (optional) Description (optional)', 0, '2026-02-14 09:11:58', '2026-02-14 12:07:07'),
('b61d5718-6880-4a84-a43d-fbff5cac27d6', '389a0749-434d-49e6-9b05-7173dd086afe', 'Demo2', 'bemo2', 'Grid', '{}', 0, NULL, 0, NULL, NULL, 'Singleton (single item per collection)', 0, '2026-02-16 07:51:30', '2026-02-16 07:51:30'),
('d50d4549-cad7-44b5-9dd1-0f1e85ceda34', '389a0749-434d-49e6-9b05-7173dd086afe', 'Demo', 'demo', 'Globe', '{}', 0, NULL, 1, NULL, NULL, 'Demo content', 0, '2026-02-13 14:28:22', '2026-02-14 12:15:05');

-- --------------------------------------------------------

--
-- Table structure for table `content_versions`
--

DROP TABLE IF EXISTS `content_versions`;
CREATE TABLE `content_versions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entry_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version_number` int NOT NULL,
  `data` json NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Named snapshot/version',
  `hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Content hash for deduplication',
  `delta` json DEFAULT NULL COMMENT 'Changes from previous version',
  `collection` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fields`
--

DROP TABLE IF EXISTS `fields`;
CREATE TABLE `fields` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Field name/key',
  `type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'string, text, integer, float, boolean, json, uuid, datetime, date, time, timestamp, file, files, m2o, o2m, m2m, m2a, translations',
  `interface` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'UI widget: input, textarea, wysiwyg, select-dropdown, datetime, file, etc.',
  `special` json DEFAULT NULL COMMENT 'Special behaviors: ["cast-boolean", "uuid", "date-created", "user-created"]',
  `options` json DEFAULT NULL COMMENT 'Field-specific configuration',
  `display` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Display template: formatted-value, datetime, file, user, etc.',
  `display_options` json DEFAULT NULL,
  `readonly` tinyint(1) NOT NULL DEFAULT '0',
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `sort` int DEFAULT NULL,
  `width` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'half, full, fill',
  `group` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Field group/accordion ID',
  `translation` json DEFAULT NULL COMMENT 'Field labels per locale: {"en": "Title", "es": "Título"}',
  `note` text COLLATE utf8mb4_unicode_ci COMMENT 'Helper text for editors',
  `validation` json DEFAULT NULL COMMENT 'Validation rules',
  `validation_message` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `required` tinyint(1) NOT NULL DEFAULT '0',
  `conditions` json DEFAULT NULL COMMENT 'Conditional visibility rules',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `fields`
--

INSERT INTO `fields` (`id`, `content_type_id`, `field`, `type`, `interface`, `special`, `options`, `display`, `display_options`, `readonly`, `hidden`, `sort`, `width`, `group`, `translation`, `note`, `validation`, `validation_message`, `required`, `conditions`, `created_at`, `updated_at`) VALUES
('02ef79f2-f4cd-4e90-9b40-c1ddd6505774', 'a973fdc6-889b-4437-b1ef-372869ae384f', 'richtext', 'markdown', 'markdown-editor', NULL, '{\"type\": \"markdown\", \"label\": \"Rich text (Markdown)\", \"width\": \"full\", \"layout\": \"vertical\", \"unique\": false, \"private\": false, \"variant\": null, \"required\": false, \"settings\": {\"unique\": false, \"private\": false, \"required\": false, \"maxLength\": null, \"minLength\": null}, \"component\": \"markdown-editor\", \"localized\": false, \"maxLength\": null, \"minLength\": null, \"conditions\": [], \"helperText\": \"The classic rich text editor\", \"validation\": {\"rules\": [], \"maxLength\": null, \"minLength\": null}, \"defaultValue\": \"\"}', NULL, NULL, 0, 0, 1, NULL, NULL, NULL, 'The classic rich text editor', '{\"unique\": false, \"required\": false}', NULL, 0, NULL, '2026-02-16 07:42:49', '2026-02-16 08:11:22'),
('0bec50f6-85ee-4c45-ada3-33973eb00a11', 'a973fdc6-889b-4437-b1ef-372869ae384f', 'gggggg', 'schema', 'schema', NULL, '{\"type\": \"schema\", \"label\": \"Schema\", \"width\": \"full\", \"layout\": \"vertical\", \"unique\": false, \"private\": false, \"variant\": null, \"required\": false, \"schemaId\": \"d50d4549-cad7-44b5-9dd1-0f1e85ceda34\", \"settings\": {\"private\": false, \"required\": false}, \"component\": \"schema\", \"localized\": false, \"conditions\": [], \"helperText\": \"Reference to an existing data model\", \"schemaIcon\": \"Settings\", \"validation\": {\"rules\": []}, \"defaultValue\": null, \"schemaRepeatable\": false, \"schemaDisplayName\": \"dddd\"}', NULL, NULL, 0, 0, 0, NULL, NULL, NULL, 'Reference to an existing data model', '{\"unique\": false, \"required\": false}', NULL, 0, NULL, '2026-02-16 12:01:33', '2026-02-16 12:01:33'),
('1fcd3be8-74ed-4853-9dfa-7bfd6caec386', 'd50d4549-cad7-44b5-9dd1-0f1e85ceda34', 'Demo text', 'string', 'input', NULL, '{\"type\": \"text\", \"label\": \"Name\", \"width\": \"full\", \"layout\": \"vertical\", \"unique\": false, \"private\": false, \"variant\": \"short\", \"required\": false, \"settings\": {\"unique\": false, \"private\": false, \"required\": false, \"maxLength\": 255, \"minLength\": null}, \"component\": \"input\", \"maxLength\": null, \"minLength\": null, \"conditions\": [], \"helperText\": \"No space is allowed for the name of the attribute\", \"validation\": {\"rules\": []}, \"placeholder\": \"Enter text...\", \"defaultValue\": \"\", \"regexPattern\": \"\"}', NULL, NULL, 0, 0, 0, NULL, NULL, NULL, 'Small or long text like title or description', '{\"required\": true, \"maxLength\": 255}', NULL, 1, NULL, '2026-02-13 14:29:08', '2026-02-14 12:15:12'),
('2046ec7d-dd3a-47ec-aae6-f0404d07682b', 'a973fdc6-889b-4437-b1ef-372869ae384f', 'BooleanTest', 'boolean', 'toggle', NULL, '{\"type\": \"boolean\", \"label\": \"Published\", \"width\": \"full\", \"layout\": \"vertical\", \"unique\": false, \"private\": false, \"variant\": null, \"required\": false, \"settings\": {\"private\": false, \"required\": false}, \"component\": \"toggle\", \"localized\": false, \"conditions\": [], \"validation\": {\"rules\": []}, \"defaultValue\": false}', NULL, NULL, 1, 1, 0, NULL, NULL, NULL, 'Yes or no, 1 or 0, true or false', '{\"unique\": false, \"required\": true}', NULL, 1, NULL, '2026-02-14 11:11:49', '2026-02-17 06:05:16'),
('344b5701-6006-4c96-9be9-6770f40776af', 'a973fdc6-889b-4437-b1ef-372869ae384f', 'Test Json', 'json', 'json-editor', NULL, '{\"type\": \"json\", \"label\": \"JSON\", \"width\": \"full\", \"layout\": \"vertical\", \"private\": false, \"variant\": null, \"required\": false, \"settings\": {\"private\": false, \"required\": false}, \"component\": \"json-editor\", \"conditions\": [], \"helperText\": \"Data in JSON format\", \"validation\": {\"rules\": []}, \"defaultValue\": null}', NULL, NULL, 0, 0, 6, NULL, NULL, NULL, 'Data in JSON format', '{\"required\": true}', NULL, 1, NULL, '2026-02-14 11:02:42', '2026-02-16 08:11:22'),
('38285d29-d2d2-49d4-adaa-e2ac556120a9', 'a973fdc6-889b-4437-b1ef-372869ae384f', 'schema23', 'schema', 'schema', NULL, '{\"type\": \"schema\", \"label\": \"Schema\", \"width\": \"full\", \"layout\": \"vertical\", \"unique\": false, \"private\": false, \"variant\": null, \"required\": false, \"schemaId\": \"b61d5718-6880-4a84-a43d-fbff5cac27d6\", \"settings\": {\"private\": false, \"required\": false}, \"component\": \"schema\", \"localized\": false, \"conditions\": [], \"helperText\": \"Reference to an existing data model\", \"schemaIcon\": \"Mail\", \"validation\": {\"rules\": []}, \"defaultValue\": null, \"schemaRepeatable\": false, \"schemaDisplayName\": \"kkkk\"}', NULL, NULL, 0, 0, 0, NULL, NULL, NULL, 'Reference to an existing data model', '{\"unique\": false, \"required\": false}', NULL, 0, NULL, '2026-02-16 12:06:46', '2026-02-16 12:06:46'),
('5edd12ea-b804-4bec-b65e-983f73838079', 'a973fdc6-889b-4437-b1ef-372869ae384f', 'textcheck', 'string', 'input', NULL, '{\"type\": \"text\", \"label\": \"Name\", \"width\": \"full\", \"layout\": \"vertical\", \"unique\": false, \"private\": false, \"variant\": \"short\", \"required\": false, \"settings\": {\"unique\": false, \"private\": false, \"required\": false, \"maxLength\": 255, \"minLength\": null}, \"component\": \"input\", \"localized\": false, \"maxLength\": null, \"minLength\": null, \"conditions\": [], \"helperText\": \"No space is allowed for the name of the attribute\", \"validation\": {\"rules\": []}, \"placeholder\": \"Enter text...\", \"defaultValue\": \"\"}', NULL, NULL, 0, 0, 0, NULL, NULL, NULL, 'Small or long text like title or description', '{\"unique\": false, \"required\": false}', NULL, 0, NULL, '2026-02-17 07:00:58', '2026-02-17 07:00:58'),
('62c37ef8-a7a9-4640-a663-6c20d4301674', 'a973fdc6-889b-4437-b1ef-372869ae384f', 'ffff45', 'schema', 'schema', NULL, '{\"type\": \"schema\", \"label\": \"Schema\", \"width\": \"full\", \"layout\": \"vertical\", \"unique\": false, \"private\": false, \"variant\": null, \"required\": false, \"schemaId\": \"b61d5718-6880-4a84-a43d-fbff5cac27d6\", \"settings\": {\"private\": false, \"required\": false}, \"component\": \"schema\", \"localized\": false, \"conditions\": [], \"helperText\": \"Reference to an existing data model\", \"schemaIcon\": \"Mail\", \"validation\": {\"rules\": []}, \"defaultValue\": null, \"schemaRepeatable\": true, \"schemaDisplayName\": \"hhhh\"}', NULL, NULL, 0, 0, 0, NULL, NULL, NULL, 'Reference to an existing data model', '{\"unique\": false, \"required\": false}', NULL, 0, NULL, '2026-02-16 12:10:01', '2026-02-17 06:07:42'),
('6d1a8f0f-bc90-40fd-9cac-25781c400fc2', 'a973fdc6-889b-4437-b1ef-372869ae384f', 'Rich Text', 'blocks', 'blocks-editor', NULL, '{\"type\": \"blocks\", \"label\": \"Rich Text (Blocks)\", \"width\": \"full\", \"layout\": \"vertical\", \"private\": false, \"variant\": null, \"required\": false, \"settings\": {\"private\": false, \"required\": false}, \"component\": \"blocks-editor\", \"conditions\": [], \"helperText\": \"The new JSON-based rich text editor\", \"validation\": {\"rules\": []}, \"placeholder\": \"Start typing...\", \"defaultValue\": null}', NULL, NULL, 0, 0, 4, NULL, NULL, NULL, 'The new JSON-based rich text editor', '{\"required\": true}', NULL, 1, NULL, '2026-02-14 11:11:25', '2026-02-16 08:11:22'),
('88b4e968-c2f7-4dba-82b8-4c3835dd6cbf', 'a973fdc6-889b-4437-b1ef-372869ae384f', 'gzone', 'json', 'dynamic-zone', NULL, '{\"type\": \"json\", \"label\": \"Dynamic Zone\", \"width\": \"full\", \"layout\": \"vertical\", \"unique\": false, \"options\": {\"allowed_schemas\": []}, \"private\": false, \"variant\": \"default\", \"required\": false, \"settings\": {\"required\": false, \"maxLength\": null, \"minLength\": null}, \"component\": \"dynamic-zone\", \"localized\": false, \"maxLength\": null, \"minLength\": null, \"helperText\": \"Dynamically pick component when editing content\", \"validation\": {\"rules\": []}, \"placeholder\": \"\", \"defaultValue\": [], \"allowed_schemas\": [\"a973fdc6-889b-4437-b1ef-372869ae384f\", \"d50d4549-cad7-44b5-9dd1-0f1e85ceda34\"]}', NULL, NULL, 0, 0, 0, NULL, NULL, NULL, 'Dynamically pick component when editing content', '{\"unique\": false, \"required\": false}', NULL, 0, NULL, '2026-02-17 07:01:50', '2026-02-17 07:01:50'),
('9770eb7c-a9f5-4e8e-8a6a-617e12b05ac1', 'b61d5718-6880-4a84-a43d-fbff5cac27d6', 'Hero Image', 'file', 'file-upload', NULL, '{\"type\": \"file\", \"label\": \"Media\", \"width\": \"full\", \"accept\": \"image/*,video/*,audio/*,application/*\", \"layout\": \"vertical\", \"unique\": false, \"private\": false, \"variant\": \"single\", \"multiple\": false, \"required\": false, \"settings\": {\"private\": false, \"required\": false, \"allowedTypes\": [\"images\", \"videos\", \"audios\", \"files\"]}, \"component\": \"file-upload\", \"localized\": false, \"conditions\": [], \"helperText\": \"Files like images, videos, etc\", \"validation\": {\"rules\": []}, \"allowedTypes\": [\"images\", \"videos\", \"audios\", \"files\"], \"defaultValue\": null, \"allowedTypesOptions\": [{\"key\": \"images\", \"label\": \"Images (JPEG, PNG, GIF, SVG, TIFF, ICO, DVU)\", \"extensions\": [\"jpeg\", \"jpg\", \"png\", \"gif\", \"svg\", \"tiff\", \"ico\", \"dvu\"]}, {\"key\": \"videos\", \"label\": \"Videos (MPEG, MP4, Quicktime, WMV, AVI, FLV)\", \"extensions\": [\"mpeg\", \"mp4\", \"mov\", \"wmv\", \"avi\", \"flv\"]}, {\"key\": \"audios\", \"label\": \"Audios (MP3, WAV, OGG)\", \"extensions\": [\"mp3\", \"wav\", \"ogg\"]}, {\"key\": \"files\", \"label\": \"Files (CSV, ZIP, PDF, Excel, JSON, ...)\", \"extensions\": [\"csv\", \"zip\", \"pdf\", \"xlsx\", \"xls\", \"json\", \"doc\", \"docx\", \"txt\"]}]}', NULL, NULL, 0, 0, 0, NULL, NULL, NULL, 'Files like images, videos, etc', '{\"unique\": false, \"required\": false}', NULL, 0, NULL, '2026-02-16 07:51:53', '2026-02-16 07:51:53'),
('9db61e86-cd7b-4163-b0db-49af4dd84009', 'a973fdc6-889b-4437-b1ef-372869ae384f', 'testemail', 'string', 'input', NULL, '{\"type\": \"email\", \"label\": \"Email\", \"width\": \"full\", \"layout\": \"vertical\", \"unique\": false, \"private\": false, \"variant\": null, \"required\": false, \"settings\": {\"unique\": false, \"private\": false, \"required\": false}, \"component\": \"input\", \"localized\": false, \"conditions\": [], \"helperText\": \"Email field with validations format\", \"validation\": {\"rules\": [{\"type\": \"email\", \"value\": true, \"message\": \"Please enter a valid email address\"}]}, \"placeholder\": \"email@example.com\", \"defaultValue\": \"\"}', NULL, NULL, 0, 0, 0, NULL, NULL, NULL, 'Email field with validations format', '{\"unique\": false, \"pattern\": \"^[^@]+@[^@]+\\\\.[^@]+$\", \"required\": true}', NULL, 1, NULL, '2026-02-16 08:34:44', '2026-02-16 08:34:44'),
('a8a8e452-9a7c-420b-b9e3-89aa5f0d51a5', 'a973fdc6-889b-4437-b1ef-372869ae384f', 'Enum', 'enumeration', 'select', NULL, '{\"type\": \"enumeration\", \"label\": \"Status\", \"width\": \"full\", \"layout\": \"vertical\", \"unique\": false, \"values\": \"\", \"options\": [{\"label\": \"Morning\", \"value\": \"morning\"}, {\"label\": \"Noon\", \"value\": \"noon\"}, {\"label\": \"Evening\", \"value\": \"evening\"}], \"private\": false, \"variant\": null, \"required\": false, \"settings\": {\"unique\": false, \"private\": false, \"required\": false}, \"component\": \"select\", \"localized\": false, \"conditions\": [], \"helperText\": \"List of values, then pick one\", \"validation\": {\"rules\": []}, \"graphqlName\": null, \"defaultValue\": null, \"valuesPlaceholder\": \"Ex:\\nmorning\\nnoon\\nevening\", \"graphqlNameHelperText\": \"Allows you to override the default generated name for GraphQL\"}', NULL, NULL, 0, 0, 7, NULL, NULL, NULL, 'List of values, then pick one', '{\"required\": false}', NULL, 0, NULL, '2026-02-14 11:33:38', '2026-02-16 08:11:22'),
('ac9a0c23-7168-4247-8bcf-112acc09c0a9', 'a973fdc6-889b-4437-b1ef-372869ae384f', 'Salary', 'integer', 'number-input', NULL, '{\"max\": null, \"min\": null, \"step\": 1, \"type\": \"number\", \"label\": \"Number\", \"width\": \"full\", \"layout\": \"vertical\", \"unique\": false, \"private\": false, \"variant\": \"integer\", \"required\": false, \"settings\": {\"unique\": false, \"private\": false, \"required\": false}, \"component\": \"number-input\", \"localized\": false, \"conditions\": [], \"helperText\": \"Numbers (integer, float, decimal)\", \"validation\": {\"rules\": []}, \"placeholder\": \"0\", \"defaultValue\": 0}', NULL, NULL, 0, 0, 2, NULL, NULL, NULL, 'Numbers (integer, float, decimal)', '{\"max\": null, \"min\": null, \"step\": 1, \"unique\": false, \"required\": true}', NULL, 1, NULL, '2026-02-16 07:57:34', '2026-02-16 08:11:22'),
('bf8907e3-d225-4545-a82f-e704edc76103', 'd50d4549-cad7-44b5-9dd1-0f1e85ceda34', 'toggle', 'boolean', 'toggle', NULL, '{\"type\": \"boolean\", \"label\": \"Published\", \"width\": \"full\", \"layout\": \"vertical\", \"private\": false, \"variant\": null, \"required\": false, \"settings\": {\"private\": false, \"required\": false}, \"component\": \"toggle\", \"conditions\": [], \"validation\": {\"rules\": []}, \"defaultValue\": false}', NULL, NULL, 0, 0, 1, NULL, NULL, NULL, 'Yes or no, 1 or 0, true or false', '{\"required\": true}', NULL, 1, NULL, '2026-02-13 14:31:28', '2026-02-14 12:15:12'),
('c788ae02-8882-4024-8922-528c75eb3141', 'a973fdc6-889b-4437-b1ef-372869ae384f', 'Test Demo Blog', 'string', 'input', NULL, '{\"type\": \"text\", \"label\": \"Name\", \"width\": \"full\", \"layout\": \"vertical\", \"unique\": false, \"private\": false, \"variant\": \"short\", \"required\": false, \"settings\": {\"unique\": false, \"private\": false, \"required\": false, \"maxLength\": 255, \"minLength\": null}, \"component\": \"input\", \"maxLength\": null, \"minLength\": null, \"conditions\": [], \"helperText\": \"No space is allowed for the name of the attribute\", \"validation\": {\"rules\": []}, \"placeholder\": \"Enter text...\", \"defaultValue\": \"\", \"regexPattern\": \"\"}', NULL, NULL, 0, 0, 5, NULL, NULL, NULL, 'Small or long text like title or description', '{\"required\": false, \"maxLength\": 255}', NULL, 0, NULL, '2026-02-14 09:58:09', '2026-02-16 08:11:22'),
('f13cba01-dd7f-465b-8465-ae19798d169d', 'a973fdc6-889b-4437-b1ef-372869ae384f', 'Password', 'string', 'input', NULL, '{\"type\": \"password\", \"label\": \"Password\", \"width\": \"full\", \"layout\": \"vertical\", \"private\": true, \"variant\": null, \"required\": false, \"settings\": {\"private\": true, \"required\": false}, \"component\": \"input\", \"conditions\": [], \"helperText\": \"Password field with encryption\", \"validation\": {\"rules\": [{\"type\": \"minLength\", \"value\": 8, \"message\": \"Password must be at least 8 characters\"}]}, \"placeholder\": \"Enter password...\", \"defaultValue\": \"\"}', NULL, NULL, 0, 0, 3, NULL, NULL, NULL, 'Password field with encryption', '{\"required\": false, \"minLength\": 8}', NULL, 0, NULL, '2026-02-14 11:11:57', '2026-02-16 08:11:22');

-- --------------------------------------------------------

--
-- Table structure for table `flows`
--

DROP TABLE IF EXISTS `flows`;
CREATE TABLE `flows` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `trigger` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'manual, webhook, event, schedule, operation',
  `accountability` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'all, activity, $trigger, $full, $accountability',
  `options` json DEFAULT NULL COMMENT 'Trigger-specific configuration',
  `operation` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Root operation node ID',
  `date_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_created` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `form_elements`
--

DROP TABLE IF EXISTS `form_elements`;
CREATE TABLE `form_elements` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tenant project ID (NULL = system/default elements available to all projects)',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Display name: "Text", "Number", "Date", etc.',
  `key` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique key: "text", "number", "date", etc.',
  `type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Base type: string, integer, float, boolean, json, datetime, date, time, timestamp, file, files, m2o, o2m, m2m, m2a, translations, blocks, markdown, component, dynamiczone, enumeration, email, password, uid',
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Grouping: basic, advanced, media, relation, etc.',
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Icon name: "Aa", "123", "calendar", etc.',
  `icon_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Icon color: "#4CAF50", "#F44336", etc.',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'User-friendly description',
  `interface` json NOT NULL COMMENT 'Complete interface configuration for form rendering',
  `variants` json DEFAULT NULL COMMENT 'Available variants: [{"key": "short", "name": "Short text", "description": "..."}, ...]',
  `default_variant` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Default variant key',
  `validation_rules` json DEFAULT NULL COMMENT 'Default validation rules: {"required": false, "minLength": 0, "maxLength": 255, ...}',
  `default_settings` json DEFAULT NULL COMMENT 'Default settings: {"required": false, "unique": false, "private": false, ...}',
  `available_settings` json DEFAULT NULL COMMENT 'Available settings for this field type: ["required", "unique", "private", "minLength", "maxLength", ...]',
  `supports_conditions` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Can this field be used in conditional logic?',
  `supports_translations` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Can this field be translated?',
  `supports_relations` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Can this field create relations?',
  `is_system` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1 = system (cannot delete), 0 = custom (can delete)',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Is this field type available for use?',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT 'Display order in field type selector',
  `usage_count` int NOT NULL DEFAULT '0' COMMENT 'How many times this field type is used',
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User who created (for custom fields)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `form_elements`
--

INSERT INTO `form_elements` (`id`, `project_id`, `name`, `key`, `type`, `category`, `icon`, `icon_color`, `description`, `interface`, `variants`, `default_variant`, `validation_rules`, `default_settings`, `available_settings`, `supports_conditions`, `supports_translations`, `supports_relations`, `is_system`, `is_active`, `sort_order`, `usage_count`, `created_by`, `created_at`, `updated_at`) VALUES
('0b29f2d4-0995-11f1-8f2f-7c2a31390701', NULL, 'Email', 'email', 'string', 'basic', 'Mail', '#F44336', 'Email field with validations format', '{\"type\": \"email\", \"label\": \"Email\", \"width\": \"full\", \"layout\": \"vertical\", \"settings\": {\"unique\": false, \"private\": false, \"required\": false}, \"component\": \"input\", \"conditions\": [], \"helperText\": \"Email field with validations format\", \"validation\": {\"rules\": [{\"type\": \"email\", \"value\": true, \"message\": \"Please enter a valid email address\"}]}, \"placeholder\": \"email@example.com\", \"defaultValue\": \"\"}', NULL, NULL, '{\"pattern\": \"^[^@]+@[^@]+\\\\.[^@]+$\", \"required\": false}', '{\"unique\": false, \"private\": false, \"required\": false}', '[\"required\", \"unique\", \"private\"]', 1, 0, 0, 1, 1, 11, 0, NULL, '2026-02-14 11:05:16', '2026-02-14 11:05:16'),
('1c57de35-0b2e-11f1-80f1-7c2a31390701', NULL, 'Schema', 'schema', 'schema', 'advanced', 'Database', '#9333EA', 'Reference to an existing data model', '{\"type\": \"schema\", \"label\": \"Schema\", \"width\": \"full\", \"layout\": \"vertical\", \"schemaId\": null, \"settings\": {\"private\": false, \"required\": false}, \"component\": \"schema\", \"conditions\": [], \"helperText\": \"Reference to an existing data model\", \"schemaIcon\": \"Database\", \"validation\": {\"rules\": []}, \"defaultValue\": null, \"schemaRepeatable\": false, \"schemaDisplayName\": null}', NULL, NULL, '{\"required\": false}', '{\"private\": false, \"required\": false}', '[\"required\", \"private\", \"schemaDisplayName\", \"schemaIcon\", \"schemaId\", \"schemaRepeatable\"]', 1, 0, 0, 1, 1, 13, 0, NULL, '2026-02-16 11:53:29', '2026-02-16 11:53:29'),
('25410af2-0bcd-11f1-80f1-7c2a31390701', NULL, 'Dynamic zone', 'dynamic_zone', 'json', 'advanced', 'Layers', '#3F51B5', 'Dynamically pick component when editing content', '{\"type\": \"json\", \"label\": \"Dynamic Zone\", \"width\": \"full\", \"layout\": \"vertical\", \"options\": {\"allowed_schemas\": []}, \"variant\": \"default\", \"settings\": {\"required\": false, \"maxLength\": null, \"minLength\": null}, \"component\": \"dynamic-zone\", \"helperText\": \"Dynamically pick component when editing content\", \"validation\": {\"rules\": []}, \"placeholder\": \"\", \"defaultValue\": []}', '[{\"key\": \"default\", \"name\": \"Default\", \"component\": \"dynamic-zone\", \"description\": \"Standard dynamic zone\"}]', 'default', '{\"maxLength\": 100, \"minLength\": 0}', '{\"required\": false, \"maxLength\": null, \"minLength\": null}', '[\"required\", \"minLength\", \"maxLength\"]', 1, 1, 0, 1, 1, 8, 0, NULL, '2026-02-17 06:51:54', '2026-02-17 06:51:54'),
('2add1200-0993-11f1-8f2f-7c2a31390701', NULL, 'Rich text (Blocks)', 'rich_text_blocks', 'blocks', 'advanced', 'Blocks', '#3B82F6', 'The new JSON-based rich text editor', '{\"type\": \"blocks\", \"label\": \"Rich Text (Blocks)\", \"width\": \"full\", \"layout\": \"vertical\", \"settings\": {\"private\": false, \"required\": false}, \"component\": \"blocks-editor\", \"conditions\": [], \"helperText\": \"The new JSON-based rich text editor\", \"validation\": {\"rules\": []}, \"placeholder\": \"Start typing...\", \"defaultValue\": null}', NULL, NULL, '{\"required\": false}', '{\"private\": false, \"required\": false}', '[\"required\", \"private\"]', 1, 1, 0, 1, 1, 2, 0, NULL, '2026-02-14 10:51:50', '2026-02-14 10:51:50'),
('5a584a82-099b-11f1-8f2f-7c2a31390701', NULL, 'Rich text (Markdown)', 'markdown', 'markdown', 'basic', 'FileText', '#3B82F6', 'The classic rich text editor', '{\"type\": \"markdown\", \"label\": \"Rich text (Markdown)\", \"width\": \"full\", \"layout\": \"vertical\", \"settings\": {\"unique\": false, \"private\": false, \"required\": false, \"maxLength\": null, \"minLength\": null}, \"component\": \"markdown-editor\", \"conditions\": [], \"helperText\": \"The classic rich text editor\", \"validation\": {\"rules\": [], \"maxLength\": null, \"minLength\": null}, \"defaultValue\": \"\"}', NULL, NULL, '{\"required\": false}', '{\"unique\": false, \"private\": false, \"required\": false, \"maxLength\": null, \"minLength\": null}', '[\"required\", \"unique\", \"private\", \"minLength\", \"maxLength\", \"defaultValue\"]', 1, 1, 0, 1, 1, 7, 0, NULL, '2026-02-14 11:50:26', '2026-02-14 11:50:26'),
('5cb7b57f-0995-11f1-8f2f-7c2a31390701', NULL, 'Date', 'date', 'datetime', 'basic', 'Calendar', '#F97316', 'A date picker with hours, minutes and seconds', '{\"type\": \"datetime\", \"label\": \"Published Date\", \"width\": \"full\", \"layout\": \"vertical\", \"settings\": {\"private\": false, \"required\": false}, \"component\": \"datepicker\", \"conditions\": [], \"helperText\": \"A date picker with hours, minutes and seconds\", \"validation\": {\"rules\": []}, \"includeTime\": true, \"defaultValue\": null, \"includeSeconds\": true}', '[{\"key\": \"datetime\", \"name\": \"Date & Time\", \"description\": \"Date and time picker\"}, {\"key\": \"date\", \"name\": \"Date Only\", \"description\": \"Date picker only\"}, {\"key\": \"time\", \"name\": \"Time Only\", \"description\": \"Time picker only\"}]', 'datetime', '{\"required\": false}', '{\"private\": false, \"required\": false}', '[\"required\", \"private\"]', 1, 0, 0, 1, 1, 4, 0, NULL, '2026-02-14 11:07:33', '2026-02-14 11:07:33'),
('6bfd5d21-0996-11f1-8f2f-7c2a31390701', NULL, 'Media', 'media', 'file', 'media', 'Image', '#9333EA', 'Files like images, videos, etc', '{\"type\": \"file\", \"label\": \"Media\", \"width\": \"full\", \"accept\": \"image/*,video/*,audio/*,application/*\", \"layout\": \"vertical\", \"variant\": \"single\", \"multiple\": false, \"settings\": {\"private\": false, \"required\": false, \"allowedTypes\": [\"images\", \"videos\", \"audios\", \"files\"]}, \"component\": \"file-upload\", \"conditions\": [], \"helperText\": \"Files like images, videos, etc\", \"validation\": {\"rules\": []}, \"allowedTypes\": [\"images\", \"videos\", \"audios\", \"files\"], \"defaultValue\": null, \"allowedTypesOptions\": [{\"key\": \"images\", \"label\": \"Images (JPEG, PNG, GIF, SVG, TIFF, ICO, DVU)\", \"extensions\": [\"jpeg\", \"jpg\", \"png\", \"gif\", \"svg\", \"tiff\", \"ico\", \"dvu\"]}, {\"key\": \"videos\", \"label\": \"Videos (MPEG, MP4, Quicktime, WMV, AVI, FLV)\", \"extensions\": [\"mpeg\", \"mp4\", \"mov\", \"wmv\", \"avi\", \"flv\"]}, {\"key\": \"audios\", \"label\": \"Audios (MP3, WAV, OGG)\", \"extensions\": [\"mp3\", \"wav\", \"ogg\"]}, {\"key\": \"files\", \"label\": \"Files (CSV, ZIP, PDF, Excel, JSON, ...)\", \"extensions\": [\"csv\", \"zip\", \"pdf\", \"xlsx\", \"xls\", \"json\", \"doc\", \"docx\", \"txt\"]}]}', '[{\"key\": \"single\", \"name\": \"Single media\", \"description\": \"Best for avatar, profile picture or cover\"}, {\"key\": \"multiple\", \"name\": \"Multiple media\", \"description\": \"Best for sliders, carousels or multiple files download\"}]', 'single', '{\"required\": false}', '{\"private\": false, \"required\": false, \"allowedTypes\": [\"images\", \"videos\", \"audios\", \"files\"]}', '[\"required\", \"private\", \"allowedTypes\"]', 0, 0, 1, 1, 1, 5, 0, NULL, '2026-02-14 11:15:08', '2026-02-14 11:15:08'),
('6d4de1aa-0994-11f1-8f2f-7c2a31390701', NULL, 'Number', 'number', 'integer', 'basic', 'Hash', '#F44336', 'Numbers (integer, float, decimal)', '{\"max\": null, \"min\": null, \"step\": 1, \"type\": \"number\", \"label\": \"Number\", \"width\": \"full\", \"layout\": \"vertical\", \"variant\": \"integer\", \"settings\": {\"unique\": false, \"private\": false, \"required\": false}, \"component\": \"number-input\", \"conditions\": [], \"helperText\": \"Numbers (integer, float, decimal)\", \"validation\": {\"rules\": []}, \"placeholder\": \"0\", \"defaultValue\": 0}', '[{\"key\": \"integer\", \"name\": \"Integer\", \"description\": \"Whole numbers\"}, {\"key\": \"float\", \"name\": \"Float\", \"description\": \"Decimal numbers\"}, {\"key\": \"decimal\", \"name\": \"Decimal\", \"description\": \"Precise decimal numbers\"}]', 'integer', '{\"max\": null, \"min\": null, \"step\": 1}', '{\"unique\": false, \"private\": false, \"required\": false}', '[\"required\", \"unique\", \"private\", \"min\", \"max\", \"step\"]', 1, 0, 0, 1, 1, 3, 0, NULL, '2026-02-14 11:00:51', '2026-02-14 11:00:51'),
('7d798425-0999-11f1-8f2f-7c2a31390701', NULL, 'Relation', 'relation', 'm2o', 'relation', 'Link2', '#3B82F6', 'Refers to a Collection Type', '{\"type\": \"relation\", \"label\": \"Relation\", \"width\": \"full\", \"layout\": \"vertical\", \"settings\": {\"private\": false, \"required\": false}, \"component\": \"relation\", \"conditions\": [], \"helperText\": \"Refers to a Collection Type\", \"validation\": {\"rules\": []}, \"relationType\": \"oneWay\", \"relationTypes\": [{\"key\": \"oneWay\", \"icon\": \"ArrowRight\", \"label\": \"has one\", \"description\": \"Article has one Article\"}, {\"key\": \"oneToOne\", \"icon\": \"ArrowLeftRight\", \"label\": \"has and belongs to one\", \"description\": \"Article has and belongs to one Article\"}, {\"key\": \"oneToMany\", \"icon\": \"ArrowRightToLine\", \"label\": \"belongs to many\", \"description\": \"Article belongs to many Articles\"}, {\"key\": \"manyToOne\", \"icon\": \"ArrowLeftToLine\", \"label\": \"has many\", \"description\": \"Article has many Articles\"}, {\"key\": \"manyToMany\", \"icon\": \"ArrowLeftRight\", \"label\": \"has and belongs to many\", \"description\": \"Article has and belongs to many Articles\"}, {\"key\": \"manyWay\", \"icon\": \"ArrowRight\", \"label\": \"has many\", \"description\": \"Article has many Articles (reverse)\"}], \"sourceFieldName\": null, \"targetFieldName\": null, \"sourceCollection\": null, \"targetCollection\": null}', NULL, NULL, '{\"required\": false}', '{\"private\": false, \"required\": false}', '[\"required\", \"private\", \"relationType\", \"targetCollection\", \"sourceFieldName\", \"targetFieldName\"]', 1, 0, 1, 1, 1, 6, 0, NULL, '2026-02-14 11:37:06', '2026-02-14 11:37:06'),
('bd0f690a-0995-11f1-8f2f-7c2a31390701', NULL, 'Password', 'password', 'string', 'basic', 'Key', '#FF9800', 'Password field with encryption', '{\"type\": \"password\", \"label\": \"Password\", \"width\": \"full\", \"layout\": \"vertical\", \"settings\": {\"private\": true, \"required\": false}, \"component\": \"input\", \"conditions\": [], \"helperText\": \"Password field with encryption\", \"validation\": {\"rules\": [{\"type\": \"minLength\", \"value\": 8, \"message\": \"Password must be at least 8 characters\"}]}, \"placeholder\": \"Enter password...\", \"defaultValue\": \"\"}', NULL, NULL, '{\"required\": false, \"minLength\": 8}', '{\"private\": true, \"required\": false}', '[\"required\", \"private\", \"minLength\", \"maxLength\"]', 1, 0, 0, 1, 1, 12, 0, NULL, '2026-02-14 11:10:15', '2026-02-14 11:10:15'),
('d2ed8924-08dd-11f1-b070-7c2a31390701', NULL, 'Text', 'text', 'string', 'basic', 'Aa', '#4CAF50', 'Small or long text like title or description', '{\"type\": \"text\", \"label\": \"Name\", \"width\": \"full\", \"layout\": \"vertical\", \"variant\": \"short\", \"settings\": {\"unique\": false, \"private\": false, \"required\": false, \"maxLength\": 255, \"minLength\": null}, \"component\": \"input\", \"conditions\": [], \"helperText\": \"No space is allowed for the name of the attribute\", \"validation\": {\"rules\": []}, \"placeholder\": \"Enter text...\", \"defaultValue\": \"\", \"regexPattern\": \"\"}', '[{\"key\": \"short\", \"name\": \"Short text\", \"component\": \"input\", \"description\": \"Best for titles, names, links (URL). It also enables exact search on the field.\"}, {\"key\": \"long\", \"name\": \"Long text\", \"component\": \"textarea\", \"description\": \"Best for descriptions, biography. Exact search is disabled.\"}]', 'short', '{\"maxLength\": 255, \"minLength\": 0}', '{\"unique\": false, \"private\": false, \"required\": false, \"maxLength\": null, \"minLength\": null}', '[\"required\", \"unique\", \"private\", \"minLength\", \"maxLength\"]', 1, 1, 0, 1, 1, 1, 0, NULL, '2026-02-13 13:13:44', '2026-02-13 13:13:44'),
('e1720d15-08dd-11f1-b070-7c2a31390701', NULL, 'Boolean', 'boolean', 'boolean', 'basic', 'ToggleLeft', '#10B981', 'Yes or no, 1 or 0, true or false', '{\"type\": \"boolean\", \"label\": \"Published\", \"width\": \"full\", \"layout\": \"vertical\", \"settings\": {\"private\": false, \"required\": false}, \"component\": \"toggle\", \"conditions\": [], \"validation\": {\"rules\": []}, \"defaultValue\": false}', NULL, NULL, '{}', '{\"private\": false, \"required\": false}', '[\"required\", \"private\"]', 1, 0, 0, 1, 1, 9, 0, NULL, '2026-02-13 13:14:08', '2026-02-13 13:14:08'),
('e6f2e8da-0993-11f1-8f2f-7c2a31390701', NULL, 'JSON', 'json', 'json', 'advanced', 'Braces', '#3B82F6', 'Data in JSON format', '{\"type\": \"json\", \"label\": \"JSON\", \"width\": \"full\", \"layout\": \"vertical\", \"settings\": {\"private\": false, \"required\": false}, \"component\": \"json-editor\", \"conditions\": [], \"helperText\": \"Data in JSON format\", \"validation\": {\"rules\": []}, \"defaultValue\": null}', NULL, NULL, '{\"required\": false}', '{\"private\": false, \"required\": false}', '[\"required\", \"private\"]', 1, 0, 0, 1, 1, 10, 0, NULL, '2026-02-14 10:57:06', '2026-02-14 10:57:06'),
('f273070a-099a-11f1-8f2f-7c2a31390701', NULL, 'UID', 'uid', 'uid', 'basic', 'KeyRound', '#9333EA', 'Unique identifier', '{\"type\": \"text\", \"label\": \"UID\", \"width\": \"full\", \"layout\": \"vertical\", \"settings\": {\"unique\": true, \"private\": false, \"required\": false, \"maxLength\": null, \"minLength\": null}, \"component\": \"input\", \"conditions\": [], \"helperText\": \"Unique identifier\", \"validation\": {\"rules\": [], \"regexPattern\": \"\"}, \"placeholder\": \"e.g. slug, seoUrl, canonicalUrl\", \"defaultValue\": \"\", \"regexPattern\": \"\", \"attachedField\": null}', NULL, NULL, '{\"unique\": true, \"required\": false}', '{\"unique\": true, \"private\": false, \"required\": false, \"maxLength\": null, \"minLength\": null}', '[\"required\", \"unique\", \"private\", \"minLength\", \"maxLength\", \"regexPattern\", \"attachedField\", \"defaultValue\"]', 1, 0, 0, 1, 1, 14, 0, NULL, '2026-02-14 11:47:32', '2026-02-14 11:47:32'),
('f912ef8f-0998-11f1-8f2f-7c2a31390701', NULL, 'Enumeration', 'enumeration', 'enumeration', 'basic', 'List', '#9333EA', 'List of values, then pick one', '{\"type\": \"enumeration\", \"label\": \"Status\", \"width\": \"full\", \"layout\": \"vertical\", \"values\": \"\", \"options\": [{\"label\": \"Morning\", \"value\": \"morning\"}, {\"label\": \"Noon\", \"value\": \"noon\"}, {\"label\": \"Evening\", \"value\": \"evening\"}], \"settings\": {\"unique\": false, \"private\": false, \"required\": false}, \"component\": \"select\", \"conditions\": [], \"helperText\": \"List of values, then pick one\", \"validation\": {\"rules\": []}, \"graphqlName\": null, \"defaultValue\": null, \"valuesPlaceholder\": \"Ex:\\nmorning\\nnoon\\nevening\", \"graphqlNameHelperText\": \"Allows you to override the default generated name for GraphQL\"}', NULL, NULL, '{\"required\": false}', '{\"unique\": false, \"private\": false, \"required\": false}', '[\"required\", \"unique\", \"private\", \"defaultValue\", \"graphqlName\"]', 1, 1, 0, 1, 1, 13, 0, NULL, '2026-02-14 11:33:24', '2026-02-14 11:33:24');

-- --------------------------------------------------------

--
-- Table structure for table `locales`
--

DROP TABLE IF EXISTS `locales`;
CREATE TABLE `locales` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `fallback_locale` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login_attempts`
--

DROP TABLE IF EXISTS `login_attempts`;
CREATE TABLE `login_attempts` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `success` tinyint(1) NOT NULL DEFAULT '0',
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `media_assets`
--

DROP TABLE IF EXISTS `media_assets`;
CREATE TABLE `media_assets` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `folder_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'image, video, document',
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` bigint NOT NULL DEFAULT '0',
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `metadata` json DEFAULT NULL COMMENT 'alt, tags, etc',
  `storage_driver` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `storage_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `tags` json DEFAULT NULL,
  `focal_point_x` int DEFAULT NULL COMMENT 'Focal point percentage X',
  `focal_point_y` int DEFAULT NULL COMMENT 'Focal point percentage Y',
  `uploaded_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modified_on` timestamp NULL DEFAULT NULL,
  `charset` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `embed` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'External embed ID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `media_folders`
--

DROP TABLE IF EXISTS `media_folders`;
CREATE TABLE `media_folders` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `media_versions`
--

DROP TABLE IF EXISTS `media_versions`;
CREATE TABLE `media_versions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `asset_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transformation` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'resize, crop, format',
  `storage_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `config` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT 'inbox' COMMENT 'inbox, archived',
  `recipient` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `collection` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `operations`
--

DROP TABLE IF EXISTS `operations`;
CREATE TABLE `operations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique key within flow',
  `type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'log, mail, notification, webhook, request, transform, condition, etc.',
  `position_x` int NOT NULL,
  `position_y` int NOT NULL,
  `options` json DEFAULT NULL COMMENT 'Operation-specific configuration',
  `resolve` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Next operation on success/true',
  `reject` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Next operation on failure/false',
  `flow_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_created` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Permissions scoped to project collections',
  `role_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Null = public access',
  `collection` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'create, read, update, delete, share',
  `permissions` json DEFAULT NULL COMMENT 'Filter rules: {"status": {"_eq": "published"}}',
  `validation` json DEFAULT NULL COMMENT 'Validation rules on write operations',
  `presets` json DEFAULT NULL COMMENT 'Default values on create',
  `fields` json DEFAULT NULL COMMENT 'Allowed fields: null=all, []=none, ["*"]=all, ["field1","field2"]=specific'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `presets`
--

DROP TABLE IF EXISTS `presets`;
CREATE TABLE `presets` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Per-project saved views',
  `bookmark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Bookmark name if saved',
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User-specific preset, null = role/global',
  `role_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Role-specific preset',
  `collection` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `search` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `layout` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'tabular' COMMENT 'tabular, cards, calendar, map, etc.',
  `layout_query` json DEFAULT NULL COMMENT 'Saved query params: limit, sort, page, etc.',
  `layout_options` json DEFAULT NULL COMMENT 'Layout-specific options',
  `refresh_interval` int DEFAULT NULL COMMENT 'Auto-refresh interval in seconds',
  `filter` json DEFAULT NULL COMMENT 'Saved filter conditions',
  `icon` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cloned_from_platform_theme_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Platform theme used for cloning',
  `config` json DEFAULT NULL,
  `feature_flags` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `name`, `slug`, `cloned_from_platform_theme_id`, `config`, `feature_flags`, `created_at`, `updated_at`) VALUES
('389a0749-434d-49e6-9b05-7173dd086afe', 'Default Project', 'default', NULL, '{}', '{}', '2026-02-13 14:26:19', '2026-02-13 14:26:19');

-- --------------------------------------------------------

--
-- Table structure for table `project_members`
--

DROP TABLE IF EXISTS `project_members`;
CREATE TABLE `project_members` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `relations`
--

DROP TABLE IF EXISTS `relations`;
CREATE TABLE `relations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Relations are project-scoped',
  `many_collection` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'The "many" side collection',
  `many_field` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Foreign key field on many side',
  `one_collection` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'The "one" side collection',
  `one_field` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Optional reverse field (for O2M)',
  `one_collection_field` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'For polymorphic (M2A): field storing collection name',
  `one_allowed_collections` json DEFAULT NULL COMMENT 'For polymorphic: allowed collections array',
  `one_deselect_action` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'nullify' COMMENT 'nullify, delete',
  `sort_field` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Field name for ordering related items',
  `junction_field` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'For M2M: field in junction pointing back to origin'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rest_schema_cache`
--

DROP TABLE IF EXISTS `rest_schema_cache`;
CREATE TABLE `rest_schema_cache` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `schema` longtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'REST/OpenAPI schema snapshot for this project',
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `revisions`
--

DROP TABLE IF EXISTS `revisions`;
CREATE TABLE `revisions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Project scope for faster filtering',
  `activity_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `collection` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` json DEFAULT NULL COMMENT 'Complete snapshot of item at this revision',
  `delta` json DEFAULT NULL COMMENT 'Only changed fields (for efficiency)',
  `parent_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Previous revision in chain',
  `version` int DEFAULT NULL COMMENT 'Optional sequential version number'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permissions` json DEFAULT NULL COMMENT 'Legacy - migrate to permissions table',
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `permissions`, `is_system`, `created_at`, `updated_at`) VALUES
('cf59ba68-0816-11f1-b070-7c2a31390701', 'Admin', 'Tenant-level administration. Full access to manage schemas, users, roles, and settings within the tenant.', NULL, 1, '2026-02-12 13:29:08', '2026-02-13 05:36:15'),
('cf59bd40-0816-11f1-b070-7c2a31390701', 'Editor', 'Content creation and editing. Can create, edit, and publish content; manage media.', NULL, 1, '2026-02-12 13:29:08', '2026-02-12 13:29:08'),
('cf59be1e-0816-11f1-b070-7c2a31390701', 'Reviewer', 'Content review and approval. Can review, approve, and reject content; cannot create content.', NULL, 1, '2026-02-12 13:29:08', '2026-02-12 13:29:08'),
('cf59beab-0816-11f1-b070-7c2a31390701', 'Author', 'Content creation only. Can create drafts; cannot publish or approve.', NULL, 1, '2026-02-12 13:29:08', '2026-02-12 13:29:08'),
('cf59bf2b-0816-11f1-b070-7c2a31390701', 'API Consumer', 'Read-only API access. Can access delivery APIs; no admin panel access.', NULL, 1, '2026-02-12 13:29:08', '2026-02-12 13:29:08');

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permission_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User ID (Super Admin or tenant user) who last updated this permission assignment'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`, `updated_at`, `updated_by`) VALUES
('2d6d14b6-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290a5cf-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d14db-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290c509-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d14ea-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290c6d5-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d14f7-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290c805-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d1503-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290c924-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d1510-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290ca41-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d151c-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290cc8a-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d1528-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290ce68-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d1535-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290cfd1-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d1541-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290d0e8-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d154d-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290d1ff-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d1559-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290d30f-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d1565-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290d420-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d1571-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290d52c-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d15ab-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290d638-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d15bc-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290d745-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d15c7-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290d845-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d15d4-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290d94c-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d15e0-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290da5c-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d15ec-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290db6b-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d15f7-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290dc74-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d1603-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290dd79-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d160f-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290de84-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d1678-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290e9ff-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d1697-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290ed3e-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d16a4-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290ee50-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d16b0-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290ef62-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d16bc-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290f088-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d16c8-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290f1aa-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6d16d5-0825-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', 'b290f2d7-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6dcaca-0825-11f1-b070-7c2a31390701', 'cf59be1e-0816-11f1-b070-7c2a31390701', 'b290c509-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6dcb06-0825-11f1-b070-7c2a31390701', 'cf59be1e-0816-11f1-b070-7c2a31390701', 'b290ca41-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6dcb3b-0825-11f1-b070-7c2a31390701', 'cf59be1e-0816-11f1-b070-7c2a31390701', 'b290d30f-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6dcb64-0825-11f1-b070-7c2a31390701', 'cf59be1e-0816-11f1-b070-7c2a31390701', 'b290d845-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6dcb84-0825-11f1-b070-7c2a31390701', 'cf59be1e-0816-11f1-b070-7c2a31390701', 'b290dc74-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6dcbef-0825-11f1-b070-7c2a31390701', 'cf59be1e-0816-11f1-b070-7c2a31390701', 'b290e9ff-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6dcc0f-0825-11f1-b070-7c2a31390701', 'cf59be1e-0816-11f1-b070-7c2a31390701', 'b290ed3e-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6dcc1c-0825-11f1-b070-7c2a31390701', 'cf59be1e-0816-11f1-b070-7c2a31390701', 'b290ee50-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6dcc31-0825-11f1-b070-7c2a31390701', 'cf59be1e-0816-11f1-b070-7c2a31390701', 'b290f088-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6e2fa5-0825-11f1-b070-7c2a31390701', 'cf59beab-0816-11f1-b070-7c2a31390701', 'b290c509-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6e2ff8-0825-11f1-b070-7c2a31390701', 'cf59beab-0816-11f1-b070-7c2a31390701', 'b290c924-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6e3013-0825-11f1-b070-7c2a31390701', 'cf59beab-0816-11f1-b070-7c2a31390701', 'b290ca41-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6e302c-0825-11f1-b070-7c2a31390701', 'cf59beab-0816-11f1-b070-7c2a31390701', 'b290cc8a-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6e306f-0825-11f1-b070-7c2a31390701', 'cf59beab-0816-11f1-b070-7c2a31390701', 'b290d1ff-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6e3087-0825-11f1-b070-7c2a31390701', 'cf59beab-0816-11f1-b070-7c2a31390701', 'b290d30f-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6e309e-0825-11f1-b070-7c2a31390701', 'cf59beab-0816-11f1-b070-7c2a31390701', 'b290d420-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6e30d0-0825-11f1-b070-7c2a31390701', 'cf59beab-0816-11f1-b070-7c2a31390701', 'b290d745-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6e30e7-0825-11f1-b070-7c2a31390701', 'cf59beab-0816-11f1-b070-7c2a31390701', 'b290d845-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6e3167-0825-11f1-b070-7c2a31390701', 'cf59beab-0816-11f1-b070-7c2a31390701', 'b290d94c-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6e32b5-0825-11f1-b070-7c2a31390701', 'cf59beab-0816-11f1-b070-7c2a31390701', 'b290e9ff-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('2d6ec0b3-0825-11f1-b070-7c2a31390701', 'cf59bf2b-0816-11f1-b070-7c2a31390701', 'b290f73b-0816-11f1-b070-7c2a31390701', '2026-02-12 15:11:59', '2026-02-12 15:11:59', NULL),
('6c832db1-08e5-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', '6c7b4cf9-08e5-11f1-b070-7c2a31390701', '2026-02-13 14:08:08', '2026-02-13 14:08:08', NULL),
('6c832e4e-08e5-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', '6c814ab7-08e5-11f1-b070-7c2a31390701', '2026-02-13 14:08:08', '2026-02-13 14:08:08', NULL),
('6c832eea-08e5-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', '6c7e35eb-08e5-11f1-b070-7c2a31390701', '2026-02-13 14:08:08', '2026-02-13 14:08:08', NULL),
('6c832f53-08e5-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', '6c7feba6-08e5-11f1-b070-7c2a31390701', '2026-02-13 14:08:08', '2026-02-13 14:08:08', NULL),
('851ded45-08e5-11f1-b070-7c2a31390701', 'cf59bd40-0816-11f1-b070-7c2a31390701', '6c7e35eb-08e5-11f1-b070-7c2a31390701', '2026-02-13 14:08:49', '2026-02-13 14:08:49', NULL),
('97c9a93c-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290f73b-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:06', '2026-02-13 05:41:06', NULL),
('97ca6c42-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290fa61-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:06', '2026-02-13 05:41:06', NULL),
('97cabbc0-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290d745-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:06', '2026-02-13 05:41:06', NULL),
('97cb0887-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290da5c-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:06', '2026-02-13 05:41:06', NULL),
('97cb7de8-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290d845-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:06', '2026-02-13 05:41:06', NULL),
('97cbe8ef-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290d94c-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:06', '2026-02-13 05:41:06', NULL),
('97cc4d9c-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290c924-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:06', '2026-02-13 05:41:06', NULL),
('97ccaa12-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290ce68-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:06', '2026-02-13 05:41:06', NULL),
('97cd013b-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290cfd1-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:06', '2026-02-13 05:41:06', NULL),
('97cd6812-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290ca41-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:06', '2026-02-13 05:41:06', NULL),
('97cdc90f-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290d0e8-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:06', '2026-02-13 05:41:06', NULL),
('97ce1a94-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290cc8a-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:06', '2026-02-13 05:41:06', NULL),
('97ce74d4-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290a5cf-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:06', '2026-02-13 05:41:06', NULL),
('97cef71d-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290c805-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:06', '2026-02-13 05:41:06', NULL),
('97cf3c9d-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290c509-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:06', '2026-02-13 05:41:06', NULL),
('97cfb19d-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290c6d5-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d02fd7-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290ef62-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d07c08-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290f2d7-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d0ff62-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290f088-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d161c4-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290f1aa-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d1bb09-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290d1ff-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d22f51-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290d52c-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d2d22a-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290d638-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d35d18-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290d30f-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d3e931-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290d420-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d44092-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290db6b-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d4bc92-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290de84-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d51492-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290dc74-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d55aa0-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290dd79-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d5b8a1-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290f3ff-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d61301-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290f510-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d66e47-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290e4d2-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d6dd02-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290e7ed-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d74d40-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290e5d9-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d7933a-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290e6e0-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d7df65-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290df8b-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d8572c-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290e2b0-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d8b0e3-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290e098-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d9024e-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290e3c2-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d96046-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290e1a2-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97d9b970-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290ed3e-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97da2319-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290e8f3-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97da9118-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290ec27-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97daf11b-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290e9ff-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97db53af-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290ee50-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL),
('97dbacf6-089e-11f1-b070-7c2a31390701', 'cf59ba68-0816-11f1-b070-7c2a31390701', 'b290eb11-0816-11f1-b070-7c2a31390701', '2026-02-13 05:41:07', '2026-02-13 05:41:07', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `seo_metadata`
--

DROP TABLE IF EXISTS `seo_metadata`;
CREATE TABLE `seo_metadata` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entry_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `locale` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `meta_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_description` text COLLATE utf8mb4_unicode_ci,
  `open_graph` json DEFAULT NULL,
  `canonical_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `structured_data` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires` timestamp NOT NULL,
  `ip` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `share_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `origin` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'web, mobile, api',
  `data` json DEFAULT NULL COMMENT 'Session data',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_descriptor` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tagline',
  `project_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `project_logo` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `public_foreground` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `public_background` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `public_note` text COLLATE utf8mb4_unicode_ci,
  `auth_login_attempts` int DEFAULT '25',
  `auth_password_policy` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Regex pattern',
  `storage_asset_transform` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT 'all',
  `storage_asset_presets` json DEFAULT NULL COMMENT 'Predefined image transformations',
  `custom_css` text COLLATE utf8mb4_unicode_ci,
  `storage_default_folder` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `basemaps` json DEFAULT NULL COMMENT 'Map configurations',
  `mapbox_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `module_bar` json DEFAULT NULL COMMENT 'Module bar configuration',
  `project_favicon` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'en-US',
  `custom_aspect_ratios` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shares`
--

DROP TABLE IF EXISTS `shares`;
CREATE TABLE `shares` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `collection` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Role permissions to apply',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Hashed password for protection',
  `user_created` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_start` timestamp NULL DEFAULT NULL,
  `date_end` timestamp NULL DEFAULT NULL,
  `times_used` int DEFAULT '0',
  `max_uses` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `themes`
--

DROP TABLE IF EXISTS `themes`;
CREATE TABLE `themes` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `design_tokens` json DEFAULT NULL,
  `component_variants` json DEFAULT NULL,
  `presets` json DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `platform_theme_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Reference to platform theme if cloned',
  `customizations` json DEFAULT NULL COMMENT 'Custom overrides to platform theme',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `theme_assignments`
--

DROP TABLE IF EXISTS `theme_assignments`;
CREATE TABLE `theme_assignments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `theme_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entry_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nullable for site-wide',
  `scope` enum('site','page') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'site',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `verification_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'local, google, github, azure, etc.',
  `external_identifier` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'OAuth provider user ID',
  `mfa_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `mfa_secret` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferences` json DEFAULT NULL COMMENT 'UI preferences, layout settings',
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'en',
  `theme` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'auto' COMMENT 'light, dark, auto',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `name`, `avatar`, `status`, `email_verified_at`, `verification_token`, `provider`, `external_identifier`, `mfa_enabled`, `mfa_secret`, `preferences`, `language`, `theme`, `last_login_at`, `created_at`, `updated_at`) VALUES
('80c1cbcf-ef58-4109-8a9f-9123871c36db', 'apiuser@gmail.com', '$2b$10$yeJWCVXblcoibuTbZi6of.l7GyfslXpzrGyEOuUaWibxybLwOFtwy', 'API User', NULL, '1', NULL, NULL, NULL, NULL, 0, NULL, NULL, 'en', 'auto', '2026-02-13 06:25:03', '2026-02-13 05:43:54', '2026-02-13 06:25:03'),
('dc166f24-982e-459a-a180-6910f855c3f0', 'test1', '$2b$10$BbAtE/75Gp5WxV4OvGKhSeCGL7kbpoF/XoOv4RJBQXsS0RFjBn.y2', 'test user', NULL, '1', NULL, NULL, NULL, NULL, 0, NULL, NULL, 'en', 'auto', '2026-02-16 11:39:32', '2026-02-12 12:53:17', '2026-02-16 11:39:32');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE `user_roles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User ID who last updated this role assignment'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`id`, `user_id`, `role_id`, `created_at`, `updated_at`, `updated_by`) VALUES
('22360322-c2e6-4d4b-b173-b6b8164cc50a', 'dc166f24-982e-459a-a180-6910f855c3f0', 'cf59ba68-0816-11f1-b070-7c2a31390701', '2026-02-12 14:42:15', '2026-02-12 14:42:15', 'bdd239a1-07d7-11f1-b070-7c2a31390701'),
('4fd11a14-a75f-430c-88a7-546f2da4f42e', '80c1cbcf-ef58-4109-8a9f-9123871c36db', 'cf59bf2b-0816-11f1-b070-7c2a31390701', '2026-02-13 05:43:54', '2026-02-13 05:43:54', 'bdd239a1-07d7-11f1-b070-7c2a31390701'),
('6b933890-6d79-4708-bc76-432e3d8260b6', 'dc166f24-982e-459a-a180-6910f855c3f0', 'cf59bd40-0816-11f1-b070-7c2a31390701', '2026-02-12 14:42:15', '2026-02-12 14:42:15', 'bdd239a1-07d7-11f1-b070-7c2a31390701'),
('7181bbe7-e068-4cfe-bfdf-e5113435135d', 'dc166f24-982e-459a-a180-6910f855c3f0', 'cf59be1e-0816-11f1-b070-7c2a31390701', '2026-02-12 14:42:15', '2026-02-12 14:42:15', 'bdd239a1-07d7-11f1-b070-7c2a31390701'),
('7aac3b69-810c-43c5-8785-dad47ae2e367', 'dc166f24-982e-459a-a180-6910f855c3f0', 'cf59beab-0816-11f1-b070-7c2a31390701', '2026-02-12 14:42:15', '2026-02-12 14:42:15', 'bdd239a1-07d7-11f1-b070-7c2a31390701'),
('eb144fc4-3d76-4178-86b7-6ec93b357db9', 'dc166f24-982e-459a-a180-6910f855c3f0', 'cf59bf2b-0816-11f1-b070-7c2a31390701', '2026-02-12 14:42:15', '2026-02-12 14:42:15', 'bdd239a1-07d7-11f1-b070-7c2a31390701');

-- --------------------------------------------------------

--
-- Table structure for table `user_role_permissions`
--

DROP TABLE IF EXISTS `user_role_permissions`;
CREATE TABLE `user_role_permissions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'e.g., "content_type:create", "user:read"',
  `resource` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'e.g., "content_type", "user", "role", "media"',
  `action` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'e.g., "create", "read", "update", "delete"',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'e.g., "content_management", "user_management"',
  `is_system` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1 = system (cannot delete), 0 = custom (can delete)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_role_permissions`
--

INSERT INTO `user_role_permissions` (`id`, `name`, `resource`, `action`, `description`, `category`, `is_system`, `created_at`, `updated_at`) VALUES
('6c7b4cf9-08e5-11f1-b070-7c2a31390701', 'form_element:create', 'form_element', 'create', 'Create new form elements', 'content_management', 1, '2026-02-13 14:08:08', '2026-02-13 14:08:20'),
('6c7e35eb-08e5-11f1-b070-7c2a31390701', 'form_element:read', 'form_element', 'read', 'View form elements', 'content_management', 1, '2026-02-13 14:08:08', '2026-02-13 14:08:20'),
('6c7feba6-08e5-11f1-b070-7c2a31390701', 'form_element:update', 'form_element', 'update', 'Update form elements', 'content_management', 1, '2026-02-13 14:08:08', '2026-02-13 14:08:20'),
('6c814ab7-08e5-11f1-b070-7c2a31390701', 'form_element:delete', 'form_element', 'delete', 'Delete form elements', 'content_management', 1, '2026-02-13 14:08:08', '2026-02-13 14:08:20'),
('b290a5cf-0816-11f1-b070-7c2a31390701', 'content_type:create', 'content_type', 'create', 'Create new content types', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290c509-0816-11f1-b070-7c2a31390701', 'content_type:read', 'content_type', 'read', 'View content types', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290c6d5-0816-11f1-b070-7c2a31390701', 'content_type:update', 'content_type', 'update', 'Update content types', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290c805-0816-11f1-b070-7c2a31390701', 'content_type:delete', 'content_type', 'delete', 'Delete content types', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290c924-0816-11f1-b070-7c2a31390701', 'content_entry:create', 'content_entry', 'create', 'Create content entries', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290ca41-0816-11f1-b070-7c2a31390701', 'content_entry:read', 'content_entry', 'read', 'View content entries', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290cc8a-0816-11f1-b070-7c2a31390701', 'content_entry:update', 'content_entry', 'update', 'Update content entries', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290ce68-0816-11f1-b070-7c2a31390701', 'content_entry:delete', 'content_entry', 'delete', 'Delete content entries', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290cfd1-0816-11f1-b070-7c2a31390701', 'content_entry:publish', 'content_entry', 'publish', 'Publish content entries', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290d0e8-0816-11f1-b070-7c2a31390701', 'content_entry:unpublish', 'content_entry', 'unpublish', 'Unpublish content entries', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290d1ff-0816-11f1-b070-7c2a31390701', 'page:create', 'page', 'create', 'Create new pages', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290d30f-0816-11f1-b070-7c2a31390701', 'page:read', 'page', 'read', 'View pages', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290d420-0816-11f1-b070-7c2a31390701', 'page:update', 'page', 'update', 'Update pages', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290d52c-0816-11f1-b070-7c2a31390701', 'page:delete', 'page', 'delete', 'Delete pages', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290d638-0816-11f1-b070-7c2a31390701', 'page:publish', 'page', 'publish', 'Publish pages', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290d745-0816-11f1-b070-7c2a31390701', 'block:create', 'block', 'create', 'Create new blocks', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290d845-0816-11f1-b070-7c2a31390701', 'block:read', 'block', 'read', 'View blocks', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290d94c-0816-11f1-b070-7c2a31390701', 'block:update', 'block', 'update', 'Update blocks', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290da5c-0816-11f1-b070-7c2a31390701', 'block:delete', 'block', 'delete', 'Delete blocks', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290db6b-0816-11f1-b070-7c2a31390701', 'media:create', 'media', 'create', 'Upload media files', 'media_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290dc74-0816-11f1-b070-7c2a31390701', 'media:read', 'media', 'read', 'View media files', 'media_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290dd79-0816-11f1-b070-7c2a31390701', 'media:update', 'media', 'update', 'Update media files', 'media_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290de84-0816-11f1-b070-7c2a31390701', 'media:delete', 'media', 'delete', 'Delete media files', 'media_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290df8b-0816-11f1-b070-7c2a31390701', 'user:create', 'user', 'create', 'Create new users', 'user_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290e098-0816-11f1-b070-7c2a31390701', 'user:read', 'user', 'read', 'View users', 'user_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290e1a2-0816-11f1-b070-7c2a31390701', 'user:update', 'user', 'update', 'Update users', 'user_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290e2b0-0816-11f1-b070-7c2a31390701', 'user:delete', 'user', 'delete', 'Delete users', 'user_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290e3c2-0816-11f1-b070-7c2a31390701', 'user:reset_password', 'user', 'reset_password', 'Reset user passwords', 'user_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290e4d2-0816-11f1-b070-7c2a31390701', 'role:create', 'role', 'create', 'Create new roles', 'user_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290e5d9-0816-11f1-b070-7c2a31390701', 'role:read', 'role', 'read', 'View roles', 'user_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290e6e0-0816-11f1-b070-7c2a31390701', 'role:update', 'role', 'update', 'Update roles', 'user_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290e7ed-0816-11f1-b070-7c2a31390701', 'role:delete', 'role', 'delete', 'Delete roles', 'user_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290e8f3-0816-11f1-b070-7c2a31390701', 'workflow:create', 'workflow', 'create', 'Create workflows', 'workflow_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290e9ff-0816-11f1-b070-7c2a31390701', 'workflow:read', 'workflow', 'read', 'View workflows', 'workflow_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290eb11-0816-11f1-b070-7c2a31390701', 'workflow:update', 'workflow', 'update', 'Update workflows', 'workflow_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290ec27-0816-11f1-b070-7c2a31390701', 'workflow:delete', 'workflow', 'delete', 'Delete workflows', 'workflow_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290ed3e-0816-11f1-b070-7c2a31390701', 'workflow:approve', 'workflow', 'approve', 'Approve workflow items', 'workflow_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290ee50-0816-11f1-b070-7c2a31390701', 'workflow:reject', 'workflow', 'reject', 'Reject workflow items', 'workflow_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290ef62-0816-11f1-b070-7c2a31390701', 'navigation:create', 'navigation', 'create', 'Create navigation items', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290f088-0816-11f1-b070-7c2a31390701', 'navigation:read', 'navigation', 'read', 'View navigation', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290f1aa-0816-11f1-b070-7c2a31390701', 'navigation:update', 'navigation', 'update', 'Update navigation', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290f2d7-0816-11f1-b070-7c2a31390701', 'navigation:delete', 'navigation', 'delete', 'Delete navigation items', 'content_management', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290f3ff-0816-11f1-b070-7c2a31390701', 'settings:read', 'settings', 'read', 'View tenant settings', 'settings', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290f510-0816-11f1-b070-7c2a31390701', 'settings:update', 'settings', 'update', 'Update tenant settings', 'settings', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290f73b-0816-11f1-b070-7c2a31390701', 'api:read', 'api', 'read', 'Access delivery API (read-only)', 'api_access', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20'),
('b290fa61-0816-11f1-b070-7c2a31390701', 'api:write', 'api', 'write', 'Access delivery API (read-write)', 'api_access', 1, '2026-02-12 13:28:20', '2026-02-13 14:08:20');

-- --------------------------------------------------------

--
-- Table structure for table `webhooks`
--

DROP TABLE IF EXISTS `webhooks`;
CREATE TABLE `webhooks` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `method` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'POST',
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT 'active, inactive',
  `data` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Include item data in payload',
  `actions` json NOT NULL COMMENT '["create", "update", "delete"]',
  `collections` json NOT NULL COMMENT '["posts", "pages", "users"]',
  `headers` json DEFAULT NULL COMMENT 'Custom HTTP headers',
  `was_active_before_deprecation` tinyint(1) DEFAULT NULL,
  `migrated_flow` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ID of flow this webhook was migrated to',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `workflows`
--

DROP TABLE IF EXISTS `workflows`;
CREATE TABLE `workflows` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `steps` json DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `workflow_comments`
--

DROP TABLE IF EXISTS `workflow_comments`;
CREATE TABLE `workflow_comments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `instance_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `type` enum('comment','rejection_reason') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'comment',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `workflow_instances`
--

DROP TABLE IF EXISTS `workflow_instances`;
CREATE TABLE `workflow_instances` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `workflow_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entry_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_step` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `assigned_to` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity`
--
ALTER TABLE `activity`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_activity_project` (`project_id`),
  ADD KEY `idx_activity_user` (`user_id`),
  ADD KEY `idx_activity_collection` (`collection`,`item`),
  ADD KEY `idx_activity_timestamp` (`timestamp`),
  ADD KEY `idx_activity_action` (`action`);

--
-- Indexes for table `api_keys`
--
ALTER TABLE `api_keys`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_api_keys_project` (`project_id`),
  ADD KEY `idx_api_keys_last_used` (`last_used_at`);

--
-- Indexes for table `api_rate_limits`
--
ALTER TABLE `api_rate_limits`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_rate_limit_window` (`identifier`,`identifier_type`,`endpoint`,`window_start`),
  ADD KEY `idx_rate_limits_identifier` (`identifier`),
  ADD KEY `idx_rate_limits_window` (`window_end`);

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_comments_project` (`project_id`),
  ADD KEY `idx_comments_collection` (`collection`,`item`),
  ADD KEY `idx_comments_user_created` (`user_created`),
  ADD KEY `fk_comments_user_updated` (`user_updated`);

--
-- Indexes for table `content_entries`
--
ALTER TABLE `content_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_content_entries_type` (`content_type_id`),
  ADD KEY `idx_content_entries_status` (`status`),
  ADD KEY `idx_content_entries_published` (`published_at`),
  ADD KEY `idx_content_slug` (`slug`),
  ADD KEY `idx_content_status_type_published` (`status`,`content_type_id`,`published_at`),
  ADD KEY `idx_content_scheduled_publish` (`scheduled_publish_at`),
  ADD KEY `idx_content_scheduled_unpublish` (`scheduled_unpublish_at`),
  ADD KEY `fk_content_entries_created_by` (`created_by`),
  ADD KEY `fk_content_entries_updated_by` (`updated_by`),
  ADD KEY `fk_content_entries_published_version` (`published_version_id`);
ALTER TABLE `content_entries` ADD FULLTEXT KEY `ft_content_search` (`search_index`);

--
-- Indexes for table `content_entries_localized`
--
ALTER TABLE `content_entries_localized`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_content_entries_localized` (`entry_id`,`locale`),
  ADD KEY `idx_content_entries_localized_locale` (`locale`);

--
-- Indexes for table `content_types`
--
ALTER TABLE `content_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_content_types_project_collection` (`project_id`,`collection`),
  ADD KEY `idx_content_types_project` (`project_id`);

--
-- Indexes for table `content_versions`
--
ALTER TABLE `content_versions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_content_versions_entry` (`entry_id`),
  ADD KEY `idx_versions_hash` (`hash`),
  ADD KEY `fk_content_versions_created_by` (`created_by`);

--
-- Indexes for table `fields`
--
ALTER TABLE `fields`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_fields_collection_field` (`content_type_id`,`field`),
  ADD KEY `idx_fields_type` (`type`),
  ADD KEY `idx_fields_interface` (`interface`),
  ADD KEY `idx_fields_group` (`group`);

--
-- Indexes for table `flows`
--
ALTER TABLE `flows`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_flows_project` (`project_id`),
  ADD KEY `idx_flows_status` (`status`),
  ADD KEY `idx_flows_trigger` (`trigger`),
  ADD KEY `fk_flows_user_created` (`user_created`);

--
-- Indexes for table `form_elements`
--
ALTER TABLE `form_elements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_form_elements_project_key` (`project_id`,`key`),
  ADD KEY `idx_form_elements_project` (`project_id`),
  ADD KEY `idx_form_elements_type` (`type`),
  ADD KEY `idx_form_elements_category` (`category`),
  ADD KEY `idx_form_elements_is_system` (`is_system`),
  ADD KEY `idx_form_elements_is_active` (`is_active`),
  ADD KEY `idx_form_elements_sort` (`sort_order`);

--
-- Indexes for table `locales`
--
ALTER TABLE `locales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_locales_project_code` (`project_id`,`code`);

--
-- Indexes for table `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_login_attempts_email` (`email`),
  ADD KEY `idx_login_attempts_ip` (`ip`),
  ADD KEY `idx_login_attempts_created` (`created_at`);

--
-- Indexes for table `media_assets`
--
ALTER TABLE `media_assets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_media_assets_project` (`project_id`),
  ADD KEY `idx_media_assets_folder` (`folder_id`),
  ADD KEY `idx_media_type_mime` (`type`,`mime_type`),
  ADD KEY `idx_media_uploaded_on` (`uploaded_on`),
  ADD KEY `fk_media_uploaded_by` (`uploaded_by`),
  ADD KEY `fk_media_modified_by` (`modified_by`);

--
-- Indexes for table `media_folders`
--
ALTER TABLE `media_folders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_media_folders_project` (`project_id`),
  ADD KEY `idx_media_folders_parent` (`parent_id`);

--
-- Indexes for table `media_versions`
--
ALTER TABLE `media_versions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_media_versions_asset` (`asset_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_recipient` (`recipient`),
  ADD KEY `idx_notifications_status` (`status`),
  ADD KEY `idx_notifications_timestamp` (`timestamp`),
  ADD KEY `fk_notifications_sender` (`sender`);

--
-- Indexes for table `operations`
--
ALTER TABLE `operations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_operations_flow` (`flow_id`),
  ADD KEY `idx_operations_type` (`type`),
  ADD KEY `fk_operations_user_created` (`user_created`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `idx_reset_tokens_user` (`user_id`),
  ADD KEY `idx_reset_tokens_expires` (`expires_at`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_permissions_project` (`project_id`),
  ADD KEY `idx_permissions_role` (`role_id`),
  ADD KEY `idx_permissions_collection` (`collection`),
  ADD KEY `idx_permissions_action` (`action`);

--
-- Indexes for table `presets`
--
ALTER TABLE `presets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_presets_project` (`project_id`),
  ADD KEY `idx_presets_user` (`user_id`),
  ADD KEY `idx_presets_role` (`role_id`),
  ADD KEY `idx_presets_collection` (`collection`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_projects_slug` (`slug`);

--
-- Indexes for table `project_members`
--
ALTER TABLE `project_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_project_members` (`project_id`,`user_id`),
  ADD KEY `idx_project_members_user` (`user_id`),
  ADD KEY `fk_project_members_role` (`role_id`);

--
-- Indexes for table `relations`
--
ALTER TABLE `relations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_relations_project` (`project_id`),
  ADD KEY `idx_relations_many` (`many_collection`,`many_field`),
  ADD KEY `idx_relations_one` (`one_collection`,`one_field`);

--
-- Indexes for table `rest_schema_cache`
--
ALTER TABLE `rest_schema_cache`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_rest_schema_cache_project` (`project_id`),
  ADD KEY `idx_rest_schema_checksum` (`checksum`);

--
-- Indexes for table `revisions`
--
ALTER TABLE `revisions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_revisions_project` (`project_id`),
  ADD KEY `idx_revisions_activity` (`activity_id`),
  ADD KEY `idx_revisions_collection` (`collection`,`item`),
  ADD KEY `idx_revisions_parent` (`parent_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_roles_name` (`name`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_role_permissions` (`role_id`,`permission_id`),
  ADD KEY `idx_role_permissions_role` (`role_id`),
  ADD KEY `idx_role_permissions_permission` (`permission_id`),
  ADD KEY `idx_role_permissions_updated_by` (`updated_by`);

--
-- Indexes for table `seo_metadata`
--
ALTER TABLE `seo_metadata`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_seo_metadata_entry_locale` (`entry_id`,`locale`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`token`),
  ADD KEY `idx_sessions_user` (`user_id`),
  ADD KEY `idx_sessions_expires` (`expires`),
  ADD KEY `fk_sessions_share` (`share_id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_settings_project` (`project_id`);

--
-- Indexes for table `shares`
--
ALTER TABLE `shares`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_shares_project` (`project_id`),
  ADD KEY `idx_shares_collection` (`collection`,`item`),
  ADD KEY `idx_shares_user_created` (`user_created`),
  ADD KEY `idx_shares_date_end` (`date_end`),
  ADD KEY `fk_shares_role` (`role_id`);

--
-- Indexes for table `themes`
--
ALTER TABLE `themes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_themes_project` (`project_id`),
  ADD KEY `idx_themes_parent` (`parent_id`),
  ADD KEY `idx_themes_platform` (`platform_theme_id`);

--
-- Indexes for table `theme_assignments`
--
ALTER TABLE `theme_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_theme_assignments_project` (`project_id`),
  ADD KEY `idx_theme_assignments_entry` (`entry_id`),
  ADD KEY `fk_theme_assignments_theme` (`theme_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_status` (`status`),
  ADD KEY `idx_users_provider` (`provider`),
  ADD KEY `idx_users_email_verified` (`email_verified_at`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_user_roles` (`user_id`,`role_id`),
  ADD KEY `idx_user_roles_role` (`role_id`),
  ADD KEY `idx_user_roles_updated_by` (`updated_by`);

--
-- Indexes for table `user_role_permissions`
--
ALTER TABLE `user_role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `uk_tenant_permissions_name` (`name`),
  ADD KEY `idx_tenant_permissions_resource` (`resource`),
  ADD KEY `idx_tenant_permissions_action` (`action`),
  ADD KEY `idx_tenant_permissions_category` (`category`),
  ADD KEY `idx_tenant_permissions_is_system` (`is_system`);

--
-- Indexes for table `webhooks`
--
ALTER TABLE `webhooks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_webhooks_project` (`project_id`),
  ADD KEY `idx_webhooks_status` (`status`);

--
-- Indexes for table `workflows`
--
ALTER TABLE `workflows`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_workflows_project` (`project_id`),
  ADD KEY `fk_workflows_content_type` (`content_type_id`);

--
-- Indexes for table `workflow_comments`
--
ALTER TABLE `workflow_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_workflow_comments_instance` (`instance_id`),
  ADD KEY `fk_workflow_comments_user` (`user_id`);

--
-- Indexes for table `workflow_instances`
--
ALTER TABLE `workflow_instances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_workflow_instances_workflow` (`workflow_id`),
  ADD KEY `idx_workflow_instances_entry` (`entry_id`),
  ADD KEY `fk_workflow_instances_assigned` (`assigned_to`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `api_keys`
--
ALTER TABLE `api_keys`
  ADD CONSTRAINT `fk_api_keys_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `fk_comments_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_comments_user_created` FOREIGN KEY (`user_created`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_comments_user_updated` FOREIGN KEY (`user_updated`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `content_entries`
--
ALTER TABLE `content_entries`
  ADD CONSTRAINT `fk_content_entries_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_content_entries_published_version` FOREIGN KEY (`published_version_id`) REFERENCES `content_versions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_content_entries_type` FOREIGN KEY (`content_type_id`) REFERENCES `content_types` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_content_entries_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `content_entries_localized`
--
ALTER TABLE `content_entries_localized`
  ADD CONSTRAINT `fk_content_entries_localized_entry` FOREIGN KEY (`entry_id`) REFERENCES `content_entries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `content_types`
--
ALTER TABLE `content_types`
  ADD CONSTRAINT `fk_content_types_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `content_versions`
--
ALTER TABLE `content_versions`
  ADD CONSTRAINT `fk_content_versions_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_content_versions_entry` FOREIGN KEY (`entry_id`) REFERENCES `content_entries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `fields`
--
ALTER TABLE `fields`
  ADD CONSTRAINT `fk_fields_content_type` FOREIGN KEY (`content_type_id`) REFERENCES `content_types` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `flows`
--
ALTER TABLE `flows`
  ADD CONSTRAINT `fk_flows_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_flows_user_created` FOREIGN KEY (`user_created`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `form_elements`
--
ALTER TABLE `form_elements`
  ADD CONSTRAINT `fk_form_elements_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `locales`
--
ALTER TABLE `locales`
  ADD CONSTRAINT `fk_locales_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `media_assets`
--
ALTER TABLE `media_assets`
  ADD CONSTRAINT `fk_media_assets_folder` FOREIGN KEY (`folder_id`) REFERENCES `media_folders` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_media_assets_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_media_modified_by` FOREIGN KEY (`modified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_media_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `media_folders`
--
ALTER TABLE `media_folders`
  ADD CONSTRAINT `fk_media_folders_parent` FOREIGN KEY (`parent_id`) REFERENCES `media_folders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_media_folders_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `media_versions`
--
ALTER TABLE `media_versions`
  ADD CONSTRAINT `fk_media_versions_asset` FOREIGN KEY (`asset_id`) REFERENCES `media_assets` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_recipient` FOREIGN KEY (`recipient`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_notifications_sender` FOREIGN KEY (`sender`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `operations`
--
ALTER TABLE `operations`
  ADD CONSTRAINT `fk_operations_flow` FOREIGN KEY (`flow_id`) REFERENCES `flows` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_operations_user_created` FOREIGN KEY (`user_created`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `fk_reset_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `permissions`
--
ALTER TABLE `permissions`
  ADD CONSTRAINT `fk_permissions_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `presets`
--
ALTER TABLE `presets`
  ADD CONSTRAINT `fk_presets_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_presets_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_presets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_members`
--
ALTER TABLE `project_members`
  ADD CONSTRAINT `fk_project_members_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_project_members_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_project_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `relations`
--
ALTER TABLE `relations`
  ADD CONSTRAINT `fk_relations_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rest_schema_cache`
--
ALTER TABLE `rest_schema_cache`
  ADD CONSTRAINT `fk_rest_schema_cache_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `revisions`
--
ALTER TABLE `revisions`
  ADD CONSTRAINT `fk_revisions_activity` FOREIGN KEY (`activity_id`) REFERENCES `activity` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_revisions_parent` FOREIGN KEY (`parent_id`) REFERENCES `revisions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_revisions_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `user_role_permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `seo_metadata`
--
ALTER TABLE `seo_metadata`
  ADD CONSTRAINT `fk_seo_metadata_entry` FOREIGN KEY (`entry_id`) REFERENCES `content_entries` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `fk_sessions_share` FOREIGN KEY (`share_id`) REFERENCES `shares` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `settings`
--
ALTER TABLE `settings`
  ADD CONSTRAINT `fk_settings_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `shares`
--
ALTER TABLE `shares`
  ADD CONSTRAINT `fk_shares_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_shares_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_shares_user_created` FOREIGN KEY (`user_created`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `themes`
--
ALTER TABLE `themes`
  ADD CONSTRAINT `fk_themes_parent` FOREIGN KEY (`parent_id`) REFERENCES `themes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_themes_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `theme_assignments`
--
ALTER TABLE `theme_assignments`
  ADD CONSTRAINT `fk_theme_assignments_entry` FOREIGN KEY (`entry_id`) REFERENCES `content_entries` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_theme_assignments_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_theme_assignments_theme` FOREIGN KEY (`theme_id`) REFERENCES `themes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `webhooks`
--
ALTER TABLE `webhooks`
  ADD CONSTRAINT `fk_webhooks_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `workflows`
--
ALTER TABLE `workflows`
  ADD CONSTRAINT `fk_workflows_content_type` FOREIGN KEY (`content_type_id`) REFERENCES `content_types` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_workflows_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `workflow_comments`
--
ALTER TABLE `workflow_comments`
  ADD CONSTRAINT `fk_workflow_comments_instance` FOREIGN KEY (`instance_id`) REFERENCES `workflow_instances` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_workflow_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `workflow_instances`
--
ALTER TABLE `workflow_instances`
  ADD CONSTRAINT `fk_workflow_instances_assigned` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_workflow_instances_entry` FOREIGN KEY (`entry_id`) REFERENCES `content_entries` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_workflow_instances_workflow` FOREIGN KEY (`workflow_id`) REFERENCES `workflows` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
