import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader, Play, RefreshCw } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import Button from '../components/Button';

interface Message {
    id: string;
    body: string;
    sender_customer_id: string;
    sender_name: string;
    direction: 'inbound' | 'outbound';
    created_at: string;
}

interface Customer {
    id: string;
    name: string;
    external_id: string;
}

interface Conversation {
    id: string;
    type: string;
    participants: Customer[];
}

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
    const [botCustomer, setBotCustomer] = useState<Customer | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const API_KEY = 'kobliat-secret-key';
    const BASE_URL = 'http://localhost:8000/api/v1';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        try {
            const response = await fetch(`${BASE_URL}/conversations`, {
                headers: { 'X-API-Key': API_KEY }
            });
            const data = await response.json();
            setConversations(Array.isArray(data) ? data : (data.data || []));
        } catch (error) {
            console.error('Failed to load conversations:', error);
            setConversations([]);
        }
    };

    const loadConversation = async (convId: string) => {
        try {
            setLoading(true);
            const response = await fetch(`${BASE_URL}/conversations/${convId}/details`, {
                headers: { 'X-API-Key': API_KEY }
            });
            const convData = await response.json();

            setConversation(convData);
            const msgs = convData.messages;
            setMessages(Array.isArray(msgs) ? msgs : (msgs?.data || []));

            if (convData.participants && convData.participants.length >= 2) {
                setCurrentCustomer(convData.participants[0]);
                setBotCustomer(convData.participants[1]);
            }
        } catch (error) {
            console.error('Failed to load conversation:', error);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const initializeChat = async () => {
        setLoading(true);
        setMessages([]);
        try {
            const userResponse = await fetch(`${BASE_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
                body: JSON.stringify({ external_id: `user_${Date.now()}`, external_type: 'web', name: 'You' })
            });
            const user = await userResponse.json();
            setCurrentCustomer(user);

            const botResponse = await fetch(`${BASE_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
                body: JSON.stringify({ external_id: `bot_${Date.now()}`, external_type: 'assistant', name: 'AI Assistant' })
            });
            const bot = await botResponse.json();
            setBotCustomer(bot);

            const convResponse = await fetch(`${BASE_URL}/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
                body: JSON.stringify({ type: 'direct', participants: [user.id, bot.id] })
            });
            const conv = await convResponse.json();
            setConversation({ ...conv, participants: [user, bot] });

            await sendBotMessage(conv.id, bot.id, "Hello! I'm your AI assistant. How can I help you today?");
            await loadConversations();
        } catch (error) {
            console.error('Failed to initialize chat:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendBotMessage = async (conversationId: string, botId: string, messageText: string) => {
        try {
            const response = await fetch(`${BASE_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
                body: JSON.stringify({ conversation_id: conversationId, direction: 'inbound', body: messageText, sender_customer_id: botId })
            });
            const message = await response.json();
            setMessages(prev => [...prev, { ...message, sender_name: 'AI Assistant' }]);
        } catch (error) {
            console.error('Error sending bot message:', error);
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || !conversation || !currentCustomer) return;

        const userMessage = inputMessage;
        setInputMessage('');
        setLoading(true);

        try {
            const response = await fetch(`${BASE_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
                body: JSON.stringify({ conversation_id: conversation.id, direction: 'outbound', body: userMessage, sender_customer_id: currentCustomer.id })
            });
            const message = await response.json();
            setMessages(prev => [...prev, { ...message, sender_name: 'You' }]);

            setTimeout(async () => {
                const aiResponse = userMessage.toLowerCase().includes('hello') ? "Hello! How can I assist you?" : "That's interesting! Tell me more.";
                await sendBotMessage(conversation.id, botCustomer!.id, aiResponse);
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Failed to send message:', error);
            setLoading(false);
        }
    };

    const runSimulator = async (scenario: 'curious_shopper' | 'angry_customer') => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8006/api/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario })
            });
            const result = await response.json();
            if (result.status === 'success' && conversation && botCustomer) {
                await sendBotMessage(conversation.id, botCustomer.id, result.generated_message);
            }
        } catch (error) {
            console.error('Simulator error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            {/* Hero Banner */}
            <div className="mb-8 bg-violet-600 dark:bg-violet-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <Bot size={28} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-1">AI Chat Assistant</h1>
                                <p className="text-white/90 text-sm">Interactive chat powered by microservices</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {!conversation ? (
                                <Button onClick={initializeChat} disabled={loading} className="!bg-white/20 !border-white/30 hover:!bg-white/30 !text-white backdrop-blur-sm">
                                    <Play size={16} /> Start Chat
                                </Button>
                            ) : (
                                <Button onClick={initializeChat} disabled={loading} className="!bg-white/20 !border-white/30 hover:!bg-white/30 !text-white backdrop-blur-sm">
                                    <RefreshCw size={16} /> New Chat
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Simulator */}
            {conversation && (
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">🤖 Chat Simulator</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Click a scenario to generate AI-powered messages</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outlined" onClick={() => runSimulator('curious_shopper')} disabled={loading} className="!text-sm">
                                <Bot size={14} /> Curious Shopper
                            </Button>
                            <Button variant="outlined" onClick={() => runSimulator('angry_customer')} disabled={loading} className="!text-sm">
                                <Bot size={14} /> Angry Customer
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Chat Area */}
            <div className="grid grid-cols-12 gap-6">
                {/* Conversations Sidebar */}
                <div className="col-span-3">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 h-[600px] flex flex-col">
                        <div className="p-4 border-b border-gray-200 dark:border-slate-800">
                            <h3 className="font-bold text-gray-900 dark:text-white">Conversations</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{conversations.length} total</p>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {conversations.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">No conversations yet</div>
                            ) : (
                                conversations.map((conv) => (
                                    <button key={conv.id} onClick={() => loadConversation(conv.id)}
                                        className={`w-full p-4 text-left border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${conversation?.id === conv.id ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Bot size={14} className="text-violet-600" />
                                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">Conversation</span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">ID: {conv.id.substring(0, 8)}...</p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Container */}
                <div className="col-span-9">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 h-[600px] flex flex-col">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {!conversation ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Bot className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Welcome to AI Chat</h3>
                                        <p className="text-gray-600 dark:text-gray-400">Click "Start Chat" to begin</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages.map((message) => {
                                        const isUser = message.sender_customer_id === currentCustomer?.id;
                                        return (
                                            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`flex gap-3 max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-purple-600 text-white' : 'bg-gray-600 dark:bg-gray-700 text-white'}`}>
                                                        {isUser ? <User size={16} /> : <Bot size={16} />}
                                                    </div>
                                                    <div>
                                                        <div className={`rounded-lg px-4 py-2 ${isUser ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white'}`}>
                                                            <p className="text-sm">{message.body}</p>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
                                                            {new Date(message.created_at).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-600 dark:bg-gray-700 flex items-center justify-center">
                                                    <Bot size={16} className="text-white" />
                                                </div>
                                                <div className="bg-gray-100 dark:bg-slate-800 rounded-lg px-4 py-2">
                                                    <Loader className="w-5 h-5 animate-spin text-gray-600 dark:text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Input */}
                        {conversation && (
                            <div className="border-t border-gray-200 dark:border-slate-800 p-4 bg-gray-50 dark:bg-slate-900">
                                <div className="flex gap-3">
                                    <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type your message..." disabled={loading}
                                        className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <Button onClick={sendMessage} disabled={loading || !inputMessage.trim()}>
                                        <Send size={16} /> Send
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Info Panel */}
            {conversation && (
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                            <p className="font-medium mb-1">Active Conversation</p>
                            <div className="text-xs space-y-1">
                                <p>Conversation ID: <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded font-mono">{conversation.id}</code></p>
                                <p>Participants: {currentCustomer?.name} & {botCustomer?.name}</p>
                                <p>Messages: {messages.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Chat;
