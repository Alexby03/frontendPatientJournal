import { useAuth } from "react-oidc-context";
import { useCallback } from 'react'; // <--- Import this

export function useApi() {
    const auth = useAuth();

    const request = useCallback(async (url, options = {}) => {
        const token = auth.user?.access_token;

        const headers = {
            ...(options.headers || {}),
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
        };

        if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
            headers["Content-Type"] = "application/json";
        }

        return fetch(url, { ...options, headers });

    }, [auth.user?.access_token]);

    return { request };
}
