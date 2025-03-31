import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";

export const getRequests = async () => {
  const response = await axios.get(`${API_BASE}/requests?populate=*`);
  return response.data;
};

export const getRequestById = async (id) => {
  const response = await axios.get(`${API_BASE}/requests/${id}?populate=*`);
  return response.data;
};

export const createRequest = async (requestData) => {
  const response = await axios.post(`${API_BASE}/requests`, {
    data: requestData,
  });
  return response.data;
};

export const updateRequest = async (id, requestData) => {
  const response = await axios.put(`${API_BASE}/requests/${id}`, {
    data: requestData,
  });
  return response.data;
};

export const deleteRequest = async (id) => {
  const response = await axios.delete(`${API_BASE}/requests/${id}`);
  return response.data;
};
