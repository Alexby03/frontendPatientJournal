import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Messages.css";

const API_BASE_URL = "http://78.72.148.32:8080";

function MessageInbox() {
    const [sessions, setSessions] = useState([]);
    const [latestMessages, setLatestMessages] = useState({});
    const [showNewForm, setShowNewForm] = useState(false);
    const [subject, setSubject] = useState("");
    const [receiverEmail, setReceiverEmail] = useState("");
    const [creating, setCreating] = useState(false);

    const navigate = useNavigate();
    const { user } = useAuth();

    // Fetch sessions for the current user
    useEffect(() => {
        async function fetchSessions() {
            try {
                const res = await fetch(`${API_BASE_URL}/sessions/user/${user.id}`);
                const data = await res.json();
                setSessions(data);

                // Fetch latest message for each session
                const latestMsgs = {};
                await Promise.all(
                    data.map(async (session) => {
                        try {
                            const msgRes = await fetch(`${API_BASE_URL}/messages/latest/session/${session.sessionId}`);
                            if (msgRes.ok) {
                                const msg = await msgRes.json();
                                latestMsgs[session.sessionId] = msg.message;
                            } else {
                                latestMsgs[session.sessionId] = "";
                            }
                        } catch {
                            latestMsgs[session.sessionId] = "";
                        }
                    })
                );
                setLatestMessages(latestMsgs);

            } catch (err) {
                console.error("Failed to fetch sessions", err);
            }
        }

        fetchSessions();
    }, [user.id]);

    // Create a new session
    const handleCreateSession = async (e) => {
        e.preventDefault();
        setCreating(true);

        try {
            // Get receiver by email
            const receiverRes = await fetch(`${API_BASE_URL}/users/email/${encodeURIComponent(receiverEmail)}`);
            if (!receiverRes.ok) throw new Error("Receiver not found");
            const receiver = await receiverRes.json();

            const sessionCreateDTO = {
                senderId: user.id,
                receiverId: receiver.id,
                subject: subject
            };

            const createRes = await fetch(`${API_BASE_URL}/sessions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sessionCreateDTO)
            });

            if (!createRes.ok) throw new Error("Failed to create session");

            const newSession = await createRes.json();
            setSessions(prev => [newSession, ...prev]);
            setLatestMessages(prev => ({ ...prev, [newSession.sessionId]: "" }));

            navigate(`/messages/${newSession.sessionId}`);
        } catch (err) {
            alert(err.message);
        } finally {
            setCreating(false);
            setShowNewForm(false);
            setSubject("");
            setReceiverEmail("");
        }
    };

    return (
        <div className="messages-container">
            {/* Taskbar */}
            <div className="taskbar">
                <button onClick={() => {
                    switch(user.userType) {
                        case "Patient": navigate("/patient/me"); break;
                        case "Doctor": navigate("/doctor/patients"); break;
                        case "OtherStaff": navigate("/doctor/patients"); break;
                        default: navigate("/");
                    }
                }}>
                    Back
                </button>

                <button onClick={() => setShowNewForm(!showNewForm)}>
                    {showNewForm ? "Cancel New Conversation" : "Start New Conversation"}
                </button>
            </div>

            <h2>My Conversations</h2>

            {/* Sessions Table */}
            <table>
                <thead>
                <tr>
                    <th>Subject</th>
                    <th>Created</th>
                    <th>Latest Message</th>
                </tr>
                </thead>
                <tbody>
                {sessions.map(session => (
                    <tr key={session.sessionId} style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/messages/${session.sessionId}`)}>
                        <td>{session.subject}</td>
                        <td>{new Date(session.creationDate).toLocaleString()}</td>
                        <td className="latest-message">{latestMessages[session.sessionId]}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* New session form */}
            {showNewForm && (
                <form onSubmit={handleCreateSession} style={{ marginTop: "15px" }}>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                        <input
                            type="text"
                            placeholder="Subject"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            required
                            style={{ flex: 2 }}
                        />
                        <input
                            type="email"
                            placeholder="Receiver Email"
                            value={receiverEmail}
                            onChange={e => setReceiverEmail(e.target.value)}
                            required
                            style={{ flex: 3 }}
                        />
                        <button type="submit" disabled={creating} style={{ flex: 1 }}>
                            {creating ? "Creating..." : "Create"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

export default MessageInbox;
