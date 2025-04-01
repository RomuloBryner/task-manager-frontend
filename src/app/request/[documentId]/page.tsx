"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getRequestById } from "@/utils/api";
import axios from "axios";

export default function RequestDetailPage() {
  const { documentId } = useParams();
  const [request, setRequest] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Hide layout elements
    const sidebar = document.querySelector(
      '[aria-label="Main navigation"]',
    ) as HTMLElement;
    const header = document.querySelector("header") as HTMLElement;

    if (sidebar) sidebar.style.display = "none";
    if (header) header.style.display = "none";

    const fetchData = async () => {
      if (!documentId) {
        setError("Invalid request ID");
        setLoading(false);
        return;
      }
    
      try {
        // Obtener data actual y todos los requests
        const [resRequest, resFields, allRequestsRes] = await Promise.all([
          getRequestById(documentId as string),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/request-body`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/requests?pagination[pageSize]=1000`)
        ]);
    
        const requestData: any = resRequest;
        setRequest(resRequest || null);
        const fieldsStrapi = resFields?.data?.data?.request || [];
        setFields(fieldsStrapi);
    
        const allRequests = allRequestsRes?.data?.data;
    
        // Ordenar todos por start_date y luego por createdAt
        allRequests.sort((a: any, b: any) => {
          const aStart = new Date(a.start_date).getTime();
          const bStart = new Date(b.start_date).getTime();
          if (aStart === bStart) {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          }
          return aStart - bStart;
        });

        // Buscar el índice de esta solicitud
        const position = allRequests.findIndex((r: any) => r.documentId === requestData.data.documentId) + 1;
        // Guardar el ID visible
        setRequest((prev: any) => ({
          ...prev,
          visibleId: position,
        }));
      } catch (err) {
        console.error(err);
        setError("Unable to load the request");
      } finally {
        setLoading(false);
      }
    };
    
    

    fetchData();

    return () => {
      if (sidebar) sidebar.style.display = "block";
      if (header) header.style.display = "block";
    };
  }, [documentId]);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg">Loading request...</div>
      </div>
    );

  if (error || !request)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg text-red-600">
          {error || "Request not found"}
        </div>
      </div>
    );

  const getStatusBadge = (status: string) => {
    const base = "inline-block rounded-full px-4 py-2 text-sm font-semibold";
    switch (status?.toLowerCase()) {
      case "pending":
        return `${base} bg-yellow-100 text-yellow-800`;
      case "approved":
        return `${base} bg-blue-100 text-blue-800`;
      case "in process":
        return `${base} bg-purple-100 text-purple-800`;
      case "completed":
        return `${base} bg-green-100 text-green-800`;
      case "canceled":
        return `${base} bg-red-100 text-red-800`;
      default:
        return `${base} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold">Request Status</h1>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Request ID:</span>
            <span className="font-medium">
              #{request.visibleId || request.data.documentId}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={getStatusBadge(request.data.statuss)}>
              {request.data.statuss}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">Requester:</span>
            <span className="font-medium">{request.data.name}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{request.data.email}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">Request Date:</span>
            <span className="font-medium">
              {new Date(request.data.start_date).toLocaleString("en-US", {
                timeZone: "America/Santo_Domingo",
                dateStyle: "long",
                timeStyle: "short",
              })}
            </span>
          </div>

          <div className="mt-6 border-t pt-6">
            <h2 className="mb-4 text-xl font-semibold">Current Progress</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Responsible:</span>
                <span className="font-medium">{request.data.responsible}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Limit Date:</span>
                <span className="font-medium">
                  {new Date(request.data.limit_date).toLocaleString("en-US", {
                    timeZone: "America/Santo_Domingo",
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </span>
              </div>

              <div className="flex w-full flex-col">
                <span className="mb-2 text-gray-600">Progress:</span>
                <div className="rounded bg-[#feefc3] p-3 text-left">
                  <span className="font-medium">{request.data.progress}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t pt-6">
            <h2 className="mb-4 text-xl font-semibold">
              Request Details
            </h2>

            <div className="grid grid-cols-2 gap-6">
              {fields.map((field, index) => {
                const value = request.data.request?.[field.name];

                // If the value is empty, null, or an empty object, do not display it
                if (
                  value === null ||
                  value === undefined ||
                  (typeof value === "object" && Object.keys(value).length === 0)
                ) {
                  return null;
                }

                return (
                  <div key={index}>
                    <h3 className="mb-1 font-medium text-gray-700">
                      {field.label}
                    </h3>

                    {field.type === "file" && value?.includes("http") ? (
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View attached file
                      </a>
                    ) : Array.isArray(value) ? (
                      <p className="text-gray-600">{value.join(", ")}</p>
                    ) : (
                      <p className="text-gray-600">{value}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
