import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import './formStyle.css';

const API_BASE_URL = "http://78.72.148.32:8080";

function ObservationForm() {
    const { id, observationId } = useParams(); // patientId + optional observationId
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem("user"));

    const [description, setDescription] = useState("");
    const [observationDate, setObservationDate] = useState("");

    useEffect(() => {
        if (observationId) {
            const fetchObservation = async () => {
                try {
                    const res = await fetch(`${API_BASE_URL}/observations/${observationId}`);
                    if (!res.ok) throw new Error("Failed to fetch observation");
                    const data = await res.json();
                    setDescription(data.description);
                    const localDateTime = new Date(data.observationDate).toISOString().slice(0,16);
                    setObservationDate(localDateTime);
                } catch (err) {
                    alert(err.message);
                }
            };
            fetchObservation();
        }
    }, [observationId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const body = { description, observationDate };

        try {
            let res;
            if (observationId) {
                // Update
                res = await fetch(`${API_BASE_URL}/observations/${observationId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            } else {
                // Create
                res = await fetch(`${API_BASE_URL}/observations/patient/${id}/practitioner/${user.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            }

            if (!res.ok) throw new Error(observationId ? "Failed to update observation" : "Failed to create observation");
            navigate(`/doctor/patient/${id}`);
        } catch (err) {
            alert(err.message);
        }
    };

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
