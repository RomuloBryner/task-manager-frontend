const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337/api';

export const getSolicitudes = async () => {
  const response = await fetch(`${API_URL}/solicitudes`);
  const data = await response.json();
  return data;
};

export const getSolicitudById = async (documentId: string) => {
  const response = await fetch(`${API_URL}/solicitudes?filters[documentId][$eq]=${documentId}`);
  const data = await response.json();
  
  if (!data.data || data.data.length === 0) {
    throw new Error('Solicitud no encontrada');
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
    solicitud: {
      objetivo: attributes.solicitud?.objetivo || '',
      herramientas: attributes.solicitud?.herramientas || '',
      fecha_limite: attributes.solicitud?.fecha_limite || '',
      responsable: attributes.solicitud?.responsable || '',
      referencias: attributes.solicitud?.referencias || '',
    }
  };
};

export const createSolicitud = async (solicitudData: any) => {
  const response = await fetch(`${API_URL}/solicitudes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: solicitudData,
    }),
  });
  return response.json();
};

export const updateSolicitud = async (id: string, solicitudData: any) => {
  const response = await fetch(`${API_URL}/solicitudes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: solicitudData,
    }),
  });
  return response.json();
}; 