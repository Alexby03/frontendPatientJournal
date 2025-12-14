import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import './formStyle.css';
import {useApi} from "../utils/Api";
import {useAuth} from "react-oidc-context";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function ConditionForm() {
    const { id, conditionId } = useParams();
    const navigate = useNavigate();

    const auth = useAuth();
    const { request } = useApi();

    const [conditionName, setConditionName] = useState("");
    const [severityLevel, setSeverityLevel] = useState(1);
    const [conditionType, setConditionType] = useState("Infectious");
    const [diagnosedDate, setDiagnosedDate] = useState("");



    const practitionerId = auth.user?.profile.sub;

    const isStaff = auth.user?.profile?.realm_access?.roles?.includes("OtherStaff");

    useEffect(() => {
        if (auth.isLoading || !auth.user || !auth.isAuthenticated) {
            return;
        }
        if (conditionId) {
            const fetchCondition = async () => {
                try {
                    const res = await request(`${API_BASE_URL}/conditions/${conditionId}`);
                    if (!res.ok) throw new Error("Failed to fetch condition");
                    const data = await res.json();
                    setConditionName(data.conditionName);
                    setConditionType(data.conditionType);
                    setSeverityLevel(data.severityLevel);
                    setDiagnosedDate(data.diagnosedDate);
                } catch (err) {
                    alert(err.message);
                }
            };
            fetchCondition();
        }
    }, [conditionId, request]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const body = {conditionName, conditionType, severityLevel, diagnosedDate};

        try {
            let res;
            if (conditionId) {
                // Update
                res = await request(`${API_BASE_URL}/conditions/${conditionId}`, {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(body),
                });
            } else {
                // Create
                res = await request(`${API_BASE_URL}/conditions/patient/${id}/practitioner/${practitionerId}`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(body),
                });
            }

            if (!res.ok) throw new Error(conditionId ? "Failed to update condition" : "Failed to create condition");

            const redirectTo = isStaff
                ? `/staff/patient/${id}`
                : `/doctor/patient/${id}`;
            navigate(redirectTo);

        } catch (err) {
            alert(err.message);
        }
    };

    if (auth.isLoading) {
        return <div>Loading...</div>;
    }
    if (!auth.isAuthenticated) {
        return <div>Not logged in</div>;
    }

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