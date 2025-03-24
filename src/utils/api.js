import axios from "axios";

const API_BASE = "http://localhost:1337/api";

export const getSolicitudes = async () => {
  const response = await axios.get(`${API_BASE}/solicituds?populate=*`);
  return response.data;
};

export const getSolicitudById = async (id) => {
  const response = await axios.get(`${API_BASE}/solicituds/${id}?populate=*`);
  return response.data;
};

export const createSolicitud = async (solicitudData) => {
  const response = await axios.post(`${API_BASE}/solicituds`, {
    data: solicitudData,
  });
  return response.data;
};

export const updateSolicitud = async (id, solicitudData) => {
  const response = await axios.put(`${API_BASE}/solicituds/${id}`, {
    data: solicitudData,
  });
  return response.data;
};

export const deleteSolicitud = async (id) => {
  const response = await axios.delete(`${API_BASE}/solicituds/${id}`);
  return response.data;
};
