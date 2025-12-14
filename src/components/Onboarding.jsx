import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { useApi } from "../utils/Api";

const API_SEARCHSERVICE_URL = process.env.REACT_APP_API_SEARCHSERVICE_URL;
const API_USERMANAGER_URL = process.env.REACT_APP_API_USERMANAGER_URL;

function Onboarding() {
    const auth = useAuth();
    const navigate = useNavigate();
    const { request } = useApi();

    const [status, setStatus] = useState("Checking authentication...");

    useEffect(() => {

        if (auth.error) {
            setStatus(`Login Error: ${auth.error.message}`);
            return;
        }

        if (auth.user && auth.isAuthenticated) { }
        else if (auth.isLoading || window.location.search.includes("code=")) {
            setStatus("Finalizing login with Keycloak...");
            return;
        } else if (!auth.isAuthenticated) {
            auth.signinRedirect();
            return;
        }
        if (auth.isLoading) {
            return;
        }
        if (!auth.isAuthenticated) {
            navigate("/");
            return;
        }
        const email = auth.user?.profile?.email;
        const fullName = auth.user?.profile?.name || "Unknown User";
        const keycloakId = auth.user?.profile?.sub;
        const roles = auth.user?.profile?.realm_access?.roles || [];

        if (!email || !keycloakId) {
            setStatus("Error: Missing user information in token.");
            return;
        }

        const hasDoctorRole = roles.includes("doctor") || roles.includes("Doctor");
        const isEmailDoctor = email.toLowerCase().includes("doctor") || email.toLowerCase().includes("dr");
        const isDoctor = hasDoctorRole || isEmailDoctor;

        console.log("Onboarding Check:", { email, roles, isDoctor });

        const syncUserWithBackend = async () => {
            try {
                setStatus("Syncing your account with the system...");

                const endpoint = isDoctor ? "/users/practitioners" : "/users/patients";
                const payload = {
                    fullName,
                    email,
                    password: "keycloak-managed",
                    [isDoctor ? "practitionerId" : "patientId"]: keycloakId
                };

                const createRes = await request(`${API_USERMANAGER_URL}${endpoint}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (createRes.ok) {
                    console.log("User created/synced successfully!");
                } else {

                    console.warn("User creation returned non-OK status (might already exist):", createRes.status);
                }

                setStatus("Verifying your profile in the database...");

                const maxAttempts = 10;
                let attempts = 0;
                let userExists = false;
                const searchEndpoint = isDoctor
                    ? `${API_SEARCHSERVICE_URL}/search/practitioner/email/${email}`
                    : `${API_SEARCHSERVICE_URL}/search/patient/email/${email}?eager=true`;

                while (attempts < maxAttempts && !userExists) {
                    attempts++;
                    console.log(`Polling attempt ${attempts}/${maxAttempts} checking ${isDoctor ? "Practitioner" : "Patient"}...`);

                    try {
                        const checkRes = await request(searchEndpoint);

                        if (checkRes.ok) {
                            console.log("User found in database!");
                            userExists = true;
                        } else {
                            console.log(`User not found (Status: ${checkRes.status}), waiting...`);
                        }
                    } catch (err) {
                        console.warn("Polling error (network?):", err);
                    }

                    if (!userExists) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }

                if (isDoctor && !userExists) {
                    console.warn("Could not verify Practitioner via Search, but proceeding anyway...");
                }

                if (!userExists) {
                    setStatus("Timeout: Could not verify your profile. Please refresh the page.");
                    return;
                }

                setStatus("Redirecting to your workspace...");

                if (isDoctor) {
                    navigate("/doctor/patients");
                } else {
                    navigate("/patient/me");
                }

            } catch (error) {
                console.error("Error during onboarding:", error);
                setStatus(`Error: ${error.message || "Something went wrong."}`);
            }
        };

        syncUserWithBackend();

    }, [auth.isLoading, auth.isAuthenticated]);

    return (
        <div>
            <h2>Setting up your workspace...</h2>
            <p>{status}</p>
        </div>
    );
}

export default Onboarding;