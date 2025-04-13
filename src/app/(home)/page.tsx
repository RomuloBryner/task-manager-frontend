"use client";
import { RequestsTable } from "@/components/SolicitudesTable";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

type PropsType = {
  searchParams: Promise<{
    selected_time_frame?: string;
  }>;
};

export default function Home() {   

  const copyCreateRequestLink = () => {
    const link = `${window.location.origin}/request`;
    navigator.clipboard.writeText(link).then(() => {
      alert("Link copied to clipboard!");
    }).catch((err) => {
      console.error("Failed to copy link:", err);
    });
  };

  return (
    <>
      <Breadcrumb pageName="Requests" />
      <div className="flex flex-col items-start justify-center gap-4">
        {/* Copy Create Request Link Button */}
        <button
          onClick={copyCreateRequestLink}
          className="col-span-2 rounded-md bg-purple-400 px-5 py-2 text-white"
        >
          Request Link
        </button>

        <RequestsTable className="col-span-12" />
      </div>
    </>
  );
}
