import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./DoctorPatient.css";
import { useAuth } from "../context/AuthContext";

const API_SEARCHSERVICE_URL = process.env.REACT_APP_API_SEARCHSERVICE_URL;

function PatientList() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        const fetchPatientsForDoctor = async () => {
            if (!user || !user.id) return;

            setLoading(true);
            try {
                const response = await fetch(`${API_SEARCHSERVICE_URL}/search/patients/practitioner/id/${user.id}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch patients");
                }

                const data = await response.json();
                setPatients(data);
            } catch (err) {
                console.error("Error fetching patients:", err);
                setError("Could not load patient list.");
            } finally {
                setLoading(false);
            }
        };

        if (user.userType === "Doctor") {
            fetchPatientsForDoctor();
        } else {
            setLoading(false);
        }

    }, [user.id, user.userType]);


    // Handle search input (both doctors and other staff)
    useEffect(() => {
        if (!searchQuery) {
            setSearchResults([]);
            return;
        }

        const fetchSearchResults = async () => {
            setSearchLoading(true);
            try {
                const res = await fetch(`${API_SEARCHSERVICE_URL}/search/patients/name/${encodeURIComponent(searchQuery)}?pageIndex=0&pageSize=10&eager=false`);
                if (res.ok) {
                    const data = await res.json();
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

        const debounceTimeout = setTimeout(fetchSearchResults, 300);
        return () => clearTimeout(debounceTimeout);
    }, [searchQuery]);

    if (loading) return <p className="loading">Loading patients...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="doctor-container">
            {/* Taskbar */}
            <div className="taskbar" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between" }}>
                <button onClick={() => navigate("/messages")} style={{ padding: "8px 16px", cursor: "pointer" }}>Conversations</button>
                <button onClick={() => navigate("/doctor/search")} style={{ padding: "8px 16px", cursor: "pointer" }}>Search patients</button>
                <button onClick={() => navigate("/doctor/my-images")} style={{ padding: "8px 16px", cursor: "pointer" }}>My Images</button>
                <button onClick={() => { logout(); navigate("/login"); }} style={{ padding: "8px 16px", cursor: "pointer" }}>Logout</button>
            </div>

            <div className="doctor-name">{user.fullName}</div>

            {/* ONLY show this section if user is a Doctor */}
            {user.userType === "Doctor" && (
                <div className="patient-section-container">
                    <div className="sub-title">Your Patients</div>

                    {patients.length === 0 ? (
                        <p className="no-patients">No patients assigned to you.</p>
                    ) : (
                        <div className="patient-grid">
                            {patients.map(p => (
                                <div className="patient-card" key={p.id}>
                                    <Link
                                        to={`/doctor/patient/${p.id}`}
                                        className="patient-name"
                                    >
                                        {p.fullName}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Search bar for both Doctor and OtherStaff */}
            <div className="patient-section-container">
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
                                <li
                                    key={p.id}
                                    onClick={() =>
                                        navigate(
                                            user.userType === "OtherStaff"
                                                ? `/staff/patient/${p.id}`
                                                : `/doctor/patient/${p.id}`
                                        )
                                    }
                                >
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