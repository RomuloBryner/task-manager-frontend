import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337/api';

export const getRequests = async () => {
  const response = await axios.get(`${API_URL}/requests`);
  return response.data;
};

export const getRequestById = async (documentId: string) => {
  const response = await axios.get(`${API_URL}/requests?filters[documentId][$eq]=${documentId}`);
  const data = response.data;
  
  if (!data.data || data.data.length === 0) {
    throw new Error('Request not found');
  }

  // Transformar la respuesta para que coincida con la estructura esperada
  const solicitud = data.data[0];
  const { id, attributes } = solicitud;
  
  return {
    id,
    documentId: attributes.documentId,
    nombre: attributes.nombre,
    estado: attributes.estado || 'Pendiente',
    fecha_inicio: attributes.fecha_inicio,
    correo: attributes.correo,
  };
};

export const createRequest = async (requestData: any) => {
  const response = await axios.post(`${API_URL}/requests`, {
    data: requestData,
  });
  return response.data;
};

export const updateRequest = async (id: string, requestData: any) => {
  const response = await axios.put(`${API_URL}/requests/${id}`, {
    data: requestData,
  });
  return response.data;
}; 