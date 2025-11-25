import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Messages.css";

const API_USERMANAGER_URL = process.env.REACT_APP_API_USERMANAGER_URL;
const API_MESSAGESERVICE_URL = process.env.REACT_APP_API_MESSAGESERVICE_URL

function MessageThread() {
    const { threadId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [userCache, setUserCache] = useState({});
    const threadEndRef = useRef(null);

    const getSenderName = async (senderId) => {
        if (senderId === user.id) return user.fullName;
        if (userCache[senderId]) return userCache[senderId];

        try {
            const res = await fetch(`${API_USERMANAGER_URL}/users/${senderId}`);
            const data = await res.json();
            setUserCache(prev => ({ ...prev, [senderId]: data.fullName }));
            return data.fullName;
        } catch {
            return "Unknown";
        }
    };

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_MESSAGESERVICE_URL}/messages/session/${threadId}`);
                let data = await res.json();

                // Sort ascending for newest at bottom
                data.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

                // Resolve sender names
                for (let msg of data) {
                    msg.senderName = await getSenderName(msg.senderId);
                }

                setMessages(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [threadId]);

    useEffect(() => {
        threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const dto = { sessionId: threadId, senderId: user.id, message: newMessage };

        try {
            const res = await fetch(`${API_MESSAGESERVICE_URL}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dto)
            });

            const savedMessage = await res.json();
            savedMessage.senderName = user.fullName;

            setMessages(prev => [...prev, savedMessage]); // append at bottom
            setNewMessage("");
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (messageId) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        try {
            await fetch(`${API_MESSAGESERVICE_URL}/messages/${messageId}`, { method: "DELETE" });
            setMessages(prev => prev.filter(msg => msg.messageId !== messageId));
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <p className="loading">Loading messages...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="messages-container">
            <div className="taskbar">
                <button onClick={() => {
                    switch(user.userType) {
                        case "Patient": navigate("/patient/me"); break;
                        case "Doctor": navigate("/doctor/messages"); break;
                        case "OtherStaff": navigate("/doctor/messages"); break;
                        default: navigate("/");
                    }
                }}>Back</button>
            </div>

            <h2>Message Thread</h2>

            <div className="message-thread">
                {messages.map(msg => (
                    <div key={msg.messageId} className={`message ${msg.senderId === user.id ? "mine" : "theirs"}`}>
                        <strong>{msg.senderName}</strong>
                        <div>{msg.message}</div>
                        <div className="message-time">{new Date(msg.dateTime).toLocaleString()}</div>
                        {msg.senderId === user.id && (
                            <span
                                style={{ cursor: "pointer", color: "#888", fontWeight: "bold", padding: "2px 6px", borderRadius: "4px" }}
                                onClick={() => handleDelete(msg.messageId)}
                                title="Delete message"
                            >✕</span>
                        )}
                    </div>
                ))}
                <div ref={threadEndRef} />
            </div>

            <form onSubmit={handleSendMessage} style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #dcdcff" }}
                />
                <button type="submit" style={{ padding: "8px 16px", borderRadius: "6px" }}>Send</button>
            </form>
        </div>
    );
}

export default MessageThread;
