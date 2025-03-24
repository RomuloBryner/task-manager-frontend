// hooks/useSolicitudes.ts
import { useEffect, useState } from "react";
import { getSolicitudes, updateSolicitud } from "@/utils/api";

interface SolicitudAttributes {
  nombre: string;
  estado: string;
  fecha_inicio: string;
  documentId: string;
}

interface Solicitud {
  id: number;
  attributes: SolicitudAttributes;
}

export function useSolicitudes() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);

//   console.log(solicitudes);

  useEffect(() => {
    const fetchSolicitudes = async () => {
      try {
        const response = await getSolicitudes();
        setSolicitudes(response.data); // Ajusta si la respuesta es diferente
      } catch (error) {
        console.error("Error al cargar solicitudes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitudes();
  }, []);

  const cambiarEstado = async (documentId: string, nuevoEstado: string) => {
    try {
      await updateSolicitud(documentId, { estado: nuevoEstado });
      setSolicitudes((prev) =>
        prev.map((solicitud: any) => 
          solicitud?.documentId === documentId 
            ? { 
                ...solicitud, 
                attributes: { 
                  ...solicitud.attributes, 
                  estado: nuevoEstado 
                } 
              }
            : solicitud
        )
      );
    } catch (error) {
      console.error("Error al actualizar estado:", error);
    }
  };

  return { solicitudes, loading, cambiarEstado };
}
