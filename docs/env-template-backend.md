# Backend Environment Variables Template

Copy these variables to your `.env` file in the backend directory.

```env
# Database Configuration
# Local MySQL connection (adjust username, password, and port as needed)
DATABASE_URL=mysql://cms_user:password@localhost:3306/cms_platform
TENANT_DATABASE_PREFIX=cms_tenant_
DB_POOL_MIN=2
DB_POOL_MAX=10

# MySQL Root Connection (for tenant provisioning - database creation and privilege grants)
# This is required for automatic tenant provisioning
# If not provided, tenant provisioning will create databases but may fail to grant privileges
# Format: mysql://root:password@localhost:3306
MYSQL_ROOT_URL=mysql://root:password@localhost:3306

# Note: Ensure MySQL 8.0+ is installed and running locally
# Default MySQL port: 3306
# Create the platform database: CREATE DATABASE cms_platform;

# JWT Authentication
JWT_SECRET=change-this-to-a-random-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=change-this-to-a-different-random-secret-key
JWT_REFRESH_EXPIRES_IN=30d

# File Storage
# Use 'local' for development, 's3' for production (AWS S3, Cloudflare R2, etc.)
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=./storage/uploads

# AWS S3 Configuration (only needed if STORAGE_TYPE=s3)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=
AWS_S3_ENDPOINT=

# Email Configuration
EMAIL_PROVIDER=console
SENDGRID_API_KEY=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

# Application
NODE_ENV=development
PORT=3001
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:3000
APP_URL=http://localhost:3000
API_URL=http://localhost:3001

# Platform Admin
PLATFORM_ADMIN_EMAIL=admin@example.com
PLATFORM_ADMIN_PASSWORD=ChangeThisPassword123!

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Security
SESSION_SECRET=change-this-session-secret
BCRYPT_ROUNDS=10

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
```
