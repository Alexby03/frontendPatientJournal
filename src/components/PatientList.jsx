import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { useNotifications } from "../context/NotificationContext";
import "./DoctorPatient.css";
import { useApi } from "../utils/Api";

const API_SEARCHSERVICE_URL = process.env.REACT_APP_API_SEARCHSERVICE_URL;

function PatientList() {
    const navigate = useNavigate();
    const auth = useAuth();
    const { request } = useApi();
    const { hasNewMessages, clearNotifications } = useNotifications();

    const userProfile = auth.user?.profile;
    const keycloakId = userProfile?.sub;

    const roles = userProfile?.realm_access?.roles || [];
    const email = userProfile?.email || "";
    const isDoctor = roles.includes("doctor") || roles.includes("Doctor") || email.includes("doctor");

    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        if (!keycloakId || !auth.isAuthenticated) return;

        if (!isDoctor) {
            setLoading(false);
            return;
        }

        const fetchPatientsForDoctor = async () => {
            setLoading(true);
            try {
                const response = await request(`${API_SEARCHSERVICE_URL}/search/patients/practitioner/id/${keycloakId}`);

                if (!response.ok) {
                    if (response.status === 404) {
                        setPatients([]);
                    } else {
                        throw new Error("Failed to fetch patients");
                    }
                } else {
                    const data = await response.json();
                    setPatients(data);
                }
            } catch (err) {
                console.error("Error fetching patients:", err);
                setError("Could not load patient list.");
            } finally {
                setLoading(false);
            }
        };

        fetchPatientsForDoctor();

    }, [keycloakId, isDoctor, auth.isAuthenticated]);

    useEffect(() => {
        if (!searchQuery) {
            setSearchResults([]);
            return;
        }

        const fetchSearchResults = async () => {
            setSearchLoading(true);
            try {
                const res = await request(`${API_SEARCHSERVICE_URL}/search/patients/name/${encodeURIComponent(searchQuery)}?pageIndex=0&pageSize=10&eager=false`);
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

    const handleLogout = () => {
        auth.signoutRedirect();
    };

    if (loading) return <p className="loading">Loading patients...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="doctor-container">
            {/* Taskbar */}
            <div className="taskbar" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between" }}>
                <div>
                    <button onClick={() => {navigate("/messages"); clearNotifications(); }} style={{ padding: "8px 16px", cursor: "pointer", marginRight: "10px" }}>
                        Conversations {hasNewMessages && <span className="alert-dot">!</span>}
                    </button>

                    {/* HÄR ÄR DEN ÅTERSTÄLLDA KNAPPEN */}
                    <button onClick={() => navigate("/doctor/search")} style={{ padding: "8px 16px", cursor: "pointer", marginRight: "10px" }}>
                        Search patients
                    </button>

                    <button onClick={() => navigate("/doctor/my-images")} style={{ padding: "8px 16px", cursor: "pointer" }}>
                        My Images
                    </button>
                </div>

                <button onClick={handleLogout} style={{ padding: "8px 16px", cursor: "pointer", backgroundColor: "#dc3545", color: "white" }}>
                    Logout
                </button>
            </div>

            <div className="doctor-name">
                Welcome, {userProfile?.name || "Doctor"}
            </div>

            {/* ONLY show this section if user is a Doctor */}
            {isDoctor && (
                <div className="patient-section-container">
                    <div className="sub-title">Your Patients</div>

                    {patients.length === 0 ? (
                        <p className="no-patients">No patients assigned to you.</p>
                    ) : (
                        <div className="patient-grid">
                            {patients.map(p => (
                                <div className="patient-card" key={p.id || p.patientId}>
                                    <Link
                                        to={`/doctor/patient/${p.id || p.patientId}`}
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

            {/* Quick Search bar (längst ner) */}
            <div className="patient-section-container">
                <h3>Quick Search</h3>
                <div className="patient-search-container" style={{position: "relative"}}>
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="patient-search-input"
                        style={{width: "100%", padding: "8px"}}
                    />
                    {searchLoading && <div className="search-loading" style={{position: "absolute", right: 10, top: 10}}>Loading...</div>}

                    {searchResults.length > 0 && (
                        <ul className="search-dropdown" style={{border: "1px solid #ccc", listStyle: "none", padding: 0, marginTop: 5, backgroundColor: "white", zIndex: 100}}>
                            {searchResults.map(p => (
                                <li
                                    key={p.id}
                                    style={{padding: "10px", cursor: "pointer", borderBottom: "1px solid #eee"}}
                                    onClick={() => navigate(`/doctor/patient/${p.id}`)}
                                >
                                    <strong>{p.fullName}</strong> <br/>
                                    <small>{p.email}</small>
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
