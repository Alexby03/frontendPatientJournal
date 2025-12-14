import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { useNotifications } from "../context/NotificationContext"; // Importera Context
import "./Messages.css";
import { useApi } from "../utils/Api";

const API_MESSAGESERVICE_URL = process.env.REACT_APP_API_MESSAGESERVICE_URL;
const API_USERMANAGER_URL = process.env.REACT_APP_API_USERMANAGER_URL;

function MessageInbox() {
    const navigate = useNavigate();
    const auth = useAuth();
    const { request } = useApi();

    // Hämta notification context
    const { hasNewMessages, clearNotifications } = useNotifications();

    // Hämta ID säkert
    const userId = auth.user?.profile?.sub;

    // Hämta roller för navigering
    const roles = auth.user?.profile?.realm_access?.roles || [];
    const isDoctor = roles.includes("doctor") || roles.includes("Doctor");
    const isStaff = roles.includes("OtherStaff") || roles.includes("otherstaff");
    const isPatient = roles.includes("patient") || roles.includes("Patient");

    const [sessions, setSessions] = useState([]);
    const [latestMessages, setLatestMessages] = useState({});
    const [unreadThreads, setUnreadThreads] = useState({});

    // UI States
    const [showNewForm, setShowNewForm] = useState(false);
    const [subject, setSubject] = useState("");
    const [receiverEmail, setReceiverEmail] = useState("");
    const [creating, setCreating] = useState(false);
    const [loading, setLoading] = useState(true);

    // Funktion för att hämta sessioner (utbruten för återanvändning)
    const fetchSessions = useCallback(async () => {
        if (!userId || !auth.isAuthenticated) return;

        // Sätt bara loading vid första laddningen, inte vid live-uppdatering
        if (sessions.length === 0) setLoading(true);

        try {
            const res = await request(`${API_MESSAGESERVICE_URL}/sessions/user/${userId}`);
            if (!res.ok) throw new Error("Could not fetch sessions");

            const data = await res.json();
            // Sortera så nyaste konversationen hamnar överst (om backend inte gör det)
            // data.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate));

            setSessions(data);

            const latestMsgs = {};
            const unread = {};

            await Promise.all(
                data.map(async (session) => {
                    try {
                        const msgRes = await request(`${API_MESSAGESERVICE_URL}/messages/latest/session/${session.sessionId}`);
                        if (msgRes.ok) {
                            const msg = await msgRes.json();
                            latestMsgs[session.sessionId] = msg.message;

                            const isMyMessage = msg.senderId === userId;
                            // Enkel logik: Om senaste meddelandet inte är från mig, och oläst -> Visa dot i trådlistan
                            unread[session.sessionId] = !msg.read && !isMyMessage;
                        } else {
                            latestMsgs[session.sessionId] = "No messages yet";
                            unread[session.sessionId] = false;
                        }
                    } catch {
                        latestMsgs[session.sessionId] = "Error loading";
                        unread[session.sessionId] = false;
                    }
                })
            );
            setLatestMessages(latestMsgs);
            setUnreadThreads(unread);

        } catch (err) {
            console.error("Failed to fetch sessions", err);
        } finally {
            setLoading(false);
        }
    }, [userId, auth.isAuthenticated, request]); // sessions.length tas bort för att undvika loop

    // 1. Initial Fetch & Clear Notifications
    useEffect(() => {
        fetchSessions();

        // När vi går in i inkorgen, släck huvud-notifikationen (pricken på Dashboard)
        clearNotifications();

    }, [fetchSessions, clearNotifications]);

    // 2. Live Update: Om hasNewMessages blir true (från WebSocket), hämta listan igen!
    useEffect(() => {
        if (hasNewMessages) {
            fetchSessions();
            // Vi rensar inte pricken här, för användaren kanske inte tittat på den nya tråden än.
            // Den släcks nästa gång man klickar på "Conversations" eller laddar om sidan.
        }
    }, [hasNewMessages, fetchSessions]);


    // 3. Create Session
    const handleCreateSession = async (e) => {
        e.preventDefault();
        if (!subject || !receiverEmail) return;

        setCreating(true);

        try {
            const receiverRes = await request(`${API_USERMANAGER_URL}/users/email/${encodeURIComponent(receiverEmail)}`);

            if (!receiverRes.ok) throw new Error("Receiver email not found in system.");
            const receiver = await receiverRes.json();

            const sessionCreateDTO = {
                senderId: userId,
                receiverId: receiver.id || receiver.practitionerId || receiver.patientId,
                subject: subject
            };

            const createRes = await request(`${API_MESSAGESERVICE_URL}/sessions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sessionCreateDTO)
            });

            if (!createRes.ok) throw new Error("Failed to create conversation.");

            const newSession = await createRes.json();

            setSessions(prev => [newSession, ...prev]);
            setLatestMessages(prev => ({ ...prev, [newSession.sessionId]: "New conversation" }));

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

    // 4. Navigation Helper
    const handleBack = () => {
        // Rensa pricken när vi går tillbaka till dashboard också, för säkerhets skull
        clearNotifications();

        if (isDoctor || isStaff) {
            navigate("/doctor/patients");
        } else if (isPatient) {
            navigate("/patient/me");
        } else {
            navigate("/");
        }
    };

    if (auth.isLoading) return <p className="loading">Loading authentication...</p>;
    if (!auth.isAuthenticated) return <p className="error-message">Please log in to view messages.</p>;

    return (
        <div className="messages-container">
            {/* Taskbar */}
            <div className="taskbar">
                <button onClick={handleBack}>
                    Back to Dashboard
                </button>

                <button onClick={() => setShowNewForm(!showNewForm)}>
                    {showNewForm ? "Cancel" : "Start New Conversation"}
                </button>
            </div>

            <h2>My Conversations</h2>

            {/* New session form */}
            {showNewForm && (
                <form onSubmit={handleCreateSession} className="new-session-form" style={{ marginTop: "15px", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
                    <h4>New Conversation</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "10px" }}>
                        <input
                            type="email"
                            placeholder="Receiver Email (e.g. doctor@hospital.com)"
                            value={receiverEmail}
                            onChange={e => setReceiverEmail(e.target.value)}
                            required
                            style={{ padding: "8px" }}
                        />
                        <input
                            type="text"
                            placeholder="Subject"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            required
                            style={{ padding: "8px" }}
                        />
                        <button type="submit" disabled={creating} style={{ alignSelf: "flex-start", padding: "8px 20px" }}>
                            {creating ? "Creating..." : "Start Chat"}
                        </button>
                    </div>
                </form>
            )}

            {/* Sessions Table */}
            {loading ? (
                <p>Loading messages...</p>
            ) : sessions.length === 0 ? (
                <p>No conversations yet.</p>
            ) : (
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
                            <td>
                                {session.subject}
                                {/* Visa röd prick PÅ TRÅDEN om den är oläst */}
                                {unreadThreads[session.sessionId] && <span className="alert-dot" style={{marginLeft: "10px", color: "red", fontWeight: "bold"}}>!</span>}
                            </td>
                            <td>{new Date(session.creationDate).toLocaleDateString()}</td>
                            <td className="latest-message" style={{color: "#666", fontStyle: "italic"}}>
                                {latestMessages[session.sessionId] || "Loading..."}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default MessageInbox;
