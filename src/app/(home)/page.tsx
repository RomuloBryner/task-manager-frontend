import { PaymentsOverview } from "@/components/Charts/payments-overview";
import { UsedDevices } from "@/components/Charts/used-devices";
import { WeeksProfit } from "@/components/Charts/weeks-profit";
import { TopChannels } from "@/components/Tables/top-channels";
import { TopChannelsSkeleton } from "@/components/Tables/top-channels/skeleton";
import { createTimeFrameExtractor } from "@/utils/timeframe-extractor";
import { Suspense } from "react";
import { ChatsCard } from "./_components/chats-card";
import { OverviewCardsGroup } from "./_components/overview-cards";
import { OverviewCardsSkeleton } from "./_components/overview-cards/skeleton";
import { RegionLabels } from "./_components/region-labels";
import * as api from "@/utils/api";
import { SolicitudesTable } from "@/components/SolicitudesTable";

type PropsType = {
  searchParams: Promise<{
    selected_time_frame?: string;
  }>;
};

export default async function Home({ searchParams }: PropsType) {
  const { selected_time_frame } = await searchParams;
  const extractTimeFrame = createTimeFrameExtractor(selected_time_frame);

  // const requests = await api.getRequests();
  // console.log(requests);

  // create a request
  // const createRequest = await api.createRequest({
  //   title: "Test Request",
  //   description: "Test Description",
  //   request_status: "pending",
  // });
  // console.log(createRequest);

  return (
    <>
        <SolicitudesTable className="col-span-12" />
    </>
  );
}
