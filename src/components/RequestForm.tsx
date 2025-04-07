"use client";

import { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formInfo, setFormInfo] = useState("");

  const handleChange = (e: any) => {
    const { name, value, type, files } = e.target;

    if (name === "name" || name === "email" || name === "global_id") {
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
    setLoading(true);

    if (!form.name || !form.email || fields.some(f => !form.request[f.name])) {
      setError("All fields are required");
      setLoading(false);
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
          setLoading(false);
          return;
        }
      } else {
        requestData[field.name] = value;
      }
    }

    const dataToSend = {
      data: {
        name: form.name,
        global_id: "123",
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTitle = async () => {
      try {
        const response = await axios.get(process.env.NEXT_PUBLIC_API_URL + "/request-body");
        const { title, info } = response?.data?.data;
        setFormTitle(title);
        setFormInfo(info);
      } catch (error) {
        console.error("Error loading form title:", error);
      }
    };

    fetchTitle();
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-7xl space-y-4 rounded bg-white p-6 shadow"
    >
      <h2 className="text-xl font-semibold">{formTitle}</h2>
      <small className="text-sm text-gray-500">{formInfo}</small>
      <hr className="my-4" />

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative mx-4 w-full max-w-md rounded-lg bg-white p-8">
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                Request sent successfully!
              </h3>
              <p className="mb-6 text-sm text-gray-500">
                Your request has been registered and will be processed soon.
              </p>
              <div className="space-y-3">
                {requestId && (
                  <a
                    href={`/request/${requestId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full rounded bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
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
                  className="inline-block w-full rounded bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300"
                >
                  Create new request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <label className="mb-1 block font-medium">Requester Information</label>

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
        type="text"
        name="global_id"
        placeholder="Global ID"
        value={form.global_id}
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
        className="w-full rounded border px-3 py-2 mb-6"
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
            <label className="mb-1 block font-medium">{field.label}</label>

            {field.type === "text" && <input type="text" {...commonProps} />}
            {field.type === "textarea" && <textarea {...commonProps} />}
            {field.type === "date" && <input type="date" {...commonProps} />}
            {field.type === "file" && (
              <input
                type="file"
                name={field.name}
                onChange={handleChange}
                className="w-full"
              />
            )}
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
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (opt: any) => opt.value,
                  );
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
        disabled={
          !form.name || !form.email || fields.some((f) => !form.request[f.name]) || loading
        }
      >
        {loading ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}
