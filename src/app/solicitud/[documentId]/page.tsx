"use client";

import { useEffect, useState, useLayoutEffect } from "react";
import { useParams } from "next/navigation";
import { getSolicitudById } from "@/utils/api";

interface SolicitudDetalle {
  objetivo: string;
  herramientas: string;
  fecha_limite: string;
  responsable: string;
  referencias?: string; // Cambiado a opcional
}

interface Solicitud {
  id: number;
  documentId: string;
  nombre: string;
  estado: string;
  fecha_inicio: string;
  correo: string;
  solicitud: SolicitudDetalle;
}

export default function SolicitudDetallePage() {
  const { documentId } = useParams();
  const [solicitud, setSolicitud] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useLayoutEffect(() => {
    console.log("OK");
  }, []);

  useEffect(() => {
    // Ocultar sidebar y header
    const sidebar = document.querySelector('[aria-label="Main navigation"]') as HTMLElement;
    const header = document.querySelector('header') as HTMLElement;

    if (sidebar) sidebar.style.display = 'none';
    if (header) header.style.display = 'none';

    const fetchSolicitud = async () => {
      if (!documentId) {
        setError("ID de solicitud no válido");
        setLoading(false);
        return;
      }

      try {
        const response = await getSolicitudById(documentId as string);
        setSolicitud(response?.data || null); // ignore the error
      } catch (err) {
        setError("No se pudo encontrar la solicitud");
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitud();

    // Restaurar al desmontar
    return () => {
      if (sidebar) sidebar.style.display = 'block';
      if (header) header.style.display = 'block';
    };
  }, [documentId]);

  useEffect(() => {
    // Ocultar sidebar y header
    const sidebar = document.querySelector('[data-component="sidebar"]') as HTMLElement;
    const header = document.querySelector('[data-component="header"]') as HTMLElement;

    if (sidebar) sidebar.style.display = 'none';
    if (header) header.style.display = 'none';

    return () => {
      if (sidebar) sidebar.style.display = 'block';
      if (header) header.style.display = 'block';
    };
  }, []);

  console.log(solicitud?.data);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-lg">Cargando solicitud...</div>
    </div>
  );

  if (error || !solicitud) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-lg text-red-600">{error || "Solicitud no encontrada"}</div>
    </div>
  );

  const getEstadoBadge = (estado: string) => {
    const base = "inline-block rounded-full px-4 py-2 text-sm font-semibold";
    switch (estado?.toLowerCase()) {
      case "pendiente":
        return `${base} bg-yellow-100 text-yellow-800`;
      case "aprobado":
        return `${base} bg-blue-100 text-blue-800`;
      case "en proceso":
        return `${base} bg-purple-100 text-purple-800`;
      case "completado":
        return `${base} bg-green-100 text-green-800`;
      case "cancelado":
        return `${base} bg-red-100 text-red-800`;
      default:
        return `${base} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Estado de Solicitud</h1>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">ID de Solicitud:</span>
            <span className="font-medium">{solicitud.documentId}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Estado:</span>
            <span className={getEstadoBadge(solicitud.estado)}>
              {solicitud.estado}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Solicitante:</span>
            <span className="font-medium">{solicitud.nombre}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Correo:</span>
            <span className="font-medium">{solicitud.correo}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Fecha de solicitud:</span>
            <span className="font-medium">
              {new Date(solicitud.fecha_inicio).toLocaleString("es-DO", {
                timeZone: "America/Santo_Domingo",
                dateStyle: "long",
                timeStyle: "short"
              })}
            </span>
          </div>

          <div className="border-t pt-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Detalles de la solicitud</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Objetivo</h3>
                <p className="text-gray-600">{solicitud.solicitud?.objetivo}</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Herramientas</h3>
                <p className="text-gray-600">{solicitud.solicitud?.herramientas}</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Fecha límite</h3>
                <p className="text-gray-600">
                  {new Date(solicitud.solicitud?.fecha_limite).toLocaleDateString("es-DO")}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Responsable</h3>
                <p className="text-gray-600">{solicitud.solicitud?.responsable}</p>
              </div>

              {solicitud.solicitud?.referencias && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Referencias</h3>
                  <p className="text-gray-600">{solicitud.solicitud?.referencias}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
