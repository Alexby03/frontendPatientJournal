import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./DoctorPatient.css";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://78.72.148.32:8080";

function PatientList() {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Search states
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        if (!user || user.userType !== "Doctor") {
            setError("You must be logged in as a doctor.");
            setLoading(false);
            return;
        }

        (async () => {
            try {
                const [encRes, condRes, obsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/encounters/practitioner/${user.id}`),
                    fetch(`${API_BASE_URL}/conditions/practitioner/${user.id}`),
                    fetch(`${API_BASE_URL}/observations/practitioner/${user.id}`)
                ]);

                if (!encRes.ok || !condRes.ok || !obsRes.ok) {
                    throw new Error("Failed to load doctor-related data.");
                }

                const [encounters, conditions, observations] = await Promise.all([
                    encRes.json(),
                    condRes.json(),
                    obsRes.json()
                ]);

                const idsFromEncounters = encounters.map(e => e.patientId);
                const idsFromConditions = conditions.map(c => c.patientId);
                const idsFromObservations = observations.map(o => o.patientId);

                const allIds = [...idsFromEncounters, ...idsFromConditions, ...idsFromObservations];
                const uniqueIds = [...new Set(allIds)];

                if (uniqueIds.length === 0) {
                    setPatients([]);
                    return;
                }

                const fetchedPatients = await Promise.all(
                    uniqueIds.map(id =>
                        fetch(`${API_BASE_URL}/patients/${id}?fetchRelations=false`).then(r => r.json())
                    )
                );

                fetchedPatients.sort((a, b) => a.fullName.localeCompare(b.fullName));
                setPatients(fetchedPatients);

            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    // Handle search input
    useEffect(() => {
        if (!searchQuery) {
            setSearchResults([]);
            return;
        }

        const fetchSearchResults = async () => {
            setSearchLoading(true);
            try {
                // Call the /search endpoint with query params
                const res = await fetch(`${API_BASE_URL}/patients/search?q=${encodeURIComponent(searchQuery)}&pageIndex=0&pageSize=10&fetchRelations=false`);
                if (res.ok) {
                    const data = await res.json(); // Array of PatientDTO
                    setSearchResults(data);
                } else {
                    setSearchResults([]);
                }
            } catch (err) {
                console.error("Search failed", err);
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        };

        const debounceTimeout = setTimeout(fetchSearchResults, 300); // debounce
        return () => clearTimeout(debounceTimeout);
    }, [searchQuery]);

    if (loading) return <p className="loading">Loading patients...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="doctor-container">
            {/* Taskbar */}
            <div className="taskbar" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between" }}>
                <button onClick={() => navigate("/messages")} style={{ padding: "8px 16px", cursor: "pointer" }}>Conversations</button>
                <button onClick={() => { logout(); navigate("/login"); }} style={{ padding: "8px 16px", cursor: "pointer" }}>Logout</button>
            </div>

            <div className="doctor-name">{user.fullName}</div>

            <div className="patient-section-container">
                <div className="sub-title">Your Patients</div>

                {patients.length === 0 ? (
                    <p className="no-patients">No patients assigned to you.</p>
                ) : (
                    <div className="patient-grid">
                        {patients.map(p => (
                            <div className="patient-card" key={p.id}>
                                <Link to={`/doctor/patient/${p.id}`} className="patient-name">{p.fullName}</Link>
                            </div>
                        ))}
                    </div>
                )}

                <div className="patient-search-container">
                    <input
                        type="text"
                        placeholder="Search for a patient..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="patient-search-input"
                    />
                    {searchLoading && <div className="search-loading">Loading...</div>}
                    {searchResults.length > 0 && (
                        <ul className="search-dropdown">
                            {searchResults.map(p => (
                                <li key={p.id} onClick={() => navigate(`/doctor/patient/${p.id}`)}>
                                    {p.fullName} ({p.email})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PatientList;
