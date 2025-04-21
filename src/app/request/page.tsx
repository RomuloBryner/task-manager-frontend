"use client";

import { RequestForm } from "@/components/RequestForm";
import axios from "axios";
import { useEffect, useState } from "react";

export default function RequestPage() {
  const [requestBody, setRequestBody] = useState<any>(null);

  useEffect(() => {
    // Load fields from Strapi
    const fetchBody = async () => {
      try {
        const response = await axios.get(process.env.NEXT_PUBLIC_API_URL + "/request-body");
        const forms = await axios.get(
          process.env.NEXT_PUBLIC_API_URL + "/request-forms",
        );
        const fields = forms.data?.data;
        console.log(fields[1].request);
        setRequestBody(fields[1].request);
      } catch (error) {
        console.error("Error loading form body:", error);
      }
    };

    fetchBody();
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
