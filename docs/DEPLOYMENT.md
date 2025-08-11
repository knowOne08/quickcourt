# Deployment Guide

## Overview

This guide covers deploying the QuickCourt application to production environments using various cloud platforms and deployment strategies.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Frontend Deployment](#frontend-deployment)
4. [Backend Deployment](#backend-deployment)
5. [Database Setup](#database-setup)
6. [Domain & SSL](#domain--ssl)
7. [Monitoring & Logging](#monitoring--logging)
8. [CI/CD Pipeline](#cicd-pipeline)

## Prerequisites

### Required Tools
- Node.js (v16 or higher)
- Git
- Docker (optional)
- Cloud CLI tools (AWS CLI, Azure CLI, or GCP CLI)

### Cloud Accounts
- MongoDB Atlas account
- Cloudinary account
- Payment gateway account (Razorpay/Stripe)
- Email service account (SendGrid/Nodemailer)

## Environment Setup

### Production Environment Variables

Create a `.env.production` file in the backend directory:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quickcourt

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@your-domain.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Payment Gateway
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret

# External APIs
GOOGLE_MAPS_API_KEY=your-google-maps-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token

# Security
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=error
```

## Frontend Deployment

### Option 1: Netlify Deployment

1. **Build Configuration**
   Create `netlify.toml` in the project root:
   ```toml
   [build]
     base = "frontend/"
     publish = "build/"
     command = "npm run build"

   [build.environment]
     REACT_APP_API_URL = "https://api.your-domain.com"
     REACT_APP_RAZORPAY_KEY = "your-razorpay-key"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy Steps**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Login to Netlify
   netlify login

   # Deploy
   cd frontend
   npm run build
   netlify deploy --prod --dir=build
   ```

### Option 2: Vercel Deployment

1. **Configuration**
   Create `vercel.json` in the frontend directory:
   ```json
   {
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "build"
         }
       }
     ],
     "routes": [
       { "handle": "filesystem" },
       { "src": "/(.*)", "dest": "/index.html" }
     ],
     "env": {
       "REACT_APP_API_URL": "https://api.your-domain.com",
       "REACT_APP_RAZORPAY_KEY": "your-razorpay-key"
     }
   }
   ```

2. **Deploy Steps**
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Deploy
   cd frontend
   vercel --prod
   ```

### Option 3: AWS S3 + CloudFront

1. **Build and Upload**
   ```bash
   cd frontend
   npm run build

   # Upload to S3
   aws s3 sync build/ s3://your-bucket-name --delete

   # Invalidate CloudFront cache
   aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
   ```

2. **S3 Bucket Policy**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       }
     ]
   }
   ```

## Backend Deployment

### Option 1: Heroku Deployment

1. **Heroku Configuration**
   Create `Procfile` in the backend directory:
   ```
   web: node server.js
   ```

2. **Deploy Steps**
   ```bash
   # Install Heroku CLI
   # Create Heroku app
   heroku create your-app-name

   # Set environment variables
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your-mongodb-uri
   heroku config:set JWT_SECRET=your-jwt-secret

   # Deploy
   git subtree push --prefix backend heroku main
   ```

### Option 2: DigitalOcean App Platform

1. **App Spec Configuration**
   Create `.do/app.yaml`:
   ```yaml
   name: quickcourt-api
   services:
   - name: api
     source_dir: /backend
     github:
       repo: your-username/quickcourt
       branch: main
     run_command: npm start
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NODE_ENV
       value: production
     - key: MONGODB_URI
       value: ${MONGODB_URI}
       type: SECRET
     - key: JWT_SECRET
       value: ${JWT_SECRET}
       type: SECRET
   ```

### Option 3: AWS EC2 with Docker

1. **Dockerfile**
   Create `Dockerfile` in the backend directory:
   ```dockerfile
   FROM node:16-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci --only=production

   COPY . .

   RUN addgroup -g 1001 -S nodejs
   RUN adduser -S nodejs -u 1001

   USER nodejs

   EXPOSE 5000

   CMD ["node", "server.js"]
   ```

2. **Docker Compose**
   Create `docker-compose.prod.yml`:
   ```yaml
   version: '3.8'
   services:
     api:
       build: ./backend
       ports:
         - "5000:5000"
       environment:
         - NODE_ENV=production
         - MONGODB_URI=${MONGODB_URI}
         - JWT_SECRET=${JWT_SECRET}
       restart: unless-stopped
   ```

3. **EC2 Deployment Script**
   ```bash
   #!/bin/bash
   # deploy.sh

   # Pull latest code
   git pull origin main

   # Build and deploy with Docker
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d

   # Clean up unused images
   docker image prune -f
   ```

### Option 4: Railway Deployment

1. **Deploy Steps**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login and deploy
   railway login
   railway link
   railway up
   ```

2. **Environment Variables**
   Set variables in Railway dashboard or via CLI:
   ```bash
   railway variables set NODE_ENV=production
   railway variables set MONGODB_URI=your-mongodb-uri
   railway variables set JWT_SECRET=your-jwt-secret
   ```

## Database Setup

### MongoDB Atlas

1. **Cluster Setup**
   - Create MongoDB Atlas account
   - Create a new cluster
   - Configure network access (whitelist IPs)
   - Create database user

2. **Connection String**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/quickcourt?retryWrites=true&w=majority
   ```

3. **Database Seeding**
   ```bash
   # Run seed script in production
   NODE_ENV=production npm run seed
   ```

### Self-Hosted MongoDB

1. **Docker Setup**
   ```yaml
   version: '3.8'
   services:
     mongodb:
       image: mongo:5.0
       environment:
         MONGO_INITDB_ROOT_USERNAME: admin
         MONGO_INITDB_ROOT_PASSWORD: password
         MONGO_INITDB_DATABASE: quickcourt
       volumes:
         - mongodb_data:/data/db
       ports:
         - "27017:27017"
   
   volumes:
     mongodb_data:
   ```

## Domain & SSL

### Domain Configuration

1. **DNS Records**
   ```
   Type    Name    Value
   A       @       your-server-ip
   A       www     your-server-ip
   CNAME   api     your-api-domain.com
   ```

2. **SSL Certificate with Let's Encrypt**
   ```bash
   # Install Certbot
   sudo apt-get install certbot python3-certbot-nginx

   # Generate certificate
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com

   # Auto-renewal
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring & Logging

### Error Tracking with Sentry

1. **Backend Integration**
   ```javascript
   const Sentry = require('@sentry/node');

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV
   });

   // Error handler
   app.use(Sentry.Handlers.errorHandler());
   ```

2. **Frontend Integration**
   ```javascript
   import * as Sentry from '@sentry/react';

   Sentry.init({
     dsn: process.env.REACT_APP_SENTRY_DSN,
     environment: process.env.NODE_ENV
   });
   ```

### Application Performance Monitoring

1. **PM2 for Process Management**
   ```bash
   # Install PM2
   npm install -g pm2

   # Start application
   pm2 start ecosystem.config.js

   # Monitor
   pm2 monit
   ```

2. **PM2 Configuration**
   Create `ecosystem.config.js`:
   ```javascript
   module.exports = {
     apps: [{
       name: 'quickcourt-api',
       script: './server.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 5000
       },
       log_date_format: 'YYYY-MM-DD HH:mm Z',
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_file: './logs/combined.log'
     }]
   };
   ```

### Health Checks

1. **API Health Check Endpoint**
   ```javascript
   app.get('/health', (req, res) => {
     res.status(200).json({
       status: 'OK',
       timestamp: new Date().toISOString(),
       uptime: process.uptime(),
       environment: process.env.NODE_ENV
     });
   });
   ```

2. **Database Connection Check**
   ```javascript
   app.get('/health/db', async (req, res) => {
     try {
       await mongoose.connection.db.admin().ping();
       res.status(200).json({ database: 'Connected' });
     } catch (error) {
       res.status(503).json({ database: 'Disconnected' });
     }
   });
   ```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install backend dependencies
      run: |
        cd backend
        npm ci
        
    - name: Run backend tests
      run: |
        cd backend
        npm test
        
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
        
    - name: Run frontend tests
      run: |
        cd frontend
        npm test -- --coverage --watchAll=false

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Build frontend
      run: |
        cd frontend
        npm ci
        npm run build
        
    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v1.2
      with:
        publish-dir: './frontend/build'
        production-branch: main
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
        heroku_app_name: ${{ secrets.HEROKU_APP_NAME }}
        heroku_email: ${{ secrets.HEROKU_EMAIL }}
        appdir: "backend"
```

### Environment Secrets

Configure these secrets in your repository settings:
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`
- `HEROKU_API_KEY`
- `HEROKU_APP_NAME`
- `HEROKU_EMAIL`

## Performance Optimization

### CDN Configuration

1. **CloudFront Distribution**
   - Origin: S3 bucket or domain
   - Cache behaviors for static assets
   - Gzip compression enabled

2. **Cache Headers**
   ```javascript
   // Static assets
   app.use('/static', express.static('public', {
     maxAge: '1y',
     etag: false
   }));

   // API responses
   app.use('/api/venues', (req, res, next) => {
     res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
     next();
   });
   ```

### Database Optimization

1. **Connection Pooling**
   ```javascript
   mongoose.connect(process.env.MONGODB_URI, {
     maxPoolSize: 10,
     serverSelectionTimeoutMS: 5000,
     socketTimeoutMS: 45000,
   });
   ```

2. **Indexes**
   ```javascript
   // Create indexes for frequently queried fields
   venueSchema.index({ 'location.coordinates': '2dsphere' });
   venueSchema.index({ sports: 1, status: 1 });
   bookingSchema.index({ user: 1, createdAt: -1 });
   ```

## Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled with SSL certificate
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation and sanitization
- [ ] JWT tokens with expiration
- [ ] Database access restricted
- [ ] Regular security updates
- [ ] Error messages don't expose sensitive info
- [ ] File upload restrictions in place

## Backup & Recovery

### Database Backup

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="quickcourt"

# Create backup
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/backup_$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" "$BACKUP_DIR/backup_$DATE"

# Remove uncompressed backup
rm -rf "$BACKUP_DIR/backup_$DATE"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
```

### Automated Backups

```yaml
# crontab entry
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

This deployment guide provides comprehensive instructions for deploying QuickCourt to production environments with proper security, monitoring, and performance optimizations.
