# RIA Conversational AI - Chatbot Widget

A lightweight, embeddable chatbot widget built with React and Material-UI. Features voice input, real-time messaging, and easy integration into any website.

## 📋 Features

- 🎨 Modern, responsive UI with Material-UI components
- 🎤 Voice input support using Web Speech API
- 💬 Real-time chat interface
- 🔌 Easy embed with UMD bundle
- 📱 Mobile-friendly design
- 🌐 Global API for programmatic control

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Create the build

```bash
npm run build
```

Generates optimized bundle in `dist/chatbot.js`


## 🌐 Usage

### Embed in HTML

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <h1>Welcome to my site!</h1>
  
  <!-- Load the chatbot widget -->
  <script src="path/to/chatbot.js"></script>
  
  <script>
    // Widget will automatically render
    // Optional: Control programmatically
    // window.openChatbot();
    // window.closeChatbot();
    // window.toggleChatbot();
  </script>
</body>
</html>
```

### Programmatic Control

The widget exposes global functions for control:

```javascript
// Open the chatbot
window.openChatbot();

// Close the chatbot
window.closeChatbot();

// Toggle the chatbot
window.toggleChatbot();
```

### Demo Site

You can also view the demo using the following steps:

```bash
npm install serve
```

From the chatbot-widget directory run 

```bash
serve .
```

View the demo site in `http://localhost:3000/public/demo`
