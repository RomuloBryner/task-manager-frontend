"use client";

// Pagina de solicitud sin el sidebar

import { FormularioSolicitud } from "@/components/SolicitudForm";
import { useEffect } from "react";

export default function SolicitudPage() {
  useEffect(() => {
    // Ocultar sidebar y header
    const sidebar = document.querySelector('[data-component="sidebar"]') as HTMLElement;
    const header = document.querySelector('[data-component="header"]') as HTMLElement;
    
    if (sidebar) sidebar.style.display = 'none';
    if (header) header.style.display = 'none';

    const sidebar1 = document.querySelector('[aria-label="Main navigation"]') as HTMLElement;
    const header1 = document.querySelector('header') as HTMLElement;

    if (sidebar1) sidebar1.style.display = 'none';
    if (header1) header1.style.display = 'none';

    // Restaurar al desmontar
    // return () => {
    //   if (sidebar) sidebar.style.display = 'block'; 
    //   if (header) header.style.display = 'block';
    // };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <FormularioSolicitud />
    </div>  
  ); 
}
