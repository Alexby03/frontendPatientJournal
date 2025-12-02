import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
// Se till att sökvägen till AuthContext är korrekt för DITT projekt!
import { useAuth } from "../context/AuthContext";
import { fabric } from "fabric"; // "fabric": "5.3.0"
import "./PatientImages.css";

// URL:er från .env
const API_IMAGEEDITOR_URL = process.env.REACT_APP_API_IMAGEEDITOR_URL;
const API_SEARCHSERVICE_URL = process.env.REACT_APP_API_SEARCHSERVICE_URL;

function PatientImages() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const practitionerId = user?.id || user?.user_id;

    const [images, setImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [editingFilename, setEditingFilename] = useState("");

    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newImageFile, setNewImageFile] = useState(null);
    const [newImageFilename, setNewImageFilename] = useState("");
    const [patientSearchQuery, setPatientSearchQuery] = useState("");
    const [patientSearchResults, setPatientSearchResults] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const canvasRef = useRef(null);
    const fabricRef = useRef(null);


    const fetchImages = useCallback(async () => {
        if (!practitionerId) return;
        try {
            const res = await fetch(`${API_IMAGEEDITOR_URL}/images/practitioner/${practitionerId}`);
            if (!res.ok) throw new Error("Failed to fetch images");
            const data = await res.json();

            const rawImages = data.images || data || [];

            const imagesWithThumb = rawImages.map((img) => ({
                ...img,
                thumbUrl: img.thumb_data
                    ? `data:${img.mime_type};base64,${btoa(String.fromCharCode(...new Uint8Array(img.thumb_data.data)))}`
                    : null
            }));
            setImages(imagesWithThumb);
        } catch (err) {
            console.error("Error fetching images:", err);
        }
    }, [practitionerId]);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);


    useEffect(() => {
        if (!patientSearchQuery || patientSearchQuery.length < 2) {
            setPatientSearchResults([]);
            return;
        }
        const handler = setTimeout(async () => {
            try {
                const res = await fetch(`${API_SEARCHSERVICE_URL}/search/patients/name/${encodeURIComponent(patientSearchQuery)}?pageIndex=0&pageSize=10&eager=false`);
                if (res.ok) {
                    const data = await res.json();
                    setPatientSearchResults(data.items || data);
                } else {
                    setPatientSearchResults([]);
                }
            } catch (e) {
                console.error("Search error:", e);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [patientSearchQuery]);

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

    const handleUpload = async () => {
        if (!newImageFile || !selectedPatient) {
            alert("Please select a file and a patient.");
            return;
        }
        console.log("Selected Patient Object:", selectedPatient);
        setIsUploading(true);

        const formData = new FormData();
        formData.append("image", newImageFile);
        formData.append("filename", newImageFilename);
        formData.append("patient_id", selectedPatient.id);
        formData.append("patient_name", selectedPatient.fullName);
        formData.append("practitioner_id", practitionerId);
        formData.append("mime_type", newImageFile.type);

        try {
            const res = await fetch(`${API_IMAGEEDITOR_URL}/images/upload`, {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) throw new Error(await res.text());

            alert("Image uploaded successfully!");
            await fetchImages();
            handleCancelCreate();

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
            const res = await fetch(`${API_IMAGEEDITOR_URL}/images/${selectedImage.image_id}`, {
                method: "PUT",
                body: formData,
            });
            if (!res.ok) throw new Error(await res.text());

            alert("Image updated!");
            await fetchImages();
            handleCancelEdit();

        } catch (err) {
            alert(`Update failed: ${err.message}`);
        }
    };

    const openEditor = async (img) => {
        try {
            const res = await fetch(`${API_IMAGEEDITOR_URL}/images/${img.image_id}`);
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
            const res = await fetch(`${API_IMAGEEDITOR_URL}/images/${imageId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            setImages(images.filter(i => i.image_id !== imageId));
        } catch (err) {
            alert("Error deleting: " + err.message);
        }
    };

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
            left: 50,
            top: 50,
            fontSize: 24,
            fill: 'red',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            width: 150,
            editable: true,
            borderColor: 'red',
            cornerColor: 'red'
        });

        fabricRef.current.add(text);
        fabricRef.current.setActiveObject(text);
    };


    const deleteSelected = () => {
        if (!fabricRef.current) return;
        const activeObj = fabricRef.current.getActiveObject();
        if (activeObj) fabricRef.current.remove(activeObj);
    };

    useEffect(() => {
        if (!selectedImage || !selectedImage.fullImageUrl) return;

        const initCanvas = () => {
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

                const maxW = 1200;
                const maxH = 800;

                const scale = Math.min(
                    maxW / img.width,
                    maxH / img.height,
                    1
                );

                img.scale(scale);

                fabricRef.current.setDimensions({
                    width: img.getScaledWidth(),
                    height: img.getScaledHeight()
                });

                fabricRef.current.add(img);
                fabricRef.current.sendToBack(img);
            });
        };

        initCanvas();

        return () => {
            if (selectedImage.fullImageUrl) URL.revokeObjectURL(selectedImage.fullImageUrl);
            if (fabricRef.current) {
                fabricRef.current.dispose();
                fabricRef.current = null;
            }
        };
    }, [selectedImage]);

    return (
        <div className="patient-images-container">
            <div className="top-buttons">
                <button onClick={() => navigate("/doctor/patients")}>Back</button>
                <button onClick={() => { setIsCreatingNew(true); setSelectedImage(null); }}>Create New Image</button>
            </div>

            {/* SKAPA BILD MODAL */}
            {isCreatingNew && (
                <div className="create-new-modal" style={{ border: '2px solid #ccc', padding: '20px', margin: '20px 0', backgroundColor: '#f9f9f9' }}>
                    <h3>Upload New Image</h3>
                    {!newImageFile ? (
                        <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} />
                    ) : (
                        <div>
                            <img src={URL.createObjectURL(newImageFile)} alt="Preview" width={200} />

                            <div className="form-group">
                                <label>Image Filename:</label>
                                <input type="text" value={newImageFilename} onChange={(e) => setNewImageFilename(e.target.value)} />
                            </div>

                            <div className="form-group">
                                <label>Search Patient:</label>
                                <input type="text" placeholder="Start typing patient name..." value={patientSearchQuery} onChange={(e) => { setPatientSearchQuery(e.target.value); setSelectedPatient(null); }}/>
                                {patientSearchResults.length > 0 && !selectedPatient && (
                                    <ul className="search-results" style={{ border: '1px solid #ddd', listStyle: 'none', padding: 0 }}>
                                        {patientSearchResults.map(p => (
                                            <li key={p.user_id || p.id} // Använd rätt ID-fält
                                                style={{ padding: '5px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                                onClick={() => {
                                                    setSelectedPatient(p);
                                                    setPatientSearchQuery(p.fullName || "");
                                                    setPatientSearchResults([]);
                                                }}>
                                                {p.fullName}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {selectedPatient && <div style={{color: 'green', marginTop: 5}}>Selected: {selectedPatient.fullName}</div>}
                            </div>
                        </div>
                    )}
                    <div className="modal-buttons" style={{marginTop: 20}}>
                        <button onClick={handleUpload} disabled={!newImageFile || !selectedPatient || isUploading}>
                            {isUploading ? "Uploading..." : "Upload & Save"}
                        </button>
                        <button onClick={handleCancelCreate} style={{marginLeft: 10}}>Cancel</button>
                    </div>
                </div>
            )}

            {/* BILDTABELL */}
            {!isCreatingNew && !selectedImage && (
                <table className="images-table" style={{ width: '100%', marginTop: 20, borderCollapse: 'collapse' }}>
                    <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #ccc' }}>
                        <th>Thumbnail</th>
                        <th>Filename</th>
                        <th>Patient</th>
                        <th>Date</th>  {/* NY KOLUMN */}
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {images.map((img) => (
                        <tr key={img.image_id} style={{ borderBottom: '1px solid #eee' }}>
                            <td>
                                {img.thumbUrl ? <img src={img.thumbUrl} alt={img.filename} width={80} /> : "No thumb"}
                            </td>
                            <td>{img.filename}</td>
                            <td>{img.patient_name}</td>
                            <td>
                                {new Date(img.creation_date).toLocaleDateString('sv-SE')}
                            </td>
                            <td>
                                <button onClick={() => openEditor(img)}>Edit</button>
                                <button onClick={() => handleDelete(img.image_id)} style={{ marginLeft: 10, color: 'red' }}>Delete</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            {/* REDIGERING (EDITOR) */}
            {selectedImage && (
                <div className="canvas-editor">
                    <h3>Editing: {selectedImage.filename}</h3>
                    <div style={{ marginBottom: 10 }}>
                        <label>Rename: </label>
                        <input type="text" value={editingFilename} onChange={(e) => setEditingFilename(e.target.value)} />
                    </div>

                    <div style={{ border: '1px solid #ccc', display: 'inline-block' }}>
                        <canvas ref={canvasRef} />
                    </div>

                    <div className="canvas-controls" style={{ marginTop: '10px' }}>
                        <button onClick={handleUpdate} style={{ backgroundColor: 'green', color: 'white', padding: '10px 20px' }}>Save Changes</button>
                        <button onClick={handleCancelEdit} style={{ marginLeft: 10 }}>Cancel</button>

                        <div style={{ marginTop: 15, paddingTop: 10, borderTop: '1px solid #eee' }}>
                            <strong>Tools: </strong>
                            <button onClick={toggleDrawMode}>Pen Tool</button>
                            <button onClick={addRectangle}>Rectangle Tool</button>
                            <button onClick={addText}>Text Tool</button>
                            <button onClick={deleteSelected}>Delete Selected Object</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PatientImages;
