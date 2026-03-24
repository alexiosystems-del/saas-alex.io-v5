import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Componente de prueba para chatear con el bot a través del nuevo Webhook
const WebChatWidget = ({ tenantId = 'demo-tenant', apiUrl = 'http://localhost:3000' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: '¡Hola! Soy ALEX. ¿En qué te puedo ayudar hoy?', sender: 'bot' }
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
            // Enviamos el mensaje al endpoint síncrono del Web Chat
            const response = await axios.post(`${apiUrl}/api/webhooks/webchat`, {
                senderId: senderId.current,
                text: userMsg.text,
                metadata: { tenantId }
            });

            // Añadimos la respuesta real de la IA al chat
            if (response.data && response.data.reply) {
                setMessages(prev => [...prev, { 
                    id: Date.now() + 1, 
                    text: response.data.reply,
                    sender: 'bot' 
                }]);
            }
            setIsLoading(false);

        } catch (error) {
            console.error('Error enviando mensaje al bot:', error);
            setMessages(prev => [...prev, { 
                id: Date.now() + 1, 
                text: 'Error de conexión con el servidor.', 
                sender: 'bot', 
                isError: true 
            }]);
            setIsLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, fontFamily: 'sans-serif' }}>
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    style={{
                        backgroundColor: '#25D366', 
                        color: 'white', 
                        border: 'none',
                        borderRadius: '50%',
                        width: '60px', 
                        height: '60px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        cursor: 'pointer',
                        fontSize: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    💬
                </button>
            )}

            {isOpen && (
                <div style={{
                    width: '350px',
                    height: '500px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 5px 25px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{
                        backgroundColor: '#25D366',
                        color: 'white',
                        padding: '15px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: 'bold'
                    }}>
                        <span>ALEX IO - WebChat</span>
                        <button 
                            onClick={() => setIsOpen(false)}
                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1,
                        padding: '15px',
                        overflowY: 'auto',
                        backgroundColor: '#f5f7f6',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        {messages.map(msg => (
                            <div key={msg.id} style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                backgroundColor: msg.sender === 'user' ? '#dcf8c6' : 'white',
                                color: msg.isError ? 'red' : '#333',
                                padding: '10px 15px',
                                borderRadius: '15px',
                                maxWidth: '80%',
                                wordBreak: 'break-word',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}>
                                {msg.text}
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{ alignSelf: 'flex-start', backgroundColor: 'white', padding: '10px 15px', borderRadius: '15px' }}>
                                <span className="typing-indicator">Escribiendo...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} style={{
                        display: 'flex',
                        padding: '10px',
                        backgroundColor: '#eee',
                        borderTop: '1px solid #ddd'
                    }}>
                        <input 
                            type="text" 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Escribe un mensaje..."
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '20px',
                                border: '1px solid #ccc',
                                outline: 'none'
                            }}
                            disabled={isLoading}
                        />
                        <button 
                            type="submit"
                            disabled={isLoading || !inputText.trim()}
                            style={{
                                marginLeft: '10px',
                                backgroundColor: inputText.trim() && !isLoading ? '#25D366' : '#aaa',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                cursor: inputText.trim() && !isLoading ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ➤
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default WebChatWidget;
