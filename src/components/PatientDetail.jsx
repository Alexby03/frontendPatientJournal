import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import "./PatientDetail.css";
import { useApi } from "../utils/Api";
import { useNotifications } from "../context/NotificationContext";

const API_SEARCHSERVICE_URL = process.env.REACT_APP_API_SEARCHSERVICE_URL;
const API_USERMANAGER_URL = process.env.REACT_APP_API_USERMANAGER_URL;

function PatientDetail() {
    const navigate = useNavigate();
    const auth = useAuth();
    const { request } = useApi();

    const { hasNewMessages, clearNotifications } = useNotifications();

    const email = auth.user?.profile?.email;
    const fullName = auth.user?.profile?.name || "Okänd Användare";
    const keycloakId = auth.user?.profile?.sub;

    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (!auth.user?.access_token || !email) {
            if (!auth.isLoading) setLoading(false);
            return;
        }

        const fetchOrSyncUser = async () => {
            try {
                const isDoctor = email.toLowerCase().includes("doctor") || email.toLowerCase().includes("dr");

                if (isDoctor) {
                    navigate("/doctor/messages");
                    return;
                }

                const res = await request(`${API_SEARCHSERVICE_URL}/search/patient/email/${email}?eager=true`);

                if (res.ok) {
                    const data = await res.json();
                    setPatientData(data);
                    setLoading(false);
                } else {
                    setTimeout(async () => {
                        const retryRes = await request(`${API_SEARCHSERVICE_URL}/search/patient/email/${email}?eager=true`);
                        if (retryRes.ok) {
                            const retryData = await retryRes.json();
                            setPatientData(retryData);
                        } else {
                            setError("User created but could not be fetched.");
                        }
                        setLoading(false);
                        setIsSyncing(false);
                    }, 500);
                }
            } catch (err) {
                console.error(err);
                setError(err.message);
                setLoading(false);
            }
        };
        fetchOrSyncUser();
    }, [email, auth.user?.access_token]);

    const handleLogout = () => {
        auth.signoutRedirect();
    };

    const handleConversationsClick = () => {
        clearNotifications();
        navigate("/messages");
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString();
    };
    const formatDateTime = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleString();
    };

    if (loading) return <p className="loading">Loading profile...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!patientData) return <div className="loading">Creating your profile...</div>;

    return (
        <div className="patient-container">
            <div className="taskbar" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between" }}>

                {/* 3. Button with FIXED Dot Logic */}
                <button
                    onClick={handleConversationsClick}
                    style={{
                        padding: "8px 16px",
                        cursor: "pointer",
                        display: "flex",       // Keeps text and dot aligned
                        alignItems: "center",
                        gap: "6px"             // Space between text and dot
                    }}
                >
                    Conversations

                    {/* RESTORED: The span now contains the "!" and uses the class */}
                    {hasNewMessages && (
                        <span className="alert-dot">!</span>
                    )}
                </button>

                <button onClick={handleLogout} style={{ padding: "8px 16px", cursor: "pointer", backgroundColor: "#dc3545", color: "white", border: "none" }}>
                    Logout
                </button>
            </div>

            <h1>{patientData.fullName}</h1>
            <p className="email">{patientData.email}</p>

            <section className="patient-section">
                <h2>Conditions</h2>
                {patientData.conditions?.length ? (
                    <table>
                        <thead>
                        <tr><th>Name</th><th>Type</th><th>Severity</th><th>Diagnosed Date</th></tr>
                        </thead>
                        <tbody>
                        {patientData.conditions.map((c, index) => (
                            <tr key={index}>
                                <td>{c.conditionName}</td><td>{c.conditionType}</td><td>{c.severityLevel}</td><td>{formatDate(c.diagnosedDate)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : <p>No conditions found.</p>}
            </section>

            <section className="patient-section">
                <h2>Encounters</h2>
                {patientData.encounters?.length ? (
                    <table>
                        <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                        </tr>
                        </thead>
                        <tbody>
                        {patientData.encounters.map((e, index) => (
                            <tr key={index}>
                                <td>{formatDateTime(e.encounterDate)}</td>
                                <td>{e.description}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : <p>No encounters found.</p>}
            </section>

            <section className="patient-section">
                <h2>Observations</h2>
                {patientData.observations?.length ? (
                    <table>
                        <thead>
                        <tr>
                            <th>Description</th>
                            <th>Date</th>
                        </tr>
                        </thead>
                        <tbody>
                        {patientData.observations.map((o, index) => (
                            <tr key={index}>
                                <td>{o.description}</td>
                                <td>{formatDateTime(o.observationDate)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : <p>No observations found.</p>}
            </section>
        </div>
    );
}

export default PatientDetail;
