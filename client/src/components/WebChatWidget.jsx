import React, { useState, useEffect, useRef } from 'react';

const G = '#D4A843';
const GH = '#E0BC6A';
const GD = '#D4A84318';
const GB = '#D4A84338';

const WebChatWidget = ({ tenantId = 'demo-tenant', apiUrl = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: '¡Hola! Soy ALEX. ¿En qué te puedo ayudar hoy? Estoy aquí para mostrarte cómo ALEX IO puede transformar tu negocio.', sender: 'bot' }
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

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMsg = { id: Date.now(), text: inputText, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            // Usamos FETCH para mayor compatibilidad y consistencia con LandingPage
            // Ignoramos apiUrl completamente porque el backend ahora reside fullstack 
            // en el mismo domain que el frontend. Esto evita errores CORS si
            // el usuario configura VITE_API_URL hacia Supabase accidentalmente.
            const targetUrl = '/api/webhooks/webchat';
            
            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: senderId.current,

                    text: userMsg.text,
                    metadata: { tenantId, platform: 'web', source: 'widget_flotante' }
                })
            });

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
                    70% { box-shadow: 0 0 0 15px rgba(212, 168, 67, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(212, 168, 67, 0); }
                }
                .alex-bubble-bot { background: #1A1F28; border-radius: 4px 16px 16px 16px; padding: 10px 14px; font-size: 14px; color: #E5E7EB; line-height: 1.5; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                .alex-bubble-user { background: ${G}; border-radius: 16px 4px 16px 16px; padding: 10px 14px; font-size: 14px; color: #07090C; line-height: 1.5; margin-left: auto; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            `}</style>
            
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    style={{
                        backgroundColor: G, 
                        color: '#07090C', 
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
                                color: '#07090C',
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
