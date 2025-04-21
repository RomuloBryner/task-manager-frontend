// hooks/useRequests.ts
import { useEffect, useState } from "react";
import { getRequests, updateRequest } from "@/utils/api";

interface RequestAttributes {
  name: string;
  status: string;
  documentId: string;
}

interface Request {
  documentId: string;
  responsible: string;
  limit_date: string;
  progress: string;
  start_date: string;
  estimated_end_date: string;
  cancel_info: string;
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
      console.log("Updating status for documentId:", documentId, "to:", newStatus);
      // Set end date if status is "Completed"
      if (newStatus === "Completed") {
        const endDate = new Date().toISOString();
        await updateRequest(documentId, { end_date: endDate });
      } else {
        await updateRequest(documentId, { end_date: null });
      }
      await updateRequest(documentId, { statuss: newStatus });
      setRequests((prev) =>
        prev.map((request: any) =>
          request?.documentId === documentId
            ? {
                ...request,
                attributes: {
                  ...request.attributes,
                  statuss: newStatus,
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
  const nextDataStatus = async (
    documentId: string,
    responsible: string,
    progress: string,
    estimated_end_date: string,
    start_date: string,
  ) => {
    try {
      await updateRequest(documentId, {
        responsible,
        progress,
        estimated_end_date,
        start_date,
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return { requests, loading, changeStatus, nextDataStatus };
}
