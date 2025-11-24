import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PatientDetail.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function StaffPatient() {
    const { id } = useParams(); // patientId
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem("user"));

    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPatient = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/patients/${id}?fetchRelations=false`);
                if (!res.ok) throw new Error("Failed to fetch patient info");
                const data = await res.json();
                setPatient(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPatient();
    }, [id]);

    const logout = () => {
        sessionStorage.clear();
        navigate("/login");
    };

    if (loading) return <p className="loading">Loading patient info...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!patient) return null;

    return (
        <div className="patient-container">
            {/* Top Taskbar */}
            <div className="taskbar" style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                    <button className="btn btn-back" onClick={() => navigate(`/doctor/patients`)}>Back</button>
                    <button className="btn btn-logout" onClick={logout}>Logout</button>
                </div>
            </div>

            <h1>{patient.fullName}</h1>
            <p className="email">{patient.email}</p>

            {/* Add buttons only */}
            <section className="patient-section">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2>Conditions</h2>
                    <button className="btn btn-add" onClick={() => navigate(`/doctor/patient/${id}/add-condition`)}>Add Condition</button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2>Encounters</h2>
                    <button className="btn btn-add" onClick={() => navigate(`/doctor/patient/${id}/add-encounter`)}>Add Encounter</button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2>Observations</h2>
                    <button className="btn btn-add" onClick={() => navigate(`/doctor/patient/${id}/add-observation`)}>Add Observation</button>
                </div>
            </section>
        </div>
    );
}

export default StaffPatient;
