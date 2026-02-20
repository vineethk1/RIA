import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  IconButton,
  TextField,
  Typography,
  Avatar,
  Fab,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Send,
  Close,
  ChatBubble,
  Mic,
  MicOff,
} from '@mui/icons-material';

import riaLogo from '../../public/ria-logo.png';


// Main ChatWidget component
const ChatWidget = ({ 
  customStyles = {},
  position = { bottom: 24, right: 24 },
  theme = 'dark',
  embedded = false, 
  configFile = null,
  greeting = "Hi! How can I help you today?",
  formattingStyles = {}, // Custom styles for formatting content
}) => {

  // Default styles based on theme and embedded mode
  const defaultStyles = {
    container: embedded ? {
      width: '100%',
      height: '100vh',
      position: 'relative',
      zIndex: 1,
    } : {
      position: 'fixed',
      bottom: position.bottom,
      right: position.right,
      zIndex: 9999,
    },
    paper: embedded ? {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 0,
      overflow: 'hidden',
      bgcolor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
    } : {
      width: 384,
      height: 600,
      display: 'flex',
      flexDirection: 'column',
      mb: 2,
      borderRadius: 3,
      overflow: 'hidden',
      bgcolor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
    },
    header: {
      bgcolor: theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
      color: theme === 'dark' ? 'white' : 'black',
      p: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: theme === 'dark' ? '1px solid #3a3a3a' : '1px solid #e0e0e0',
    },
    avatar: {
      bgcolor: 'transparent',
      width: 48,
      height: 48,
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      p: 2,
      bgcolor: theme === 'dark' ? '#1a1a1a' : '#fafafa',
    },
    userMessage: {
      bgcolor: '#60a5fa',
      color: 'black',
      borderBottomRightRadius: 4,
    },
    botMessage: {
      bgcolor: theme === 'dark' ? '#2a2a2a' : '#f0f0f0',
      color: theme === 'dark' ? '#e5e5e5' : '#333333',
      borderBottomLeftRadius: 4,
    },
    inputContainer: {
      p: 2,
      bgcolor: theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
      borderTop: theme === 'dark' ? '1px solid #3a3a3a' : '1px solid #e0e0e0',
    },
    textField: {
      '& .MuiOutlinedInput-root': {
        borderRadius: 3,
        bgcolor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        color: theme === 'dark' ? '#e5e5e5' : '#333333',
        '& fieldset': {
          borderColor: theme === 'dark' ? '#3a3a3a' : '#d0d0d0',
        },
        '&:hover fieldset': {
          borderColor: '#60a5fa',
        },
        '&.Mui-focused fieldset': {
          borderColor: '#60a5fa',
        },
      },
      '& .MuiInputBase-input::placeholder': {
        color: theme === 'dark' ? '#6a6a6a' : '#999999',
        opacity: 1,
      },
    },
    micButton: {
      bgcolor: theme === 'dark' ? '#3a3a3a' : '#e0e0e0',
      color: theme === 'dark' ? '#a0a0a0' : '#666666',
      '&:hover': {
        bgcolor: theme === 'dark' ? '#4a4a4a' : '#d0d0d0',
      },
      '&:disabled': {
        bgcolor: theme === 'dark' ? '#3a3a3a' : '#f0f0f0',
        color: theme === 'dark' ? '#6a6a6a' : '#cccccc',
      },
    },
    micButtonActive: {
      bgcolor: '#ef4444',
      color: 'white',
      '&:hover': {
        bgcolor: '#dc2626',
      },
    },
    sendButton: {
      bgcolor: '#60a5fa',
      color: theme === 'dark' ? 'black' : 'white',
      '&:hover': {
        bgcolor: '#3b82f6',
      },
      '&:disabled': {
        bgcolor: theme === 'dark' ? '#3a3a3a' : '#e0e0e0',
        color: theme === 'dark' ? '#6a6a6a' : '#cccccc',
      },
    },
    fab: {
      width: 56,
      height: 56,
      padding: 0,
      overflow: 'hidden',
      bgcolor: 'transparent',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      '&:hover': {
        bgcolor: 'transparent',
        transform: 'scale(1.05)',
      },
    },
  };

  // Merge custom styles with defaults
  const styles = {
    container: { ...defaultStyles.container, ...customStyles.container },
    paper: { ...defaultStyles.paper, ...customStyles.paper },
    header: { ...defaultStyles.header, ...customStyles.header },
    avatar: defaultStyles.avatar,
    messagesContainer: { ...defaultStyles.messagesContainer, ...customStyles.messagesContainer },
    userMessage: { ...defaultStyles.userMessage, ...customStyles.userMessage },
    botMessage: { ...defaultStyles.botMessage, ...customStyles.botMessage },
    inputContainer: { ...defaultStyles.inputContainer, ...customStyles.inputContainer },
    textField: { ...defaultStyles.textField, ...customStyles.textField },
    micButton: { ...defaultStyles.micButton, ...customStyles.micButton },
    micButtonActive: { ...defaultStyles.micButtonActive, ...customStyles.micButtonActive },
    sendButton: { ...defaultStyles.sendButton, ...customStyles.sendButton },
    fab: defaultStyles.fab,
  };

  // Format styling with proper merge - using useMemo to prevent recreation on every render
  const formatting = React.useMemo(() => {
    const defaultFormattingStyles = {
      table: {
        container: {
          my: 2,
          maxWidth: '100%',
          overflowX: 'auto',
          bgcolor: theme === 'dark' ? '#1a1a1a' : '#fafafa',
          border: theme === 'dark' ? '1px solid #3a3a3a' : '1px solid #e0e0e0',
        },
        header: {
          bgcolor: theme === 'dark' ? '#2a2a2a' : '#f5f5f5',
          fontWeight: 600,
          color: theme === 'dark' ? '#e5e5e5' : '#333333',
          borderBottom: theme === 'dark' ? '1px solid #3a3a3a' : '1px solid #e0e0e0',
        },
        cell: {
          color: theme === 'dark' ? '#e5e5e5' : '#333333',
          borderBottom: theme === 'dark' ? '1px solid #3a3a3a' : '1px solid #e0e0e0',
        },
        rowHover: {
          bgcolor: theme === 'dark' ? '#252525' : '#f9f9f9',
        },
      },
      list: {
        my: 1,
        pl: 3,
        listItem: {
          mb: 0.5,
          lineHeight: 1.6,
        },
      },
      bold: {
        fontWeight: 600,
        color: theme === 'dark' ? '#ffffff' : '#000000',
      },
      italic: {
        fontStyle: 'italic',
      },
      code: {
        bgcolor: theme === 'dark' ? '#2a2a2a' : '#f0f0f0',
        color: theme === 'dark' ? '#60a5fa' : '#2563eb',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '0.9em',
        fontFamily: 'monospace',
      },
      heading: {
        mt: 2,
        mb: 1,
        fontWeight: 600,
        color: theme === 'dark' ? '#e5e5e5' : '#333333',
      },
      blockquote: {
        borderLeft: '4px solid',
        borderColor: theme === 'dark' ? '#60a5fa' : '#3b82f6',
        bgcolor: theme === 'dark' ? '#374151' : '#e0e7ff',
        pl: 2,
        py: 1.5,
        my: 2,
        borderRadius: '0 4px 4px 0',
        fontStyle: 'italic',
        color: theme === 'dark' ? '#e5e7eb' : '#3730a3',
      },
    };

    // Deep merge helper for nested objects
    const deepMerge = (target, source) => {
      const result = { ...target };
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
      return result;
    };

    // Merge formatting styles with deep merge
    return {
      table: deepMerge(defaultFormattingStyles.table, formattingStyles.table || {}),
      list: deepMerge(defaultFormattingStyles.list, formattingStyles.list || {}),
      bold: { ...defaultFormattingStyles.bold, ...(formattingStyles.bold || {}) },
      italic: { ...defaultFormattingStyles.italic, ...(formattingStyles.italic || {}) },
      code: { ...defaultFormattingStyles.code, ...(formattingStyles.code || {}) },
      heading: { ...defaultFormattingStyles.heading, ...(formattingStyles.heading || {}) },
      blockquote: { ...defaultFormattingStyles.blockquote, ...(formattingStyles.blockquote || {}) },
    };
  }, [theme, formattingStyles]);

  // State variables
  const [isOpen, setIsOpen] = useState(embedded ? true : false);
  const [messages, setMessages] = useState([
    { id: 1, text: greeting, sender: 'bot', type: 'text', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [configData, setConfigData] = useState(null);
  const [configError, setConfigError] = useState(null);
  
  // Refs for DOM and WebRTC
  const messagesEndRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const audioStreamRef = useRef(null);
  const webrtcIdRef = useRef(null);
  const audioOutputRef = useRef(null);

  // Function to play greeting audio
  const playGreetingAudioFn = async () => {
    if (!greeting) return;

    try {
      setIsBotSpeaking(true);

      const response = await fetch('http://localhost:8000/api/v1/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: greeting,
          voice_id: "Nhs7eitvQWFTQBsf0yiT",
          model_id: "eleven_multilingual_v2",
          fmt: "mp3"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate greeting audio');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audioElement = new Audio(audioUrl);

      // Mute user audio while bot is speaking (if WebRTC is active)
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => (track.enabled = false));
      }

      await audioElement.play();
      
      audioElement.onended = () => {
        setIsBotSpeaking(false);
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => (track.enabled = true));
        }
        URL.revokeObjectURL(audioUrl);
      };

    } catch (error) {
      console.error('Error playing greeting audio:', error);
      setIsBotSpeaking(false);
    }
  };

  // Play greeting audio when chatbot opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        playGreetingAudioFn();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Expose control functions globally for external use
  useEffect(() => {
    window.openChatbot = () => setIsOpen(true);
    window.closeChatbot = () => setIsOpen(false);
    window.toggleChatbot = () => setIsOpen(prev => !prev);
    
    return () => {
      delete window.openChatbot;
      delete window.closeChatbot;
      delete window.toggleChatbot;
    };
  }, []);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Load config file and send to backend if provided
  useEffect(() => {
    if (!configFile) return;

    // Load the JSON config from the file
    fetch(configFile)
      .then(response => {
        if (!response.ok) throw new Error("Config file could not be loaded");
        return response.json();
      })
      .then(config => {
        setConfigData(config);
        console.log("Loaded config:", config);

        // Send the config to the backend
        return fetch("http://localhost:8000/api/v1/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config)
        });
      })
      .then(res => {
        if (!res.ok) throw new Error("Backend rejected config");
        return res.json();
      })
      .then(result => {
        console.log("Backend accepted config:", result);
      })
      .catch(error => {
        console.error("Error loading/sending config:", error);
        setConfigError(error.message);
      });

  }, [configFile]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Setup WebRTC connection for voice input
  const setupWebRTC = async () => {
    try {
      setConnectionStatus('connecting');
      
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;
      webrtcIdRef.current = Math.random().toString(36).substring(7);

      // Get user audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      
      audioStreamRef.current = stream;

      // Add audio tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle incoming audio tracks
      pc.addEventListener("track", (evt) => {
        if (audioOutputRef.current && 
            audioOutputRef.current.srcObject !== evt.streams[0]) {
          audioOutputRef.current.srcObject = evt.streams[0];
          audioOutputRef.current.play().catch(e => console.error('Error playing audio:', e));
        }
      });

      // Create data channel for text
      const dataChannel = pc.createDataChannel("text");
      dataChannelRef.current = dataChannel;

      // Data channel event handlers
      dataChannel.onopen = () => {
        console.log('Data channel opened');
        setConnectionStatus('connected');
      };

      dataChannel.onclose = () => {
        console.log('Data channel closed');
        setConnectionStatus('disconnected');
      };

      // Handle incoming messages from backend
      dataChannel.onmessage = (event) => {
        console.log('Received message:', event.data);
        try {
          const data = JSON.parse(event.data);
          
          // Handle transcription from backend
          if (data.transcription) {
            const userText = data.transcription.original_text;
            
            if (userText) {
              const userMessage = {
                id: Date.now(),
                text: userText,
                type: 'text',
                sender: 'user',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, userMessage]);
            }
            setIsLoading(true);
          }

          // Handle key points from backend
          if(data.micro_agent && data.micro_agent.key_points){
            const keyPointsMessage = {
              id: Date.now() + 1,
              text: data.micro_agent.key_points,
              sender: 'bot',
              type: 'text',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, keyPointsMessage]);
            setIsLoading(true);
          }          

          // Handle action items from backend
          if (data.micro_agent && data.micro_agent.action_items && data.micro_agent.action_items.length > 0) {
            let messageText = '';
            messageText += `Key Points:`;
            data.micro_agent.action_items.forEach((item) => {
              messageText += `\n• ${item.description}`;
            });
            messageText += `\n`;
            const actionItemMessage = {
              id: Date.now() + 1,
              text: messageText,
              type: 'text',
              sender: 'bot',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, actionItemMessage]);
          }

          // Handle bot reply preview
          if (data.reply_preview){
            const botText = data.reply_preview;
            const botMessage = {
              id: Date.now() + 1,
              text: botText,
              type: 'text',
              sender: 'bot',
              timestamp: new Date()
            };
            setIsLoading(false);
            setMessages(prev => [...prev, botMessage]);
          }

          if (data.optional_response) {
            data.optional_response.forEach((item) => {
              const optionalMessage = {
                id: Date.now() + 1,
                text: item.value,
                type: item.type,
                sender: 'bot',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, optionalMessage]);
            });
          }

          // Handle bot reply audio (TTS)
          if (data.reply_audio_b64) {
            const audioData = data.reply_audio_b64;
            const audioBlob = new Blob([new Uint8Array(atob(audioData).split('').map(c => c.charCodeAt(0)))], { type: 'audio/mp3' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audioElement = new Audio(audioUrl);
            setIsBotSpeaking(true);

            // Mute user audio while bot is speaking
            if (audioStreamRef.current) {
              audioStreamRef.current.getTracks().forEach(track => (track.enabled = false));
            }

            audioElement.play();
            audioElement.onended = () => {
              setIsBotSpeaking(false); 
              if (audioStreamRef.current) {
                audioStreamRef.current.getTracks().forEach(track => (track.enabled = true));
              }
            };
          }

        } catch (e) {
          // Fallback for non-JSON messages
          console.error('Error parsing message:', e);
          const botMessage = {
            id: Date.now(),
            text: event.data,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
        }
      };

      // Create offer and send to backend
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send ICE candidates to backend
      pc.onicecandidate = ({ candidate }) => {
        if (candidate) {
          console.debug("Sending ICE candidate", candidate);
          fetch('http://localhost:8000/webrtc/webrtc/offer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              candidate: candidate.toJSON(),
              webrtc_id: webrtcIdRef.current,
              type: "ice-candidate",
            })
          }).catch(e => console.error('Error sending ICE candidate:', e));
        }
      };

      // Send offer to backend and set remote description
      const response = await fetch('http://localhost:8000/webrtc/webrtc/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sdp: offer.sdp,
          type: offer.type,
          webrtc_id: webrtcIdRef.current
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const serverResponse = await response.json();
      await pc.setRemoteDescription(new RTCSessionDescription(serverResponse));

      setConnectionStatus('connected');
      setIsListening(true);

    } catch (error) {
      // Handle errors and cleanup
      console.error('Error setting up WebRTC:', error);
      setConnectionStatus('error');
      alert(`Failed to connect: ${error.message}. Make sure your backend is running on /webrtc/offer`);
      cleanupWebRTC();
    }
  };

  // Cleanup WebRTC resources
  const cleanupWebRTC = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setConnectionStatus('disconnected');
    setIsListening(false);
    webrtcIdRef.current = null;
  };

  // Toggle voice input (start/stop WebRTC)
  const toggleVoiceInput = async () => {
    if (isListening) {
      cleanupWebRTC();
    } else {
      await setupWebRTC();
    }
  };

  // Send text message to backend
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    const requestBody = {
      text: input,
      need_action_items: true,
      include_tts: true,
      tts_voice_id: "Nhs7eitvQWFTQBsf0yiT",   
      tts_model_id: "eleven_multilingual_v2",   
      tts_format: "mp3"
    };

    setIsLoading(true);  
    setInput('');

    try {
      // Send message to backend
      const response = await fetch('http://localhost:8000/api/v1/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to send message to backend');
      }

      const data = await response.json();

      // Handle key points from backend
      if(data.micro_agent && data.micro_agent.key_points){
        const keyPointsMessage = {
          id: Date.now() + 1,
          text: data.micro_agent.key_points,
          type: 'text',
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, keyPointsMessage]);
      }
     
      // Handle bot reply preview
      const botMessage = {
        id: Date.now(),
        text: data.reply_preview || "No response",
        type: 'text',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // Handle action items from backend
      if (data.micro_agent && data.micro_agent.action_items && data.micro_agent.action_items.length > 0) {
        let messageText = '';
        messageText += `Key Points:`;
        data.micro_agent.action_items.forEach((item) => {
          messageText += `\n• ${item.description}`;
        });
        messageText += `\n`;
        
        const actionItemMessage = {
          id: Date.now() + 1,
          text: messageText,
          type: 'text',
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, actionItemMessage]);
      }

      if (data.optional_response) {
            data.optional_response.forEach((item) => {
              const optionalMessage = {
                id: Date.now() + 1,
                text: item.value,
                type: item.type,
                sender: 'bot',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, optionalMessage]);
            });
          }

      // Handle bot reply audio (TTS)
      if (data.reply_audio_b64) {
        const audioData = data.reply_audio_b64;
        const audioBlob = new Blob([new Uint8Array(atob(audioData).split('').map(c => c.charCodeAt(0)))], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioElement = new Audio(audioUrl);
        setIsBotSpeaking(true);

        // Mute user audio while bot is speaking
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => (track.enabled = false));
        }

        audioElement.play();
        audioElement.onended = () => {
          setIsBotSpeaking(false); 
          if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => (track.enabled = true));
          }
        };
      }

    } catch (error) {
      // Handle errors
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);  
    }
  };

  // Handle Enter key for sending message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Cleanup WebRTC on unmount
  useEffect(() => {
    return () => {
      cleanupWebRTC();
    };
  }, []);

  // Get color for connection status indicator
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#10b981';
      case 'connecting':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const formatMessageText = (text) => {
    // Remove code block markers (```language and ```)
    let cleanedText = text.replace(/```[\w]*\n?/g, '');
    
    const lines = cleanedText.split('\n');
    const elements = [];
    let inTable = false;
    let tableData = [];
    let inList = false;
    let listItems = [];
    let isOrderedList = false;
    let inBlockquote = false;
    let blockquoteLines = [];

    // Helper function to format inline text (bold, italic, code)
    const formatInlineText = (text) => {
      let processedText = text;
      
      // Protect existing HTML-like content
      const protectedSegments = [];
      processedText = processedText.replace(/(<[^>]+>)/g, (match) => {
        protectedSegments.push(match);
        return `__PROTECTED_${protectedSegments.length - 1}__`;
      });
      
      // Build inline styles from formatting object
      const codeStyle = Object.entries(formatting.code)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
        .join('; ');
      const boldStyle = Object.entries(formatting.bold)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
        .join('; ');
      const italicStyle = Object.entries(formatting.italic)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
        .join('; ');
      
      // Handle inline code first
      processedText = processedText.replace(/`([^`]+)`/g, `<code style="${codeStyle}">$1</code>`);
      
      // Handle bold with ** (greedy match to get full content)
      processedText = processedText.replace(/\*\*([^\n*]+(?:\*(?!\*)[^\n*]*)*?)\*\*/g, `<strong style="${boldStyle}">$1</strong>`);
      
      // Handle bold with __
      processedText = processedText.replace(/__([^\n_]+(?:_(?!_)[^\n_]*)*?)__/g, `<strong style="${boldStyle}">$1</strong>`);
      
      // Handle italic with single * (avoid matching **)
      processedText = processedText.replace(/(?<!\*)\*(?!\*)([^\n*]+)\*(?!\*)/g, `<em style="${italicStyle}">$1</em>`);
      
      // Handle italic with single _
      processedText = processedText.replace(/(?<!_)_(?!_)([^\n_]+)_(?!_)/g, `<em style="${italicStyle}">$1</em>`);
      
      // Restore protected segments
      processedText = processedText.replace(/__PROTECTED_(\d+)__/g, (match, index) => {
        return protectedSegments[index];
      });
      
      return processedText;
    };

    const flushList = () => {
      if (listItems.length > 0) {
        const ListComponent = isOrderedList ? 'ol' : 'ul';
        elements.push(
          <Box 
            key={`list-${elements.length}`} 
            component={ListComponent} 
            sx={{ 
              ...formatting.list,
              '& li': formatting.list.listItem,
            }}
          >
            {listItems.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: formatInlineText(item) }} />
            ))}
          </Box>
        );
        listItems = [];
      }
      inList = false;
      isOrderedList = false;
    };

    const flushBlockquote = () => {
      if (blockquoteLines.length > 0) {
        elements.push(
          <Box
            key={`blockquote-${elements.length}`}
            sx={formatting.blockquote}
          >
            {blockquoteLines.map((line, idx) => (
              <Typography
                key={idx}
                variant="body2"
                sx={{ mb: idx < blockquoteLines.length - 1 ? 0.5 : 0 }}
                dangerouslySetInnerHTML={{ __html: formatInlineText(line) }}
              />
            ))}
          </Box>
        );
        blockquoteLines = [];
      }
      inBlockquote = false;
    };

    const flushTable = () => {
      if (tableData.length > 0) {
        // Filter out separator rows from tableData
        const filteredData = tableData.filter(row => {
          // Check if this row is a separator (all cells are just dashes/colons/spaces)
          return !row.every(cell => /^[\s:|-]+$/.test(cell));
        });
        
        if (filteredData.length === 0) {
          tableData = [];
          inTable = false;
          return;
        }
        
        const headers = filteredData[0];
        const rows = filteredData.slice(1);
        
        elements.push(
          <TableContainer 
            key={`table-${elements.length}`}
            component={Paper}
            sx={formatting.table.container}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: formatting.table.header.bgcolor }}>
                  {headers.map((header, idx) => (
                    <TableCell 
                      key={idx}
                      sx={formatting.table.header}
                      dangerouslySetInnerHTML={{ __html: formatInlineText(header) }}
                    />
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, rowIdx) => (
                  <TableRow 
                    key={rowIdx}
                    sx={{
                      '&:last-child td': { border: 0 },
                      '&:hover': formatting.table.rowHover,
                    }}
                  >
                    {row.map((cell, cellIdx) => (
                      <TableCell 
                        key={cellIdx}
                        sx={formatting.table.cell}
                        dangerouslySetInnerHTML={{ __html: formatInlineText(cell) }}
                      />
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
        tableData = [];
      }
      inTable = false;
    };

    lines.forEach((line, idx) => {
      // Check for blockquote (> text)
      const blockquoteMatch = line.match(/^>\s*(.*)$/);
      if (blockquoteMatch) {
        flushTable();
        flushList();
        inBlockquote = true;
        const content = blockquoteMatch[1].trim();
        if (content) {
          blockquoteLines.push(content);
        }
        return;
      }

      // If we were in a blockquote and this line isn't a blockquote, flush it
      if (inBlockquote && !blockquoteMatch) {
        flushBlockquote();
      }

      // Check for table rows (markdown style: | col1 | col2 |)
      if (line.trim().match(/^\|(.+)\|$/)) {
        flushList();
        flushBlockquote();
        inTable = true;
        const cells = line.split('|')
          .filter(cell => cell.trim())
          .map(cell => cell.trim());
        tableData.push(cells);
        return;
      }
      
      // Check for table separator (|---|---|)
      if (line.trim().match(/^\|[\s:-]+\|$/)) {
        return;
      }

      // If we were in a table and this line isn't a table row, flush the table
      if (inTable && !line.trim().match(/^\|(.+)\|$/)) {
        flushTable();
      }

      // Check for bullet points (-, *, •)
      const bulletMatch = line.match(/^[\s]*[-*•]\s+(.+)$/);
      if (bulletMatch) {
        flushTable();
        flushBlockquote();
        if (inList && isOrderedList) {
          // Switching from ordered to unordered list
          flushList();
        }
        inList = true;
        isOrderedList = false;
        listItems.push(bulletMatch[1]);
        return;
      }

      // Check for numbered lists (1., 2., etc.)
      const numberedMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
      if (numberedMatch) {
        flushTable();
        flushBlockquote();
        if (inList && !isOrderedList) {
          // Switching from unordered to ordered list
          flushList();
        }
        inList = true;
        isOrderedList = true;
        listItems.push(numberedMatch[1]);
        return;
      }

      // If we were in a list and this line isn't a list item, flush the list
      if (inList && !bulletMatch && !numberedMatch) {
        flushList();
      }

      // Handle formatting in regular text lines
      let processedLine = formatInlineText(line);

      // Handle headers (# Header)
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const headerText = headerMatch[2];
        elements.push(
          <Typography 
            key={`header-${idx}`}
            variant={`h${Math.min(level + 3, 6)}`}
            sx={formatting.heading}
            dangerouslySetInnerHTML={{ __html: formatInlineText(headerText) }}
          />
        );
        return;
      }

      // Regular text
      if (line.trim()) {
        elements.push(
          <Typography 
            key={`text-${idx}`}
            variant="body2"
            sx={{ mb: 0.5 }}
            dangerouslySetInnerHTML={{ 
              __html: processedLine.replace(/\n/g, '<br />') 
            }}
          />
        );
      } else {
        // Empty line - add spacing
        elements.push(<Box key={`space-${idx}`} sx={{ height: 8 }} />);
      }
    });

    // Flush any remaining list or table or blockquote
    flushList();
    flushTable();
    flushBlockquote();

    return elements.length > 0 ? elements : text;
  };

  const resolveImageSrc = (value) => {
  if (!value) return '';

  const trimmed = value.trim();

  if (trimmed.startsWith('data:image')) {
    return trimmed;
  }

  if (trimmed.startsWith('<svg')) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
  }

  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  if (base64Regex.test(trimmed)) {
    return `data:image/png;base64,${trimmed}`;
  }

  return trimmed;
};


  const renderMessageContent = (msg) => {
  switch (msg.type) {
    case 'html':
      return (
        <Box
          sx={{ '& img': { maxWidth: '100%' } }}
          dangerouslySetInnerHTML={{ __html: msg.text }}
        />
      );

    case 'image': {
      const src = resolveImageSrc(msg.text);

    return (
      <Box
      component="img"
      src={src}
      alt="Bot sent image"
      sx={{
        maxWidth: '100%',
        borderRadius: 1,
      }}
      />
    );
    }

    case 'video':
      return (
        <Box
          component="video"
          src={msg.text}
          controls
          sx={{
            maxWidth: '100%',
            borderRadius: 1,
          }}
        />
      );

    case 'text':
    default:
      return formatMessageText(msg.text);
  }
};


  // Render component
  return (
    <Box sx={styles.container}>
      {isOpen && (
        <Paper elevation={embedded ? 0 : 8} sx={styles.paper}>
          {/* Header */}
          <Box sx={styles.header}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={styles.avatar}>
                <img 
                  src={riaLogo}
                  alt="RIA Logo" 
                  style={{ width: '150%', height: '150%', objectFit: 'contain' }}
                />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  RIA Assistant
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: getConnectionStatusColor(),
                    }}
                  />
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {connectionStatus === 'connected' ? 'Connected' : 
                     connectionStatus === 'connecting' ? 'Connecting...' :
                     connectionStatus === 'error' ? 'Connection Error' : 
                     'AI Powered Assistance'}
                  </Typography>
                </Box>
              </Box>
            </Box>
            {/* Close button for non-embedded mode */}
            {!embedded && (
              <IconButton onClick={() => setIsOpen(false)} sx={{ color: 'inherit' }}>
                <Close />
              </IconButton>
            )}
          </Box>

          {/* Messages Container */}
          <Box sx={styles.messagesContainer}>
            {messages.map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    maxWidth: '80%',
                    p: 1.5,
                    borderRadius: 2,
                    ...(msg.sender === 'user' ? styles.userMessage : styles.botMessage),
                  }}
                >
                  {msg.sender === 'bot' ? (
                    <Box>
                      {renderMessageContent(msg)}
                      <Typography
                        variant="caption"
                        sx={{
                          opacity: 0.7,
                          fontSize: '0.7rem',
                          display: 'block',
                          mt: 1,
                        }}
                      >
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Typography variant="body2" sx={{ mb: 0.5, whiteSpace: 'pre-wrap' }}>
                        {msg.text}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          opacity: 0.7,
                          fontSize: '0.7rem',
                        }}
                      >
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </>
                  )}
                </Paper>
              </Box>
            ))}
            
            {/* Loading spinner for bot response */}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    ...styles.botMessage,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <CircularProgress size={8} sx={{ color: '#60a5fa' }} />
                  </Box>
                </Paper>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Container */}
          <Box sx={styles.inputContainer}>
            {/* Bot speaking or listening indicator */}
            {isBotSpeaking ? (
              <Chip
                icon={<Mic sx={{ fontSize: 18 }} />}
                label="RIA is speaking..."
                size="small"
                sx={{
                  ml: 1,
                  mb: 0.5,
                  bgcolor: '#60a5fa',
                  color: 'white',
                  fontWeight: 500,
                  letterSpacing: 0.3,
                  '& .MuiChip-icon': {
                    color: 'white',
                  },
                }}
              />
            ) : isListening ? (
              <Chip
                icon={<Mic />}
                label={`Streaming Audio (${connectionStatus})`}
                size="small"
                sx={{ 
                  mb: 1,
                  bgcolor: getConnectionStatusColor(),
                  color: connectionStatus === 'connected' ? 'white' : 'black',
                  '& .MuiChip-icon': { 
                    color: connectionStatus === 'connected' ? 'white' : 'black' 
                  },
                }}
              />
            ) : null}

            {/* Input field and buttons */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <TextField
                fullWidth
                multiline
                maxRows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                variant="outlined"
                size="small"
                sx={styles.textField}
              />
              {/* Voice input button */}
              <IconButton
                color="primary"
                onClick={toggleVoiceInput}
                disabled={isLoading || connectionStatus === 'connecting'}
                sx={isListening ? styles.micButtonActive : styles.micButton}
              >
                {isListening ? <MicOff /> : <Mic />}
              </IconButton>
              {/* Send button */}
              <IconButton
                color="primary"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                sx={styles.sendButton}
              >
                <Send />
              </IconButton>
            </Box>
          </Box>
          
          {/* Hidden audio output for WebRTC */}
          <audio ref={audioOutputRef} style={{ display: 'none' }} autoPlay />
        </Paper>
      )}

      {/* Floating action button to open widget (non-embedded mode) */}
      {!isOpen && !embedded && (
        <Fab
          color="primary"
          onClick={() => setIsOpen(true)}
          sx={styles.fab}
        >
          <img 
            src={riaLogo}
            alt="RIA Logo" 
            style={{ width: '150%', height: '150%', objectFit: 'cover' }}
          />
        </Fab>
      )}
    </Box>
  );
};

export default ChatWidget;