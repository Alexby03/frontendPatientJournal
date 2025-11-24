import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // import AuthContext hook
import "./PatientDetail.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function PatientDetail() {
    const navigate = useNavigate();
    const { logout } = useAuth(); // get logout from context
    const user = JSON.parse(sessionStorage.getItem("user"));
    const { fullName, email } = user || {};

    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/patients/email/${email}?fetchRelations=true`);
                if (!res.ok) throw new Error("Could not fetch patient data");
                const data = await res.json();
                setPatientData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (email) fetchPatientData();
    }, [email]);

    if (loading) return <p className="loading">Loading patient data...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!patientData) return null;

    // Helper functions
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleString(undefined, {
            year: "numeric", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <div className="patient-container">
            {/* Taskbar with Conversations and Logout */}
            <div
                className="taskbar"
                style={{
                    marginBottom: "20px",
                    display: "flex",
                    justifyContent: "space-between"
                }}
            >
                <button
                    onClick={() => navigate("/messages")}
                    style={{ padding: "8px 16px", cursor: "pointer" }}
                >
                    Conversations
                </button>
                <button
                    onClick={() => { logout(); navigate("/login"); }}
                    style={{ padding: "8px 16px", cursor: "pointer" }}
                >
                    Logout
                </button>
            </div>

            <h1>{patientData.fullName}</h1>
            <p className="email">{patientData.email}</p>

            {/* Conditions Table */}
            <section className="patient-section">
                <h2>Conditions</h2>
                {patientData.conditions.length ? (
                    <table>
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Severity</th>
                            <th>Diagnosed Date</th>
                        </tr>
                        </thead>
                        <tbody>
                        {patientData.conditions.map((c, index) => (
                            <tr key={index}>
                                <td>{c.conditionName}</td>
                                <td>{c.conditionType}</td>
                                <td>{c.severityLevel}</td>
                                <td>{formatDate(c.diagnosedDate)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : <p>No conditions found.</p>}
            </section>

            {/* Encounters Table */}
            <section className="patient-section">
                <h2>Encounters</h2>
                {patientData.encounters.length ? (
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

            {/* Observations Table */}
            <section className="patient-section">
                <h2>Observations</h2>
                {patientData.observations.length ? (
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
