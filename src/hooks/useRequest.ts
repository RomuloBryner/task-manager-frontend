// hooks/useRequests.ts
import { useEffect, useState } from "react";
import { getRequests, updateRequest } from "@/utils/api";

interface RequestAttributes {
  name: string;
  status: string;
  start_date: string;
  documentId: string;
}

interface Request {
  documentId: string;
  responsible: string;
  limit_date: string;
  progress: string;
  id: number;
  attributes: RequestAttributes;
}

export function useRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await getRequests();
        setRequests(response.data); // Adjust if the response structure is different
      } catch (error) {
        console.error("Error loading requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const changeStatus = async (documentId: string, newStatus: string) => {
    try {
      await updateRequest(documentId, { statuss: newStatus });
      setRequests((prev) =>
        prev.map((request: any) =>
          request?.documentId === documentId
            ? {
                ...request,
                attributes: {
                  ...request.attributes,
                  statuss: newStatus
                }
              }
            : request
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // responsible: formData.responsible,
  // limit_date: formData.limit_date,
  // progress: formData.progress,
  const nextDataStatus = async (documentId: string, responsible: string, progress: string) => {
    try {
      await updateRequest(documentId, { responsible, progress });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return { requests, loading, changeStatus, nextDataStatus };
}
