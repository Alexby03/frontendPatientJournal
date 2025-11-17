import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE_URL = "http://78.72.148.32:8080";

function CreateNoteForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem("user"));

    const [description, setDescription] = useState("");
    const [encounterDate, setEncounterDate] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const body = { description, encounterDate };

        try {
            const res = await fetch(`${API_BASE_URL}/encounters/patient/${id}/practitioner/${user.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error("Failed to create encounter");
            navigate(`/doctor/patient/${id}`);
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="form-container">
            <h2>Add Encounter</h2>
            <form onSubmit={handleSubmit}>
                <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} required />
                <input type="datetime-local" value={encounterDate} onChange={e => setEncounterDate(e.target.value)} required />
                <button type="submit">Add Encounter</button>
            </form>
        </div>
    );
}

export default CreateNoteForm;
