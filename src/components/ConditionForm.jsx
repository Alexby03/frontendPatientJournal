import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import './formStyle.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function ConditionForm() {
    const {id, conditionId} = useParams(); // patientId + optional conditionId
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem("user"));

    const [conditionName, setConditionName] = useState("");
    const [severityLevel, setSeverityLevel] = useState(1);
    const [conditionType, setConditionType] = useState("Infectious");
    const [diagnosedDate, setDiagnosedDate] = useState("");

    useEffect(() => {
        if (conditionId) {
            const fetchCondition = async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/conditions/${conditionId}`);
                    if (!res.ok) throw new Error("Failed to fetch condition");
                    const data = await res.json();
                    setConditionName(data.conditionName);
                    setConditionType(data.conditionType);
                    setSeverityLevel(data.severityLevel);
                    setDiagnosedDate(data.diagnosedDate); // format for date input if needed
                } catch (err) {
                    alert(err.message);
                }
            };
            fetchCondition();
        }
    }, [conditionId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const body = {conditionName, conditionType, severityLevel, diagnosedDate};

        try {
            let res;
            if (conditionId) {
                // Update
                res = await fetch(`${API_BASE_URL}/conditions/${conditionId}`, {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(body),
                });
            } else {
                // Create
                res = await fetch(`${API_BASE_URL}/conditions/patient/${id}/practitioner/${user.id}`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(body),
                });
            }

            if (!res.ok) throw new Error(conditionId ? "Failed to update condition" : "Failed to create condition");

            const redirectTo = user.userType === "OtherStaff"
                ? `/staff/patient/${id}`
                : `/doctor/patient/${id}`;
            navigate(redirectTo);

        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="form-container">
            <h2>{conditionId ? "Update Condition" : "Add Condition"}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Condition Name</label>
                    <input
                        type="text"
                        placeholder="Condition Name"
                        value={conditionName}
                        onChange={e => setConditionName(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Condition Type</label>
                    <select
                        value={conditionType}
                        onChange={e => setConditionType(e.target.value)}
                        required
                    >
                        <option value="">Select Condition Type</option>
                        <option value="Infectious">Infectious</option>
                        <option value="Chronic">Chronic</option>
                        <option value="Genetic">Genetic</option>
                        <option value="Autoimmune">Autoimmune</option>
                        <option value="Psychiatric">Psychiatric</option>
                        <option value="Cancerous">Cancerous</option>
                        <option value="Neurological">Neurological</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Severity Level</label>
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={severityLevel}
                        onChange={e => setSeverityLevel(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Diagnosed Date</label>
                    <input
                        type="date"
                        value={diagnosedDate}
                        onChange={e => setDiagnosedDate(e.target.value)}
                        required
                    />
                </div>

                <div className="form-buttons">
                    <button
                        type="button"
                        className="btn btn-back"
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </button>
                    <button type="submit" className="btn btn-submit">
                        {conditionId ? "Update" : "Add"} Condition
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ConditionForm;