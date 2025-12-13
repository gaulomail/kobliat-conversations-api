import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, Paperclip, X, File as FileIcon, Loader2, Play, RefreshCw } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import Button from '../components/Button';

interface Message {
    id?: string;
    body?: string;
    sender_customer_id?: string;
    sender_name?: string;
    direction?: 'inbound' | 'outbound';
    created_at?: string;
    error?: string; // For API error responses
    media_id?: string;
    content_type?: string;
    is_error?: boolean;
    is_processed?: boolean;
}

interface Customer {
    id: string; // This is the PARTICIPANT ID (from conversation_participants table)
    customer_id?: string; // This is the CUSTOMER ID (from customers table)
    name: string;
    external_id: string;
    external_type?: string;
}

interface Conversation {
    id: string;
    type: string;
    participants: Customer[];
    preview?: string;
    participantName?: string;
    last_message_at?: string;
    created_at?: string; // Added for sort fallback
    channel?: string; // Added channel
}
// ... (Chat component)

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // Attachment State
    const [draftFile, setDraftFile] = useState<File | null>(null);
    const [draftPreview, setDraftPreview] = useState<string | null>(null); // For local preview
    const [uploadingState, setUploadingState] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
    const [uploadedMedia, setUploadedMedia] = useState<{ id: string; filename: string; contentType: string } | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [caption, setCaption] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
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

    const [channelFilter, setChannelFilter] = useState<string>('all'); // Filter state

    const loadConversations = async () => {
        try {

            const response = await fetch(`${BASE_URL}/conversations`, {
                headers: { 'X-API-Key': API_KEY }
            });



            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to load conversations:', response.status, errorText);
                setConversations([]);
                return;
            }

            const data = await response.json();


            const list: Conversation[] = Array.isArray(data) ? data : (data.data || []);


            // Initial render
            setConversations(list);

            // Hydrate with details for preview (async)
            const enriched = await Promise.all(list.map(async (conv) => {
                try {
                    const detailRes = await fetch(`${BASE_URL}/conversations/${conv.id}/details`, {
                        headers: { 'X-API-Key': API_KEY }
                    });

                    if (!detailRes.ok) {
                        console.warn(`Failed to load details for conversation ${conv.id}`);
                        return conv;
                    }

                    const detail = await detailRes.json();

                    const msgs = Array.isArray(detail.messages) ? detail.messages : (detail.messages?.data || []);
                    const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;

                    const participants = detail.participants || [];
                    // Prefer showing name of the non-assistant participant (The Customer/User)
                    const customer = participants.find((p: any) => p.external_type !== 'assistant') || participants[0];
                    const name = customer?.name || 'Unknown User';

                    return {
                        ...conv,
                        preview: lastMsg ? lastMsg.body : 'No messages',
                        participantName: name,
                        last_message_at: lastMsg ? lastMsg.created_at : conv.last_message_at,
                        channel: customer?.external_type || 'web' // Extract channel
                    };
                } catch (e) {
                    console.error('Error enriching conversation:', conv.id, e);
                    return conv;
                }
            }));

            // Sort by message date descending
            // Sort by message date descending (fallback to created_at for new chats)
            enriched.sort((a, b) => {
                const getSortTime = (c: Conversation) => {
                    if (c.last_message_at) return new Date(c.last_message_at).getTime();
                    if (c.created_at) return new Date(c.created_at).getTime();
                    return 0;
                };
                return getSortTime(b) - getSortTime(a);
            });


            setConversations(enriched);
        } catch (error) {
            console.error('Failed to load conversations:', error);
            setConversations([]);
        }
    };

    useEffect(() => {
        loadConversations();

        // Restore active conversation if present
        const savedConvId = localStorage.getItem('activeConversationId');
        if (savedConvId) {

            loadConversation(savedConvId);
        }
    }, []);

    const identifyParticipants = (participants: Customer[]) => {
        if (!participants || participants.length === 0) return { customer: null, bot: null };

        // 1. Find Bot
        let bot = participants.find(p => p.external_type === 'assistant');
        if (!bot) bot = participants.find(p => p.name?.toLowerCase().includes('assistant') || p.name?.toLowerCase().includes('bot') || p.name?.toLowerCase().includes('ai'));

        // 2. Find Customer (The one who is NOT the bot)
        let customer;
        if (bot) {
            customer = participants.find(p => p.id !== bot?.id);
        } else {
            // Heuristics if bot not explicitly marked
            customer = participants.find(p => p.name === 'You');
            if (!customer) {
                // heuristic: The one with 'web' or 'whatsapp' type is likely the user
                customer = participants.find(p => p.external_type === 'web' || p.external_type === 'whatsapp');
            }

            // Fallback: If we have 2 participants and identifying one fails, assume strict ordering or assignment
            if (!customer && participants.length > 0) customer = participants[0];
            if (!bot && participants.length > 1) bot = participants[1];
        }

        // Safety: ensure they are different if possible
        if (customer?.id === bot?.id && participants.length > 1) {
            bot = participants.find(p => p.id !== customer?.id);
        }

        return { customer: customer || null, bot: bot || null };
    };

    const loadConversation = async (convId: string) => {
        try {
            setIsLoading(true);
            const response = await fetch(`${BASE_URL}/conversations/${convId}/details`, {
                headers: { 'X-API-Key': API_KEY }
            });

            if (!response.ok) {
                console.error('Failed to fetch conversation details');
                localStorage.removeItem('activeConversationId');
                setIsLoading(false);
                return;
            }

            const convData = await response.json();


            // Save to local storage for persistence on reload
            localStorage.setItem('activeConversationId', convId);

            const msgs = convData.messages;
            let messageList = Array.isArray(msgs) ? msgs : (msgs?.data || []);

            // Enrich messages with sender names from participants for robust alignment
            if (convData.participants) {
                const nameMap = new Map<string, string>();
                convData.participants.forEach((p: any) => {
                    if (p.customer_id) nameMap.set(p.customer_id, p.name);
                    if (p.id) nameMap.set(p.id, p.name);
                });

                messageList = messageList.map((m: any) => ({
                    ...m,
                    sender_name: m.sender_name || nameMap.get(m.sender_customer_id) || (m.sender_customer_id === botCustomer?.id ? 'AI Assistant' : '')
                }));
            }

            setMessages(messageList);

            if (convData.participants) {
                const { customer, bot } = identifyParticipants(convData.participants);


                if (customer) setCurrentCustomer(customer);
                if (bot) setBotCustomer(bot);

                setConversation({
                    ...convData,
                    participants: [customer, bot].filter(Boolean) as Customer[]
                });
            } else {
                setConversation(convData);
            }

        } catch (error) {
            console.error('Failed to load conversation:', error);
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    };

    const initializeChat = async () => {
        setIsLoading(true);
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
            localStorage.setItem('activeConversationId', conv.id);

            await sendBotMessage(conv.id, bot.id, "Hello! I'm your AI assistant. How can I help you today?");

            // Reload conversations list to show the new conversation

            await loadConversations();
        } catch (error) {
            console.error('Failed to initialize chat:', error);
        } finally {
            setIsLoading(false);
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


            // Ensure body is preserved
            const messageWithBody = {
                ...message,
                body: message.body || messageText, // Use original text if body is missing
                sender_name: 'AI Assistant'
            };

            setMessages(prev => [...prev, messageWithBody]);
        } catch (error) {
            console.error('Error sending bot message:', error);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || !conversation || !currentCustomer) return;

        const messagePayload = {
            conversation_id: conversation.id,
            direction: 'outbound' as const, // Fix literal type inference
            sender_customer_id: currentCustomer?.customer_id || currentCustomer?.id, // Prioritize customer_id
            body: input,
            media_id: undefined, // Standard message has no media
            content_type: 'text/plain',
            created_at: new Date().toISOString()
        };

        // Optimistic Update
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
            id: tempId,
            ...messagePayload,
            sender_name: 'You',
            is_processed: false
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setInput(''); // Clear input
        // Attachment handling is moved to sendAttachmentMessage


        try {
            const response = await fetch(`${BASE_URL}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': API_KEY,
                },
                body: JSON.stringify(messagePayload),
            });

            const message = await response.json();


            setMessages(prev => prev.map(msg =>
                msg.id === tempId ? { ...message, sender_name: 'You', is_processed: true } : msg
            ));

            // Simulate AI response after user message
            setIsLoading(true);
            setTimeout(async () => {
                const lowerMessage = (messagePayload.body || '').toLowerCase();
                let aiResponse = '';

                if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
                    const greetings = [
                        "Hello! How can I assist you today?",
                        "Hi there! What can I help you with?",
                        "Hey! I'm here to help. What do you need?",
                        "Hello! Great to hear from you. How may I assist?"
                    ];
                    aiResponse = greetings[Math.floor(Math.random() * greetings.length)];
                } else if (lowerMessage.includes('help') || lowerMessage.includes('assist')) {
                    const helpResponses = [
                        "I'm here to help! What would you like to know?",
                        "Of course! I can assist you with various things. What do you need help with?",
                        "I'd be happy to help! Please tell me more about what you're looking for.",
                        "Sure thing! How can I make your day easier?"
                    ];
                    aiResponse = helpResponses[Math.floor(Math.random() * helpResponses.length)];
                } else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
                    const thanksResponses = [
                        "You're welcome! Is there anything else I can help with?",
                        "Happy to help! Let me know if you need anything else.",
                        "My pleasure! Feel free to ask if you have more questions.",
                        "Glad I could help! Anything else on your mind?"
                    ];
                    aiResponse = thanksResponses[Math.floor(Math.random() * thanksResponses.length)];
                } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
                    const pricingResponses = [
                        "Our pricing varies depending on your specific needs. Could you tell me more about what you're looking for?",
                        "I'd be happy to discuss pricing! What features are you most interested in?",
                        "Great question! Pricing depends on several factors. What's your use case?",
                        "Let's talk about pricing! Can you share more details about your requirements?"
                    ];
                    aiResponse = pricingResponses[Math.floor(Math.random() * pricingResponses.length)];
                } else if (lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('?')) {
                    const questionResponses = [
                        "That's a great question! Let me help you with that.",
                        "I can definitely explain that. What specifically would you like to know?",
                        "Good question! I'm here to provide answers.",
                        "Let me help clarify that for you. What aspect interests you most?"
                    ];
                    aiResponse = questionResponses[Math.floor(Math.random() * questionResponses.length)];
                } else if (messagePayload.media_id) {
                    aiResponse = "Thanks for sharing the attachment! How can I help you with it?";
                }
                else {
                    const generalResponses = [
                        "I understand. Could you tell me more about that?",
                        "Interesting! What else would you like to share?",
                        "I see. How can I help you with this?",
                        "Got it! What would you like to know more about?",
                        "That makes sense. What's your main concern?",
                        "I'm listening. What else is on your mind?"
                    ];
                    aiResponse = generalResponses[Math.floor(Math.random() * generalResponses.length)];
                }

                await sendBotMessage(conversation.id, botCustomer!.id, aiResponse);
                setIsLoading(false);
            }, 1000);

        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => prev.map(msg =>
                msg.id === tempId ? { ...msg, is_error: true, body: 'Failed to send message.' } : msg
            ));
            setIsLoading(false);
        }
    };
    const handleFileSelect = (file: File) => {
        setDraftFile(file);
        setUploadingState('uploading');
        setCaption(''); // Reset caption

        // Generate local preview for images
        if (file.type.startsWith('image/')) {
            const objectUrl = URL.createObjectURL(file);
            setDraftPreview(objectUrl);
        } else {
            setDraftPreview(null);
        }

        // Start upload immediately
        const formData = new FormData();
        formData.append('file', file);
        formData.append('owner_service', 'ops-dashboard');

        fetch(`${BASE_URL}/media/upload`, {
            method: 'POST',
            headers: { 'X-API-Key': API_KEY },
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.id) {
                    setUploadedMedia({
                        id: data.id,
                        filename: data.filename,
                        contentType: data.content_type
                    });
                    setUploadingState('done');
                } else {
                    setUploadingState('error');
                }
            })
            .catch(() => setUploadingState('error'));
    };

    const cancelAttachment = () => {
        setDraftFile(null);
        setDraftPreview(null);
        setUploadedMedia(null);
        setUploadingState('idle');
        setCaption('');
    };

    const sendAttachmentMessage = async () => {
        if (!uploadedMedia || !conversation || !currentCustomer) return;

        const messagePayload = {
            conversation_id: conversation.id,
            direction: 'outbound' as const,
            sender_customer_id: currentCustomer.customer_id || currentCustomer.id,
            body: caption || '', // Caption is the body
            media_id: uploadedMedia.id,
            content_type: uploadedMedia.contentType,
            created_at: new Date().toISOString()
        };

        // Optimistic UI for Attachment
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: Message = {
            id: tempId,
            ...messagePayload,
            sender_name: 'You',
            is_processed: false,
            // Ensure these are explicitly set for the UI to render the attachment immediately
            media_id: uploadedMedia.id,
            content_type: uploadedMedia.contentType
        };

        setMessages(prev => [...prev, optimisticMessage]);
        cancelAttachment(); // Close modal immediately

        try {
            const response = await fetch(`${BASE_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
                body: JSON.stringify(messagePayload),
            });
            const message = await response.json();

            setMessages(prev => prev.map(msg =>
                msg.id === tempId ? { ...message, sender_name: 'You', is_processed: true } : msg
            ));

            // Simulate AI Response specific to attachment
            setIsLoading(true);
            setTimeout(async () => {
                await sendBotMessage(conversation.id, botCustomer!.id, "Received your file! Analyzing it now...");
                setIsLoading(false);
            }, 1000);

        } catch (error) {
            setMessages(prev => prev.map(msg =>
                msg.id === tempId ? { ...msg, is_error: true, body: 'Failed to send attachment.' } : msg
            ));
        }
    };

    const runSimulator = async (scenario: 'curious_shopper' | 'angry_customer') => {
        setIsLoading(true);
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
            setIsLoading(false);
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
                                <Button onClick={initializeChat} disabled={isLoading} className="!bg-white/20 !border-white/30 hover:!bg-white/30 !text-white backdrop-blur-sm">
                                    <Play size={16} /> Start Chat
                                </Button>
                            ) : (
                                <Button onClick={initializeChat} disabled={isLoading} className="!bg-white/20 !border-white/30 hover:!bg-white/30 !text-white backdrop-blur-sm">
                                    <RefreshCw size={16} /> New Chat
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Simulator */}
            {
                conversation && (
                    <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">🤖 Chat Simulator</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Click a scenario to generate AI-powered messages</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outlined" onClick={() => runSimulator('curious_shopper')} disabled={isLoading} className="!text-sm">
                                    <Bot size={14} /> Curious Shopper
                                </Button>
                                <Button variant="outlined" onClick={() => runSimulator('angry_customer')} disabled={isLoading} className="!text-sm">
                                    <Bot size={14} /> Angry Customer
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Main Chat Area */}
            <div className="grid grid-cols-12 gap-6">
                {/* Conversations Sidebar */}
                <div className="col-span-3">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 h-[600px] flex flex-col">
                        <div className="p-4 border-b border-gray-200 dark:border-slate-800 space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 dark:text-white">Conversations</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{conversations.length} total</p>
                            </div>

                            {/* Channel Filter */}
                            <select
                                value={channelFilter}
                                onChange={(e) => setChannelFilter(e.target.value)}
                                className="w-full p-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            >
                                <option value="all">All Channels</option>
                                <option value="web">Web Chat</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="email">Email</option>
                                <option value="sms">SMS</option>
                            </select>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {conversations.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">No conversations yet</div>
                            ) : (
                                conversations
                                    .filter(c => channelFilter === 'all' || c.channel === channelFilter)
                                    .map((conv) => (
                                        <button key={conv.id} onClick={() => loadConversation(conv.id)}
                                            className={`w-full p-4 text-left border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${conversation?.id === conv.id ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${conv.preview ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {conv.participantName || 'Conversation'}
                                                    </span>
                                                </div>
                                                {conv.last_message_at && (
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                        {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${conv.channel === 'whatsapp' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    conv.channel === 'email' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                        conv.channel === 'sms' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                            'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                                                    }`}>
                                                    {conv.channel}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate pl-4">
                                                {conv.preview || `ID: ${conv.id.substring(0, 8)}...`}
                                            </p>
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
                                    {messages.map((message, index) => {
                                        // Use direction as primary source of truth for alignment
                                        // Outbound = User (Right), Inbound = Bot/Others (Left)
                                        const isUser = message.direction === 'outbound' ||
                                            (message.direction !== 'inbound' && message.sender_name === 'You');

                                        const messageKey = message.id || `msg-${index}`;

                                        // Handle error messages
                                        if (message.is_error) {
                                            return (
                                                <div key={messageKey} className="flex justify-center my-4">
                                                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm border border-red-100">
                                                        <span>⚠️</span>
                                                        {message.body}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div
                                                key={messageKey}
                                                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-md ${isUser
                                                        ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-none'
                                                        : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-slate-700 rounded-bl-none'
                                                        }`}
                                                >
                                                    {!isUser && (
                                                        <div className="text-xs font-semibold mb-1 opacity-70 flex items-center gap-2">
                                                            {message.sender_name === 'AI Assistant' && <Bot size={12} />}
                                                            {message.sender_name}
                                                        </div>
                                                    )}

                                                    {/* Media Attachment */}
                                                    {message.media_id && (
                                                        <div className="mb-2">
                                                            {message.content_type?.startsWith('image/') ? (
                                                                <ChatImage mediaId={message.media_id} baseUrl={BASE_URL} />
                                                            ) : (
                                                                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600 max-w-sm">
                                                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                                                        <FileIcon size={24} />
                                                                    </div>
                                                                    <div className="overflow-hidden">
                                                                        <p className="font-medium text-sm truncate text-gray-900 dark:text-white">Attachment</p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{message.content_type?.split('/')[1] || 'FILE'}</p>
                                                                    </div>
                                                                    <a
                                                                        href={`${BASE_URL}/media/${message.media_id}/download`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="ml-auto p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                                    >
                                                                        <Paperclip size={18} />
                                                                    </a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <p className="whitespace-pre-wrap leading-relaxed">{message.body}</p>
                                                    <div className={`text-[10px] mt-2 flex items-center justify-end gap-1 ${isUser ? 'text-indigo-100' : 'text-gray-400'
                                                        }`}>
                                                        {new Date(message.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {isUser && (
                                                            <span>{message.is_processed ? '✓✓' : '✓'}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}{isLoading && (
                                        <div className="flex justify-start">
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-600 dark:bg-gray-700 flex items-center justify-center">
                                                    <Bot size={16} className="text-white" />
                                                </div>
                                                <div className="bg-gray-100 dark:bg-slate-800 rounded-lg px-4 py-2">
                                                    <Loader2 className="w-5 h-5 animate-spin text-gray-600 dark:text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Input Area */}
                        <div
                            className="p-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-xl relative"
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setIsDragOver(false);
                                const file = e.dataTransfer.files?.[0];
                                if (file) handleFileSelect(file);
                            }}
                        >
                            {isDragOver && (
                                <div className="absolute inset-0 bg-indigo-50/90 dark:bg-indigo-900/80 z-10 flex items-center justify-center border-2 border-dashed border-indigo-500 rounded-b-xl mx-2 mb-2">
                                    <div className="text-indigo-600 dark:text-indigo-300 font-medium flex flex-col items-center gap-2">
                                        <FileIcon size={32} />
                                        <span>Drop file here to send</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 items-end">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileSelect(file);
                                        // Reset input so same file can be selected again if needed
                                        e.target.value = '';
                                    }}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={!conversation}
                                    className="p-3 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors disabled:opacity-50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                                    title="Attach file"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Type your message..."
                                    disabled={!conversation}
                                    className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 max-h-32"
                                />
                                <button
                                    onClick={() => sendMessage()}
                                    disabled={!input.trim() || !conversation}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Send className="w-5 h-5" />
                                    <span className="hidden sm:inline">Send</span>
                                </button>
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
                </div>{/* Close col-span-9 */}
            </div>{/* Close grid */}

            {/* WhatsApp Style Attachment Preview Modal */}
            {
                draftFile && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <div className="bg-gray-100 dark:bg-slate-800 p-4 flex justify-between items-center text-gray-900 dark:text-white">
                                <h3 className="font-semibold">Send File</h3>
                                <button onClick={cancelAttachment} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Preview Area */}
                            <div className="flex-1 p-8 bg-gray-50 dark:bg-slate-950 flex items-center justify-center overflow-auto min-h-[300px]">
                                {draftFile.type.startsWith('image/') && draftPreview ? (
                                    <img src={draftPreview} alt="Preview" className="max-w-full max-h-[500px] rounded-lg shadow-lg object-contain" />
                                ) : (
                                    <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400 p-10 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
                                        <FileIcon size={64} className="text-indigo-500" />
                                        <div className="text-center">
                                            <p className="font-medium text-lg text-gray-900 dark:text-white">{draftFile.name}</p>
                                            <p className="text-sm">{(draftFile.size / 1024).toFixed(1)} KB • {draftFile.type || 'Unknown Type'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer / Input */}
                            <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
                                <div className="flex gap-2 items-center">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={caption}
                                            onChange={(e) => setCaption(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && uploadedMedia && sendAttachmentMessage()}
                                            placeholder="Add a caption..."
                                            autoFocus
                                            className="w-full bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-12"
                                        />
                                        {uploadingState === 'uploading' && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                                            </div>
                                        )}
                                        {uploadingState === 'done' && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                                                <Send size={20} className="rotate-45" />
                                                {/* Just an icon to show ready, button is separate */}
                                            </div>
                                        )}
                                        {uploadingState === 'error' && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500" title="Upload failed">
                                                <X size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={uploadingState === 'error' ? () => handleFileSelect(draftFile) : sendAttachmentMessage}
                                        disabled={uploadingState === 'uploading'}
                                        title={uploadingState === 'error' ? "Retry Upload" : "Send Message"}
                                        className={`p-4 rounded-full shadow-lg transition-all flex items-center gap-2 text-white ${uploadingState === 'error'
                                            ? 'bg-red-500 hover:bg-red-600 hover:scale-105 active:scale-95'
                                            : uploadingState === 'uploading'
                                                ? 'bg-indigo-400 cursor-wait'
                                                : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95'
                                            }`}
                                    >
                                        {uploadingState === 'uploading' ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : uploadingState === 'error' ? (
                                            <RefreshCw className="w-6 h-6" />
                                        ) : (
                                            <Send size={24} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

        </DashboardLayout >
    );
};

function ChatImage({ mediaId, alt, baseUrl }: { mediaId: string; alt?: string; baseUrl: string }) {
    const [src, setSrc] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!mediaId) return;
        fetch(`${baseUrl}/media/${mediaId}/download`, {
            headers: { 'X-API-Key': 'kobliat-secret-key' }
        })
            .then(res => res.json())
            .then(data => {
                if (data.download_url) setSrc(data.download_url);
                else setError(true);
            })
            .catch(() => setError(true));
    }, [mediaId, baseUrl]);

    if (error) return <div className="text-xs text-red-400 flex items-center gap-1"><X size={12} /> Failed to load image</div>;
    if (!src) return <div className="w-48 h-32 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-lg" />;

    return (
        <img
            src={src}
            alt={alt || "Attachment"}
            className="max-w-full rounded-lg mt-2 cursor-pointer hover:opacity-95 transition-opacity max-h-[300px] object-cover"
            onClick={() => window.open(src, '_blank')}
        />
    );
}

export default Chat;
