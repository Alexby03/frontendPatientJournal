import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PatientDetail.css";
import {useApi} from "../utils/Api";

const API_SEARCHSERVICE_URL = process.env.REACT_APP_API_SEARCHSERVICE_URL;

function StaffPatient() {
    const { id } = useParams(); // patientId
    const navigate = useNavigate();

    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const { request } = useApi();

    useEffect(() => {
        const fetchPatient = async () => {
            try {
                const res = await request(`${API_SEARCHSERVICE_URL}/search/patient/id/${id}?eager=true`);
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
    }, [id, request]);

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
