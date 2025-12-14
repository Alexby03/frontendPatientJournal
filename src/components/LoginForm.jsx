import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import "./LoginForm.css";

function LoginForm() {
    const auth = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (auth.isAuthenticated) {
            const roles = auth.user?.profile?.realm_access?.roles || [];

            if (roles.includes("Doctor") || roles.includes("OtherStaff")) {
                navigate("/doctor/patients");
            } else if (roles.includes("Patient")) {
                navigate("/patient/me");
            } else {
                navigate("/");
            }
        }
    }, [auth.isAuthenticated, auth.user, navigate]);

    const handleLogin = () => {
        auth.signinRedirect();
    };

    const handleRegister = () => {
        auth.signinRedirect({
            extraQueryParams: {
                prompt: "create"
            }
        });
    };

    if (auth.error) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <h2>Something went wrong</h2>
                    <p className="error-message">Login error: {auth.error.message}</p>
                    <button onClick={handleLogin}>Try again</button>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>PatientJournal</h2>
                <p>Please log in through the keycloak client below.</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
                    <button onClick={handleLogin}>
                        Log in with SSO
                    </button>

                    <button onClick={handleRegister} className="secondary-button" style={{ backgroundColor: "#6c757d" }}>
                        Register new account
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LoginForm;
