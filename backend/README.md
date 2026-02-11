# CMS Backend - NestJS API

**Framework**: NestJS  
**Language**: TypeScript  
**Database**: MySQL 8.0+  
**ORM**: Prisma

---

## 📚 Documentation

**👉 See [INDEX.md](./INDEX.md) for complete documentation index**

Quick links:
- **Setup Guide**: [docs/setup/DATABASE_SETUP.md](./docs/setup/DATABASE_SETUP.md)
- **Testing Guide**: [docs/testing/TESTING_GUIDE.md](./docs/testing/TESTING_GUIDE.md)
- **API Docs (Swagger)**: http://localhost:3001/api/docs | [Swagger Guide](./docs/api/SWAGGER_GUIDE.md)
- **Development Progress**: [docs/development/PHASE1_PROGRESS.md](./docs/development/PHASE1_PROGRESS.md)

---

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup Prisma**
   ```bash
   npx prisma init
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Run development server**
   ```bash
   npm run start:dev
   ```

## Available Scripts

- `npm run start:dev` - Start development server
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run migrations
- `npm run prisma:studio` - Open Prisma Studio

## API Endpoints

- Base URL: `http://localhost:3001/api/v1`
- API Docs: `http://localhost:3001/api/docs` (when Swagger is configured)
