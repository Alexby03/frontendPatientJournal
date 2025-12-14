import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import './formStyle.css';
import { useApi } from "../utils/Api";
import { useAuth } from "react-oidc-context";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function EncounterForm() {
    const { id, encounterId } = useParams(); // patientId + optional encounterId
    const navigate = useNavigate();

    // Auth Hooks
    const auth = useAuth();
    const { request } = useApi();

    const [description, setDescription] = useState("");
    const [encounterDate, setEncounterDate] = useState("");

    const practitionerId = auth.user?.profile?.sub;
    const isStaff = auth.user?.profile?.realm_access?.roles?.includes("OtherStaff");

    useEffect(() => {
        // Vänta på auth
        if (auth.isLoading || !auth.user || !auth.isAuthenticated) {
            return;
        }

        if (encounterId) {
            const fetchEncounter = async () => {
                try {
                    const res = await request(`${API_BASE_URL}/encounters/${encounterId}`);
                    if (!res.ok) throw new Error("Failed to fetch encounter");
                    const data = await res.json();

                    setDescription(data.description);

                    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
                    if (data.encounterDate) {
                        const localDateTime = new Date(data.encounterDate).toISOString().slice(0, 16);
                        setEncounterDate(localDateTime);
                    }
                } catch (err) {
                    alert(err.message);
                }
            };
            fetchEncounter();
        }
    }, [encounterId, request, auth.isLoading, auth.user, auth.isAuthenticated]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const body = { description, encounterDate };

        try {
            let res;
            if (encounterId) {
                // Update
                res = await request(`${API_BASE_URL}/encounters/${encounterId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            } else {
                // Create
                // Använd practitionerId från auth, inte från sessionStorage!
                res = await request(`${API_BASE_URL}/encounters/patient/${id}/practitioner/${practitionerId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            }

            if (!res.ok) throw new Error(encounterId ? "Failed to update encounter" : "Failed to create encounter");

            // Redirect baserat på roll (samma logik som ConditionForm)
            const redirectTo = isStaff
                ? `/staff/patient/${id}`
                : `/doctor/patient/${id}`;
            navigate(redirectTo);

        } catch (err) {
            alert(err.message);
        }
    };

    // Skydda vyn medan auth laddar eller om man är utloggad
    if (auth.isLoading) {
        return <div className="loading">Loading...</div>;
    }
    if (!auth.isAuthenticated) {
        return <div className="error-message">Not logged in</div>;
    }

    return (
        <div className="form-container">
            <h2>{encounterId ? "Update Encounter" : "Add Encounter"}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        placeholder="Description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Encounter Date</label>
                    <input
                        type="datetime-local"
                        value={encounterDate}
                        onChange={e => setEncounterDate(e.target.value)}
                        required
                    />
                </div>

                <div className="form-buttons">
                    <button
                        type="button"
                        className="btn btn-back"
                        onClick={() => navigate(-1)}>
                        Back
                    </button>
                    <button type="submit" className="btn btn-submit">
                        {encounterId ? "Update" : "Add"} Encounter
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EncounterForm;
