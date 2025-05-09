"use client";

import { useState, useEffect } from "react";
import axios from "axios";

interface Field {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

const departments = [
  "Select Department",
  "Project",
  "VS Biopsy",
  "VS PPA",
  "BD Excellence",
  "Incoming and Supplier Quality",
  "Environmental Quality",
  "EHS",
  "Maintenance and Facilities",
  "Quality Assurance",
  "Quality Systems",
  "Other",
];

export function RequestForm({
  fields: initialFields,
  isEditMode = false,
}: {
  fields: Field[];
  isEditMode?: boolean;
}) {
  const [form, setForm] = useState<any>({
    name: "",
    global_id: "",
    email: "",
    department: "",
    limit_date: "",
    additional_info: "",
    request_type: "",
    request: {},
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formInfo, setFormInfo] = useState("");
  const [otherDepartment, setOtherDepartment] = useState(false);
  const [otherDepartmentText, setOtherDepartmentText] = useState("");
  const [otherSelect, setOtherSelect] = useState<string | null>(null);
  const [otherSelectText, setOtherSelectText] = useState("");
  const [forms, setForms] = useState<any>([]);
  const [fields, setFields] = useState<Field[]>(initialFields);

  const handleChange = (e: any) => {
    const { name, value, type, files } = e.target;

    if (
      name === "name" ||
      name === "email" ||
      name === "global_id" ||
      name === "department" ||
      name === "limit_date" ||
      name === "additional_info"
    ) {
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

  const handleDepartmentChange = (e: any) => {
    const value = e.target.value;

    if (value === "Select Department") {
      setForm((prev: any) => ({ ...prev, department: "" }));
      return;
    }

    if (value === "Other") {
      setOtherDepartment(true);
      setForm((prev: any) => ({ ...prev, department: otherDepartmentText }));
    } else {
      setOtherDepartment(false);
      setForm((prev: any) => ({ ...prev, department: value }));
    }
  };

  const handleSelectChange = (e: any, fieldName: string) => {
    const value = e.target.value;

    if (value === "__other__") {
      setOtherSelect(fieldName);
      setForm((prev: any) => ({
        ...prev,
        request: {
          ...prev.request,
          [fieldName]: "",
        },
      }));
      setOtherSelectText("");
    } else {
      setOtherSelect(null);
      setForm((prev: any) => ({
        ...prev,
        request: {
          ...prev.request,
          [fieldName]: value,
        },
      }));
    }
  };

  const uploadFileToStrapi = async (file: File) => {
    const formData = new FormData();
    formData.append("files", file);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data[0].url;
    } catch (err) {
      console.error("Error uploading file to Strapi:", err);
      throw err;
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

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
        global_id: form.global_id,
        department: form.department,
        email: form.email || "noemail@gmail.com",
        statuss: "Pending",
        start_date: new Date().toISOString(),
        limit_date: form.limit_date || "not provided",
        additional_info: form.additional_info || "not provided",
        request_type: form.request_type,
        request: requestData,
      },
    };

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/requests`,
        dataToSend,
      );

      const result = res.data;

      setSubmitted(true);
      setRequestId(result.data.documentId || result.data.id);
      setForm({
        name: "",
        email: "",
        department: "",
        limit_date: "",
        additional_info: "",
        request_type: "",
        request: {},
      });
      setError("");
    } catch (err) {
      console.error(err);
      setError("Error submitting the request");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTypeChange = async (e: any) => {
    const selectedFormId = e.target.value;
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/request-forms/${selectedFormId}`,
      );
      const formData = response.data?.data;
      setFields(formData.request || []);
      setFormTitle(formData.title);
      setFormInfo(formData.info);
      setForm((prev: any) => ({ ...prev, request_type: selectedFormId }));
    } catch (error) {
      console.error("Error loading form details:", error);
    }
  };

  useEffect(() => {
    const fetchTitle = async () => {
      try {
        const response = await axios.get(
          process.env.NEXT_PUBLIC_API_URL + "/request-body",
        );
        const { title, info } = response?.data?.data;
        setFormTitle(title);
        setFormInfo(info);
      } catch (error) {
        console.error("Error loading form title:", error);
      }
    };

    const fetchForms = async () => {
      try {
        const response = await axios.get(
          process.env.NEXT_PUBLIC_API_URL + "/request-forms",
        );
        const forms = response.data?.data;
        setForms(
          forms.map((form: any) => ({ ...form, wasAutoGenerated: false })),
        );
      } catch (error) {
        console.error("Error loading form body:", error);
      }
    };

    fetchTitle();
    fetchForms();
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-7xl space-y-4 rounded bg-white p-6 shadow"
    >
      <h2 className="mb-4 text-xl font-semibold">{formTitle}</h2>
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

      <label className="mb-1 block font-semibold">Requester Information</label>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium">
          Name <span style={{ color: "red" }}>*</span>
        </label>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="w-full rounded border px-3 py-2"
          required // Añade este atributo
        />
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium">
          Global ID <span style={{ color: "red" }}>*</span>
        </label>
        <input
          type="text"
          name="global_id"
          placeholder="Global ID"
          value={form.global_id}
          onChange={handleChange}
          className="w-full rounded border px-3 py-2"
          required // Añade este atributo
        />
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium">
          Department <span style={{ color: "red" }}>*</span>
        </label>
        <select
          name="department"
          value={form.department}
          onChange={handleDepartmentChange}
          className="w-full rounded border px-3 py-2"
          required // Añade este atributo
        >
          {departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
        {otherDepartment && (
          <input
            type="text"
            name="otherDepartmentInput"
            value={otherDepartmentText}
            onChange={(e) => {
              setOtherDepartmentText(e.target.value);
              setForm((prev: any) => ({ ...prev, department: e.target.value }));
            }}
            placeholder="Specify other department"
            className="mt-2 w-full rounded border px-3 py-2"
            required // Añade este atributo
          />
        )}
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium">Request Type <br/><small className={`${form.request_type != "" && "hidden"}`} style={{ color: "red" }}>Select your request type</small></label>
        <select
          name="request_type"
          value={form.request_type}
          onChange={handleRequestTypeChange}
          className="w-full rounded border px-3 py-2"
        >
          <option value="">Select a request type</option>
          {forms.map((form: any) => (
            <option key={form.documentId} value={form.documentId}>
              {form.title}
            </option>
          ))}
        </select>
      </div>

      <hr className="my-4 mb-8" />

      <label className="mb-1 block font-semibold">Request Details</label>
      {fields.map((field, idx) => {
        const commonProps = {
          name: field.name,
          value: form.request[field.name] || "",
          onChange: handleChange,
          className: "w-full rounded border px-3 py-2",
        };

        return (
          <div key={idx}>
            <label className="mb-1 block text-sm font-medium">
              {field.label}{" "}
              {field.required && <span style={{ color: "red" }}>*</span>}
            </label>

            {field.type === "text" && (
              <input type="text" {...commonProps} required={field.required} />
            )}
            {field.type === "textarea" && (
              <textarea {...commonProps} required={field.required} />
            )}
            {field.type === "date" && (
              <input type="date" {...commonProps} required={field.required} />
            )}
            {field.type === "file" && (
              <input
                type="file"
                name={field.name}
                onChange={handleChange}
                className="w-full"
                required={field.required}
              />
            )}
            {field.type === "select" && (
              <div>
                <select
                  name={field.name}
                  value={form.request[field.name] || ""}
                  onChange={(e) => handleSelectChange(e, field.name)}
                  className="w-full rounded border px-3 py-2"
                  required={field.required}
                >
                  <option value="">Select an option</option>
                  {field.options?.map((opt: string, i: number) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="__other__">Other</option>
                </select>

                {otherSelect === field.name && (
                  <input
                    type="text"
                    placeholder="Specify other option"
                    value={otherSelectText}
                    onChange={(e) => {
                      setOtherSelectText(e.target.value);
                      setForm((prev: any) => ({
                        ...prev,
                        request: {
                          ...prev.request,
                          [field.name]: e.target.value,
                        },
                      }));
                    }}
                    className="mt-2 w-full rounded border px-3 py-2"
                    required={field.required}
                  />
                )}
              </div>
            )}

            {field.type === "multiselect" && (
              <select
                name={field.name}
                multiple
                value={form.request[field.name] || []}
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
                required={field.required}
              >
                {field.options?.map((opt: string, i: number) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
          </div>
        );
      })}

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium">
          Expected delivery date:
        </label>
        <input
          type="date"
          name="limit_date"
          placeholder="Limit Date"
          min={new Date().toISOString().split("T")[0]}
          value={form.limit_date}
          onChange={handleChange}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label
          htmlFor="additional_info"
          className="mb-1 block text-sm font-medium"
        >
          Additional Information:
        </label>
        <textarea
          name="additional_info"
          value={form.additional_info}
          onChange={handleChange}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
      >
        {loading ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}
