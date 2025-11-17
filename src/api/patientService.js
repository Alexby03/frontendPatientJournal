import axios from "axios";

const API_URL = "http://78.72.148.32:8080/api/patients";

export const getAllPatients = async () => {
    const res = await axios.get(API_URL);
    return res.data;
};

export const getPatientById = async (id) => {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data;
};

export const createPatient = async (patient) => {
    const res = await axios.post(API_URL, patient);
    return res.data;
};

export const updatePatient = async (id, patient) => {
    const res = await axios.put(`${API_URL}/${id}`, patient);
    return res.data;
};

export const deletePatient = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
};