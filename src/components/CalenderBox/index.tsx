"use client";

import { Calendar } from "react-big-calendar";
import {
  parseISO,
  format,
  differenceInDays,
  isBefore,
  isAfter,
  startOfWeek,
  endOfWeek,
  addDays,
  differenceInHours,
} from "date-fns";
import { es } from "date-fns/locale";
import { useRequests } from "@/hooks/useRequest";
import { useMemo, useState } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  FileText,
  CheckCircle,
  User,
  Calendar as CalendarIcon,
  AlertTriangle,
} from "lucide-react";
import moment from "moment";
import { momentLocalizer } from "react-big-calendar";

interface PrintRequest {
  id: string;
  documentId: string;
  title: string;
  statuss: string;
  start: Date;
  end: Date | null;
  limit_date?: Date | null;
  client?: string;
  details?: any;
  daysRemaining?: number | null;
  department?: string;
  estimated_time?: number;
  global_id?: string;
  email?: string;
  expectedStartTime?: Date;
  estimated_end_date?: Date;
  timeConflict?: boolean;
  createdAt?: Date;
}

type CalendarView = "month" | "week" | "day" | "agenda";

export function RequestsCalendar() {
  const { requests, loading, changeStatus, nextDataStatus } = useRequests();
  const [selectedEvent, setSelectedEvent] = useState<PrintRequest | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentView, setCurrentView] = useState<CalendarView>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [formData, setFormData] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });

  // Horas laborales
  const WORK_START_HOUR = 8;
  const WORK_END_HOUR_WEEKDAY = 17; // 5 PM
  const WORK_END_HOUR_FRIDAY = 16; // 4 PM

  // Función para resaltar las horas laborales
  const highlightWorkingHours = (date: Date) => {
    const dayOfWeek = date.getDay();
    const hour = date.getHours();

    const isWorkingDay = dayOfWeek >= 1 && dayOfWeek <= 5; // Lunes a Viernes
    const isWorkingHour =
      dayOfWeek >= 1 && dayOfWeek <= 4
        ? hour >= WORK_START_HOUR && hour < WORK_END_HOUR_WEEKDAY
        : dayOfWeek === 5
        ? hour >= WORK_START_HOUR && hour < WORK_END_HOUR_FRIDAY
        : false;

    if (isWorkingDay && isWorkingHour) {
      return {
        style: {
          backgroundColor: "#eafbf0", // Color para resaltar las horas laborales
        },
      };
    }

    return {};
  };

  // Convertir los datos de solicitudes en eventos para el calendario
  const events = useMemo(() => {
    if (!requests || !Array.isArray(requests)) return [];

    const today = new Date();

    let mappedRequests = requests.map((req: any) => {
      // Usar start_date para la fecha de inicio
      const start = req.start_date ? parseISO(req.start_date) : new Date();

      // Manejar limit_date
      const limit_date = req.limit_date ? parseISO(req.limit_date) : null;

      // Calcular días restantes hasta la fecha límite
      const daysRemaining = limit_date
        ? differenceInDays(limit_date, today)
        : null;

      // Calcular horas en base a la fecha inicial y la fecha estimated_end_date
      const estimated_time = differenceInHours(req.estimated_end_date, start);

      return {
        id: req.id,
        documentId: req.documentId || "",
        title: req.name || "Sin título",
        // Usar statuss si existe, si no, usa progress
        statuss: req.statuss,
        start,
        estimated_end_date: req.estimated_end_date ? parseISO(req.estimated_end_date) : new Date(),
        end: null, // No se usa en este contexto
        limit_date,
        client: req.responsible || "",
        details: req.request || undefined,
        daysRemaining,
        department: req.department || "",
        estimated_time,
        global_id: req.global_id,
        email: req.email,
        createdAt: req.createdAt ? parseISO(req.createdAt) : new Date(),
      } as PrintRequest;
    });

    mappedRequests.sort(
      (a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0)
    );

    // Considerar las solicitudes activas
    const activeRequests = mappedRequests.filter((req) => {
      const status = req.statuss.toLowerCase();
      return ["approved", "pending"].includes(status) && status !== "cancelled";
    });

    activeRequests.forEach((req) => {
      // Asignar directamente la fecha de inicio como el tiempo estimado de inicio
      req.expectedStartTime = req.start;

      // Calcular la fecha estimada de finalización sumando el tiempo desde la fecha de inicio hasta el tiempo estimado de finalización
      const estimatedEndTime = new Date(req.start?.getTime());
      estimatedEndTime.setHours(
        estimatedEndTime.getHours() + (req.estimated_time || 1),
      );

      req.estimated_end_date = req.estimated_end_date;

      // Verificar si hay conflicto con la fecha límite
      if (
        req.limit_date &&
        req.estimated_end_date &&
        isAfter(req.estimated_end_date, req.limit_date)
      ) {
        req.timeConflict = true;
      }
    });

    return mappedRequests;
  }, [requests]);

  const groupedByDeadline = useMemo(() => {
    if (!events.length) return [];

    // Actualizado para excluir específicamente estado 'cancelled'
    const activeEvents = events.filter(
      (e) =>
        e.statuss.toLowerCase() === "in process" &&
        e.statuss.toLowerCase() !== "cancelled"
    );

    return activeEvents
      .sort((a, b) => {
        if (!a.limit_date || !b.limit_date) return 0;
        return a.limit_date.getTime() - b.limit_date.getTime();
      })
      .slice(0, 5);
  }, [events]);

  const workQueue = useMemo(() => {
    if (!events.length) return [];

    const activeEvents = events.filter((e) => {
      const status = e.statuss.toLowerCase();
      return ["approved", "pending"].includes(status) && status !== "cancelled";
    });

    return activeEvents
      .sort((a, b) => {
        if (!a.expectedStartTime || !b.expectedStartTime) return 0;
        return a.expectedStartTime.getTime() - b.expectedStartTime.getTime();
      })
      .slice(0, 5);
  }, [events]);

  const getEventColor = (event: PrintRequest) => {
    if (event.timeConflict) {
      return { bg: "#fef2f2", border: "#dc2626" };
    }
    if (!event.daysRemaining && event.daysRemaining !== 0) {
      return { bg: "#f3f4f6", border: "#9ca3af" };
    }
    if (event.daysRemaining < 0) {
      return { bg: "#fef2f2", border: "#ef4444" };
    }
    if (event.daysRemaining === 0) {
      return { bg: "#fef2f2", border: "#f97316" };
    }
    if (event.daysRemaining <= 2) {
      return { bg: "#fff7ed", border: "#f97316" };
    }
    if (event.daysRemaining <= 4) {
      return { bg: "#fefce8", border: "#eab308" };
    }
    return { bg: "#f0f9ff", border: "#3b82f6" };
  };

  const getStatusBadge = (status: string) => {
    // Aseguramos que status es una cadena y la convertimos a minúsculas
    const statusLower = String(status).toLowerCase();

    switch (statusLower) {
      case "pending":
        return (
          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
            Pendiente
          </span>
        );
      case "approved":
        return (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
            Aprobado
          </span>
        );
      case "completed":
        return (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
            Completado
          </span>
        );
      case "cancelled":
        return (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-800">
            Cancelado
          </span>
        );
      case "in progress":
        return (
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800">
            En progreso
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-800">
            {status}
          </span>
        );
    }
  };

  const eventStyleGetter = (event: PrintRequest) => {
    // Estados cancelados aparecen en gris
    if (event.statuss.toLowerCase() === "cancelled") {
      return {
        style: {
          backgroundColor: "#f3f4f6",
          borderLeft: "3px solid #9ca3af",
          color: "#6b7280",
          borderRadius: "4px",
          padding: "2px 8px",
          fontSize: "13px",
          textDecoration: "line-through",
        },
      };
    }

    const colors = getEventColor(event);
    return {
      style: {
        backgroundColor: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        color: "#1f2937",
        borderRadius: "4px",
        padding: "2px 8px",
        fontSize: "13px",
      },
    };
  };

  const CustomToolbar = ({ date, onNavigate, view, onView }: any) => (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => onNavigate("PREV")}
            className="rounded-lg p-1.5 hover:bg-gray-200"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              onNavigate("TODAY");
              setCurrentDate(new Date());
            }}
            className="rounded-lg px-3 py-1.5 text-sm hover:bg-gray-200"
          >
            Hoy
          </button>
          <button
            onClick={() => onNavigate("NEXT")}
            className="rounded-lg p-1.5 hover:bg-gray-200"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <h2 className="ml-1 hidden text-lg font-medium text-gray-800 sm:block">
          {view === "month"
            ? format(date, "MMMM yyyy")
            : view === "week"
            ? `${format(startOfWeek(date), "d MMM")} - ${format(
                endOfWeek(date),
                "d MMM"
              )}`
            : format(date, "EEEE, d MMMM")}
        </h2>
      </div>

      <div className="flex gap-1">
        <button
          onClick={() => onView("month")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            view === "month" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Mes
        </button>
        <button
          onClick={() => onView("week")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            view === "week" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Semana
        </button>
        <button
          onClick={() => onView("day")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            view === "day" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Día
        </button>
        <button
          onClick={() => onView("agenda")}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            view === "agenda" ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Lista
        </button>
      </div>
    </div>
  );

  const EventAgenda = ({ event }: { event: PrintRequest }) => {
    const colors = getEventColor(event);

    return (
      <div className="flex items-start border-b border-gray-100 p-2 hover:bg-gray-50">
        <div
          className="mr-2 mt-1 h-full w-1 self-stretch rounded-full"
          style={{ backgroundColor: colors.border }}
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-1">
            <h4 className="text-sm font-medium">{event.title}</h4>
            {getStatusBadge(event.statuss)}

            {event.timeConflict && (
              <span className="flex items-center gap-0.5 whitespace-nowrap rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                <AlertTriangle className="h-3 w-3" /> Retrasado
              </span>
            )}

            {event.daysRemaining != null &&
              event.daysRemaining <= 2 && (
                <span className="flex items-center gap-0.5 whitespace-nowrap rounded-full bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">
                  <Clock className="h-3 w-3" />
                  {event.daysRemaining < 0
                    ? `Retrasado ${Math.abs(event.daysRemaining)}d`
                    : event.daysRemaining === 0
                    ? "¡Hoy!"
                    : `${event.daysRemaining}d`}
                </span>
              )}
          </div>

          <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>{format(event.start, "dd/MM")}</span>

            {event.client && <span>Cliente: {event.client}</span>}

            {event.department && <span>Departamento: {event.department}</span>}

            {event.limit_date && (
              <span
                className={`${
                  event.daysRemaining && event.daysRemaining < 0
                    ? "font-medium text-red-600"
                    : ""
                }`}
              >
                Entrega limite: {format(event.limit_date, "dd/MM")}
              </span>
            )}

            {event.estimated_time && (
              <span>Tiempo: {event.estimated_time}h</span>
            )}
          </div>

          {event.expectedStartTime && event.estimated_end_date && (
            <div className="mt-1 rounded bg-gray-50 px-2 py-1 text-xs">
              <div className="flex gap-1">
                <span className="text-gray-500">Estimado:</span>
                <span className="font-medium">
                  {format(event.expectedStartTime, "dd/MM HH:mm")} -{" "}
                  {format(event.estimated_end_date, "dd/MM HH:mm")}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const DeadlineSummary = () => (
    <div className="mb-4 overflow-hidden rounded-lg border">
      <div className="border-b bg-gray-50 p-3">
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-medium text-gray-800">
            Próximas entregas
          </h3>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {groupedByDeadline.length ? (
          groupedByDeadline.map((event) => {
            const colors = getEventColor(event);
            return (
              <div
                key={event.id}
                className="flex cursor-pointer items-center gap-2 p-3 hover:bg-gray-50"
                onClick={() => {
                  setSelectedEvent(event as PrintRequest);
                  setIsPopupOpen(true);
                }}
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: colors.border }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between text-sm">
                    <h4 className="truncate font-medium">{event.title}</h4>
                    {event.daysRemaining != null &&
                      event.daysRemaining <= 2 && (
                        <span
                          className={`ml-2 whitespace-nowrap text-xs font-medium ${
                            event.daysRemaining < 0
                              ? "text-red-600"
                              : event.daysRemaining === 0
                              ? "text-orange-600"
                              : event.daysRemaining <= 2
                              ? "text-orange-500"
                              : "text-blue-600"
                          }`}
                        >
                          {event.daysRemaining < 0
                            ? `Retrasado (${Math.abs(event.daysRemaining)}d)`
                            : event.daysRemaining === 0
                            ? "¡Hoy!"
                            : (event.daysRemaining === 1
                              ? "1 día"
                              : `${event.daysRemaining} días`)}
                        </span>
                      )}
                  </div>
                  <div className="mt-0.5 flex justify-between text-xs text-gray-500">
                    <span>
                      Entrega limite:{" "}
                      {event.limit_date
                        ? format(event.limit_date, "dd/MM/yyyy")
                        : "No definida"}
                    </span>
                    {event.department && (
                      <span className="truncate">{event.department}</span>
                    )}
                  </div>
                  {event.timeConflict && (
                    <div className="mt-1 flex items-center text-xs text-red-600">
                      <AlertTriangle className="mr-1 h-3 w-3" /> Posible retraso
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">
            No hay entregas pendientes
          </div>
        )}
      </div>
    </div>
  );

  const WorkQueueSummary = () => (
    <div className="mb-4 overflow-hidden rounded-lg border">
      <div className="border-b bg-gray-50 p-3">
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-green-600" />
          <h3 className="text-sm font-medium text-gray-800">Cola de trabajo</h3>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {workQueue.length ? (
          workQueue.map((event) => (
            <div
              key={event.id}
              className="flex cursor-pointer items-center gap-2 p-3 hover:bg-gray-50"
              onClick={() => {
                setSelectedEvent(event as PrintRequest);
                setIsPopupOpen(true);
              }}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-800">
                {event.estimated_time}h
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between text-sm">
                  <h4 className="truncate font-medium">{event.title}</h4>
                  {getStatusBadge(event.statuss)}
                </div>
                <div className="mt-0.5 flex flex-col text-xs text-gray-500">
                  <span>
                    Inicio:{" "}
                    {event.expectedStartTime
                      ? format(event.expectedStartTime, "dd/MM HH:mm")
                      : "No definido"}
                  </span>
                  <span>
                    Fin:{" "}
                    {event.estimated_end_date
                      ? format(event.estimated_end_date, "dd/MM HH:mm")
                      : "No definido"}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">
            No hay trabajos en cola
          </div>
        )}
      </div>
    </div>
  );

  const validateSelectedDate = (date: Date): boolean => {
    const day = date.getDay();
    if (day === 0 || day === 6) {
      alert("Por favor seleccione un día entre lunes y viernes");
      return false;
    }
    return true;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      startDate: e.target.value,
    });
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      startTime: e.target.value,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      endDate: e.target.value,
    });
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      endTime: e.target.value,
    });
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedEvent(null);
  };

  const getTimeOptions = (date: string) => {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    const options = [];
    const startHour = 8;
    const endHour = dayOfWeek === 5 ? 16 : 17; // 4 PM on Friday, 5 PM otherwise

    for (let hour = startHour; hour < endHour; hour++) {
      options.push(
        <option key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
          {`${hour}:00 ${hour < 12 ? 'AM' : 'PM'}`}
        </option>
      );
    }
    return options;
  };

  const handleSaveChanges = async () => {
    if (!selectedEvent) return;

    const { startDate, startTime, endDate, endTime } = formData;

    const buildISO = (date: string, time: string) => {
      if (!date || !time) return null;

      // Asegurar que el time tenga el formato correcto HH:mm
      const parts = time.split(":");
      const hour = parts[0]?.padStart(2, "0") || "00";
      const minutes = parts[1]?.padStart(2, "0") || "00";

      return `${date}T${hour}:${minutes}:00`;
    };

    const combinedStartDateTime = buildISO(startDate, startTime);
    const combinedEndDateTime = buildISO(endDate, endTime);

    console.log("combinedStartDateTime:", combinedStartDateTime);
    console.log("combinedEndDateTime:", combinedEndDateTime);

    if (!combinedStartDateTime || !combinedEndDateTime) {
      alert("Por favor completa todas las fechas y horas antes de continuar.");
      return;
    }

    try {
      await nextDataStatus(
        selectedEvent.documentId,
        selectedEvent.client || "",
        selectedEvent.statuss,
        combinedEndDateTime,
        combinedStartDateTime
      ).then(() => {
        window.location.reload();
      });
      setIsPopupOpen(false);
      // Optionally refresh your data here
    } catch (error) {
      console.error("Error updating request:", error);
      alert("Error al guardar los cambios");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      <div className="hidden lg:col-span-1 lg:block">
        <DeadlineSummary />
        <WorkQueueSummary />
        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
          <h3 className="mb-2 text-sm font-medium text-blue-800">Leyenda</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-700">Retrasado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500"></div>
              <span className="text-xs text-gray-700">Urgente (0-2 días)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs text-gray-700">Próximo (3-4 días)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-700">Normal (5+ días)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3">
        <Calendar
          localizer={momentLocalizer(moment)}
          events={events}
          startAccessor="start"
          endAccessor="estimated_end_date"
          style={{ height: 700 }}
          min={new Date(2023, 0, 1, 8, 0)} // Establecer la hora mínima a las 8 AM
          max={new Date(2023, 0, 1, 18, 0)} // Establecer la hora máxima a las 5 PM
          messages={{
            today: "Hoy",
            previous: "Anterior",
            next: "Siguiente",
            month: "Mes",
            week: "Semana",
            day: "Día",
          }}
          views={["month", "week", "day", "agenda"]}
          onView={(view) => setCurrentView(view as CalendarView)}
          view={currentView}
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
          components={{
            toolbar: CustomToolbar,
            agenda: {
              event: EventAgenda,
            },
          }}
          eventPropGetter={eventStyleGetter}
          dayPropGetter={highlightWorkingHours}
          onSelectEvent={(event) => {
            const eventStart = event.start;
            const eventEnd = event.end || event.start;

            setSelectedEvent(event as PrintRequest);
            setFormData({
              startDate: format(eventStart, "yyyy-MM-dd"),
              startTime: format(eventStart, "HH:mm"),
              endDate: format(eventEnd, "yyyy-MM-dd"),
              endTime: format(eventEnd, "HH:mm"),
            });
            setIsPopupOpen(true);
          }}
        />
      </div>

      {/* Modal de detalles */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-medium">Detalles del pedido</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <h2 className="text-xl font-medium">{selectedEvent.title}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {getStatusBadge(selectedEvent.statuss)}

                  {selectedEvent.timeConflict && (
                    <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      <AlertTriangle className="h-3 w-3" /> Conflicto de tiempo
                    </span>
                  )}

                  {selectedEvent.daysRemaining != null &&
                    selectedEvent.daysRemaining <= 2 && (
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          selectedEvent.daysRemaining != null &&
                          selectedEvent.daysRemaining < 0
                            ? "bg-red-100 text-red-700"
                            : selectedEvent.daysRemaining === 0
                              ? "bg-orange-100 text-orange-700"
                              : selectedEvent.daysRemaining <= 2
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                        } flex items-center gap-1`}
                      >
                        <Clock className="h-3 w-3" />
                        {selectedEvent.daysRemaining < 0
                          ? `¡Vencido hace ${Math.abs(selectedEvent.daysRemaining)} días!`
                          : selectedEvent.daysRemaining === 0
                            ? "¡Entrega hoy!"
                            : `Faltan ${selectedEvent.daysRemaining} días`}
                      </span>
                    )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Cliente/Responsable</p>
                    <p className="font-medium">
                      {selectedEvent.client || "No especificado"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CalendarIcon className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Fecha de entrega</p>
                    <p className="font-medium">
                      {format(selectedEvent.start, "dd 'de' MMMM 'de' yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Detalles</p>

                    {selectedEvent.details ? (
                      <ul className="space-y-1">
                        {Object.entries(selectedEvent.details).map(
                          ([key, value]) => (
                            <li key={key}>
                              <strong className="capitalize">{key}:</strong>{" "}
                              {String(value)}
                            </li>
                          ),
                        )}
                      </ul>
                    ) : (
                      <p className="font-medium text-gray-500">
                        No especificado
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <hr />
              <div className="pb-6 flex items-center justify-end gap-4">
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Fecha de inicio</p>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={handleStartDateChange}
                      className="mt-1 rounded border px-2 py-1 text-sm"
                    />
                    <select
                      value={formData.startTime}
                      onChange={handleStartTimeChange}
                      className="mt-1 rounded border px-2 py-1 text-sm"
                    >
                      {getTimeOptions(formData.startDate)}
                    </select>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Fecha de fin</p>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={handleEndDateChange}
                      className="mt-1 rounded border px-2 py-1 text-sm"
                    />
                    <select
                      value={formData.endTime}
                      onChange={handleEndTimeChange}
                      className="mt-1 rounded border px-2 py-1 text-sm"
                    >
                      {getTimeOptions(formData.endDate)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleSaveChanges}
                  className="rounded bg-blue-500 px-4 py-2 text-white"
                >
                  Guardar cambios
                </button>
                <button
                  onClick={closePopup}
                  className="rounded border px-4 py-2 text-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
