"use client";

import { useState } from "react";
import { createRequest } from "@/utils/api";
import axios from "axios";

export function RequestForm({ fields }: { fields: any[] }) {
  const [form, setForm] = useState<any>({
    name: "",
    email: "",
    request: {},
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);

  const handleChange = (e: any) => {
    const { name, value, type, files } = e.target;

    if (name === "name" || name === "email") {
      setForm((prev: any) => ({ ...prev, [name]: value }));
    } else {
      setForm((prev: any) => ({
        ...prev,
        request: {
          ...prev.request,
          [name]: type === "file" ? files[0] : value,
        },
      }));
    }
  };

  const uploadFileToStrapi = async (file: File) => {
    const formData = new FormData();
    formData.append("files", file);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/upload`, // Asegúrate de que esta URL sea correcta
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data[0].url; // Ajusta esto según la estructura de la respuesta de tu API
    } catch (err) {
      console.error("Error uploading file to Strapi:", err);
      throw err;
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!form.name || !form.email || fields.some(f => !form.request[f.name])) {
      setError("All fields are required");
      return;
    }

    const requestData: any = {};

    for (const field of fields) {
      const value = form.request[field.name];

      if (field.type === "file" && value instanceof File) {
        try {
          const fileUrl = await uploadFileToStrapi(value);
          requestData[field.name] = fileUrl;
        } catch (err) {
          setError("Error uploading file");
          return;
        }
      } else {
        requestData[field.name] = value;
      }
    }

    const dataToSend = {
      data: {
        name: form.name,
        email: form.email,
        statuss: "Pending",
        start_date: new Date().toISOString(),
        request: requestData,
      }
    };

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/requests`, dataToSend);

      const result = res.data;

      setSubmitted(true);
      setRequestId(result.data.documentId || result.data.id);
      setForm({ name: "", email: "", request: {} });
      setError("");
    } catch (err) {
      console.error(err);
      setError("Error submitting the request");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-7xl w-full space-y-4 rounded bg-white p-6 shadow relative"
    >
      <h2 className="text-xl font-semibold">New Request</h2>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {submitted && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
            <div className="text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Request sent successfully!</h3>
              <p className="text-sm text-gray-500 mb-6">Your request has been registered and will be processed soon.</p>
              <div className="space-y-3">
                {requestId && (
                  <a
                    href={`/request/${requestId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    View request status
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setRequestId(null);
                  }}
                  className="inline-block w-full bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                >
                  Create new request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <input
        type="text"
        name="name"
        placeholder="Name"
        value={form.name}
        onChange={handleChange}
        className="w-full rounded border px-3 py-2"
        required
      />

      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        className="w-full rounded border px-3 py-2"
        required
      />

      {fields.map((field, idx) => {
        const commonProps = {
          name: field.name,
          value: form.request[field.name] || "",
          onChange: handleChange,
          className: "w-full rounded border px-3 py-2",
        };

        return (
          <div key={idx}>
            <label className="block font-medium mb-1">{field.label}</label>

            {field.type === "text" && <input type="text" {...commonProps} />}
            {field.type === "textarea" && <textarea {...commonProps} />}
            {field.type === "date" && <input type="date" {...commonProps} />}
            {field.type === "file" && <input type="file" name={field.name} onChange={handleChange} className="w-full" />}
            {field.type === "select" && (
              <select {...commonProps}>
                <option value="">Select an option</option>
                {field.options.map((opt: string, i: number) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
            {field.type === "multiselect" && (
              <select
                name={field.name}
                multiple
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (opt: any) => opt.value);
                  setForm((prev: any) => ({
                    ...prev,
                    request: {
                      ...prev.request,
                      [field.name]: selected,
                    },
                  }));
                }}
                className="w-full rounded border px-3 py-2"
              >
                {field.options.map((opt: string, i: number) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}

      <button
        type="submit"
        className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        disabled={!form.name || !form.email || fields.some(f => !form.request[f.name])}
        onClick={handleSubmit}
      >
        Submit request
      </button>
    </form>
  );
}
