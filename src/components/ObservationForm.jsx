import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import './formStyle.css';
import { useApi } from "../utils/Api";
import { useAuth } from "react-oidc-context";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function ObservationForm() {
    const { id, observationId } = useParams(); // patientId + optional observationId
    const navigate = useNavigate();

    // Auth Hooks
    const auth = useAuth();
    const { request } = useApi();

    const [description, setDescription] = useState("");
    const [observationDate, setObservationDate] = useState("");

    // Hämta info från Auth Context
    const practitionerId = auth.user?.profile?.sub;
    const isStaff = auth.user?.profile?.realm_access?.roles?.includes("OtherStaff");

    useEffect(() => {
        // Vänta på auth innan vi hämtar något
        if (auth.isLoading || !auth.user || !auth.isAuthenticated) {
            return;
        }

        if (observationId) {
            const fetchObservation = async () => {
                try {
                    const res = await request(`${API_BASE_URL}/observations/${observationId}`);
                    if (!res.ok) throw new Error("Failed to fetch observation");
                    const data = await res.json();

                    setDescription(data.description);

                    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
                    if (data.observationDate) {
                        const localDateTime = new Date(data.observationDate).toISOString().slice(0, 16);
                        setObservationDate(localDateTime);
                    }
                } catch (err) {
                    alert(err.message);
                }
            };
            fetchObservation();
        }
    }, [observationId, request, auth.isLoading, auth.user, auth.isAuthenticated]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const body = { description, observationDate };

        try {
            let res;
            if (observationId) {
                // Update
                res = await request(`${API_BASE_URL}/observations/${observationId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            } else {
                // Create
                // Använd practitionerId från Auth Context
                res = await request(`${API_BASE_URL}/observations/patient/${id}/practitioner/${practitionerId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            }

            if (!res.ok) throw new Error(observationId ? "Failed to update observation" : "Failed to create observation");

            // Redirect baserat på roll
            const redirectTo = isStaff
                ? `/staff/patient/${id}`
                : `/doctor/patient/${id}`;
            navigate(redirectTo);

        } catch (err) {
            alert(err.message);
        }
    };

    // Skydda vyn
    if (auth.isLoading) {
        return <div className="loading">Loading...</div>;
    }
    if (!auth.isAuthenticated) {
        return <div className="error-message">Not logged in</div>;
    }

    return (
        <div className="form-container">
            <h2>{observationId ? "Update Observation" : "Add Observation"}</h2>
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
                    <label>Observation Date</label>
                    <input
                        type="datetime-local"
                        value={observationDate}
                        onChange={e => setObservationDate(e.target.value)}
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
                        {observationId ? "Update" : "Add"} Observation
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ObservationForm;
