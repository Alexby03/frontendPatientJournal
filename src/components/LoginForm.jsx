import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import "./LoginForm.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const loginPayload = {
                email: email,
                password: password
            };

            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(loginPayload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Wrong email or password");
            }

            const userDTO = await response.json();
            login(userDTO);

            switch (userDTO.userType) {
                case "Patient":
                    navigate("/patient/me");
                    break;
                case "Doctor":
                    navigate("/doctor/patients");
                    break;
                case "OtherStaff":
                    navigate("/doctor/patients");
                    break;
                default:
                    navigate("/");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterClick = () => {
        navigate("/register");
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Welcome to PatientJournal</h2>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleLogin}>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? <div className="loader"></div> : "Login"}
                    </button>
                </form>
                <p className="register-text" onClick={handleRegisterClick}>
                    Sign in
                </p>
            </div>
        </div>
    );
}

export default LoginForm;