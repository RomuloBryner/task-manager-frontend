"use client";

import { RequestForm } from "@/components/RequestForm";
import axios from "axios";
import { useEffect, useState } from "react";

export default function RequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
        <RequestForm fields={[]} />
    </div>
  );
}
