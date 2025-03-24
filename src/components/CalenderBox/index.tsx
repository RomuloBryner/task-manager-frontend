"use client";
import React, { useState, useEffect } from 'react';
import { useRequest, RequestData, RequestStatus } from '@/hooks/useRequest';
import * as api from '@/utils/api'

const statusColors: Record<RequestStatus, string> = {
  pending: 'bg-yellow-300',
  in_progress: 'bg-blue-300',
  completed: 'bg-green-300',
  cancelled: 'bg-red-300',
};

const CalendarBox = () => {
  const request = async () => await api.getRequests();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [requests, setRequests] = useState<RequestData[]>([]);

  // Simular múltiples requests para demostración
  // En una aplicación real, esto vendría de tu API
  useEffect(() => {
    const fetchRequests = async () => {
      const requests = await request();
      setRequests(requests);
    };
    fetchRequests();
  }, []);

  // Obtener el primer día del mes actual (para calcular el desplazamiento)
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Domingo, 1 = Lunes, etc.
  
  // Obtener el número total de días en el mes actual
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  
  // Función para ir al mes anterior
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  // Función para ir al mes siguiente
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  // Obtener nombre del mes actual
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  
  const currentMonthName = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  
  // Crear array con todos los días del mes
  const getDaysArray = () => {
    const daysArray = [];
    
    // Agregar celdas vacías para los días antes del primer día del mes
    for (let i = 0; i < startingDayOfWeek; i++) {
      daysArray.push(null);
    }
    
    // Agregar todos los días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      daysArray.push(day);
    }
    
    return daysArray;
  };
  
  // Obtener requests para un día específico
  const getRequestsForDay = (day: number) => {
    if (!day) return [];
    return requests.filter(req => {
      const reqDate = req.scheduled_time ? new Date(req.scheduled_time) : null;
      if (!reqDate) return false;
      return reqDate.getDate() === day && 
             reqDate.getMonth() === currentDate.getMonth() &&
             reqDate.getFullYear() === currentDate.getFullYear();
    });
  };
  
  // Renderizar una celda del día
  const renderDayCell = (day: number | null, index: number) => {
    if (day === null) {
      return (
        <td key={`empty-${index}`} className="ease relative h-20 cursor-default border border-stroke p-2 bg-gray-100 dark:bg-dark-3 md:h-25 md:p-6 xl:h-31"></td>
      );
    }
    
    const dayRequests = getRequestsForDay(day);
    const isToday = new Date().getDate() === day && 
                    new Date().getMonth() === currentDate.getMonth() &&
                    new Date().getFullYear() === currentDate.getFullYear();
    
    return (
      <td
        key={day}
        className={`ease relative h-20 cursor-pointer border border-stroke p-2 transition duration-500 hover:bg-gray-2 dark:border-dark-3 dark:hover:bg-dark-2 md:h-25 md:p-6 xl:h-31 ${
          isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
        }`}
      >
        <span className={`font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-dark dark:text-white'}`}>
          {day}
        </span>
        
        <div className="mt-1 max-h-16 overflow-y-auto">
          {dayRequests.map(req => (
            <div
              key={req.id}
              className={`text-xs mb-1 p-1 rounded truncate ${statusColors[req.request_status] || ''}`}
              title={req.title}
            >
              {req.title}
            </div>
          ))}
        </div>
      </td>
    );
  };
  
  // Agrupar los días en filas de 7 (una semana)
  const renderCalendarGrid = () => {
    const days = getDaysArray();
    const rows: React.ReactElement[][] = [];
    let cells: React.ReactElement[] = [];
    
    days.forEach((day, index) => {
      if (index % 7 === 0 && cells.length > 0) {
        rows.push(cells);
        cells = [];
      }
      
      cells.push(renderDayCell(day, index));
      
      if (index === days.length - 1) {
        // Añadir celdas vacías al final si es necesario
        const remainingCells = 7 - cells.length;
        for (let i = 0; i < remainingCells; i++) {
          cells.push(
            <td key={`end-empty-${i}`} className="ease relative h-20 cursor-default border border-stroke p-2 bg-gray-100 dark:bg-dark-3 md:h-25 md:p-6 xl:h-31"></td>
          );
        }
        rows.push(cells);
      }
    });
    
    return rows.map((row, rowIndex) => (
      <tr key={`row-${rowIndex}`} className="grid grid-cols-7">
        {row}
      </tr>
    ));
  };
  
  return (
    <div className="w-full max-w-full rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      {/* Controles de navegación del mes */}
      <div className="flex items-center justify-between p-4 border-b border-stroke dark:border-dark-3">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-2"
        >
          &larr;
        </button>
        
        <h2 className="text-xl font-semibold text-dark dark:text-white">
          {currentMonthName} {currentYear}
        </h2>
        
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-2"
        >
          &rarr;
        </button>
      </div>
      
      {/* Calendario */}
      <table className="w-full">
        <thead>
          <tr className="grid grid-cols-7 rounded-t-[10px] bg-primary text-white">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <th
                key={day}
                className="flex h-15 items-center justify-center p-1 text-body-xs font-medium sm:text-base xl:p-5"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {false ? (
            <tr>
              <td colSpan={7} className="h-60 text-center">
                <div className="flex items-center justify-center h-full">
                  Cargando...
                </div>
              </td>
            </tr>
          ) : (
            renderCalendarGrid()
          )}
        </tbody>
      </table>
      
      {/* Leyenda de colores */}
      <div className="p-4 border-t border-stroke dark:border-dark-3">
        <div className="text-sm font-semibold mb-2 text-dark dark:text-white">Estados:</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusColors).map(([status, colorClass]) => (
            <div key={status} className="flex items-center">
              <div className={`w-4 h-4 mr-1 rounded ${colorClass}`}></div>
              <span className="text-xs capitalize">{status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarBox;