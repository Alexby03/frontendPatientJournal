import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PatientDetail.css";

function StaffPatient() {
    const { id } = useParams(); // patientId
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem("user"));

    const logout = () => {
        sessionStorage.clear();
        navigate("/login");
    };

    return (
        <div className="patient-container">
            {/* Top Taskbar */}
            <div className="taskbar" style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                    <button className="btn btn-back" onClick={() => navigate(`/doctor/patients`)}>Back</button>
                    <button className="btn btn-logout" onClick={logout}>Logout</button>
                </div>
            </div>

            <h1>Patient Actions</h1>
            <p className="email">You can add new entries for this patient.</p>

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
