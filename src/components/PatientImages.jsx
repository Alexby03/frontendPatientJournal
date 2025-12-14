import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { fabric } from "fabric";
import "./PatientImages.css";
import { useApi } from "../utils/Api";

// URL:er från .env
const API_IMAGEEDITOR_URL = process.env.REACT_APP_API_IMAGEEDITOR_URL;
const API_SEARCHSERVICE_URL = process.env.REACT_APP_API_SEARCHSERVICE_URL;

function PatientImages() {
    const navigate = useNavigate();
    const auth = useAuth();
    const { request } = useApi(); // Vi använder denna för GET och JSON-anrop

    // Hämta ID
    const practitionerId = auth.user?.profile?.sub;
    const accessToken = auth.user?.access_token; // Behövs för manuell fetch vid upload

    const [images, setImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [editingFilename, setEditingFilename] = useState("");

    // State för uppladdning
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newImageFile, setNewImageFile] = useState(null);
    const [newImageFilename, setNewImageFilename] = useState("");

    // State för sökning
    const [patientSearchQuery, setPatientSearchQuery] = useState("");
    const [patientSearchResults, setPatientSearchResults] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);

    const [isUploading, setIsUploading] = useState(false);

    const canvasRef = useRef(null);
    const fabricRef = useRef(null);

    // ---------------------------------------------------------
    // 1. FIX: Stoppa loopen genom att flytta logiken in i useEffect
    // ---------------------------------------------------------
    useEffect(() => {
        let isMounted = true;

        const loadImages = async () => {
            if (!practitionerId || !auth.isAuthenticated) return;

            try {
                // Använd request här eftersom det är vanlig JSON GET
                const res = await request(`${API_IMAGEEDITOR_URL}/images/practitioner/${practitionerId}`);
                if (!res.ok) throw new Error("Failed to fetch images");

                const data = await res.json();
                if (isMounted) {
                    const rawImages = data.images || data || [];
                    const imagesWithThumb = rawImages.map((img) => ({
                        ...img,
                        thumbUrl: img.thumb_data
                            ? `data:${img.mime_type};base64,${btoa(String.fromCharCode(...new Uint8Array(img.thumb_data.data)))}`
                            : null
                    }));
                    setImages(imagesWithThumb);
                }
            } catch (err) {
                console.error("Error fetching images:", err);
            }
        };

        loadImages();

        return () => { isMounted = false; };
        // OBS: Vi tar bort 'request' från dependency array för att undvika loopar om useApi inte är stabil.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [practitionerId, auth.isAuthenticated]);


    // 2. Sök efter patienter (Debounce)
    useEffect(() => {
        if (!patientSearchQuery || patientSearchQuery.length < 2) {
            setPatientSearchResults([]);
            return;
        }
        const handler = setTimeout(async () => {
            try {
                const res = await request(`${API_SEARCHSERVICE_URL}/search/patients/name/${encodeURIComponent(patientSearchQuery)}`);
                if (res.ok) {
                    const data = await res.json();
                    setPatientSearchResults(Array.isArray(data) ? data : (data.items || []));
                } else {
                    setPatientSearchResults([]);
                }
            } catch (e) {
                console.error("Search error:", e);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [patientSearchQuery, request]); // Request här är oftast OK, men var uppmärksam

    const handleCancelCreate = () => {
        setIsCreatingNew(false);
        setNewImageFile(null);
        setNewImageFilename("");
        setPatientSearchQuery("");
        setPatientSearchResults([]);
        setSelectedPatient(null);
    };

    const handleCancelEdit = () => {
        if (fabricRef.current) {
            fabricRef.current.dispose();
            fabricRef.current = null;
        }
        setSelectedImage(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewImageFile(file);
            setNewImageFilename(file.name.replace(/\.[^/.]+$/, ""));
        }
    };

    // ---------------------------------------------------------
    // 3. FIX: Använd native fetch för FormData för att undvika JSON-fel
    // ---------------------------------------------------------
    const handleUpload = async () => {
        if (!newImageFile || !selectedPatient) {
            alert("Please select a file and a patient.");
            return;
        }

        setIsUploading(true);

        const formData = new FormData();
        formData.append("image", newImageFile);
        formData.append("filename", newImageFilename);

        const targetPatientId = selectedPatient.patientId || selectedPatient.id || selectedPatient.sub;
        formData.append("patient_id", targetPatientId);
        formData.append("patient_name", selectedPatient.fullName || selectedPatient.name || "Unknown");
        formData.append("practitioner_id", practitionerId);
        formData.append("mime_type", newImageFile.type);

        try {
            // VIKTIGT: Använd fetch direkt, inte request-wrappern.
            // Sätt INTE 'Content-Type'. Låt webbläsaren sätta multipart-headern.
            const res = await fetch(`${API_IMAGEEDITOR_URL}/images/upload`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                },
                body: formData,
            });

            if (!res.ok) throw new Error(await res.text());

            alert("Image uploaded successfully!");
            // Trigga en reload av bilder manuellt genom att uppdatera en trigger eller anropa en funktion
            window.location.reload(); // Enkel lösning, eller flytta ut fetchImages igen utanför useEffect om du vill vara snyggare.

        } catch (err) {
            alert(`Upload failed: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdate = async () => {
        if (!fabricRef.current || !selectedImage) return;

        const dataURL = fabricRef.current.toDataURL({ format: "png" });
        const blob = await (await fetch(dataURL)).blob();

        const formData = new FormData();
        formData.append("image", blob, `${editingFilename}.png`);
        formData.append("filename", editingFilename);
        formData.append("mime_type", "image/png");
        formData.append("width", fabricRef.current.width);
        formData.append("height", fabricRef.current.height);

        try {
            // Samma fix här: Använd native fetch för att skicka fil
            const res = await fetch(`${API_IMAGEEDITOR_URL}/images/${selectedImage.image_id}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                },
                body: formData,
            });

            if (!res.ok) throw new Error(await res.text());

            alert("Image updated!");
            handleCancelEdit();
            window.location.reload();

        } catch (err) {
            alert(`Update failed: ${err.message}`);
        }
    };

    const openEditor = async (img) => {
        try {
            const res = await request(`${API_IMAGEEDITOR_URL}/images/${img.image_id}`);
            if (!res.ok) throw new Error(await res.text());
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            setSelectedImage({ ...img, fullImageUrl: objectUrl });
            setEditingFilename(img.filename);
        } catch (err) {
            alert(`Could not open editor: ${err.message}`);
        }
    };

    const handleDelete = async (imageId) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            const res = await request(`${API_IMAGEEDITOR_URL}/images/${imageId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            setImages(images.filter(i => i.image_id !== imageId));
        } catch (err) {
            alert("Error deleting: " + err.message);
        }
    };

    // --- Fabric.js Tools ---
    const toggleDrawMode = () => {
        if (!fabricRef.current) return;
        fabricRef.current.isDrawingMode = !fabricRef.current.isDrawingMode;
        if (fabricRef.current.isDrawingMode) {
            const brush = new fabric.PencilBrush(fabricRef.current);
            brush.color = "red";
            brush.width = 5;
            fabricRef.current.freeDrawingBrush = brush;
        }
    };

    const addRectangle = () => {
        if (!fabricRef.current) return;
        fabricRef.current.isDrawingMode = false;
        const rect = new fabric.Rect({
            left: 100, top: 100, fill: 'transparent', stroke: 'red', strokeWidth: 3, width: 100, height: 100, selectable: true
        });
        fabricRef.current.add(rect);
    };

    const addText = () => {
        if (!fabricRef.current) return;
        fabricRef.current.isDrawingMode = false;
        const text = new fabric.Textbox("New Note", {
            left: 50, top: 50, fontSize: 24, fill: 'red', fontFamily: "Arial", fontWeight: 'bold', width: 150
        });
        fabricRef.current.add(text);
        fabricRef.current.setActiveObject(text);
    };

    const deleteSelected = () => {
        if (!fabricRef.current) return;
        const activeObj = fabricRef.current.getActiveObject();
        if (activeObj) fabricRef.current.remove(activeObj);
    };

    // --- Init Canvas ---
    useEffect(() => {
        if (!selectedImage || !selectedImage.fullImageUrl) return;
        if (!canvasRef.current) return;

        fabricRef.current = new fabric.Canvas(canvasRef.current, {
            isDrawingMode: true,
        });

        const brush = new fabric.PencilBrush(fabricRef.current);
        brush.color = "red";
        brush.width = 5;
        fabricRef.current.freeDrawingBrush = brush;

        fabric.Image.fromURL(selectedImage.fullImageUrl, (img) => {
            img.set({ selectable: false, evented: false });
            const maxW = 1000;
            const maxH = 700;
            const scale = Math.min(maxW / img.width, maxH / img.height, 1);
            img.scale(scale);

            fabricRef.current.setDimensions({
                width: img.getScaledWidth(),
                height: img.getScaledHeight()
            });

            fabricRef.current.add(img);
            fabricRef.current.sendToBack(img);
        });

        return () => {
            if (selectedImage.fullImageUrl) URL.revokeObjectURL(selectedImage.fullImageUrl);
            if (fabricRef.current) {
                fabricRef.current.dispose();
                fabricRef.current = null;
            }
        };
    }, [selectedImage]);

    if (auth.isLoading) return <div>Loading auth...</div>;
    if (!auth.isAuthenticated) return <div>Access Denied. Please log in.</div>;

    return (
        <div className="patient-images-container">
            <div className="top-buttons">
                <button onClick={() => navigate("/doctor/patients")}>Back</button>
                <button onClick={() => { setIsCreatingNew(true); setSelectedImage(null); }}>Create New Image</button>
            </div>

            {/* SKAPA BILD MODAL */}
            {isCreatingNew && (
                <div className="create-new-modal" style={{ border: '2px solid #ccc', padding: '20px', margin: '20px 0', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                    <h3>Upload New Image</h3>
                    {!newImageFile ? (
                        <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} />
                    ) : (
                        <div>
                            <img src={URL.createObjectURL(newImageFile)} alt="Preview" width={200} style={{border: "1px solid #ddd", marginBottom: "10px"}} />

                            <div className="form-group">
                                <label style={{display:"block", fontWeight:"bold"}}>Image Filename:</label>
                                <input type="text" value={newImageFilename} onChange={(e) => setNewImageFilename(e.target.value)} style={{width: "100%", padding: "5px"}}/>
                            </div>

                            <div className="form-group" style={{marginTop: "10px"}}>
                                <label style={{display:"block", fontWeight:"bold"}}>Search Patient:</label>
                                <input
                                    type="text"
                                    placeholder="Start typing patient name..."
                                    value={patientSearchQuery}
                                    onChange={(e) => { setPatientSearchQuery(e.target.value); setSelectedPatient(null); }}
                                    style={{width: "100%", padding: "5px"}}
                                />

                                {patientSearchResults.length > 0 && !selectedPatient && (
                                    <ul className="search-results" style={{ border: '1px solid #ddd', listStyle: 'none', padding: 0, marginTop: "5px", maxHeight: "150px", overflowY: "auto", backgroundColor: "white" }}>
                                        {patientSearchResults.map(p => (
                                            <li key={p.id || p.patientId || p.sub}
                                                style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                                onClick={() => {
                                                    setSelectedPatient(p);
                                                    setPatientSearchQuery(p.fullName || p.name || "Selected Patient");
                                                    setPatientSearchResults([]);
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "white"}
                                            >
                                                <strong>{p.fullName || p.name}</strong> <small>({p.email})</small>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {selectedPatient && <div style={{color: 'green', marginTop: 5, fontWeight: "bold"}}>Selected: {selectedPatient.fullName}</div>}
                            </div>
                        </div>
                    )}
                    <div className="modal-buttons" style={{marginTop: 20}}>
                        <button onClick={handleUpload} disabled={!newImageFile || !selectedPatient || isUploading} style={{padding: "10px 20px", cursor: "pointer"}}>
                            {isUploading ? "Uploading..." : "Upload & Save"}
                        </button>
                        <button onClick={handleCancelCreate} style={{marginLeft: 10, padding: "10px 20px", cursor: "pointer"}}>Cancel</button>
                    </div>
                </div>
            )}

            {/* BILDTABELL */}
            {!isCreatingNew && !selectedImage && (
                <table className="images-table" style={{ width: '100%', marginTop: 20, borderCollapse: 'collapse' }}>
                    <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #ccc', backgroundColor: "#eee" }}>
                        <th style={{padding: "10px"}}>Thumbnail</th>
                        <th style={{padding: "10px"}}>Filename</th>
                        <th style={{padding: "10px"}}>Patient</th>
                        <th style={{padding: "10px"}}>Date</th>
                        <th style={{padding: "10px"}}>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {images.length === 0 ? <tr><td colSpan="5" style={{padding:"20px", textAlign:"center"}}>No images found.</td></tr> :
                        images.map((img) => (
                            <tr key={img.image_id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{padding: "10px"}}>
                                    {img.thumbUrl ? <img src={img.thumbUrl} alt={img.filename} width={60} height={60} style={{objectFit: "cover", borderRadius: "4px"}} /> : "No thumb"}
                                </td>
                                <td style={{padding: "10px"}}>{img.filename}</td>
                                <td style={{padding: "10px"}}>{img.patient_name}</td>
                                <td style={{padding: "10px"}}>
                                    {new Date(img.creation_date).toLocaleDateString()}
                                </td>
                                <td style={{padding: "10px"}}>
                                    <button onClick={() => openEditor(img)} style={{marginRight: "5px"}}>Edit</button>
                                    <button onClick={() => handleDelete(img.image_id)} style={{ backgroundColor: "#ffcccc", color: "#cc0000", border: "1px solid #cc0000" }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* REDIGERING (EDITOR) */}
            {selectedImage && (
                <div className="canvas-editor" style={{marginTop: "20px"}}>
                    <h3>Editing: {selectedImage.filename}</h3>
                    <div style={{ marginBottom: 10 }}>
                        <label>Rename: </label>
                        <input type="text" value={editingFilename} onChange={(e) => setEditingFilename(e.target.value)} />
                    </div>

                    <div style={{ border: '1px solid #ccc', display: 'inline-block', boxShadow: "0 0 10px rgba(0,0,0,0.1)" }}>
                        <canvas ref={canvasRef} />
                    </div>

                    <div className="canvas-controls" style={{ marginTop: '10px' }}>
                        <button onClick={handleUpdate} style={{ backgroundColor: 'green', color: 'white', padding: '10px 20px', border: "none", cursor: "pointer" }}>Save Changes</button>
                        <button onClick={handleCancelEdit} style={{ marginLeft: 10, padding: '10px 20px', cursor: "pointer" }}>Cancel</button>

                        <div style={{ marginTop: 15, paddingTop: 10, borderTop: '1px solid #eee' }}>
                            <strong>Tools: </strong>
                            <button onClick={toggleDrawMode}>Pen</button>
                            <button onClick={addRectangle}>Rectangle</button>
                            <button onClick={addText}>Text</button>
                            <button onClick={deleteSelected} style={{marginLeft: "20px", color: "red"}}>Delete Object</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PatientImages;
