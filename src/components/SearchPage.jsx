
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SearchPage.css";

const API_SEARCHSERVICE_URL = process.env.REACT_APP_API_SEARCHSERVICE_URL;

function SearchPage() {
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem("user"));

    // Search inputs
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [condition, setCondition] = useState("");
    const [date, setDate] = useState("");
    const [practitionerEmail, setPractitionerEmail] = useState("");

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const searchName = async () => {
        if (!name) return;

        setLoading(true);
        try {
            const res = await fetch(
                `${API_SEARCHSERVICE_URL}/search/patients/name/${encodeURIComponent(
                    name
                )}?pageIndex=0&pageSize=20&eager=false`
            );
            setResults(res.ok ? await res.json() : []);
        } finally {
            setLoading(false);
        }
    };

    const searchEmail = async () => {
        if (!email) return;

        setLoading(true);
        try {
            const res = await fetch(
                `${API_SEARCHSERVICE_URL}/search/patient/email/${encodeURIComponent(email)}`
            );
            setResults(res.ok ? [await res.json()] : []);
        } finally {
            setLoading(false);
        }
    };

    const searchCondition = async () => {
        if (!condition) return;

        setLoading(true);
        try {
            const res = await fetch(
                `${API_SEARCHSERVICE_URL}/search/patients/condition/${condition}`
            );
            setResults(res.ok ? await res.json() : []);
        } finally {
            setLoading(false);
        }
    };

    const searchPractitionerDate = async () => {
        if (!date) return;

        setLoading(true);
        try {
            const res = await fetch(
                `${API_SEARCHSERVICE_URL}/search/patients/practitioner/id/${user.id}/date?localDate=${date}`
            );
            setResults(res.ok ? await res.json() : []);
        } finally {
            setLoading(false);
        }
    };

    const searchPatientsByDoctorEmail = async () => {
        if (!practitionerEmail) return;

        setLoading(true);
        try {

            const doctorRes = await fetch(`${API_SEARCHSERVICE_URL}/search/practitioner/email/${encodeURIComponent(practitionerEmail)}`);
            //if (!doctorRes.ok) return setResults([]);

            const doctor = await doctorRes.json();
            //if (!doctor?.id) return setResults([]);


            const patientsRes = await fetch(`${API_SEARCHSERVICE_URL}/search/patients/practitioner/id/${doctor.id}`);
            //if (!patientsRes.ok) return setResults([]);

            const patients = await patientsRes.json();


            setResults(Array.isArray(patients) ? patients : [patients]);
        } catch (err) {
            console.error("Error fetching patients by doctor email:", err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="search-page">

            <div className="taskbar">
                <button onClick={() => navigate("/doctor/patients")}>Back</button>
            </div>

            <h2>Search Patients</h2>

            {/* ---- ALL SEARCH BOXES IN ONE HORIZONTAL ROW ---- */}
            <div className="search-row">

                {/* ---- SEARCH PATIENTS BY NAME ---- */}
                <div className="search-box">
                    <h4>Search by Name</h4>
                    <input
                        type="text"
                        placeholder="Enter name..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <button onClick={searchName}>Search</button>
                </div>

                {/* ---- SEARCH PATIENT BY EMAIL ---- */}
                <div className="search-box">
                    <h4>Search by Email</h4>
                    <input
                        type="email"
                        placeholder="Enter email..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button onClick={searchEmail}>Search</button>
                </div>

                {/* ---- SEARCH PATIENTS BY CONDITION ---- */}
                <div className="search-box">
                    <h4>Search by Condition</h4>
                    <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                        <option value="Infectious">Infectious</option>
                        <option value="Chronic">Chronic</option>
                        <option value="Genetic">Genetic</option>
                        <option value="Autoimmune">Autoimmune</option>
                        <option value="Psychiatric">Psychiatric</option>
                        <option value="Cancerous">Cancerous</option>
                        <option value="Neurological">Neurological</option>
                    </select>
                    <button onClick={searchCondition}>Search</button>
                </div>

                {/* ---- PRACTITIONER + DATE ---- */}
                <div className="search-box">
                    <h4>Patients you treated at a specific date</h4>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <button onClick={searchPractitionerDate}>Search</button>
                </div>

                {/* ---- PRACTITIONER + EMAIL ---- */}
                <div className="search-box">
                    <h4>Search by Doctor's Email</h4>
                    <input
                        type="email"
                        placeholder="Enter Doctor's email..."
                        value={practitionerEmail}
                        onChange={(e) => setPractitionerEmail(e.target.value)}
                    />
                    <button onClick={searchPatientsByDoctorEmail}>Search</button>
                </div>

            </div>

            {/* ---- RESULTS ---- */}
            <div className="results-container">
                <h3>Results</h3>

                {loading && <p>Loading...</p>}
                {!loading && results.length === 0 && <p>No patients found.</p>}

                {results.length > 0 &&
                    results.map((p) => (
                        <div
                            key={p.id}
                            className="result-card"
                            onClick={() => navigate(`/doctor/patient/${p.id}`)}
                        >
                            <strong>{p.fullName}</strong>
                            <div>{p.email}</div>
                        </div>
                    ))}
            </div>
        </div>
    );
}

export default SearchPage;
