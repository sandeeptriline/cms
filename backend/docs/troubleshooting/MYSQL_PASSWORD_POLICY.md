# MySQL Password Policy Requirements

**Date**: 2026-02-12

---

## Issue: Password Policy Error

When creating a MySQL user, you may encounter:

```
#1819 - Your password does not satisfy the current policy requirements
```

This happens because MySQL 8.0+ has a default password validation plugin (`validate_password`) that enforces password strength requirements.

---

## MySQL Password Policy Requirements

### Default Policy (MEDIUM)

MySQL 8.0+ default password policy requires:

1. **Minimum Length**: 8 characters
2. **Character Mix**:
   - At least 1 uppercase letter (A-Z)
   - At least 1 lowercase letter (a-z)
   - At least 1 number (0-9)
   - At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
3. **Dictionary Check**: Password cannot be a common dictionary word

### Policy Levels

MySQL has three password policy levels:

- **LOW**: Only checks password length (default: 8 characters)
- **MEDIUM**: Checks length, numeric, mixed case, and special characters (default)
- **STRONG**: Checks length, numeric, mixed case, special characters, and dictionary file

---

## Solutions

### Solution 1: Use a Strong Password (Recommended)

Use a password that meets the policy requirements:

```sql
-- Login as root
sudo mysql

-- Create user with strong password
CREATE USER 'cms_user'@'localhost' IDENTIFIED BY 'Admin@123!Secure';
GRANT ALL PRIVILEGES ON cms_platform.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;
```

**Update your `.env` file**:
```env
DATABASE_URL=mysql://cms_user:Admin%40123%21Secure@localhost:3306/cms_platform
```

**Note**: URL-encode special characters:
- `@` → `%40`
- `!` → `%21`

### Solution 2: Check Current Policy Settings

```sql
-- Login as root
sudo mysql

-- Check current policy
SHOW VARIABLES LIKE 'validate_password%';
```

This will show:
- `validate_password.policy` - Policy level (LOW, MEDIUM, STRONG)
- `validate_password.length` - Minimum password length
- `validate_password.mixed_case_count` - Minimum uppercase/lowercase letters
- `validate_password.number_count` - Minimum numbers
- `validate_password.special_char_count` - Minimum special characters

### Solution 3: Temporarily Lower Policy (Development Only)

**⚠️ Warning**: Only use this for development. Never disable password validation in production.

```sql
-- Login as root
sudo mysql

-- Temporarily lower policy
SET GLOBAL validate_password.policy = LOW;
SET GLOBAL validate_password.length = 6;

-- Create user with simpler password
CREATE USER 'cms_user'@'localhost' IDENTIFIED BY 'Admin123';
GRANT ALL PRIVILEGES ON cms_platform.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;

-- Restore default policy (optional)
SET GLOBAL validate_password.policy = MEDIUM;
SET GLOBAL validate_password.length = 8;
```

### Solution 4: Disable Password Validation Plugin (Not Recommended)

**⚠️ Strong Warning**: This is not recommended, especially for production. Only use if absolutely necessary for development.

```sql
-- Login as root
sudo mysql

-- Uninstall password validation plugin
UNINSTALL PLUGIN validate_password;

-- Create user
CREATE USER 'cms_user'@'localhost' IDENTIFIED BY 'Admin123';
GRANT ALL PRIVILEGES ON cms_platform.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;

-- Reinstall plugin (recommended)
INSTALL PLUGIN validate_password SONAME 'validate_password.so';
```

---

## Recommended Passwords for Development

Here are some examples of passwords that meet MySQL's default policy:

1. `Admin@123!Secure` - Meets all requirements
2. `CmsUser#2024` - Meets all requirements
3. `MyCms!Pass123` - Meets all requirements
4. `Secure@Pass1` - Meets all requirements

**Pattern**: `[Upper][Lower][Special][Number][MoreChars]`

---

## Quick Setup Script with Strong Password

```sql
-- Run as root
sudo mysql <<EOF
-- Create user with strong password
CREATE USER IF NOT EXISTS 'cms_user'@'localhost' IDENTIFIED BY 'Admin@123!Secure';

-- Grant privileges
GRANT ALL PRIVILEGES ON cms_platform.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;

-- Verify
SELECT User, Host FROM mysql.user WHERE User='cms_user';
SHOW GRANTS FOR 'cms_user'@'localhost';
EOF
```

**Update `.env`**:
```env
DATABASE_URL=mysql://cms_user:Admin%40123%21Secure@localhost:3306/cms_platform
```

---

## URL Encoding for Special Characters

When using passwords with special characters in `DATABASE_URL`, you must URL-encode them:

| Character | URL Encoded |
|-----------|-------------|
| `@` | `%40` |
| `!` | `%21` |
| `#` | `%23` |
| `$` | `%24` |
| `%` | `%25` |
| `&` | `%26` |
| `*` | `%2A` |
| `+` | `%2B` |
| `=` | `%3D` |

**Example**:
- Password: `Admin@123!Secure`
- URL-encoded: `Admin%40123%21Secure`
- Full URL: `mysql://cms_user:Admin%40123%21Secure@localhost:3306/cms_platform`

---

## Testing Password Strength

You can test if a password meets the policy before creating the user:

```sql
-- This will show the policy requirements
SHOW VARIABLES LIKE 'validate_password%';

-- Try to set a password (will fail if it doesn't meet requirements)
-- This helps you understand what's missing
ALTER USER 'test'@'localhost' IDENTIFIED BY 'your_password_here';
```

---

## Related Documentation

- [MySQL Password Validation Plugin](https://dev.mysql.com/doc/refman/8.0/en/validate-password.html)
- [MySQL User Account Management](https://dev.mysql.com/doc/refman/8.0/en/user-management.html)
- [MySQL User Setup Guide](./MYSQL_USER_SETUP.md)

---

**Last Updated**: 2026-02-12
