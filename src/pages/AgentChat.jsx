import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Container, Button, Card, Input, Avatar } from '../components/design-system';
import { Send, ArrowLeft, Settings } from 'lucide-react';

export const AgentChat = ({ agentId, onBack, masterContext }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'agent',
      text: 'Hello! I\'m your Social Media Agent. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: inputValue,
      timestamp: new Date(),
    };
    setMessages([...messages, userMessage]);
    setInputValue('');

    // Simulate agent response
    setIsLoading(true);
    setTimeout(() => {
      const agentMessage = {
        id: messages.length + 2,
        sender: 'agent',
        text: 'I understand! Let me help you with that. I\'m analyzing your request...',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <Container size="lg">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#5E9BEB] hover:text-[#4A7BC9] font-semibold font-sarabun"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div className="text-center flex-1">
              <h1 className="text-xl font-bold text-gray-900 font-sarabun">
                Social Media Agent
              </h1>
              <p className="text-xs text-gray-500 font-sarabun">Ready to help</p>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </Container>
      </div>

      {/* Messages */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <Container size="lg">
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                variants={messageVariants}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-md ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  {message.sender === 'agent' && (
                    <Avatar
                      fallback="A"
                      size="sm"
                      className="flex-shrink-0"
                    />
                  )}
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-[#5E9BEB] text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="font-sarabun">{message.text}</p>
                    <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                variants={messageVariants}
                className="flex justify-start"
              >
                <div className="flex gap-3">
                  <Avatar fallback="A" size="sm" />
                  <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl rounded-bl-none">
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </Container>
      </motion.div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white">
        <Container size="lg">
          <form onSubmit={handleSendMessage} className="py-4 flex gap-3">
            <Input
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading || !inputValue.trim()}
              className="flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </Container>
      </div>
    </div>
  );
};

export default AgentChat;
