"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { RequestsCalendar } from "@/components/CalenderBox";
import { Metadata } from "next";

const CalendarPage = () => {
  return (
    <>
      <Breadcrumb pageName="Calendar" />

      <RequestsCalendar />
    </>
  );
};

export default CalendarPage;
