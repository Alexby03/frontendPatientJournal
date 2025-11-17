import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PatientDetail.css";

const API_BASE_URL = "http://78.72.148.32:8080";

function DoctorPatientDetail() {
    const { id } = useParams(); // patientId
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem("user"));

    const [patientData, setPatientData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/patients/${id}?fetchRelations=true`);
                if (!res.ok) throw new Error("Could not fetch patient data");
                const data = await res.json();
                setPatientData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchPatientData();
    }, [id]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleUpdate = (type, itemId) => alert(`Update ${type} with ID: ${itemId} (implement form)`);

    const handleDelete = async (type, item) => {
        let itemId, endpoint;

        switch(type) {
            case "Condition":
                itemId = item.conditionId;
                endpoint = "conditions";
                break;
            case "Encounter":
                itemId = item.encounterId;
                endpoint = "encounters";
                break;
            case "Observation":
                itemId = item.observationId;
                endpoint = "observations";
                break;
            default:
                return;
        }

        if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
            try {
                const res = await fetch(`${API_BASE_URL}/${endpoint}/${itemId}`, {
                    method: "DELETE"
                });
                if (!res.ok) throw new Error(`${type} could not be deleted`);

                // Remove from state so UI updates
                setPatientData(prev => ({
                    ...prev,
                    [type.toLowerCase() + "s"]: prev[type.toLowerCase() + "s"].filter(i => {
                        const idKey = type === "Condition" ? "conditionId" : type === "Encounter" ? "encounterId" : "observationId";
                        return i[idKey] !== itemId;
                    })
                }));
            } catch (err) {
                alert(err.message);
            }
        }
    };

    const logout = () => {
        sessionStorage.clear();
        navigate("/login");
    };

    if(loading) return <p className="loading">Loading patient data...</p>;
    if(error) return <p className="error-message">{error}</p>;
    if(!patientData) return null;

    return (
        <div className="patient-container">
            {/* Top Taskbar */}
            <div className="taskbar" style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                    <button className="btn btn-back" onClick={() => navigate(-1)}>Back</button>
                    <button className="btn btn-logout" onClick={logout}>Logout</button>
                </div>
            </div>

            <h1>{patientData.fullName}</h1>
            <p className="email">{patientData.email}</p>

            {/* Conditions */}
            <section className="patient-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2>Conditions</h2>
                    <button className="btn btn-add" onClick={() => navigate(`/doctor/patient/${id}/add-condition`)}>Add Condition</button>
                </div>
                {patientData.conditions.length ? (
                    <table>
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Severity</th>
                            <th>Diagnosed Date</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {patientData.conditions.map((c, index) => (
                            <tr key={index}>
                                <td>{c.conditionName}</td>
                                <td>{c.conditionType}</td>
                                <td>{c.severityLevel}</td>
                                <td>{formatDate(c.diagnosedDate)}</td>
                                <td style={{ textAlign: "center" }}>
                                    <button className="btn" onClick={() => handleUpdate("Condition", c.conditionId)}>Update</button>
                                    <button className="btn btn-logout" onClick={() => handleDelete("Condition", c)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : <p>No conditions found.</p>}
            </section>

            {/* Encounters */}
            <section className="patient-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2>Encounters</h2>
                    <button className="btn btn-add" onClick={() => navigate(`/doctor/patient/${id}/add-encounter`)}>Add Encounter</button>
                </div>
                {patientData.encounters.length ? (
                    <table>
                        <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {patientData.encounters.map((e, index) => (
                            <tr key={index}>
                                <td>{formatDateTime(e.encounterDate)}</td>
                                <td>{e.description}</td>
                                <td style={{ textAlign: "center" }}>
                                    <button className="btn" onClick={() => handleUpdate("Encounter", e.encounterId)}>Update</button>
                                    <button className="btn btn-logout" onClick={() => handleDelete("Encounter", e)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : <p>No encounters found.</p>}
            </section>

            {/* Observations */}
            <section className="patient-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2>Observations</h2>
                    <button className="btn btn-add" onClick={() => navigate(`/doctor/patient/${id}/add-observation`)}>Add Observation</button>
                </div>
                {patientData.observations.length ? (
                    <table>
                        <thead>
                        <tr>
                            <th>Description</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {patientData.observations.map((o, index) => (
                            <tr key={index}>
                                <td>{o.description}</td>
                                <td>{formatDateTime(o.observationDate)}</td>
                                <td style={{ textAlign: "center" }}>
                                    <button className="btn" onClick={() => handleUpdate("Observation", o.observationId)}>Update</button>
                                    <button className="btn btn-logout" onClick={() => handleDelete("Observation", o)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : <p>No observations found.</p>}
            </section>
        </div>
    );
}

export default DoctorPatientDetail;
