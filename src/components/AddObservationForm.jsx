import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE_URL = "http://78.72.148.32:8080";

function AddObservationForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem("user"));

    const [description, setDescription] = useState("");
    const [observationDate, setObservationDate] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const body = { description, observationDate };

        try {
            const res = await fetch(`${API_BASE_URL}/observations/patient/${id}/practitioner/${user.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error("Failed to create observation");
            navigate(`/doctor/patient/${id}`);
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="form-container">
            <h2>Add Observation</h2>
            <form onSubmit={handleSubmit}>
                <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required />
                <input type="datetime-local" value={observationDate} onChange={e => setObservationDate(e.target.value)} required />
                <button type="submit">Add Observation</button>
            </form>
        </div>
    );
}

export default AddObservationForm;