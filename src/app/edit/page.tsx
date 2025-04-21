"use client";
import React, { useState, useEffect } from "react";
import { getRequestForms } from "@/utils/api";
import Link from "next/link";
import axios from "axios";

interface Form {
  documentId: string;
  title: string;
  info: string;
}

async function saveFormTitleAndInfo(title: string, info: string, documentId: string) {
  const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/request-forms/${documentId}`, {
    data: {
      title: title,
      info: info
    }
  });
  return response.data;
}

async function createNewForm(title: string) {
  const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/request-forms`, {
    data: {
      title: title,
      request: []
    }
  });
  return response.data;
}

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingForm, setEditingForm] = useState<Form | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formInfo, setFormInfo] = useState("");
  const [generalTitle, setGeneralTitle] = useState("");
  const [generalInfo, setGeneralInfo] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState("");

  const handleDeleteForm = async (documentId: string) => {
    if (confirm("Are you sure you want to delete this form?")) {
      try {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/request-forms/${documentId}`);
        // Refresh the forms list
        const response = await getRequestForms();
        setForms(response.data);
      } catch (error) {
        console.error("Error deleting form:", error);
        alert("Failed to delete form");
      }
    }
  };

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await getRequestForms();
        setForms(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching forms:", error);
        setLoading(false);
      }
    };
    
    const fetchGeneralInfo = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/request-body`);
        setGeneralTitle(response.data?.data?.title || "");
        setGeneralInfo(response.data?.data?.info || "");
      } catch (error) {
        console.error("Error fetching general info:", error);
      }
    };
    
    fetchGeneralInfo();
    fetchForms();
  }, []);

  const handleEdit = (form: Form) => {
    setEditingForm(form);
    setFormTitle(form.title);
    setFormInfo(form.info);
  };

  const handleSave = async () => {
    if (editingForm) {
      try {
        await saveFormTitleAndInfo(formTitle, formInfo, editingForm.documentId);
        setEditingForm(null);
        
        // Refresh the forms list
        const response = await getRequestForms();
        setForms(response.data);
      } catch (error) {
        console.error("Error saving form:", error);
      }
    }
  };

  const handleSaveGeneralInfo = async () => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/request-body`, {
        data: {
          title: generalTitle,
          info: generalInfo
        }
      });
      alert("General information updated successfully!");
    } catch (error) {
      console.error("Error saving general info:", error);
      alert("Failed to update general information");
    }
  };

  const handleCreateNewForm = async () => {
    if (!newFormTitle.trim()) {
      alert("Please enter a title for the new form");
      return;
    }
    
    try {
      await createNewForm(newFormTitle);
      setIsCreatingNew(false);
      setNewFormTitle("");
      
      // Refresh the forms list
      const response = await getRequestForms();
      setForms(response.data);
    } catch (error) {
      console.error("Error creating new form:", error);
      alert("Failed to create new form");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Forms Management</h1>
      
      {/* General info section */}
      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">General Information</h2>
        <div className="mb-4 flex items-start gap-4">
          <div className="w-1/3">
            <label htmlFor="generalTitle" className="block mb-1 font-medium">Title</label>
            <input
              type="text"
              id="generalTitle"
              value={generalTitle}
              onChange={(e) => setGeneralTitle(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div className="w-3/5">
            <label htmlFor="generalInfo" className="block mb-1 font-medium">Information</label>
            <textarea
              rows={4}
              id="generalInfo"
              value={generalInfo}
              onChange={(e) => setGeneralInfo(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>
        </div>
        <button 
          onClick={handleSaveGeneralInfo}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Save General Information
        </button>
      </div>
      
      {/* Forms list section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Available Forms</h2>
          <button 
            onClick={() => setIsCreatingNew(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Create New Form
          </button>
        </div>
        
        {/* Create new form dialog */}
        {isCreatingNew && (
          <div className="mb-6 p-4 border rounded-lg bg-blue-50">
            <h3 className="text-lg font-medium mb-3">Create New Form</h3>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                placeholder="Enter form title"
                value={newFormTitle}
                onChange={(e) => setNewFormTitle(e.target.value)}
                className="flex-grow rounded border px-3 py-2"
              />
              <button 
                onClick={handleCreateNewForm}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Create
              </button>
              <button 
                onClick={() => {
                  setIsCreatingNew(false);
                  setNewFormTitle("");
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Form editing section */}
        {editingForm && (
          <div className="mb-6 p-4 border rounded-lg bg-yellow-50">
            <h3 className="text-lg font-medium mb-3">Edit Form: {editingForm.title}</h3>
            <div className="mb-4 flex items-start gap-4">
              <div className="w-1/3">
                <label htmlFor="formTitle" className="block mb-1 font-medium">Title</label>
                <input
                  type="text"
                  id="formTitle"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Save Changes
              </button>
              <button 
                onClick={() => setEditingForm(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Forms list */}
        {forms.length > 0 ? (
  <ul className="border rounded-lg overflow-hidden">
    {forms.map((form) => (
      <li key={form.documentId} className="border-b last:border-b-0">
        <div className="flex items-center justify-between p-4 hover:bg-gray-50">
          <strong className="text-lg">{form.title || "Untitled Form"}</strong>
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(form)}
              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
            >
              Edit
            </button>
            <Link href={`/edit/${form.documentId}`}>
              <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                Design
              </button>
            </Link>
            <button
              onClick={() => handleDeleteForm(form.documentId)}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </li>
    ))}
  </ul>
) : (
  <p className="text-gray-500 italic">No forms available. Create one to get started.</p>
)}

      </div>
    </div>
  );
}
