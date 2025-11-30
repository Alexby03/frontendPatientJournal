import { BrowserRouter, Routes, Route} from "react-router-dom"
import { AuthProvider } from "./context/AuthContext";

import LoginForm from "./components/LoginForm";
import Register from "./components/Register";
import StaffPatient from "./components/StaffPatient";
import PatientDetail from "./components/PatientDetail";
import PatientList from "./components/PatientList";
import SearchPage from "./components/SearchPage";
import DoctorPatientDetail from "./components/DoctorPatientDetail";
import MessageInbox from "./components/MessageInbox";
import ConditionForm from "./components/ConditionForm";
import EncounterForm from "./components/EncounterForm";
import ObservationForm from "./components/ObservationForm";
import ProtectedRoute from "./components/ProtectedRoute";
import MessageThread from "./components/MessageThread";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>

                    {/* Login */}
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/register" element={<Register />} />

                    {/* Message dms and threads */}
                    <Route path="/messages" element={<MessageInbox />} />
                    <Route path="/messages/:threadId" element={<MessageThread />} />

                    {/* PATIENT ROUTES */}
                    <Route
                        path="/patient/me"
                        element={
                            <ProtectedRoute allowed={["Patient"]}>
                                <PatientDetail />
                            </ProtectedRoute>
                        }
                    />

                    {/* DOCTOR / STAFF ROUTES */}
                    <Route
                        path="/doctor/patients"
                        element={
                            <ProtectedRoute allowed={["Doctor", "OtherStaff"]}>
                                <PatientList />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/doctor/search"
                        element={
                            <ProtectedRoute allowed={["Doctor"]}>
                                <SearchPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/staff/patient/:id"
                        element={
                            <ProtectedRoute allowed={["OtherStaff"]}>
                                <StaffPatient />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/doctor/patient/:id"
                        element={
                            <ProtectedRoute allowed={["Doctor"]}>
                                <DoctorPatientDetail />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/doctor/messages"
                        element={
                            <ProtectedRoute allowed={["Doctor", "OtherStaff"]}>
                                <MessageInbox />
                            </ProtectedRoute>
                        }
                    />

                    {/* ADD NEW CONDITION / ENCOUNTER / OBSERVATION */}
                    <Route
                        path="/doctor/patient/:id/add-condition"
                        element={
                            <ProtectedRoute allowed={["Doctor", "OtherStaff"]}>
                                <ConditionForm />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/doctor/patient/:id/add-encounter"
                        element={
                            <ProtectedRoute allowed={["Doctor", "OtherStaff"]}>
                                <EncounterForm />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/doctor/patient/:id/add-observation"
                        element={
                            <ProtectedRoute allowed={["Doctor", "OtherStaff"]}>
                                <ObservationForm />
                            </ProtectedRoute>
                        }
                    />

                    {/* UPDATE CONDITION / ENCOUNTER / OBSERVATION */}
                    <Route
                        path="/doctor/patient/:id/update-condition/:conditionId"
                        element={
                            <ProtectedRoute allowed={["Doctor", "OtherStaff"]}>
                                <ConditionForm/>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/doctor/patient/:id/update-encounter/:encounterId"
                        element={
                            <ProtectedRoute allowed={["Doctor", "OtherStaff"]}>
                                <EncounterForm />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/doctor/patient/:id/update-observation/:observationId"
                        element={
                            <ProtectedRoute allowed={["Doctor", "OtherStaff"]}>
                                <ObservationForm />
                            </ProtectedRoute>
                        }
                    />


                    {/* DEFAULT / HOMEPAGE */}
                    <Route path="/" element={<LoginForm />} />

                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;