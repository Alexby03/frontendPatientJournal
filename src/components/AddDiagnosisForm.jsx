import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE_URL = "http://78.72.148.32:8080";

function AddDiagnosisForm({ onSuccess }) {
    const { id } = useParams(); // patientId
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem("user")); // practitioner

    const [conditionName, setConditionName] = useState("");
    const [severityLevel, setSeverityLevel] = useState(1);
    const [conditionType, setConditionType] = useState("Infectious");
    const [diagnosedDate, setDiagnosedDate] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const body = { conditionName, severityLevel, conditionType, diagnosedDate };

        try {
            const res = await fetch(`${API_BASE_URL}/conditions/patient/${id}/practitioner/${user.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error("Failed to create condition");

            const created = await res.json();

            if (onSuccess) onSuccess(created); // callback to update parent state
            navigate(`/doctor/patient/${id}`); // go back to patient page
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="form-container">
            <h2>Add Condition</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Condition Name" value={conditionName} onChange={e => setConditionName(e.target.value)} required />
                <input type="number" placeholder="Severity Level" value={severityLevel} onChange={e => setSeverityLevel(Number(e.target.value))} min={1} max={10} required />
                <select value={conditionType} onChange={e => setConditionType(e.target.value)}>
                    <option value="Infectious">Infectious</option>
                    <option value="Chronic">Chronic</option>
                    <option value="Genetic">Genetic</option>
                    <option value="Autoimmune">Autoimmune</option>
                    <option value="Psychiatric">Psychiatric</option>
                    <option value="Cancerous">Cancerous</option>
                    <option value="Neurological">Neurological</option>
                </select>
                <input type="date" value={diagnosedDate} onChange={e => setDiagnosedDate(e.target.value)} required />
                <button type="submit">Add Condition</button>
            </form>
        </div>
    );
}

export default AddDiagnosisForm;