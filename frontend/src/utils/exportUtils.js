// Export conversations to JSON
export const exportToJSON = (conversations, title = 'conversation') => {
  const dataStr = JSON.stringify(conversations, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export conversations to Markdown
export const exportToMarkdown = (conversations, title = 'AI Conversation') => {
  let markdown = `# ${title}\n\n`;
  markdown += `Generated on: ${new Date().toLocaleString()}\n\n`;
  markdown += `---\n\n`;

  Object.entries(conversations).forEach(([botId, messages]) => {
    if (messages.length > 0) {
      // Capitalize bot name
      const botName = botId.charAt(0).toUpperCase() + botId.slice(1);
      markdown += `## ${botName} Conversation\n\n`;

      messages.forEach(msg => {
        const role = msg.role.toUpperCase();
        const time = new Date(msg.timestamp).toLocaleTimeString();

        markdown += `**${role}** _(${time})_\n\n`;
        markdown += `${msg.content}\n\n`;
        markdown += `---\n\n`;
      });
    }
  });

  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/\s+/g, '-')}-${Date.now()}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export conversations to plain text
export const exportToText = (conversations, title = 'AI Conversation') => {
  let text = `${title}\n`;
  text += `Generated on: ${new Date().toLocaleString()}\n`;
  text += `${'='.repeat(50)}\n\n`;

  Object.entries(conversations).forEach(([botId, messages]) => {
    if (messages.length > 0) {
      const botName = botId.toUpperCase();
      text += `\n${botName} CONVERSATION\n`;
      text += `${'-'.repeat(50)}\n\n`;

      messages.forEach(msg => {
        const role = msg.role.toUpperCase();
        const time = new Date(msg.timestamp).toLocaleTimeString();

        text += `[${role}] ${time}\n`;
        text += `${msg.content}\n\n`;
      });
    }
  });

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/\s+/g, '-')}-${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Copy conversation to clipboard
export const copyToClipboard = async (conversations) => {
  let text = '';

  Object.entries(conversations).forEach(([botId, messages]) => {
    if (messages.length > 0) {
      text += `\n=== ${botId.toUpperCase()} ===\n\n`;

      messages.forEach(msg => {
        text += `${msg.role.toUpperCase()}: ${msg.content}\n\n`;
      });
    }
  });

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
};
