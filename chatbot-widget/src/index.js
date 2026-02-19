import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatWidget from './components/ChatWidget.jsx';

let rootInstance = null;

// Initialize function that creates the widget
function initChatbot(config = {}) {
  // Create container if it doesn't exist
  let container = document.getElementById('chatbot-widget-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'chatbot-widget-root';
    document.body.appendChild(container);
  }
  
  if (!rootInstance) {
    rootInstance = ReactDOM.createRoot(container);
  }
  rootInstance.render(<ChatWidget theme='light' {...config} />);
}

// Destroy function to remove the chatbot
function destroyChatbot() {
  const container = document.getElementById('chatbot-widget-root');
  if (container && rootInstance) {
    rootInstance.unmount();
    rootInstance = null;
    container.remove();
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.initChatbot = initChatbot;
  window.destroyChatbot = destroyChatbot;
}

export { initChatbot, destroyChatbot };
