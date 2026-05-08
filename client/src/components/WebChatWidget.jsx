import React, { useState, useEffect, useRef } from 'react';
import { getPreferredApiBase } from '../api';

const G = '#6366F1';
const GH = '#818CF8';
const GD = '#6366F118';
const GB = '#6366F138';

const WebChatWidget = ({ tenantId = 'demo-tenant', apiUrl = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: '¡Bienvenido a la nueva era! Soy el demo bot de ALEX IO. Estoy aquí para demostrarte cómo puedo automatizar tus ventas, calificar leads 24/7 y reducir tus costos operativos. ¿Qué desafío de comunicación quieres resolver hoy?', sender: 'bot' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    
    // Generar un ID de sesión/usuario único para la prueba
    const senderId = useRef(`web_user_${Math.random().toString(36).substr(2, 9)}`);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        const handleOpenChat = () => setIsOpen(true);
        window.addEventListener('open-alex-chat', handleOpenChat);
        return () => window.removeEventListener('open-alex-chat', handleOpenChat);
    }, []);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMsg = { id: Date.now(), text: inputText, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            const baseUrl = apiUrl || getPreferredApiBase() || window.location.origin;
            const targetUrl = `${baseUrl.replace(/\/$/, '')}/api/webhooks/webchat`;
            
            console.log(`[WebChat] Sending message to: ${targetUrl}`);
            
            // Prepare history for AI context (Standardized format: { role, content })
            const chatHistory = [...messages, userMsg].map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            }));

            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: senderId.current,
                    text: userMsg.text,
                    history: chatHistory,
                    metadata: { tenantId, platform: 'web', source: 'widget_flotante' }
                })
            });

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const textDump = await response.text();
                throw new Error(`Error del Servidor: Esperaba JSON pero recibí: ${textDump.substring(0, 100)}...`);
            }

            const data = await response.json();

            // Accept reply from both success AND error responses
            if (data && data.reply) {
                setMessages(prev => [...prev, { 
                    id: Date.now() + 1, 
                    text: data.reply,
                    sender: 'bot' 
                }]);
            } else {
                throw new Error('Respuesta inválida del servidor');
            }
        } catch (error) {
            console.error('Error enviando mensaje al bot:', error);
            setMessages(prev => [...prev, { 
                id: Date.now() + 1, 
                text: 'Temporalmente fuera de línea. Por favor, intenta de nuevo en unos instantes.', 
                sender: 'bot', 
                isError: true 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
                @keyframes alex-pulse {
                    0% { box-shadow: 0 0 0 0 ${GB}; }
                    70% { box-shadow: 0 0 0 15px rgba(99, 102, 241, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
                }
                .alex-bubble-bot { background: #1A1F28; border-radius: 4px 16px 16px 16px; padding: 10px 14px; font-size: 14px; color: #E5E7EB; line-height: 1.5; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                .alex-bubble-user { background: ${G}; border-radius: 16px 4px 16px 16px; padding: 10px 14px; font-size: 14px; color: #FFFFFF; line-height: 1.5; margin-left: auto; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            `}</style>
            
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    style={{
                        backgroundColor: G, 
                        color: '#FFFFFF', 
                        border: 'none',
                        borderRadius: '50%',
                        width: '60px', 
                        height: '60px',
                        boxShadow: `0 4px 15px ${GB}`,
                        cursor: 'pointer',
                        fontSize: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'alex-pulse 2s infinite'
                    }}
                >
                    💬
                </button>
            )}

            {isOpen && (
                <div style={{
                    width: '360px',
                    height: '520px',
                    backgroundColor: '#07090C',
                    borderRadius: '20px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: `1px solid #1E2530`
                }}>
                    {/* Header */}
                    <div style={{
                        background: '#0D1117',
                        color: 'white',
                        padding: '18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: `1px solid #1E2530`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: G }}></div>
                            <span style={{ fontWeight: '600', fontSize: '15px' }}>ALEX IO — Cognitivo</span>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '20px' }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1,
                        padding: '20px',
                        overflowY: 'auto',
                        backgroundColor: '#07090C',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        {messages.map(msg => (
                            <div key={msg.id} style={{ display: 'flex', width: '100%' }}>
                                <div className={msg.sender === 'user' ? 'alex-bubble-user' : 'alex-bubble-bot'} style={msg.isError ? { border: '1px solid #EF4444', color: '#EF4444' } : {}}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{ alignSelf: 'flex-start', color: '#6B7280', fontSize: '12px', paddingLeft: '5px' }}>
                                ALEX está pensando...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} style={{
                        display: 'flex',
                        padding: '15px',
                        backgroundColor: '#0D1117',
                        borderTop: '1px solid #1E2530',
                        gap: '10px'
                    }}>
                        <input 
                            type="text" 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Escribe un mensaje..."
                            style={{
                                flex: 1,
                                padding: '10px 16px',
                                borderRadius: '10px',
                                border: '1px solid #2A2F38',
                                backgroundColor: '#1A1F28',
                                color: 'white',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                            disabled={isLoading}
                        />
                        <button 
                            type="submit"
                            disabled={isLoading || !inputText.trim()}
                            style={{
                                backgroundColor: inputText.trim() && !isLoading ? G : '#1E2530',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '0 15px',
                                cursor: inputText.trim() && !isLoading ? 'pointer' : 'default',
                                fontWeight: 'bold'
                            }}
                        >
                            →
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default WebChatWidget;
