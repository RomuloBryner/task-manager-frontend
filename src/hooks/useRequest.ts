// hooks/useRequest.ts
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:1337'; // Reemplaza con tu base real

export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface RequestData {
  id: string;
  title: string;
  description: string;
  requester: any; // Puedes tipar esto si tienes el modelo de User
  assigned_operator?: any;
  request_status: RequestStatus;
  scheduled_time?: string;
}

export const useRequest = (id: string) => {
  const [request, setRequest] = useState<RequestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await axios.get<RequestData>(`${API_BASE}/api/requests/${id}`);
        setRequest(response.data);
      } catch (error) {
        console.error('Error fetching request:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id]);

  return { request, loading };
};
