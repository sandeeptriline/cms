# Local MySQL Setup Guide

**Version:** 1.0  
**Date:** 2026

This guide helps you set up MySQL 8.0+ locally for development.

---

## Installation

### macOS

```bash
# Using Homebrew (recommended)
brew install mysql@8.0
brew services start mysql@8.0

# Verify installation
mysql --version
```

### Ubuntu/Debian

```bash
# Update package list
sudo apt update

# Install MySQL Server
sudo apt install mysql-server

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Verify installation
mysql --version
```

### Windows

1. Download MySQL Installer from [MySQL Downloads](https://dev.mysql.com/downloads/installer/)
2. Run the installer
3. Choose "Developer Default" setup type
4. Follow the installation wizard
5. Set root password during installation
6. Start MySQL service from Services panel

---

## Initial Setup

### 1. Secure MySQL Installation (Recommended)

```bash
# Run security script (Linux/macOS)
sudo mysql_secure_installation

# Or login and run manually
mysql -u root -p
```

### 2. Create Platform Database

```sql
-- Login to MySQL
mysql -u root -p

-- Create platform database
CREATE DATABASE cms_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verify database creation
SHOW DATABASES;

-- Exit MySQL
EXIT;
```

### 3. Create Database User (Optional but Recommended)

```sql
-- Login as root
mysql -u root -p

-- Create user for CMS
CREATE USER 'cms_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant privileges
-- Note: MySQL doesn't support wildcards in GRANT statements
-- Tenant databases will be granted privileges automatically during provisioning
GRANT ALL PRIVILEGES ON cms_platform.* TO 'cms_user'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify user
SELECT user, host FROM mysql.user WHERE user = 'cms_user';

-- Exit
EXIT;
```

---

## Connection Configuration

### Update Environment Variables

In your backend `.env` file:

```env
# Using root user (development only)
DATABASE_URL=mysql://root:your_password@localhost:3306/cms_platform

# Or using dedicated user (recommended)
DATABASE_URL=mysql://cms_user:your_secure_password@localhost:3306/cms_platform

TENANT_DATABASE_PREFIX=cms_tenant_
```

### Test Connection

```bash
# Test MySQL connection
mysql -u root -p -e "SELECT VERSION();"

# Or test with your user
mysql -u cms_user -p -e "SHOW DATABASES;"
```

---

## Running MySQL

### macOS (Homebrew)

```bash
# Start MySQL
brew services start mysql@8.0

# Stop MySQL
brew services stop mysql@8.0

# Restart MySQL
brew services restart mysql@8.0

# Check status
brew services list | grep mysql
```

### Linux (systemd)

```bash
# Start MySQL
sudo systemctl start mysql

# Stop MySQL
sudo systemctl stop mysql

# Restart MySQL
sudo systemctl restart mysql

# Check status
sudo systemctl status mysql

# Enable auto-start on boot
sudo systemctl enable mysql
```

### Windows

- Use Services panel (services.msc)
- Find "MySQL80" service
- Start/Stop/Restart as needed
- Or use Command Prompt (as Administrator):
  ```cmd
  net start MySQL80
  net stop MySQL80
  ```

---

## Database Management Tools

### Recommended GUI Tools

1. **MySQL Workbench** (Official)
   - Download: [MySQL Workbench](https://dev.mysql.com/downloads/workbench/)
   - Features: Visual database design, SQL editor, Server administration

2. **DBeaver** (Free, Cross-platform)
   - Download: [DBeaver](https://dbeaver.io/download/)
   - Features: Universal database tool, supports many databases

3. **Prisma Studio** (For Prisma projects)
   - Install: `npx prisma studio`
   - Features: Visual database browser, edit data directly

4. **TablePlus** (macOS/Windows)
   - Download: [TablePlus](https://tableplus.com/)
   - Features: Modern, native database client

---

## Common Issues & Solutions

### Issue: Can't connect to MySQL

**Solution:**
```bash
# Check if MySQL is running
sudo systemctl status mysql  # Linux
brew services list | grep mysql  # macOS

# Check MySQL port
netstat -an | grep 3306

# Check MySQL error log
sudo tail -f /var/log/mysql/error.log  # Linux
tail -f /usr/local/var/mysql/*.err  # macOS Homebrew
```

### Issue: Access denied for user

**Solution:**
```sql
-- Reset root password (if needed)
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### Issue: Port 3306 already in use

**Solution:**
```bash
# Find process using port 3306
sudo lsof -i :3306  # macOS/Linux

# Kill the process or change MySQL port in my.cnf
```

### Issue: Character set issues

**Solution:**
```sql
-- Ensure UTF8MB4 encoding
ALTER DATABASE cms_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## MySQL Configuration

### Location of Configuration Files

- **macOS (Homebrew)**: `/usr/local/etc/my.cnf` or `/opt/homebrew/etc/my.cnf`
- **Linux**: `/etc/mysql/my.cnf` or `/etc/my.cnf`
- **Windows**: `C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`

### Recommended Settings for Development

```ini
[mysqld]
# Character set
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

# Connection settings
max_connections=200
max_allowed_packet=256M

# Performance (for development)
innodb_buffer_pool_size=1G
innodb_log_file_size=256M

# Logging (optional)
general_log=1
general_log_file=/var/log/mysql/general.log
```

**Note:** After changing configuration, restart MySQL:
```bash
sudo systemctl restart mysql  # Linux
brew services restart mysql@8.0  # macOS
```

---

## Next Steps

1. ✅ MySQL installed and running
2. ✅ Platform database created (`cms_platform`)
3. ✅ Database user created (optional)
4. ✅ Environment variables configured
5. ✅ Connection tested

**Ready to proceed with Phase 0: Foundation & Setup!**

---

## Additional Resources

- [MySQL 8.0 Documentation](https://dev.mysql.com/doc/refman/8.0/en/)
- [MySQL Workbench Documentation](https://dev.mysql.com/doc/workbench/en/)
- [Prisma MySQL Guide](https://www.prisma.io/docs/concepts/database-connectors/mysql)

---

**Last Updated**: 2026
