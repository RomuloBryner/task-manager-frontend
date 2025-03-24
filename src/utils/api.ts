const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';

export const getSolicitudById = async (documentId: string) => {
  const response = await fetch(`${API_URL}/api/solicitudes?filters[documentId][$eq]=${documentId}`);
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