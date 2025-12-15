import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import "./Messages.css";
import { useApi } from "../utils/Api";

const API_USERMANAGER_URL = process.env.REACT_APP_API_USERMANAGER_URL;
const API_MESSAGESERVICE_URL = process.env.REACT_APP_API_MESSAGESERVICE_URL;

function MessageThread() {
    const { threadId } = useParams();
    const navigate = useNavigate();
    const auth = useAuth();
    const { request } = useApi();

    const userId = auth.user?.profile?.sub;
    const userName = auth.user?.profile?.name || "Me";

    const roles = auth.user?.profile?.realm_access?.roles || [];
    const isDoctor = roles.includes("doctor") || roles.includes("Doctor");
    const isPatient = roles.includes("patient") || roles.includes("Patient");

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [userCache, setUserCache] = useState({});

    const threadEndRef = useRef(null);

    const getSenderName = useCallback(async (senderId, currentCache) => {
        if (senderId === userId) return userName;
        if (currentCache[senderId]) return currentCache[senderId];

        try {
            const res = await request(`${API_USERMANAGER_URL}/users/${senderId}`);
            if (res.ok) {
                const data = await res.json();
                return data.fullName;
            }
            return "Unknown";
        } catch {
            return "Unknown";
        }
    }, [request, userId, userName]);

    useEffect(() => {
        if (!userId || !auth.isAuthenticated) return;

        const fetchMessages = async () => {
            setLoading(true);
            try {
                const res = await request(`${API_MESSAGESERVICE_URL}/messages/session/${threadId}`);
                if (!res.ok) throw new Error("Failed to load messages");

                let data = await res.json();

                data.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

                const uniqueSenders = [...new Set(data.map(m => m.senderId))];
                const newCache = { ...userCache };

                await Promise.all(uniqueSenders.map(async (sid) => {
                    if (sid !== userId && !newCache[sid]) {
                        newCache[sid] = await getSenderName(sid, newCache);
                    }
                }));

                setUserCache(newCache);

                const messagesWithNames = data.map(msg => ({
                    ...msg,
                    senderName: msg.senderId === userId ? userName : (newCache[msg.senderId] || "Unknown")
                }));

                setMessages(messagesWithNames);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

    }, [threadId, userId, auth.isAuthenticated]);

    useEffect(() => {
        threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const dto = {
            sessionId: threadId,
            senderId: userId,
            message: newMessage
        };

        try {
            const res = await request(`${API_MESSAGESERVICE_URL}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dto)
            });

            if (!res.ok) throw new Error("Failed to send message");

            const savedMessage = await res.json();
            savedMessage.senderName = userName;

            setMessages(prev => [...prev, savedMessage]);
            setNewMessage("");
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (messageId) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        try {
            const res = await request(`${API_MESSAGESERVICE_URL}/messages/${messageId}`, { method: "DELETE" });
            if (res.ok) {
                setMessages(prev => prev.filter(msg => msg.messageId !== messageId));
            } else {
                throw new Error("Could not delete message");
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleBack = () => {
        navigate("/messages");
    };

    if (auth.isLoading) return <p className="loading">Loading conversation...</p>;
    if (!auth.isAuthenticated) return <p className="error-message">Access denied.</p>;
    if (loading) return <p className="loading">Loading messages...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="messages-container">
            <div className="taskbar">
                <button onClick={handleBack}>
                    Back to Inbox
                </button>
            </div>

            <h2>Conversation</h2>

            <div className="message-thread">
                {messages.length === 0 ? (
                    <p style={{textAlign: "center", color: "#888"}}>No messages yet. Start the conversation!</p>
                ) : (
                    messages.map(msg => (
                        <div key={msg.messageId} className={`message ${msg.senderId === userId ? "mine" : "theirs"}`}>
                            <strong>{msg.senderName}</strong>
                            <div>{msg.message}</div>
                            <div className="message-time">{new Date(msg.dateTime).toLocaleString()}</div>

                            {/* Radera-knapp (endast för egna meddelanden) */}
                            {msg.senderId === userId && (
                                <span
                                    className="delete-msg-btn"
                                    onClick={() => handleDelete(msg.messageId)}
                                    title="Delete message"
                                    style={{ cursor: "pointer", marginLeft: "10px", color: "#ff4444", fontWeight: "bold" }}
                                >✕</span>
                            )}
                        </div>
                    ))
                )}
                <div ref={threadEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-input-area" style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    autoFocus
                    style={{ flex: 1, padding: "12px", borderRadius: "6px", border: "1px solid #ccc" }}
                />
                <button type="submit" disabled={!newMessage.trim()} style={{ padding: "8px 24px", borderRadius: "6px" }}>
                    Send
                </button>
            </form>
        </div>
    );
}

export default MessageThread;
