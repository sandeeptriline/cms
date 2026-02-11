# Database Setup Instructions

## Current Configuration

Your `.env` file is configured with:
```
DATABASE_URL=mysql://root:password@localhost:3306/cms_platform
```

## Next Steps

### 1. Verify MySQL Connection

Test your MySQL connection with your actual credentials:

```bash
# Option 1: If using password
mysql -u root -p
# Enter your password when prompted

# Option 2: If using sudo (Linux)
sudo mysql -u root

# Option 3: If using different user
mysql -u your_username -p
```

### 2. Create Platform Database

Once connected to MySQL, run:

```sql
CREATE DATABASE IF NOT EXISTS cms_platform 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Verify database was created
SHOW DATABASES LIKE 'cms_platform';

-- Exit MySQL
EXIT;
```

### 3. Update .env if Needed

If your MySQL credentials are different, update `backend/.env`:

```env
# If using different user/password
DATABASE_URL=mysql://your_username:your_password@localhost:3306/cms_platform

# If using different port
DATABASE_URL=mysql://root:password@localhost:3307/cms_platform
```

### 4. Test Connection with Prisma

After database is created, test the connection:

```bash
cd backend
npx prisma db pull  # This will test the connection
```

### 5. Setup Prisma Migrations

Once connection works:

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

## Troubleshooting

### Access Denied Error

If you get "Access denied" error:

1. **Check if MySQL is running:**
   ```bash
   sudo systemctl status mysql
   ```

2. **Try with sudo (Linux):**
   ```bash
   sudo mysql -u root
   ```

3. **Reset root password (if needed):**
   ```bash
   sudo mysql
   ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_new_password';
   FLUSH PRIVILEGES;
   ```

4. **Create a new MySQL user for the project:**
   ```sql
   CREATE USER 'cms_user'@'localhost' IDENTIFIED BY 'secure_password';
   GRANT ALL PRIVILEGES ON cms_platform.* TO 'cms_user'@'localhost';
   GRANT ALL PRIVILEGES ON cms_tenant_*.* TO 'cms_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
   
   Then update `.env`:
   ```env
   DATABASE_URL=mysql://cms_user:secure_password@localhost:3306/cms_platform
   ```

---

**Once the database is created and connection works, proceed with Prisma setup!**
