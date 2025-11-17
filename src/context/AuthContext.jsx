import { createContext, useState, useContext, useEffect } from "react";

export const AuthContext = createContext();

//TODO: Fix the uncaught runtime error in React, look into useAuth()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const savedUser = sessionStorage.getItem("user");
        if (savedUser) setUser(JSON.parse(savedUser));
    }, []);

    const login = (userDTO) => {
        setUser(userDTO);
        sessionStorage.setItem("user", JSON.stringify(userDTO));
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem("user");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
