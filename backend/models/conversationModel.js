import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  botId: {
    type: String,
    enum: ['groq', 'gemini', 'cohere', 'claude', 'gpt4', 'mistral'],
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isError: {
    type: Boolean,
    default: false
  }
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  messages: {
    groq: [messageSchema],
    gemini: [messageSchema],
    cohere: [messageSchema],
    claude: [messageSchema],
    gpt4: [messageSchema],
    mistral: [messageSchema]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  tags: [String],
  isArchived: {
    type: Boolean,
    default: false
  }
});

// Update the updatedAt timestamp before saving
conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Generate title from first user message
conversationSchema.methods.generateTitle = function() {
  // Find first user message across all bots
  for (const bot of Object.keys(this.messages)) {
    const userMessage = this.messages[bot].find(msg => msg.role === 'user');
    if (userMessage) {
      // Take first 50 characters as title
      this.title = userMessage.content.substring(0, 50) + (userMessage.content.length > 50 ? '...' : '');
      return this.title;
    }
  }
  return this.title;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
