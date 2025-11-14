"use client"

import { CommunityLayout } from "@/components/dashboard/community-layout"

export default function CommunityPage() {
  return (
    <CommunityLayout
      userName="Araya"
      userAvatar="/diverse-person-smiling.png"
      userStatus="Active explorer"
      onSetAvailability={() => {
        console.log("Set availability clicked")
      }}
    />
  )
}

