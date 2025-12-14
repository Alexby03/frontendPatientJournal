import {useAuth} from "react-oidc-context";

export const useApi = () => {
    const auth = useAuth();
    const request = async (url, options = {}) => {
        if (!auth.user || !auth.user.access_token) {
            throw new Error("No access token available");
        }
        const headers = {
            "Content-Type": "application/json",
            ...options.headers,
            "Authorization": `Bearer ${auth.user.access_token}`
        };
        return await fetch(url, {...options, headers});
    };
    return { request };
};
