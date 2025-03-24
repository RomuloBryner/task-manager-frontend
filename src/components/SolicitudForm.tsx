"use client";

import { useState } from "react";
import { createSolicitud } from "@/utils/api";

export function FormularioSolicitud() {
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    solicitud: {
      objetivo: "",
      herramientas: "",
      fecha_limite: "",
      responsable: "",
      referencias: "",
    },
  });

  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const [solicitudId, setSolicitudId] = useState<string | null>(null);

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    if (name in form.solicitud) {
      setForm((prev) => ({
        ...prev,
        solicitud: {
          ...prev.solicitud,
          [name]: value,
        },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!form.nombre || !form.correo || Object.values(form.solicitud).some(v => v.trim() === "")) {
      setError("Todos los campos son obligatorios");
      return;
    }

    const dataToSend = {
      ...form,
      estado: "Pendiente",
      fecha_inicio: new Date().toISOString(),
    };

    try {
      const response = await createSolicitud(dataToSend);
      setEnviado(true);
      setSolicitudId(response.data.documentId);
      setForm({
        nombre: "",
        correo: "",
        solicitud: {
          objetivo: "",
          herramientas: "",
          fecha_limite: "",
          responsable: "",
          referencias: "",
        },
      });
      setError("");
    } catch (err) {
      setError("Error al enviar la solicitud");
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="max-w-7xl w-full space-y-4 rounded bg-white p-6 shadow relative"
      >
        <h2 className="text-xl font-semibold">Nueva Solicitud</h2>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {enviado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
              <div className="text-center">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">¡Solicitud enviada con éxito!</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Tu solicitud ha sido registrada y será procesada pronto.
                </p>
                <div className="space-y-3">
                  {solicitudId && (
                    <a
                      href={`/solicitud/${solicitudId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                    >
                      Ver estado de la solicitud
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEnviado(false);
                      setSolicitudId(null);
                    }}
                    className="inline-block w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                  >
                    Crear nueva solicitud
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
          className="w-full rounded border px-3 py-2"
          required
        />

        <input
          type="email"
          name="correo"
          placeholder="Correo electrónico"
          value={form.correo}
          onChange={handleChange}
          className="w-full rounded border px-3 py-2"
          required
        />

        <div className="space-y-3">
          <label className="block font-medium">Objetivo de la tarea</label>
          <input
            type="text"
            name="objetivo"
            value={form.solicitud.objetivo}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
          />

          <label className="block font-medium">Herramientas o tecnologías</label>
          <input
            type="text"
            name="herramientas"
            value={form.solicitud.herramientas}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
          />

          <label className="block font-medium">Fecha límite</label>
          <input
            type="date"
            name="fecha_limite"
            value={form.solicitud.fecha_limite}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
          />

          <label className="block font-medium">Responsable o colaborador</label>
          <input
            type="text"
            name="responsable"
            value={form.solicitud.responsable}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
          />

          <label className="block font-medium">Ejemplos o referencias</label>
          <textarea
            name="referencias"
            value={form.solicitud.referencias}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          Enviar solicitud
        </button>
      </form>
    </>
  );
}
