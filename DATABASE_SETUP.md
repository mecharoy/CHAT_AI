# Database Setup Guide

This guide will help you set up MongoDB for the AI Chatbot Comparison app.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5.0 or higher) - Optional

## Database Options

The app supports two database modes:

### 1. JSON File Storage (Default - No Setup Required)
- Users are stored in `backend/data/users.json`
- No MongoDB installation required
- Perfect for development and testing
- Automatically created on first run

### 2. MongoDB (Recommended for Production)
- Persistent conversation history
- Better performance
- Scalable for multiple users

## MongoDB Installation

### Option A: Local MongoDB Installation

#### Windows
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer
3. Choose "Complete" installation
4. Install MongoDB as a service
5. MongoDB will run automatically on `mongodb://localhost:27017`

#### macOS
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian)
```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Option B: MongoDB Atlas (Cloud - Free Tier Available)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Click "Connect" on your cluster
5. Choose "Connect your application"
6. Copy the connection string
7. Replace `<password>` with your database password
8. Add the connection string to your `.env` file

## Environment Configuration

Create a `.env` file in the `backend` directory:

```env
# MongoDB Connection (Optional - remove to use JSON storage)
MONGODB_URI=mongodb://localhost:27017/ai-chatbot
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-chatbot?retryWrites=true&w=majority

# Server Port
PORT=5000

# JWT Secret for authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# AI API Keys (Add the ones you want to use)
GROQ_API_KEY=your-groq-api-key
COHERE_API_KEY=your-cohere-api-key
GEMINI_API_KEY=your-gemini-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key
MISTRAL_API_KEY=your-mistral-api-key
```

## Getting API Keys

### Free/Trial API Keys Available:

1. **Groq** (Fast, Free): https://console.groq.com
   - Very fast inference
   - Generous free tier

2. **Cohere** (Free Trial): https://dashboard.cohere.com
   - Good free tier for testing

3. **Google Gemini** (Free): https://makersuite.google.com/app/apikey
   - Free tier available

4. **Anthropic Claude** (Trial Credits): https://console.anthropic.com
   - $5 free credits on signup

5. **OpenAI GPT-4** (Paid): https://platform.openai.com
   - Requires payment
   - GPT-4o-mini is cheaper

6. **Mistral AI** (Free Trial): https://console.mistral.ai
   - Free tier available

Note: You don't need all API keys - the app will work with any combination of available models.

## Database Schema

### Users Collection (JSON or MongoDB)
```javascript
{
  id: String,
  email: String,
  password: String (hashed with bcrypt),
  name: String,
  createdAt: Date
}
```

### Conversations Collection (MongoDB only)
```javascript
{
  userId: String,
  title: String,
  messages: {
    groq: [{
      role: String,
      content: String,
      timestamp: Date,
      isError: Boolean
    }],
    gemini: [...],
    cohere: [...],
    claude: [...],
    gpt4: [...],
    mistral: [...]
  },
  createdAt: Date,
  updatedAt: Date,
  tags: [String],
  isArchived: Boolean
}
```

## Verification

### Check if MongoDB is Running

```bash
# Local MongoDB
mongosh
# Should connect successfully

# Check connection in your app
# Start the backend server
cd backend
npm start

# Look for this message:
# "MongoDB Connected: localhost" or "MongoDB Connected: cluster.mongodb.net"
```

### If MongoDB is NOT Running

The app will automatically fall back to JSON storage and show:
```
Error connecting to MongoDB: ...
Falling back to JSON file storage for users
```

This is normal and the app will work fine with JSON storage!

## Managing Your Database

### Using MongoDB Compass (GUI)

1. Download from https://www.mongodb.com/try/download/compass
2. Connect to `mongodb://localhost:27017`
3. Browse collections:
   - `users` - User accounts
   - `conversations` - Chat history

### Using Command Line

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use ai-chatbot

# View users
db.users.find()

# View conversations
db.conversations.find()

# Delete all conversations (reset)
db.conversations.deleteMany({})

# Count documents
db.conversations.countDocuments()
```

## Backup and Restore

### Backup
```bash
# Backup entire database
mongodump --db ai-chatbot --out ./backup

# Backup specific collection
mongodump --db ai-chatbot --collection conversations --out ./backup
```

### Restore
```bash
# Restore entire database
mongorestore --db ai-chatbot ./backup/ai-chatbot

# Restore specific collection
mongorestore --db ai-chatbot --collection conversations ./backup/ai-chatbot/conversations.bson
```

## Troubleshooting

### MongoDB Won't Start

```bash
# Check if MongoDB is running
sudo systemctl status mongod  # Linux
brew services list  # macOS

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log  # Linux
tail -f /usr/local/var/log/mongodb/mongo.log  # macOS
```

### Connection Refused

1. Make sure MongoDB is running
2. Check firewall settings
3. Verify the connection string in `.env`
4. For Atlas, whitelist your IP address

### App Works Without MongoDB

Yes! This is expected. The app gracefully falls back to JSON file storage if MongoDB is not available. This is perfect for:
- Development
- Testing
- Simple deployments
- Quick demos

## Production Deployment

For production, we recommend:

1. **MongoDB Atlas** (Managed Cloud Database)
   - Automatic backups
   - High availability
   - Security features
   - Free tier available

2. **Security Best Practices:**
   - Use strong JWT_SECRET
   - Enable MongoDB authentication
   - Use environment variables
   - Enable HTTPS
   - Regular backups

3. **Performance:**
   - Create indexes on frequently queried fields
   - Monitor database performance
   - Set up connection pooling

## Need Help?

- MongoDB Documentation: https://docs.mongodb.com
- MongoDB University (Free): https://university.mongodb.com
- Community Forums: https://community.mongodb.com
