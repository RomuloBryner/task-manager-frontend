"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSolicitudes } from "@/hooks/useSolicitudes";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const ESTADOS = [
  "Pendiente",
  "Aprobado",
  "En proceso",
  "Completado",
  "Cancelado",
];

export function SolicitudesTable({ className }: { className?: string }) {
  const router = useRouter();
  const { solicitudes, loading, cambiarEstado } = useSolicitudes();
  const [modalOpen, setModalOpen] = useState(false);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");
  const [solicitudActual, setSolicitudActual] = useState<string | null>(null);
  const [estadosLocales, setEstadosLocales] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (solicitudes && solicitudes.length > 0) {
      const nuevosEstados: Record<string, string> = {};
      solicitudes.forEach((solicitud: any) => {
        if (solicitud.documentId) {
          if (!estadosLocales[solicitud.documentId]) {
            nuevosEstados[solicitud.documentId] = solicitud.estado || "Pendiente";
          }
        }
      });
      setEstadosLocales(prev => ({
        ...prev,
        ...nuevosEstados
      }));
    }
  }, [solicitudes, estadosLocales]);

  const abrirModal = (id: string, estadoActual: string) => {
    setSolicitudActual(id);
    setEstadoSeleccionado(estadoActual);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setSolicitudActual(null);
    setEstadoSeleccionado("");
  };

  const handleActualizarEstado = async () => {
    if (solicitudActual && estadoSeleccionado) {
      setCargando(true);
      try {
        await cambiarEstado(solicitudActual.toString(), estadoSeleccionado);
        setEstadosLocales(prev => ({
          ...prev,
          [solicitudActual]: estadoSeleccionado
        }));
        cerrarModal();
      } catch (error) {
        console.error("Error al actualizar el estado:", error);
        // Aquí podrías mostrar un mensaje de error al usuario
      } finally {
        setCargando(false);
      }
    }
  };

  const getEstadoBadge = (estado: string) => {
    const base = "inline-block rounded-full px-3 py-1 text-sm font-semibold";
    switch (estado.toLowerCase()) {
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

  if (loading) return <div className="p-4">Cargando solicitudes...</div>;
  
  if (solicitudes.length === 0) return <div className="p-4">No hay solicitudes</div>;

  if (modalOpen) {
    // Mostrar sombra y hacer el contenido mas oscuro para el header y el sidebar
    const header = document.querySelector('[data-component="header"]') as HTMLElement;
    const sidebar = document.querySelector('[data-component="sidebar"]') as HTMLElement;
    if (header) header.style.filter = 'blur(10px) brightness(0.5)';
    if (sidebar) sidebar.style.filter = 'blur(10px) brightness(0.5)';
  }

  return (
    <div className={`rounded bg-white w-full p-6 shadow ${className}`}>
      <h2 className="mb-4 text-xl font-bold">Solicitudes</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha de creación</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {solicitudes.map((s: any) => {
            const estadoActual = s.documentId && estadosLocales[s.documentId]
              ? estadosLocales[s.documentId]
              : s.estado || "Pendiente";

            return (
              <TableRow 
                key={s.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => window.open(`/solicitud/${s.documentId}`, '_blank')}
              >
                <TableCell>
                  {s?.nombre || "Sin nombre"}
                </TableCell>
                <TableCell>
                  <span className={getEstadoBadge(estadoActual)}>
                    {estadoActual}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(s?.fecha_inicio).toLocaleString('es-DO', {
                    timeZone: 'America/Santo_Domingo',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirModal(s.documentId, estadoActual);
                    }}
                    className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                  >
                    Cambiar estado
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {modalOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Cambiar estado</h3>
            <select
              value={estadoSeleccionado}
              onChange={(e) => setEstadoSeleccionado(e.target.value)}
              className="mb-4 w-full rounded border px-3 py-2"
            >
              {ESTADOS.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                onClick={cerrarModal}
                className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleActualizarEstado}
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                disabled={cargando}
              >
                {cargando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
