# Starting the Backend Server

## Quick Start

```bash
cd backend
npm run start:dev
```

## Port Conflict Resolution

If you see `EADDRINUSE: address already in use :::3001`:

### Option 1: Kill existing process
```bash
# Find process using port 3001
lsof -ti:3001

# Kill it
kill $(lsof -ti:3001)

# Or kill all nest processes
pkill -f "nest start"
```

### Option 2: Use different port
Update `.env`:
```env
PORT=3002
```

## Server Status

Once started, you should see:
```
🚀 Backend API is running on: http://localhost:3001/api/v1
```

## Available Scripts

- `npm run start:dev` - Start in watch mode (development)
- `npm run start` - Start without watch mode
- `npm run start:prod` - Start production build
- `npm run build` - Build for production

## Testing

After server starts, test with:
```bash
curl http://localhost:3001/api/v1
```

Expected response:
```
CMS Platform API is running!
```
