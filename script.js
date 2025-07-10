// Get chatbot elements
const chatbotToggleBtn = document.getElementById('chatbotToggleBtn');
const chatbotPanel = document.getElementById('chatbotPanel');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotSendBtn = document.getElementById('chatbotSendBtn');

// Import the OpenAI API key from secrets.js
// (Make sure secrets.js is included in your HTML before script.js)

if (chatbotToggleBtn && chatbotPanel) {
  // Toggle chat open/closed when clicking the button
  chatbotToggleBtn.addEventListener('click', () => {
    chatbotPanel.classList.toggle('open');
  });

  // Close chat when clicking anywhere except the chat panel or button
  document.addEventListener('click', (e) => {
    // If chat is open AND user clicked outside chat area, close it
    if (chatbotPanel.classList.contains('open') && 
        !chatbotPanel.contains(e.target) && 
        !chatbotToggleBtn.contains(e.target)) {
      chatbotPanel.classList.remove('open');
    }
  });
}

// Function to add a message to the chat window
function addMessage(text, sender) {
  // Create a new div for the message
  const messageDiv = document.createElement('div');
  messageDiv.className = `chatbot-message chatbot-message--${sender}`;

  // Format the assistant's message with line breaks between sections
  if (sender === 'assistant') {
    // Replace double line breaks or section headers with <br><br> for spacing
    let formatted = text
      // Add breaks before common section headers (Script, Tone, CTA, etc.)
      .replace(/(Script:|Voiceover:|Tone:|CTA:|Music:|Visual direction:|Structure:|\n\n)/gi, '<br><br>$1')
      // Replace single line breaks with <br>
      .replace(/\n/g, '<br>');
    messageDiv.innerHTML = formatted;
  } else {
    // For user, just show plain text
    messageDiv.textContent = text;
  }
  chatbotMessages.appendChild(messageDiv);
  // Scroll to the bottom
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Store the conversation history as an array of message objects
const conversationHistory = [
  { role: 'system', content: `You are WayChat, Waymark’s friendly creative assistant.

Waymark is a video ad creation platform that helps people turn ideas, products, or messages into high-quality, ready-to-run videos. The platform is used by small businesses, agencies, and marketers to create broadcast-   ads with minimal friction.

Your job is to help users shape raw input — whether it’s a business name, a tagline, a product, a vibe, or a rough idea — into a short-form video concept.

Your responses may include suggested video structures, voiceover lines, tone and visual direction, music suggestions, and clarifying follow-up questions.

If the user's input is unclear, ask 1–2 short questions to help sharpen the direction before offering creative suggestions.

Only respond to questions related to Waymark, its tools, its platform, or the creative process of making short-form video ads. If a question is unrelated, politely explain that you're focused on helping users create video ads with Waymark.

Keep your replies concise, collaborative, and focused on helping users express their message clearly. Always align with modern marketing best practices — and stay supportive and friendly.` }
];

// Function to send a message to OpenAI and get a response
async function sendMessageToOpenAI(userInput) {
  // Add user's message to chat
  addMessage(userInput, 'user');

  // Add user's message to conversation history
  conversationHistory.push({ role: 'user', content: userInput });

  // Show a loading message
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'chatbot-message chatbot-message--assistant';
  loadingDiv.textContent = 'Thinking...';
  chatbotMessages.appendChild(loadingDiv);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

  try {
    // Call the OpenAI API using fetch and async/await
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: conversationHistory,
        temperature: 0.8, // Adjust temperature for creativity
        max_tokens: 300 // Limit response length
      })
    });

    const data = await response.json();
    // Remove the loading message
    chatbotMessages.removeChild(loadingDiv);

    // Get the assistant's reply
    const assistantReply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
      ? data.choices[0].message.content.trim()
      : 'Sorry, I could not understand that.';

    // Add assistant's reply to chat
    addMessage(assistantReply, 'assistant');

    // Add assistant's reply to conversation history
    conversationHistory.push({ role: 'assistant', content: assistantReply });
  } catch (error) {
    chatbotMessages.removeChild(loadingDiv);
    addMessage('Error: Could not reach OpenAI.', 'assistant');
    console.error(error);
  }
}

// Send message when user clicks the send button or presses Enter
if (chatbotSendBtn && chatbotInput) {
  chatbotSendBtn.addEventListener('click', () => {
    const userInput = chatbotInput.value.trim();
    if (userInput) {
      sendMessageToOpenAI(userInput);
      chatbotInput.value = '';
    }
  });

  chatbotInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const userInput = chatbotInput.value.trim();
      if (userInput) {
        sendMessageToOpenAI(userInput);
        chatbotInput.value = '';
      }
    }
  });
}
