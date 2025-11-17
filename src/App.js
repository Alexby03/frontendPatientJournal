import { BrowserRouter, Routes, Route} from "react-router-dom"
import { AuthProvider } from "./context/AuthContext";

import LoginForm from "./components/LoginForm";
import Register from "./components/Register";
import PatientDetail from "./components/PatientDetail";
import PatientList from "./components/PatientList";
import DoctorPatientDetail from "./components/DoctorPatientDetail";
import MessageInbox from "./components/MessageInbox";
import AddDiagnosisForm from "./components/AddDiagnosisForm";
import CreateNoteForm from "./components/CreateNoteForm";
import AddObservationForm from "./components/AddObservationForm";
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
                            <ProtectedRoute allowed={["Doctor"]}>
                                <AddDiagnosisForm />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/doctor/patient/:id/add-encounter"
                        element={
                            <ProtectedRoute allowed={["Doctor"]}>
                                <CreateNoteForm />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/doctor/patient/:id/add-observation"
                        element={
                            <ProtectedRoute allowed={["Doctor"]}>
                                <AddObservationForm />
                            </ProtectedRoute>
                        }
                    />

                    {/* UPDATE CONDITION / ENCOUNTER / OBSERVATION */}
                    <Route
                        path="/doctor/patient/:id/update-condition/:conditionId"
                        element={
                            <ProtectedRoute allowed={["Doctor"]}>
                                <AddDiagnosisForm />
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