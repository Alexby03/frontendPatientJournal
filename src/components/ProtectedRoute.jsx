import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";

function ProtectedRoute({ allowed, children }) {
    const auth = useAuth();

    useEffect(() => {
        if (!auth.isLoading && !auth.isAuthenticated) {
            auth.signinRedirect().catch(err => {
                console.error("Login failed:", err);
            });
        }
    }, [auth.isLoading, auth.isAuthenticated, auth]);

    if (auth.isLoading) {
        return <div className="loading">Logging in...</div>;
    }

    if (!auth.isAuthenticated) {
        return <div>Redirecting to Keycloak...</div>;
    }

    const userRoles = auth.user?.profile?.realm_access?.roles || [];

    const hasPermission = allowed.some(role => userRoles.includes(role));

    if (!hasPermission) {
        return (
            <div style={{ padding: 20, textAlign: 'center' }}>
                <h2>No permission</h2>
                <button onClick={() => auth.signoutRedirect()}>Log out</button>
            </div>
        );
    }

    return children;
}

export default ProtectedRoute;
