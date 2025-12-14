import React from "react";
import { AuthProvider } from "react-oidc-context";

const oidcConfig = {
    authority: "http://localhost:8080/realms/PatientJournal",
    client_id: "patientjournal-keycloak",
    redirect_uri: "http://localhost:3000/",
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
