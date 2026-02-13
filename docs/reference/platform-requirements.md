# Platform Requirements

**Version:** 1.0  
**Date:** 2026  
**Status:** Approved

---

## Technology Stack

### Frontend (Admin Panel)
- **Framework**: Next.js (Latest)
- **React**: React 19 (via Next.js)
- **UI Components**: Radix UI ([radix-ui.com](https://www.radix-ui.com/))
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **State Management**: Zustand / React Query

### Backend (API)
- **Framework**: NestJS (Latest)
- **Language**: TypeScript
- **ORM**: Prisma
- **Validation**: class-validator, class-transformer

### Database
- **Database**: MySQL 8.0+
- **Connection**: mysql2 (via Prisma)
- **Migrations**: Prisma Migrate

### Additional Services
- **Cache**: In-memory (development) / Database-based (production)
- **Queue**: Database-based job queue (can use BullMQ with Redis later if needed)
- **Storage**: AWS S3 / Google Cloud Storage / Cloudflare R2
- **CDN**: Cloudflare / AWS CloudFront
- **Email**: SendGrid / AWS SES / Resend
- **Search**: Elasticsearch / Meilisearch (optional)

---

## Version Requirements

### Next.js
- **Version**: Latest (16.x or higher)
- **Features Required**:
  - App Router
  - Server Components
  - Server Actions
  - React 19 support

### NestJS
- **Version**: Latest (10.x or higher)
- **Features Required**:
  - Guards (Authentication, Authorization)
  - Interceptors (Tenant filtering, Logging)
  - Pipes (Validation)
  - Modules (Feature-based architecture)

### MySQL
- **Version**: 8.0 or higher
- **Features Required**:
  - JSON data type support
  - Full-text search
  - Virtual columns
  - Window functions

### Radix UI
- **Version**: Latest
- **Packages Required**:
  - @radix-ui/react-dialog
  - @radix-ui/react-dropdown-menu
  - @radix-ui/react-popover
  - @radix-ui/react-select
  - @radix-ui/react-tabs
  - @radix-ui/react-tooltip
  - @radix-ui/react-checkbox
  - @radix-ui/react-switch
  - @radix-ui/react-slider
  - @radix-ui/themes (optional, for pre-built themes)

---

## Admin Panel UI Requirements

### Design Reference
- **Primary Reference**: [Directus Admin Panel](https://directus.io/)
- **Sandbox Reference**: [Directus Sandbox](https://sandbox.directus.io/admin/getting-started/get-started)

### UI Framework
- **Component Library**: Radix UI Primitives
- **Styling**: Tailwind CSS
- **Theme System**: Radix UI Themes (optional) or custom with Tailwind

### Key UI Patterns (from Directus)

#### 1. Layout
- **Sidebar Navigation**: Collapsible, hierarchical menu
- **Top Header**: Search, notifications, user menu, theme toggle
- **Content Area**: Breadcrumbs, page title, main content
- **Right Panel**: Optional contextual panels (help, history, comments)

#### 2. Content Management
- **List View**: Data table with sorting, filtering, pagination
- **Detail View**: Field-based form editor
- **Bulk Actions**: Multi-select with toolbar
- **Status Badges**: Visual status indicators
- **Quick Actions**: Row-level action menus

#### 3. Schema Builder
- **Visual Designer**: Drag-and-drop field builder
- **Field Configuration**: Right-side configuration panel
- **Live Preview**: Real-time schema preview
- **Relationship Mapper**: Visual relationship graph

#### 4. Media Library
- **Grid/List View**: Toggle between views
- **Folder Navigation**: Hierarchical folder structure
- **Drag & Drop Upload**: File upload interface
- **Media Preview**: Preview with metadata panel

#### 5. Dashboard
- **Customizable Widgets**: Drag-and-drop dashboard
- **Real-Time Metrics**: Live data updates
- **Activity Feed**: Recent activity timeline
- **Quick Actions**: Common task shortcuts

---

## Development Environment

### Required Tools
- **Node.js**: 20.x LTS or higher (20+ required)
- **MySQL**: 8.0+ installed locally
- **Package Manager**: npm, yarn, or pnpm
- **Git**: Version control

### Recommended Tools
- **VS Code**: Code editor
- **Cursor AI**: AI-assisted development
- **Prisma Studio**: Database GUI
- **Postman/Insomnia**: API testing
- **MySQL Workbench / DBeaver**: Database management tool

---

## Deployment Requirements

### Frontend (Next.js)
- **Platform**: Vercel, Netlify, or self-hosted
- **Node Version**: 20+ (20.x LTS or higher required)
- **Build**: Static export or server-side rendering

### Backend (NestJS)
- **Platform**: AWS, GCP, Azure, Railway, or self-hosted
- **Node Version**: 20+ (20.x LTS or higher required)
- **Process Manager**: PM2 or systemd

### Database (MySQL)
- **Platform**: AWS RDS, Google Cloud SQL, Azure Database, or self-hosted
- **Version**: MySQL 8.0+
- **Backup**: Automated daily backups
- **Replication**: Read replicas for scaling

---

## Performance Requirements

### API Response Times
- **Cached Content**: < 200ms
- **Uncached Content**: < 500ms
- **Database Queries**: < 100ms

### Frontend Performance
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: 90+ across all metrics

### Scalability
- **Concurrent Users**: 1000+ per tenant
- **API Requests**: 10,000+ requests/minute
- **Database Connections**: Connection pooling required

---

## Security Requirements

### Authentication
- **JWT Tokens**: Stateless authentication
- **Token Expiration**: Configurable (default 7 days)
- **Refresh Tokens**: Token refresh mechanism
- **SSO Support**: OAuth 2.0, SAML, OpenID Connect
- **2FA**: TOTP, SMS, Email-based

### Authorization
- **RBAC**: Role-based access control
- **Field-Level Permissions**: Granular field access
- **API Key Authentication**: For programmatic access

### Data Security
- **Encryption**: Data at rest and in transit (TLS/SSL)
- **Tenant Isolation**: Complete data isolation
- **Audit Logging**: All actions logged
- **Input Validation**: All inputs validated and sanitized

---

## Browser Support

### Desktop
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Mobile
- iOS Safari (latest 2 versions)
- Chrome Mobile (latest 2 versions)

---

## Accessibility Requirements

### Standards
- **WCAG 2.1**: Level AA compliance
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 ratio

---

## Monitoring & Logging

### Application Monitoring
- **APM**: Application Performance Monitoring
- **Error Tracking**: Error logging and alerting
- **Uptime Monitoring**: Service availability tracking

### Logging
- **Application Logs**: Structured logging (Winston/Pino)
- **Audit Logs**: User action tracking
- **Access Logs**: API access logging

---

## Documentation Requirements

### Technical Documentation
- **API Documentation**: OpenAPI/Swagger
- **Code Documentation**: JSDoc/TSDoc
- **Architecture Diagrams**: System architecture

### User Documentation
- **Admin Guide**: User manual for admin panel
- **API Guide**: API usage documentation
- **Developer Guide**: Setup and development guide

---

**End of Document**
