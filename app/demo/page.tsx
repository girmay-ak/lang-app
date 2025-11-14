"use client"

import { DashboardLayout } from "@/components/dashboard/layout"

// Mock map component for demo
function MockMapComponent() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Simulated map tiles */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Mock markers */}
      <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50" />
      <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-pink-500 rounded-full animate-pulse shadow-lg shadow-pink-500/50" />
      <div className="absolute top-2/3 left-2/3 w-8 h-8 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50" />
      <div className="absolute top-1/3 right-1/3 w-8 h-8 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
      
      {/* Center indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg" />
    </div>
  )
}

// Mock partner data
const mockPartners = [
  {
    id: "1",
    name: "Emma",
    bio: "British expat in Den Haag",
    distance: "1.2 km",
    languages: "EN ↔ NL",
    matchScore: 87,
    isOnline: true,
    city: "Den Haag",
  },
  {
    id: "2",
    name: "Carlos",
    bio: "Spanish teacher & coffee lover",
    distance: "2.5 km",
    languages: "ES ↔ EN",
    matchScore: 92,
    isOnline: true,
    city: "Rotterdam",
  },
  {
    id: "3",
    name: "Yuki",
    bio: "Learning Dutch for work",
    distance: "3.1 km",
    languages: "JP ↔ NL",
    matchScore: 78,
    isOnline: false,
    city: "Den Haag",
  },
  {
    id: "4",
    name: "Ahmed",
    bio: "Tech professional learning languages",
    distance: "4.2 km",
    languages: "AR ↔ EN",
    matchScore: 85,
    isOnline: true,
    city: "Delft",
  },
  {
    id: "5",
    name: "Sophie",
    bio: "French native, loves culture exchange",
    distance: "5.1 km",
    languages: "FR ↔ NL",
    matchScore: 81,
    isOnline: false,
    city: "Den Haag",
  },
]

export default function DemoPage() {
  const handleSetAvailability = () => {
    console.log("Set availability clicked")
  }

  const handleOpenFilters = () => {
    console.log("Open filters clicked")
  }

  const handleRecenterMap = () => {
    console.log("Recenter map clicked")
  }

  const handleZoomIn = () => {
    console.log("Zoom in clicked")
  }

  const handleZoomOut = () => {
    console.log("Zoom out clicked")
  }

  return (
    <DashboardLayout
      mapComponent={<MockMapComponent />}
      onRecenterMap={handleRecenterMap}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      nearbyCount={mockPartners.length}
      cityName="Den Haag"
      userName="Alex Martinez"
      userAvatar="/diverse-person-smiling.png"
      userStatus="Active explorer"
      onSetAvailability={handleSetAvailability}
      onOpenFilters={handleOpenFilters}
      partners={mockPartners}
    />
  )
}



