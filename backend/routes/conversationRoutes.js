import express from 'express';
import Conversation from '../models/conversationModel.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all conversations for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      userId: req.user.id,
      isArchived: false
    })
    .sort({ updatedAt: -1 })
    .select('_id title createdAt updatedAt')
    .limit(50);

    res.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get a specific conversation
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Create new conversation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, messages } = req.body;

    const conversation = new Conversation({
      userId: req.user.id,
      title: title || 'New Conversation',
      messages: messages || {
        groq: [],
        gemini: [],
        cohere: [],
        claude: [],
        gpt4: [],
        mistral: []
      }
    });

    await conversation.save();

    res.status(201).json({ conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Update conversation
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, messages } = req.body;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (title !== undefined) conversation.title = title;
    if (messages !== undefined) conversation.messages = messages;

    // Auto-generate title if it's still "New Conversation"
    if (conversation.title === 'New Conversation') {
      conversation.generateTitle();
    }

    await conversation.save();

    res.json({ conversation });
  } catch (error) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

// Delete conversation (archive)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    conversation.isArchived = true;
    await conversation.save();

    res.json({ message: 'Conversation archived successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Export conversation
router.get('/:id/export', authenticateToken, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="conversation-${conversation._id}.json"`);
      res.json(conversation);
    } else if (format === 'markdown') {
      let markdown = `# ${conversation.title}\n\n`;
      markdown += `Created: ${conversation.createdAt.toLocaleString()}\n\n`;
      markdown += `---\n\n`;

      Object.entries(conversation.messages).forEach(([botId, messages]) => {
        if (messages.length > 0) {
          markdown += `## ${botId.toUpperCase()}\n\n`;
          messages.forEach(msg => {
            markdown += `**${msg.role.toUpperCase()}** (${new Date(msg.timestamp).toLocaleTimeString()})\n\n`;
            markdown += `${msg.content}\n\n`;
            markdown += `---\n\n`;
          });
        }
      });

      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="conversation-${conversation._id}.md"`);
      res.send(markdown);
    } else {
      res.status(400).json({ error: 'Unsupported export format' });
    }
  } catch (error) {
    console.error('Error exporting conversation:', error);
    res.status(500).json({ error: 'Failed to export conversation' });
  }
});

export default router;
