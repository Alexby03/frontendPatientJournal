import { useAuth } from "../context/AuthContext";

export function useApi() {
    const { token } = useAuth();

    const apiFetch = async (url, options = {}) => {
        return fetch(url, {
            ...options,
            headers: {
                ...(options.headers || {}),
                "Authorization": token ? `Bearer ${token}` : "",
                "Content-Type": "application/json",
            }
        });
    };

    return { apiFetch };
}