"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRequests } from "@/hooks/useRequest";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRequestById } from "@/utils/api";
import axios from "axios";

const STATUSES = [
  "Approved",
  "In Process",
  "Completed",
  "Cancelled",
];

export function RequestsTable({ className }: { className?: string }) {
  const router = useRouter();
  const { requests, loading, changeStatus, nextDataStatus } = useRequests();
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [nextStepModalOpen, setNextStepModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<string | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [formData, setFormData] = useState({
    responsible: "",
    limit_date: "",
    progress: "",
  });
  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);

  useEffect(() => {
    if (requests && requests.length > 0) {
      const newStatuses: Record<string, string> = {};
      let hasChanges = false;

      requests.forEach((request: any) => {
        if (request.documentId && !localStatuses[request.documentId]) {
          newStatuses[request.documentId] = request.statuss || "Pending";
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setLocalStatuses(prev => ({
          ...prev,
          ...newStatuses
        }));
      }
    }
  }, [requests]);

  const fetchRequestDetails = async (documentId: string) => {
    if (!documentId) return;

    try {
      const [resRequest, resFields] = await Promise.all([
        getRequestById(documentId),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/request-body`),
      ]);

      setRequestDetails(resRequest || null);
      setFields(resFields?.data?.data?.request || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openUpdateModal = (id: string) => {
    const request = requests.find((r: any) => r.documentId === id);
    setCurrentRequest(id);
    setFormData({
      responsible: request?.responsible || "",
      limit_date: request?.limit_date || "",
      progress: request?.progress || "",
    });
    setUpdateModalOpen(true);
  };

  const openNextStepModal = (id: string) => {
    setCurrentRequest(id);
    setNextStepModalOpen(true);
  };

  const openCancelModal = (id: string) => {
    setCurrentRequest(id);
    setCancelModalOpen(true);
  };

  const closeModal = () => {
    setUpdateModalOpen(false);
    setNextStepModalOpen(false);
    setCancelModalOpen(false);
    setAcceptModalOpen(false);
    setCurrentRequest(null);
    setFormData({
      responsible: "",
      limit_date: "",
      progress: "",
    });
    setRequestDetails(null);
    setFields([]);
  };

  const handleUpdateFields = async () => {
    if (currentRequest) {
      setLoadingStatus(true);
      const currentRequestNow = requests.find((r: any) => r.documentId === currentRequest);
      const currentResponsible = currentRequestNow?.responsible;
      console.log(currentResponsible);
      try {
        await nextDataStatus(currentRequest.toString(), currentRequestNow?.responsible, formData.limit_date, formData.progress);
        closeModal();
      } catch (error) {
        console.error("Error updating fields:", error);
      } finally {
        setLoadingStatus(false);
      }
    }
  };

  const handleNextStep = async () => {
    if (currentRequest) {
      const currentStatus = localStatuses[currentRequest];
      let newStatus = "";

      if (currentStatus === "Approved") {
        newStatus = "In Process";
      } else if (currentStatus === "In Process") {
        newStatus = "Completed";
      }

      if (newStatus) {
        setLoadingStatus(true);
        try {
          await changeStatus(currentRequest.toString(), newStatus);
          setLocalStatuses(prev => ({
            ...prev,
            [currentRequest]: newStatus
          }));
          closeModal();
        } catch (error) {
          console.error("Error updating status:", error);
        } finally {
          setLoadingStatus(false);
        }
      }
    }
  };

  const handleCancelRequest = async () => {
    if (currentRequest) {
      setLoadingStatus(true);
      try {
        await changeStatus(currentRequest.toString(), "Cancelled");
        setLocalStatuses(prev => ({
          ...prev,
          [currentRequest]: "Cancelled"
        }));
        closeModal();
      } catch (error) {
        console.error("Error canceling request:", error);
      } finally {
        setLoadingStatus(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const base = "inline-block rounded-full px-3 py-1 text-sm font-semibold";
    if (!status) {
      return `${base} bg-gray-100 text-gray-800`;
    }
    switch (status.toLowerCase()) {
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

  const copyLink = (documentId: string) => {
    const link = `${window.location.origin}/request/${documentId}`;
    navigator.clipboard.writeText(link).then(() => {
      alert("Link copied to clipboard!");
    }).catch((err) => {
      console.error("Failed to copy link:", err);
    });
  };

  const acceptRequest = async (documentId: string) => {
    setCurrentRequest(documentId);
    await fetchRequestDetails(documentId);
    const currentRequestLimitDate = requestDetails?.data?.limit_date;
    setFormData({
      responsible: requestDetails?.data?.responsible || "",
      limit_date: currentRequestLimitDate || "",
      progress: requestDetails?.data?.progress || "",
    });
    setAcceptModalOpen(true);
  };

  const confirmAcceptRequest = async () => {
    if (currentRequest) {
      const limitDate = formData.limit_date;
      setLoadingStatus(true);
      try {
        await changeStatus(currentRequest.toString(), "Approved");
        await nextDataStatus(currentRequest.toString(), formData.responsible, limitDate, formData.progress);
        setLocalStatuses(prev => ({
          ...prev,
          [currentRequest]: "Approved"
        }));
        closeModal();
      } catch (error) {
        console.error("Error accepting request:", error);
      } finally {
        setLoadingStatus(false);
      }
    }
  };

  if (loading) return <div className="p-4">Loading requests...</div>;

  if (requests.length === 0) return <div className="p-4">No requests</div>;

  const pendingRequests = requests.filter(r => localStatuses[r.documentId] === "Pending");
  const activeRequests = requests.filter(r => localStatuses[r.documentId] !== "Pending" && localStatuses[r.documentId] !== "Cancelled" && localStatuses[r.documentId] !== "Completed");
  const completedRequests = requests.filter(r => localStatuses[r.documentId] === "Completed");
  const cancelledRequests = requests.filter(
    (r) => localStatuses[r.documentId] === "Cancelled",
  );

  return (
    <div className={`flex flex-col gap-8 w-full`}>
      <div className="flex gap-4 w-full">
        <div className="w-2/6 bg-white rounded p-6 shadow">
          <h2 className="mb-1 text-xl font-bold">New Requests</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Creation Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.map((r: any) => (
                <TableRow
                  key={r.id}
                  className="hover:bg-gray-50 cursor-pointer relative"
                  onMouseEnter={() => {
                    const badge = document.getElementById(`badge-${r.documentId}`);
                    if (badge) {
                      badge.style.display = 'block';
                    }
                  }}
                  onMouseLeave={() => {
                    const badge = document.getElementById(`badge-${r.documentId}`);
                    if (badge) {
                      badge.style.display = 'none';
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    copyLink(r.documentId);
                  }}
                >
                  <TableCell>{r?.name || "No name"}</TableCell>
                  <TableCell>
                    <span className={getStatusBadge("Pending")}>Pending</span>
                  </TableCell>
                  <TableCell>
                    {new Date(r?.start_date).toLocaleString('en-US', {
                      timeZone: 'America/Santo_Domingo',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        acceptRequest(r.documentId);
                      }}
                      className="rounded bg-green-500 px-3 py-1 text-white hover:bg-green-600"
                    >
                      Accept
                    </button>
                    <span
                      id={`badge-${r.documentId}`}
                      className="absolute top-[65%] left-[50%] translate-x-[-50%] translate-y-[-50%] mt-2 mr-2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden"
                    >
                      Copiar link
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="w-4/6 bg-white rounded p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">Active Requests</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Creation Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeRequests.map((r: any) => {
                const currentStatus = localStatuses[r.documentId] || "Approved";

                return (
                  <TableRow
                    key={r.id}
                    className="hover:bg-gray-50 cursor-pointer relative"
                    onMouseEnter={() => {
                      const badge = document.getElementById(`badge-${r.documentId}`);
                      if (badge) {
                        badge.style.display = 'block';
                      }
                    }}
                    onMouseLeave={() => {
                      const badge = document.getElementById(`badge-${r.documentId}`);
                      if (badge) {
                        badge.style.display = 'none';
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyLink(r.documentId);
                    }}
                  >
                    <TableCell>{r?.name || "No name"}</TableCell>
                    <TableCell>
                      <span className={getStatusBadge(currentStatus)}>
                        {currentStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(r?.start_date).toLocaleString('en-US', {
                        timeZone: 'America/Santo_Domingo',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openUpdateModal(r.documentId);
                        }}
                        className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
                      >
                        Update progress
                      </button>
                      {currentStatus !== "Completed" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openNextStepModal(r.documentId);
                          }}
                          className="ml-2 rounded bg-green-500 px-3 py-1 text-white hover:bg-green-600"
                        >
                          Next Step
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCancelModal(r.documentId);
                        }}
                        className={r.statuss === "Cancelled" ? `hidden` : `ml-2 rounded bg-red-500 px-3 py-1 text-white hover:bg-red-600`}
                      >
                        Cancel
                      </button>
                      <span
                        id={`badge-${r.documentId}`}
                        className="absolute top-[65%] left-[50%] translate-x-[-50%] translate-y-[-50%] mt-2 mr-2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden"
                      >
                        Copiar link
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="w-full bg-white rounded p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Completed Requests</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Creation Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {completedRequests.map((r: any) => {
              const currentStatus = localStatuses[r.documentId];

              return (
                <TableRow
                  key={r.id}
                  className="hover:bg-gray-50 cursor-pointer relative"
                  onMouseEnter={() => {
                    const badge = document.getElementById(`badge-${r.documentId}`);
                    if (badge) {
                      badge.style.display = 'block';
                    }
                  }}
                  onMouseLeave={() => {
                    const badge = document.getElementById(`badge-${r.documentId}`);
                    if (badge) {
                      badge.style.display = 'none';
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    copyLink(r.documentId);
                  }}
                >
                  <TableCell>{r?.name || "No name"}</TableCell>
                  <TableCell>
                    <span className={getStatusBadge(currentStatus)}>
                      {currentStatus}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(r?.start_date).toLocaleString('en-US', {
                      timeZone: 'America/Santo_Domingo',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      id={`badge-${r.documentId}`}
                      className="absolute top-[65%] left-[50%] translate-x-[-50%] translate-y-[-50%] mt-2 mr-2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden"
                    >
                      Copiar link
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="w-full bg-white rounded p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">Cancelled Requests</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Creation Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cancelledRequests.map((r: any) => {
              const currentStatus = localStatuses[r.documentId];

              return (
                <TableRow
                  key={r.id}
                  className="hover:bg-gray-50 cursor-pointer relative"
                  onMouseEnter={() => {
                    const badge = document.getElementById(`badge-${r.documentId}`);
                    if (badge) {
                      badge.style.display = 'block';
                    }
                  }}
                  onMouseLeave={() => {
                    const badge = document.getElementById(`badge-${r.documentId}`);
                    if (badge) {
                      badge.style.display = 'none';
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    copyLink(r.documentId);
                  }}
                >
                  <TableCell>{r?.name || "No name"}</TableCell>
                  <TableCell>
                    <span className={getStatusBadge(currentStatus)}>
                      {currentStatus}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(r?.start_date).toLocaleString('en-US', {
                      timeZone: 'America/Santo_Domingo',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      id={`badge-${r.documentId}`}
                      className="absolute top-[65%] left-[50%] translate-x-[-50%] translate-y-[-50%] mt-2 mr-2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden"
                    >
                      Copiar link
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {updateModalOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Update Fields</h3>
            {/* <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Responsible</label>
              <input
                type="text"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                className="w-full rounded border px-3 py-2"
              />
            </div> */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Progress</label>
              <textarea
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateFields}
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                disabled={loadingStatus}
              >
                {loadingStatus ? "Saving..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {nextStepModalOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-lg text-center">
            <h3 className="mb-4 text-lg font-semibold">Next Step</h3>
            <p>Do you want to move to the next step?</p>
            <button
              onClick={handleNextStep}
              className={`mt-4 rounded px-4 py-2 text-white ${currentRequest && localStatuses[currentRequest] === "Approved" ? "bg-purple-500 hover:bg-purple-600" : "bg-green-500 hover:bg-green-600"}`}
              disabled={loadingStatus}
            >
              {loadingStatus ? "Updating..." : `Next Step: ${currentRequest && localStatuses[currentRequest] === "Approved" ? "In Process" : "Completed"}`}
            </button>
            <button
              onClick={closeModal}
              className="mt-2 rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {cancelModalOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Cancel Request</h3>
            <p>Are you sure you want to cancel this request?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={closeModal}
                className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
              >
                No
              </button>
              <button
                onClick={handleCancelRequest}
                className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                disabled={loadingStatus}
              >
                {loadingStatus ? "Canceling..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {acceptModalOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
            <div className="mb-12">
              <h4 className="mb-2 text-lg font-semibold">Request Details</h4>
              <div className="grid grid-cols-2 gap-6">
                {fields.map((field, index) => {
                  const value = requestDetails?.data?.request?.[field.name];

                  if (
                    value === null ||
                    value === undefined ||
                    (typeof value === "object" && Object.keys(value).length === 0)
                  ) {
                    return null;
                  }

                  return (
                    <div key={index}>
                      <h5 className="mb-1 font-medium text-gray-700">
                        {field.label}
                      </h5>
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
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Responsible</label>
              <input
                type="text"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmAcceptRequest}
                className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                disabled={loadingStatus}
              >
                {loadingStatus ? "Accepting..." : "Accept"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
