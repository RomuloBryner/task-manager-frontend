"use client";
import { RequestsTable } from "@/components/SolicitudesTable";
import Link from "next/link";

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
      <div className="grid grid-cols-12 gap-4">

        {/* Copy Create Request Link Button */}
        <button
          onClick={copyCreateRequestLink}
          className="col-span-2 bg-purple-400 text-white p-2 rounded-md"
        >
          Copy Create Request Link
        </button>

        <RequestsTable className="col-span-12" />
      </div>
    </>
  );
}
