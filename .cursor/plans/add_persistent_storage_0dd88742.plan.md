---
name: Add Persistent Storage
overview: Add database persistence for chat messages and file storage, with FREE deployment on Vercel (frontend) + Railway (backend + PostgreSQL) + Cloudinary (file storage).
todos:
  - id: add-dependencies
    content: Add Spring Data JPA, PostgreSQL, Cloudinary SDK dependencies
    status: pending
  - id: create-entities
    content: Create JPA entities for Message and FileMetadata
    status: pending
  - id: create-repositories
    content: Create Spring Data repositories
    status: pending
  - id: create-service-layer
    content: Create ChatService and CloudinaryFileStorageService
    status: pending
  - id: add-migration-scripts
    content: Create Flyway database migration scripts
    status: pending
    dependencies:
      - create-entities
  - id: update-controller
    content: Update ChatBotController to use service layer
    status: pending
    dependencies:
      - create-service-layer
  - id: add-rest-endpoints
    content: Add REST endpoints for message history and file upload
    status: pending
    dependencies:
      - create-service-layer
  - id: update-frontend-history
    content: Add message history loading in frontend
    status: pending
    dependencies:
      - add-rest-endpoints
  - id: update-file-handling
    content: Update file upload to use Cloudinary via REST API
    status: pending
  - id: add-railway-config
    content: Create railway.json and configure environment variables
    status: pending
  - id: add-vercel-config
    content: Create vercel.json for frontend deployment
    status: pending
  - id: create-docker-compose
    content: Create docker-compose.yml for local development with PostgreSQL
    status: pending
  - id: create-deployment-guide
    content: Create step-by-step deployment guide for Vercel + Railway
    status: pending
---

# Add Persistent Storage to ChatterBox

## Architecture Overview

```mermaid
flowchart TB
    subgraph frontend [Frontend Next.js]
        UI[Chat UI]
        WS_Client[WebSocket Client]
    end
    
    subgraph backend [Backend Spring Boot]
        WS_Handler[WebSocket Handler]
        Controller[ChatBotController]
        Service[ChatService]
        Repository[MessageRepository]
        FileService[FileStorageService]
    end
    
    subgraph storage [Storage Layer]
        DB[(PostgreSQL)]
        FileStore[S3 / Local Storage]
    end
    
    UI --> WS_Client
    WS_Client <-->|Real-time| WS_Handler
    WS_Handler --> Controller
    Controller --> Service
    Service --> Repository
    Service --> FileService
    Repository --> DB
    FileService --> FileStore
```

## FREE Deployment Strategy (Cost: $0)

This plan focuses on deploying ChatterBox with **zero hosting costs** using:

- **Vercel** - Frontend hosting (unlimited free deployments)
- **Railway** - Backend + PostgreSQL database (500MB free tier)
- **Cloudinary** - Image/file storage (10GB free, 25k transformations/month)

### Why This Stack?

```mermaid
graph LR
    subgraph vercel[Vercel FREE]
        FE[Next.js Frontend<br/>Unlimited bandwidth<br/>Auto-scaling]
    end
    
    subgraph railway[Railway FREE]
        BE[Spring Boot Backend<br/>512MB RAM]
        DB[(PostgreSQL<br/>500MB storage)]
    end
    
    subgraph cloudinary[Cloudinary FREE]
        FS[File Storage<br/>10GB + CDN]
    end
    
    FE -->|WebSocket + REST| BE
    BE --> DB
    BE -->|Upload/Retrieve| FS
    FE -->|Display images| FS
```

**Benefits:**

- No credit card required for basic tier
- Automatic HTTPS/SSL certificates
- Built-in CDN for fast file delivery
- Easy deployment via Git push
- Suitable for portfolio projects and demos
- Can handle 20-50 concurrent users

**Limitations:**

- Railway free tier: Backend sleeps after 5 min inactivity (wakes on first request)
- 500MB database limit (approximately 50,000-100,000 messages)
- 10GB file storage limit

## Key Considerations for Storage

### 1. Data to Store

**Messages Table:**

- Message ID (primary key)
- Sender username
- Message content
- Message type (CHAT, JOIN, LEAVE, FILE)
- Timestamp
- Room/channel ID (for future multi-room support)

**Files Table:**

- File ID (primary key)
- Message ID (foreign key)
- File path/URL
- File type
- File size
- Upload timestamp

**Why these decisions:**

- Separate files from messages to avoid storing large base64 blobs in DB
- Include room ID for future scalability
- Track metadata for analytics and cleanup

### 2. Database Recommendation: PostgreSQL

**Rationale:**

- ACID compliance for message integrity
- JSON support for flexible message metadata
- Excellent performance for chat applications
- Easy to deploy across all environments (cloud, k8s, traditional)
- Free and widely supported
- Better for analytics/reporting than NoSQL

**Alternative:** MongoDB if you need more flexible schema or document-based queries

### 3. File Storage Strategy: Cloudinary (FREE)

**Cloudinary Free Tier:**

- 10GB storage
- 25,000 transformations per month
- Built-in CDN for fast delivery worldwide
- Image optimization and resizing
- Secure upload with signatures

**Why Cloudinary over alternatives:**

- FREE tier is generous (10GB vs 5GB S3 free tier that expires)
- Automatic image optimization reduces bandwidth
- No need to manage S3 buckets or access keys
- Direct upload from frontend possible
- Built-in transformations (resize, crop, format conversion)

**Fallback for local development:**

- Local filesystem storage
- Easy to switch via configuration

## Implementation Changes Required

### Backend Changes

1. **Add Dependencies** ([pom.xml](pom.xml)):

   - Spring Data JPA
   - PostgreSQL driver
   - Cloudinary Java SDK
   - Flyway (database migration)

2. **Create New Classes**:

   - `MessageEntity` - JPA entity for messages
   - `FileMetadataEntity` - JPA entity for file metadata
   - `MessageRepository` - Spring Data repository
   - `ChatService` - Business logic layer
   - `FileStorageService` - Handle file upload/retrieval
   - Migration scripts for database schema

3. **Modify Existing**:

   - Update `ChatBotController` to use service layer
   - Add message history endpoint: `GET /api/messages?limit=50`
   - Add file upload endpoint: `POST /api/files`

4. **Configuration** ([application.properties](src/main/resources/application.properties)):
```properties
# Database (Railway will provide DATABASE_URL)
spring.datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/chatterbox}
spring.datasource.username=${DB_USERNAME:chatterbox}
spring.datasource.password=${DB_PASSWORD:changeme}
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false

# Flyway migration
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true

# Cloudinary File Storage
cloudinary.cloud-name=${CLOUDINARY_CLOUD_NAME:}
cloudinary.api-key=${CLOUDINARY_API_KEY:}
cloudinary.api-secret=${CLOUDINARY_API_SECRET:}
file.storage.type=${FILE_STORAGE_TYPE:cloudinary}
file.storage.local.path=${FILE_STORAGE_PATH:./uploads}
```


### Frontend Changes

1. **Load Message History**:

   - Add API call on component mount to fetch last 50 messages
   - Display history before WebSocket messages
   - Add "Load More" pagination

2. **File Handling**:

   - Upload files via REST API instead of WebSocket
   - Display images from URL instead of base64
   - Add loading states for file uploads

3. **Update** [`frontend/src/pages/chat.tsx`](frontend/src/pages/chat.tsx) and [`frontend/src/services/websocket.ts`](frontend/src/services/websocket.ts)

## FREE Deployment Guide: Vercel + Railway + Cloudinary

### Step 1: Setup Cloudinary (File Storage)

1. **Create Free Account:**

   - Go to https://cloudinary.com/users/register/free
   - Sign up with GitHub or email
   - No credit card required

2. **Get API Credentials:**

   - After login, go to Dashboard
   - Copy these values (needed for Railway):
     - Cloud Name
     - API Key
     - API Secret

### Step 2: Deploy Backend to Railway

1. **Create Railway Account:**

   - Go to https://railway.app
   - Sign up with GitHub (recommended for easy deployment)

2. **Create New Project:**

   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your ChatterBox repository
   - Select the repository

3. **Add PostgreSQL Database:**

   - In your Railway project, click "+ New"
   - Select "Database" → "PostgreSQL"
   - Railway automatically creates database and provides `DATABASE_URL`

4. **Configure Backend Service:**

   - Click on your backend service
   - Go to "Variables" tab
   - Add environment variables:
     ```
     CLOUDINARY_CLOUD_NAME=your_cloud_name
     CLOUDINARY_API_KEY=your_api_key
     CLOUDINARY_API_SECRET=your_api_secret
     FILE_STORAGE_TYPE=cloudinary
     SPRING_PROFILES_ACTIVE=prod
     ```

   - Railway auto-detects `DATABASE_URL` from PostgreSQL service

5. **Configure Build:**

   - Railway auto-detects Maven
   - Build command: `mvn clean package -DskipTests`
   - Start command: `java -jar target/chatterbox-0.0.1-SNAPSHOT.jar`

6. **Get Backend URL:**

   - Click "Settings" → "Generate Domain"
   - Copy the URL (e.g., `https://chatterbox-production-abc123.up.railway.app`)

### Step 3: Deploy Frontend to Vercel

1. **Create Vercel Account:**

   - Go to https://vercel.com/signup
   - Sign up with GitHub

2. **Import Project:**

   - Click "Add New" → "Project"
   - Import your ChatterBox repository
   - Vercel auto-detects Next.js

3. **Configure Build Settings:**

   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Add Environment Variables:**

   - Go to "Settings" → "Environment Variables"
   - Add:
     ```
     NEXT_PUBLIC_BACKEND_URL=https://your-railway-backend-url.up.railway.app
     NEXT_PUBLIC_WS_URL=wss://your-railway-backend-url.up.railway.app
     ```


5. **Deploy:**

   - Click "Deploy"
   - Vercel builds and deploys automatically
   - Get your frontend URL (e.g., `https://chatterbox-abc123.vercel.app`)

### Step 4: Update CORS Configuration

In [`WebSecurityConfig.java`](src/main/java/com/example/ChatBot/config/WebSecurityConfig.java), update allowed origins:

```java
.setAllowedOrigins(
    "http://localhost:3000",
    "https://your-app.vercel.app",
    "https://*.vercel.app"  // Allow all Vercel preview deployments
)
```

### Step 5: Test Deployment

1. **Visit your Vercel URL**
2. **Enter a username** and join chat
3. **Send a message** - should persist in database
4. **Upload an image** - should store in Cloudinary
5. **Refresh page** - message history should load
6. **Open in another browser** - messages should sync in real-time

### Automatic Deployments

**Both Vercel and Railway support automatic deployments:**

- Push to `main` branch → auto-deploy to production
- Push to other branches → Railway and Vercel create preview deployments
- Zero downtime deployments

### Configuration Files to Add

**railway.json** (in project root):

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks",
    "buildCommand": "mvn clean package -DskipTests"
  },
  "deploy": {
    "startCommand": "java -jar target/chatterbox-0.0.1-SNAPSHOT.jar",
    "restartPolicyType": "on-failure",
    "restartPolicyMaxRetries": 10
  }
}
```

**vercel.json** (in frontend directory):

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "${NEXT_PUBLIC_BACKEND_URL}/api/:path*"
    }
  ]
}
```

### Cost Breakdown

| Service | Free Tier Limits | Cost |

|---------|------------------|------|

| **Vercel** | Unlimited bandwidth, 100GB/month | $0 |

| **Railway** | 512MB RAM, $5 credit/month | $0 |

| **Cloudinary** | 10GB storage, 25k transformations | $0 |

| **PostgreSQL** | 500MB database on Railway | $0 |

| **SSL Certificate** | Auto-provided by Vercel & Railway | $0 |

| **Total** | | **$0/month** |

### Monitoring Your Usage

**Railway:**

- Dashboard shows database size
- Monitor RAM and CPU usage
- $5 monthly credit (backend usually uses $0-3/month)

**Cloudinary:**

- Dashboard shows storage used
- Track transformations
- Set up alerts at 80% usage

**Database Size Estimation:**

- Average message: ~200 bytes
- 500MB = approximately 2.5 million messages
- For 50 users sending 100 messages/day = 5,000 messages/day
- Database full in: ~500 days

## Deployment Challenges & Solutions (Railway + Vercel Specific)

### Challenge 1: Railway Backend Sleep (Free Tier)

**Problem:** Railway free tier sleeps after 5 minutes of inactivity

**Impact:**

- First request after sleep takes 10-30 seconds to wake up
- WebSocket connection may timeout during wake-up

**Solutions:**

**Option A: Accept the limitation** (Recommended for portfolio)

- Add loading message: "Waking up server, please wait..."
- Show connection status in frontend
- Good for demos and low-traffic apps

**Option B: Keep-alive ping**

- Set up external monitoring (UptimeRobot free tier)
- Ping backend every 3-4 minutes
- Keeps backend awake during active hours

**Implementation in frontend:**

```typescript
// Show wake-up message
if (connecting for > 5 seconds) {
  show "Server is waking up from sleep..."
}
```

### Challenge 2: Database Connection from Railway

**Problem:** Railway provides `DATABASE_URL` in different format

**Railway format:**

```
postgresql://user:pass@host:5432/dbname
```

**Spring Boot expects:**

```
jdbc:postgresql://host:5432/dbname
```

**Solution - Auto-conversion in application.properties:**

```properties
# Railway auto-injects DATABASE_URL
# Parse it or use spring-cloud-connectors
spring.datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/chatterbox}
```

**Or create wrapper in code:**

```java
@Value("${DATABASE_URL:#{null}}")
private String databaseUrl;

@Bean
public DataSource dataSource() {
    if (databaseUrl != null && databaseUrl.startsWith("postgres://")) {
        databaseUrl = databaseUrl.replace("postgres://", "jdbc:postgresql://");
    }
    // Configure datasource
}
```

### Challenge 3: WebSocket Connection with Vercel + Railway

**Problem:** Frontend on Vercel needs to connect to backend on Railway

**Challenges:**

- CORS must allow Vercel domain
- WebSocket needs `wss://` (secure WebSocket)
- Railway provides HTTPS/WSS by default

**Solution in frontend config:**

```typescript
// frontend/.env.production
NEXT_PUBLIC_BACKEND_URL=https://your-app.up.railway.app
NEXT_PUBLIC_WS_URL=wss://your-app.up.railway.app

// Use in code
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'
```

**Update CORS in backend:**

```java
@Override
public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/ws")
        .setAllowedOrigins(
            "http://localhost:3000",
            "https://*.vercel.app"
        )
        .withSockJS();
}
```

### Challenge 4: Environment Variables Management

**Problem:** Different variables needed for local vs deployed

**Solution - Multi-environment config:**

**Local development (.env.local):**

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

**Vercel production (via dashboard):**

```
NEXT_PUBLIC_BACKEND_URL=https://your-app.up.railway.app
NEXT_PUBLIC_WS_URL=wss://your-app.up.railway.app
```

**Railway (via dashboard):**

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
DATABASE_URL=(auto-provided)
SPRING_PROFILES_ACTIVE=prod
```

### Challenge 5: Database Schema Management with Flyway

**Problem:** Railway creates empty database, need to initialize schema

**Solution - Flyway Migrations:**

Create versioned SQL scripts in `src/main/resources/db/migration/`:

**V1__initial_schema.sql:**

```sql
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    sender VARCHAR(50) NOT NULL,
    content TEXT,
    message_type VARCHAR(20) NOT NULL,
    timestamp BIGINT NOT NULL,
    room_id VARCHAR(100) DEFAULT 'default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_room ON messages(room_id, timestamp DESC);

CREATE TABLE file_metadata (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT REFERENCES messages(id),
    cloudinary_public_id VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Benefits:**

- Runs automatically on first deployment
- Railway database auto-initialized
- Version controlled schema changes

### Challenge 6: Cloudinary Upload Errors

**Problem:** Large files may fail to upload

**Solutions:**

1. **Frontend validation:**
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
if (file.size > MAX_FILE_SIZE) {
  alert('File too large. Max 5MB');
  return;
}
```

2. **Backend validation:**
```java
@Size(max = 10485760, message = "File must be under 10MB")
private String fileContent;
```

3. **Cloudinary configuration:**
```properties
# Increase timeout for large uploads
cloudinary.upload.timeout=60000
```


### Challenge 7: Railway Free Tier Limits

**Problem:** 500MB database limit

**Monitor and manage:**

1. **Track database size:**
```sql
SELECT pg_size_pretty(pg_database_size('chatterbox')) as db_size;
```

2. **Implement message cleanup:**
```java
@Scheduled(cron = "0 0 2 * * ?") // Run at 2 AM daily
public void cleanupOldMessages() {
    // Delete messages older than 90 days
    long ninetyDaysAgo = System.currentTimeMillis() - (90L * 24 * 60 * 60 * 1000);
    messageRepository.deleteByTimestampBefore(ninetyDaysAgo);
}
```

3. **Set up alerts in Railway:**

- Monitor database size in Railway dashboard
- Upgrade to paid tier ($5/month for 8GB) if needed

### Challenge 8: Security Best Practices

**For Railway + Vercel + Cloudinary:**

1. **Never commit secrets:**

   - Add `.env` to `.gitignore`
   - Use Railway/Vercel environment variables UI
   - Rotate Cloudinary API keys if exposed

2. **CORS Configuration:**
```java
.setAllowedOrigins(
    "http://localhost:3000",
    "https://your-app.vercel.app",
    "https://*.vercel.app"  // Allows preview deployments
)
.setAllowedOriginPatterns("https://*-your-username.vercel.app")
```

3. **Input validation:**

   - Already implemented in Entity.java
   - Sanitize content in ChatBotController
   - Validate file types before Cloudinary upload

4. **Rate limiting** (optional but recommended):
```java
// Add dependency: spring-boot-starter-data-redis
@Component
public class RateLimitInterceptor {
    // Limit to 10 messages per minute per user
}
```


## Testing Strategy

**Local Development:**

1. Use Docker Compose with PostgreSQL
```bash
docker-compose up -d postgres
# Run backend with local file storage
mvn spring-boot:run
# Run frontend
cd frontend && npm run dev
```

2. Test features:

   - Send messages and verify they persist
   - Refresh page and check message history loads
   - Upload images (stored locally in dev)

**Before Deploying to Railway/Vercel:**

1. Test with Cloudinary in development:

   - Add Cloudinary credentials to local `.env`
   - Verify file uploads work
   - Check images display from Cloudinary CDN

2. Test database migrations:

   - Drop local database and restart
   - Verify Flyway creates schema automatically

**After Deploying:**

1. **Smoke test deployment:**

   - Visit Vercel URL
   - Join chat room
   - Send message
   - Upload image
   - Refresh and verify persistence

2. **Test WebSocket connection:**

   - Open two browser windows
   - Send messages from one
   - Verify real-time delivery to other

3. **Monitor Railway logs:**

   - Check for database connection errors
   - Verify Flyway migrations ran successfully
   - Watch for Cloudinary upload errors

## Migration Path

**Phase 1:** Add database without breaking existing functionality

- Backend stores messages but doesn't require them
- Frontend still works without history

**Phase 2:** Add message history feature

- Frontend fetches and displays history
- Graceful fallback if API fails

**Phase 3:** Add file storage optimization

- Upload files to storage service
- Still support base64 for backward compatibility

**Phase 4:** Remove base64 file support

- Clean up legacy code
- Optimize database queries

## Summary of Key Files to Create/Modify

### Backend Files

**Dependencies & Config:**

- [`pom.xml`](pom.xml) - Add Spring Data JPA, PostgreSQL, Cloudinary, Flyway
- [`application.properties`](src/main/resources/application.properties) - Database and Cloudinary config

**New Java Classes:**

- `src/main/java/com/example/ChatBot/model/MessageEntity.java` - JPA entity
- `src/main/java/com/example/ChatBot/model/FileMetadataEntity.java` - JPA entity
- `src/main/java/com/example/ChatBot/repository/MessageRepository.java` - Spring Data repository
- `src/main/java/com/example/ChatBot/repository/FileMetadataRepository.java` - Spring Data repository
- `src/main/java/com/example/ChatBot/service/ChatService.java` - Business logic
- `src/main/java/com/example/ChatBot/service/FileStorageService.java` - Interface
- `src/main/java/com/example/ChatBot/service/CloudinaryFileStorageService.java` - Implementation
- `src/main/java/com/example/ChatBot/controller/MessageController.java` - REST endpoints

**Modify Existing:**

- [`ChatBotController.java`](src/main/java/com/example/ChatBot/controller/ChatBotController.java) - Use service layer
- [`WebSecurityConfig.java`](src/main/java/com/example/ChatBot/config/WebSecurityConfig.java) - Update CORS for Vercel

**Database Migrations:**

- `src/main/resources/db/migration/V1__initial_schema.sql` - Create tables
- `src/main/resources/db/migration/V2__add_indexes.sql` - Performance indexes

### Frontend Files

**Modify Existing:**

- [`chat.tsx`](frontend/src/pages/chat.tsx) - Load message history, handle file uploads
- [`websocket.ts`](frontend/src/services/websocket.ts) - Add REST API integration
- [`package.json`](frontend/package.json) - Add axios

**New Files:**

- `frontend/src/services/api.ts` - REST API client
- `frontend/.env.local` - Local development config
- `frontend/vercel.json` - Vercel deployment config

### Deployment Files

**New Configuration:**

- `railway.json` - Railway deployment config (project root)
- `docker-compose.yml` - Local development with PostgreSQL
- `.env.example` - Template for environment variables
- `DEPLOYMENT.md` - Step-by-step deployment guide

### Quick Start Summary

1. **Add dependencies** to pom.xml (Spring Data JPA, PostgreSQL, Cloudinary, Flyway)
2. **Create JPA entities** (MessageEntity, FileMetadataEntity)
3. **Create repositories** (MessageRepository, FileMetadataRepository)
4. **Create service layer** (ChatService, CloudinaryFileStorageService)
5. **Add Flyway migration** (V1__initial_schema.sql)
6. **Update controller** to use services
7. **Add REST endpoints** for message history and file upload
8. **Update frontend** to load history and use REST API for files
9. **Configure for Railway** (railway.json, environment variables)
10. **Configure for Vercel** (vercel.json, environment variables)
11. **Deploy and test**

### Estimated Implementation Time

- Backend changes: 3-4 hours
- Frontend changes: 2 hours
- Database migrations: 1 hour
- Cloudinary integration: 1-2 hours
- Testing and deployment: 2 hours
- **Total: 9-11 hours**

### What You'll Achieve

After completing this plan, you'll have:

- Persistent chat message storage in PostgreSQL
- Image uploads stored in Cloudinary with CDN delivery
- Message history that loads on page refresh
- FREE hosting on Vercel + Railway + Cloudinary
- Professional portfolio-ready chat application
- Auto-deployment via Git push