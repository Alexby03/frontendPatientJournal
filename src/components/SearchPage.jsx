import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import "./SearchPage.css";
import { useApi } from "../utils/Api";

const API_SEARCHSERVICE_URL = process.env.REACT_APP_API_SEARCHSERVICE_URL;

function SearchPage() {
    const navigate = useNavigate();

    // Auth Hooks
    const auth = useAuth();
    const { request } = useApi();

    // Hämta ID säkert från Keycloak token
    // (Keycloaks 'sub' claim matchar ditt Practitioner ID i backend om du mappat det rätt i Onboarding)
    const practitionerId = auth.user?.profile?.sub;

    // Search inputs
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [condition, setCondition] = useState("");
    const [date, setDate] = useState("");
    const [practitionerEmail, setPractitionerEmail] = useState("");

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(""); // Rättat state destrukturering

    // Hjälpmetod för att kolla auth status innan sökning
    const checkAuth = () => {
        if (!auth.isAuthenticated || !auth.user) {
            setError("You must be logged in to search.");
            return false;
        }
        return true;
    };

    const searchName = async () => {
        if (!checkAuth() || !name) return;

        setLoading(true);
        setError("");
        try {
            const res = await request(
                `${API_SEARCHSERVICE_URL}/search/patients/name/${encodeURIComponent(name)}?pageIndex=0&pageSize=20&eager=false`
            );
            if (res.ok) {
                setResults(await res.json());
            } else {
                setResults([]);
            }
        } catch (err) {
            console.error(err);
            setError("Search failed.");
        } finally {
            setLoading(false);
        }
    };

    const searchEmail = async () => {
        if (!checkAuth() || !email) return;

        setLoading(true);
        setError("");
        try {
            const res = await request(
                `${API_SEARCHSERVICE_URL}/search/patient/email/${encodeURIComponent(email)}`
            );
            // Eftersom denna endpoint returnerar ETT objekt, lägg det i en array
            if (res.ok) {
                const data = await res.json();
                setResults([data]);
            } else {
                setResults([]);
            }
        } catch (err) {
            console.error(err);
            setError("Search failed.");
        } finally {
            setLoading(false);
        }
    };

    const searchCondition = async () => {
        if (!checkAuth() || !condition) return;

        setLoading(true);
        setError("");
        try {
            const res = await request(
                `${API_SEARCHSERVICE_URL}/search/patients/condition/${condition}`
            );
            if (res.ok) {
                setResults(await res.json());
            } else {
                setResults([]);
            }
        } catch (err) {
            console.error(err);
            setError("Search failed.");
        } finally {
            setLoading(false);
        }
    };

    const searchPractitionerDate = async () => {
        if (!checkAuth() || !date) return;

        // Här använder vi practitionerId från token!
        if (!practitionerId) {
            setError("Could not identify your practitioner ID.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const res = await request(
                `${API_SEARCHSERVICE_URL}/search/patients/practitioner/id/${practitionerId}/date?localDate=${date}`
            );
            if (res.ok) {
                setResults(await res.json());
            } else {
                setResults([]);
            }
        } catch (err) {
            console.error(err);
            setError("Search failed.");
        } finally {
            setLoading(false);
        }
    };

    const searchPatientsByDoctorEmail = async () => { // Tog bort (e) då knappen inte är i ett <form>
        if (!checkAuth() || !practitionerEmail) return;

        setLoading(true);
        setError("");
        setResults([]);

        try {
            // 1. Hitta läkaren först
            const doctorRes = await request(`${API_SEARCHSERVICE_URL}/search/practitioner/email/${encodeURIComponent(practitionerEmail)}`);
            if (!doctorRes.ok) {
                setError("No practitioner found with that email.");
                setLoading(false);
                return;
            }

            const doctor = await doctorRes.json();

            // Kolla efter id eller practitionerId beroende på din DTO
            const docId = doctor.id || doctor.practitionerId;

            if (!docId) {
                setError("Invalid practitioner data received.");
                setLoading(false);
                return;
            }

            // 2. Hämta patienterna för den läkaren
            const patientsRes = await request(`${API_SEARCHSERVICE_URL}/search/patients/practitioner/id/${docId}`);

            if (!patientsRes.ok) {
                throw new Error("Failed to fetch patients list.");
            }

            const patients = await patientsRes.json();
            setResults(patients);

        } catch (err) {
            console.error("Search error:", err);
            setError("An error occurred while searching.");
        } finally {
            setLoading(false);
        }
    };

    // UI Render Guard
    if (auth.isLoading) return <p className="loading">Loading authentication...</p>;

    return (
        <div className="search-page">

            <div className="taskbar">
                <button onClick={() => navigate("/doctor/patients")}>Back</button>
            </div>

            <h2>Search Patients</h2>

            {error && <p className="error-message" style={{color: 'red', textAlign: 'center'}}>{error}</p>}

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
                    <button onClick={searchName} disabled={loading}>Search</button>
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
                    <button onClick={searchEmail} disabled={loading}>Search</button>
                </div>

                {/* ---- SEARCH PATIENTS BY CONDITION ---- */}
                <div className="search-box">
                    <h4>Search by Condition</h4>
                    <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                        <option value="">Select Condition</option>
                        <option value="Infectious">Infectious</option>
                        <option value="Chronic">Chronic</option>
                        <option value="Genetic">Genetic</option>
                        <option value="Autoimmune">Autoimmune</option>
                        <option value="Psychiatric">Psychiatric</option>
                        <option value="Cancerous">Cancerous</option>
                        <option value="Neurological">Neurological</option>
                    </select>
                    <button onClick={searchCondition} disabled={loading}>Search</button>
                </div>

                {/* ---- PRACTITIONER + DATE ---- */}
                <div className="search-box">
                    <h4>Patients YOU treated on date</h4>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <button onClick={searchPractitionerDate} disabled={loading}>Search</button>
                </div>

                {/* ---- PRACTITIONER + EMAIL ---- */}
                <div className="search-box">
                    <h4>Search by Other Doctor's Email</h4>
                    <input
                        type="email"
                        placeholder="Enter Doctor's email..."
                        value={practitionerEmail}
                        onChange={(e) => setPractitionerEmail(e.target.value)}
                    />
                    <button onClick={searchPatientsByDoctorEmail} disabled={loading}>Search</button>
                </div>

            </div>

            {/* ---- RESULTS ---- */}
            <div className="results-container">
                <h3>Results</h3>

                {loading && <p>Loading results...</p>}
                {!loading && results.length === 0 && <p>No patients found (or no search performed).</p>}

                {results.length > 0 &&
                    results.map((p) => (
                        <div
                            key={p.id || p.patientId} // Fallback för olika ID-namn
                            className="result-card"
                            onClick={() => navigate(`/doctor/patient/${p.id || p.patientId}`)}
                            style={{cursor: 'pointer'}}
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
