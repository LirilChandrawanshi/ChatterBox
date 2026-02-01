# MongoDB Setup for ChatterBox

ChatterBox uses MongoDB for persisting chat messages (CHAT and FILE types). You can run MongoDB locally or use MongoDB Atlas (cloud).

## Local Development

### Option 1: Docker (Recommended)

```bash
docker-compose up -d
```

This starts MongoDB, the backend, and frontend. MongoDB runs on `localhost:27017` with a persistent volume.

### Option 2: Local MongoDB Installation

1. Install MongoDB locally: https://www.mongodb.com/docs/manual/installation/
2. Start MongoDB
3. Run the backend - it will connect to `mongodb://localhost:27017/chatterbox` by default

## Cloud: MongoDB Atlas

1. **Create an account** at [mongodb.com/atlas](https://www.mongodb.com/atlas)

2. **Create a free cluster** (M0 - 512MB)

3. **Create a database user** with read/write access

4. **Get your connection string** from "Connect" → "Connect your application"
   - Example: `mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/chatterbox`

5. **Add your IP to Network Access** (or `0.0.0.0/0` for development)

6. **Set the environment variable**:
   ```bash
   export SPRING_DATA_MONGODB_URI="mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/chatterbox"
   ```

   Or in Docker:
   ```yaml
   environment:
     - SPRING_DATA_MONGODB_URI=mongodb+srv://...
   ```

## REST API

- **GET /api/messages?limit=50** - Fetch recent message history (default 50, max 100)

## What's Stored

- **CHAT** messages - text content
- **FILE** messages - images (base64 stored in DB; consider Cloudinary for production at scale)
- **JOIN**, **LEAVE**, **TYPING** - not persisted (ephemeral)
