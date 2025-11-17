import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Messages.css";

const API_BASE_URL = "http://78.72.148.32:8080";

function MessageThread() {
    const { threadId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [userCache, setUserCache] = useState({}); // Cache sender names to avoid repeated fetches

    // Helper: fetch sender name by ID, or use cache
    const getSenderName = async (senderId) => {
        if (senderId === user.id) return user.fullName;
        if (userCache[senderId]) return userCache[senderId];

        try {
            const res = await fetch(`${API_BASE_URL}/users/${senderId}`);
            if (!res.ok) throw new Error("User not found");
            const data = await res.json();
            setUserCache(prev => ({ ...prev, [senderId]: data.fullName }));
            return data.fullName;
        } catch {
            return "Unknown";
        }
    };

    // Fetch messages
    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/messages/session/${threadId}`);
                if (!res.ok) throw new Error("Failed to fetch messages");
                let data = await res.json();

                // Sort descending by date
                data.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

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

    // Send new message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const dto = {
            sessionId: threadId,
            senderId: user.id,
            message: newMessage
        };

        try {
            const res = await fetch(`${API_BASE_URL}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dto)
            });

            if (!res.ok) throw new Error("Failed to send message");

            const savedMessage = await res.json();
            savedMessage.senderName = user.fullName;

            setMessages(prev => [savedMessage, ...prev]);
            setNewMessage("");
        } catch (err) {
            alert(err.message);
        }
    };

    // Delete message
    const handleDelete = async (messageId) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;

        try {
            const res = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
                method: "DELETE"
            });

            if (!res.ok) throw new Error("Failed to delete message");

            setMessages(prev => prev.filter(msg => msg.messageId !== messageId));
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <p className="loading">Loading messages...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="messages-container">
            {/* Taskbar */}
            <div className="taskbar">
                <button onClick={() => {
                    switch(user.userType) {
                        case "Patient":
                            navigate("/patient/me");
                            break;
                        case "Doctor":
                            navigate("/doctor/patients");
                            break;
                        case "OtherStaff":
                            navigate("/doctor/messages");
                            break;
                        default:
                            navigate("/");
                    }
                }}>
                    Back
                </button>
            </div>

            <h2>Message Thread</h2>

            <table>
                <thead>
                <tr>
                    <th>Sender</th>
                    <th>Message</th>
                    <th>Date</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {messages.map(msg => (
                    <tr key={msg.messageId}>
                        <td>{msg.senderName}</td>
                        <td>{msg.message}</td>
                        <td>{new Date(msg.dateTime).toLocaleString()}</td>
                        <td style={{ textAlign: "right" }}>
                            {msg.senderId === user.id && (
                                <span
                                    style={{
                                        cursor: "pointer",
                                        color: "#888",
                                        fontWeight: "bold",
                                        padding: "2px 6px",
                                        borderRadius: "4px"
                                    }}
                                    onClick={() => handleDelete(msg.messageId)}
                                    title="Delete message"
                                >
                                        ✕
                                    </span>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* New message form */}
            <form onSubmit={handleSendMessage} style={{ marginTop: "15px" }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    style={{ width: "80%", padding: "8px", marginRight: "10px", borderRadius: "6px", border: "1px solid #dcdcff" }}
                />
                <button type="submit" style={{ padding: "8px 16px", borderRadius: "6px" }}>
                    Send
                </button>
            </form>
        </div>
    );
}

export default MessageThread;
