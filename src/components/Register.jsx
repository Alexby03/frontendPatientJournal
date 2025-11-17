import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginForm.css"; // återanvänd CSS från login

const API_BASE_URL = "http://78.72.148.32:8080";

function Register() {
    const [email, setEmail] = useState("");
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const payload = {
                email,
                fullName,
                password,
                userType: "Patient" // alltid patient
            };

            const response = await fetch(`${API_BASE_URL}/patients`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Could not register");
            }

            alert("Sign in successful! Login now.");
            navigate("/login");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigate("/login");
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Register</h2>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleRegister}>
                    <label>Full Name</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />

                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Sign in"}
                    </button>
                </form>

                {/* Länk tillbaka till login */}
                <p
                    className="register-text"
                    style={{ color: "#6c63ff", marginTop: "1rem" }}
                    onClick={handleBackToLogin}
                >
                    Back to login
                </p>
            </div>
        </div>
    );
}

export default Register;
