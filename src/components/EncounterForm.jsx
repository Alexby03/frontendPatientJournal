import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import './formStyle.css';

const API_BASE_URL = "http://78.72.148.32:8080";

function EncounterForm() {
    const { id, encounterId } = useParams(); // patientId + optional encounterId
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem("user"));
    const [description, setDescription] = useState("");
    const [encounterDate, setEncounterDate] = useState("");

    useEffect(() => {
        if (encounterId) {
            const fetchEncounter = async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/encounters/${encounterId}`);
                    if (!res.ok) throw new Error("Failed to fetch encounter");
                    const data = await res.json();
                    setDescription(data.description);
                    // Format for datetime-local input
                    const localDateTime = new Date(data.encounterDate).toISOString().slice(0,16);
                    setEncounterDate(localDateTime);
                } catch (err) {
                    alert(err.message);
                }
            };
            fetchEncounter();
        }
    }, [encounterId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const body = { description, encounterDate };

        try {
            let res;
            if (encounterId) {
                // Update
                res = await fetch(`${API_BASE_URL}/encounters/${encounterId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            } else {
                // Create
                res = await fetch(`${API_BASE_URL}/encounters/patient/${id}/practitioner/${user.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            }

            if (!res.ok) throw new Error(encounterId ? "Failed to update encounter" : "Failed to create encounter");

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
