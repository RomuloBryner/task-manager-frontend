"use client";

import { RequestForm } from "@/components/RequestForm";
import axios from "axios";
import { useEffect, useState } from "react";

export default function RequestPage() {
  const [requestBody, setRequestBody] = useState<any>(null);

  useEffect(() => {
    // Hide sidebar and header
    const sidebar = document.querySelector('[data-component="sidebar"]') as HTMLElement;
    const header = document.querySelector('[data-component="header"]') as HTMLElement;

    if (sidebar) sidebar.style.display = 'none';
    if (header) header.style.display = 'none';

    const sidebar1 = document.querySelector('[aria-label="Main navigation"]') as HTMLElement;
    const header1 = document.querySelector('header') as HTMLElement;

    if (sidebar1) sidebar1.style.display = 'none';
    if (header1) header1.style.display = 'none';

    // Load fields from Strapi
    const fetchBody = async () => {
      try {
        const response = await axios.get(process.env.NEXT_PUBLIC_API_URL + "/request-body");
        const fields = response.data?.data?.request;
        setRequestBody(fields);
      } catch (error) {
        console.error("Error loading form body:", error);
      }
    };

    fetchBody();

    // Restore if necessary
    // return () => {
    //   if (sidebar) sidebar.style.display = 'block';
    //   if (header) header.style.display = 'block';
    // };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {requestBody ? (
        <RequestForm fields={requestBody} />
      ) : (
        <p className="text-gray-600">Loading form...</p>
      )}
    </div>
  );
}
