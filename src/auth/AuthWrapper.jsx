import React from "react";
import { AuthProvider } from "react-oidc-context";

const oidcConfig = {
    authority: process.env.REACT_APP_AUTHORITY_URL,
    client_id: "patientjournal-keycloak",
    redirect_uri: process.env.REACT_APP_REDIRECT_URL,
    post_logout_redirect_uri: window.location.origin,
    response_type: "code",
    scope: "openid profile email",
    onSigninCallback: (_user) => {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
};

export const AuthWrapper = ({ children }) => {
    const onRxError = (error) => {
        console.error("OIDC Error:", error);
    };

    return (
        <AuthProvider {...oidcConfig} onRemoveUser={() => {}} onError={onRxError}>
            {children}
        </AuthProvider>
    );
};
