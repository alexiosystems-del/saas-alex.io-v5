import React, { useState, useEffect, useRef } from 'react';
import { getPreferredApiBase } from '../api';

const G = '#6366F1';
const GH = '#818CF8';
const GD = '#6366F118';
const GB = '#6366F138';

const BACKEND_URL = (() => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && !envUrl.includes('supabase.co')) return envUrl.replace(/\/$/, '');
    return 'https://whatsapp-fullstack-ylsx.onrender.com';
})();

const INITIAL_MESSAGE = `👋 Hola, soy ALEX IO.

Ayudo a empresas a responder clientes, automatizar conversaciones y recuperar ventas automáticamente — 24/7.

Diseñado para que ninguna conversación importante se pierda.

Antes de mostrarte cómo funciona…

¿cuál es hoy el mayor problema que tienes con tus clientes o conversaciones?`;

const WebChatWidget = ({ tenantId = 'demo-tenant', apiUrl = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: INITIAL_MESSAGE, sender: 'bot' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioPlayerRef = useRef(null);

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

    const getApiBase = () => {
        return apiUrl || getPreferredApiBase() || BACKEND_URL;
    };

    const buildHistory = (currentMessages, newUserMsg = null) => {
        const allMsgs = newUserMsg ? [...currentMessages, newUserMsg] : currentMessages;
        return allMsgs.map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
        }));
    };

    const sendMessageToBackend = async (text, currentMessages) => {
        const baseUrl = getApiBase();
        const targetUrl = `${baseUrl.replace(/\/$/, '')}/api/webhooks/webchat`;

        const userMsg = { id: Date.now(), text, sender: 'user' };
        const chatHistory = buildHistory(currentMessages, userMsg);

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
        if (data && data.reply) {
            return data.reply;
        }
        throw new Error('Respuesta inválida del servidor');
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMsg = { id: Date.now(), text: inputText, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        const currentMessages = [...messages, userMsg];
        setInputText('');
        setIsLoading(true);

        try {
            const reply = await sendMessageToBackend(inputText, messages);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: reply,
                sender: 'bot'
            }]);
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

    // --- VOICE INPUT ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                if (audioBlob.size < 1000) {
                    console.warn('[Voice] Audio too short, ignoring.');
                    return;
                }

                setIsLoading(true);
                const voiceUserMsg = { id: Date.now(), text: '🎤 Mensaje de voz enviado...', sender: 'user', isVoice: true };
                setMessages(prev => [...prev, voiceUserMsg]);

                try {
                    // Transcribe via backend (Whisper)
                    const baseUrl = getApiBase();
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'voice_input.webm');
                    formData.append('senderId', senderId.current);
                    formData.append('tenantId', tenantId);
                    formData.append('history', JSON.stringify(buildHistory(messages)));

                    const transcribeRes = await fetch(`${baseUrl}/api/webhooks/webchat/voice`, {
                        method: 'POST',
                        body: formData
                    });

                    if (!transcribeRes.ok) {
                        // Fallback: send as text indication
                        const reply = await sendMessageToBackend('(El usuario envió un mensaje de voz)', messages);
                        setMessages(prev => [...prev, { id: Date.now() + 1, text: reply, sender: 'bot' }]);
                        return;
                    }

                    const voiceData = await transcribeRes.json();

                    if (voiceData.transcription) {
                        // Update user message with transcription
                        setMessages(prev => prev.map(m =>
                            m.id === voiceUserMsg.id
                                ? { ...m, text: `🎤 "${voiceData.transcription}"` }
                                : m
                        ));
                    }

                    if (voiceData.reply) {
                        const botReply = { id: Date.now() + 1, text: voiceData.reply, sender: 'bot' };
                        setMessages(prev => [...prev, botReply]);

                        // Play TTS audio if available
                        if (voiceData.audioUrl) {
                            playAudioResponse(voiceData.audioUrl);
                        }
                    }
                } catch (err) {
                    console.error('[Voice] Error processing voice:', err);
                    setMessages(prev => [...prev, {
                        id: Date.now() + 1,
                        text: 'No pude procesar tu mensaje de voz. Intenta escribir tu mensaje.',
                        sender: 'bot',
                        isError: true
                    }]);
                } finally {
                    setIsLoading(false);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('[Voice] Microphone access denied:', err);
            alert('No se pudo acceder al micrófono. Verifica los permisos de tu navegador.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const playAudioResponse = (audioUrl) => {
        try {
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
            }
            const audio = new Audio(audioUrl);
            audioPlayerRef.current = audio;
            setIsPlayingAudio(true);
            audio.onended = () => setIsPlayingAudio(false);
            audio.onerror = () => setIsPlayingAudio(false);
            audio.play().catch(() => setIsPlayingAudio(false));
        } catch (err) {
            console.error('[Voice] Audio playback error:', err);
            setIsPlayingAudio(false);
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
                @keyframes alex-recording {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
                }
                .alex-bubble-bot { background: #1A1F28; border-radius: 4px 16px 16px 16px; padding: 10px 14px; font-size: 14px; color: #E5E7EB; line-height: 1.6; box-shadow: 0 2px 5px rgba(0,0,0,0.1); white-space: pre-line; max-width: 85%; }
                .alex-bubble-user { background: ${G}; border-radius: 16px 4px 16px 16px; padding: 10px 14px; font-size: 14px; color: #FFFFFF; line-height: 1.5; margin-left: auto; box-shadow: 0 2px 5px rgba(0,0,0,0.1); max-width: 85%; }
                .alex-bubble-voice { opacity: 0.85; font-style: italic; }
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
                    width: '380px',
                    height: '560px',
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
                        padding: '16px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: `1px solid #1E2530`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '10px', height: '10px', borderRadius: '50%',
                                backgroundColor: isPlayingAudio ? '#EF4444' : '#22C55E',
                                animation: isPlayingAudio ? 'alex-recording 1s infinite' : 'none'
                            }}></div>
                            <div>
                                <span style={{ fontWeight: '600', fontSize: '14px', display: 'block' }}>ALEX IO</span>
                                <span style={{ fontSize: '10px', color: '#6B7280', letterSpacing: '0.5px' }}>Infraestructura Cognitiva</span>
                            </div>
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
                        padding: '16px',
                        overflowY: 'auto',
                        backgroundColor: '#07090C',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        {messages.map(msg => (
                            <div key={msg.id} style={{ display: 'flex', width: '100%' }}>
                                <div
                                    className={`${msg.sender === 'user' ? 'alex-bubble-user' : 'alex-bubble-bot'} ${msg.isVoice ? 'alex-bubble-voice' : ''}`}
                                    style={msg.isError ? { border: '1px solid #EF4444', color: '#EF4444' } : {}}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{ alignSelf: 'flex-start', color: '#6B7280', fontSize: '12px', paddingLeft: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: G, animation: 'alex-pulse 1s infinite' }}></span>
                                ALEX está pensando...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} style={{
                        display: 'flex',
                        padding: '12px 15px',
                        backgroundColor: '#0D1117',
                        borderTop: '1px solid #1E2530',
                        gap: '8px',
                        alignItems: 'center'
                    }}>
                        {/* Voice Button */}
                        <button
                            type="button"
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isLoading}
                            style={{
                                backgroundColor: isRecording ? '#EF4444' : '#1A1F28',
                                color: isRecording ? '#FFF' : '#6B7280',
                                border: isRecording ? '2px solid #EF4444' : '1px solid #2A2F38',
                                borderRadius: '10px',
                                width: '40px',
                                height: '40px',
                                cursor: isLoading ? 'default' : 'pointer',
                                fontSize: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all 0.2s ease',
                                animation: isRecording ? 'alex-recording 1.2s infinite' : 'none',
                                opacity: isLoading ? 0.5 : 1
                            }}
                            title={isRecording ? 'Detener grabación' : 'Enviar mensaje de voz'}
                        >
                            {isRecording ? '⏹' : '🎤'}
                        </button>

                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={isRecording ? 'Grabando...' : 'Escribe un mensaje...'}
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: '1px solid #2A2F38',
                                backgroundColor: '#1A1F28',
                                color: 'white',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                            disabled={isLoading || isRecording}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !inputText.trim() || isRecording}
                            style={{
                                backgroundColor: inputText.trim() && !isLoading && !isRecording ? G : '#1E2530',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '10px',
                                width: '40px',
                                height: '40px',
                                cursor: inputText.trim() && !isLoading && !isRecording ? 'pointer' : 'default',
                                fontWeight: 'bold',
                                flexShrink: 0,
                                fontSize: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            →
                        </button>
                    </form>

                    {/* Footer */}
                    <div style={{
                        padding: '6px 15px 8px',
                        backgroundColor: '#0D1117',
                        borderTop: '1px solid #0F1318',
                        textAlign: 'center'
                    }}>
                        <span style={{ fontSize: '9px', color: '#374151', letterSpacing: '1px' }}>
                            POWERED BY ALEX IO — NEURAL COMMAND CENTER
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WebChatWidget;
