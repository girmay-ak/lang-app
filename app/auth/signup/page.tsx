"use client"

import { useRouter } from "next/navigation"
import { SignupFlow } from "@/components/signup-flow"

export default function SignupPage() {
  const router = useRouter()

  return (
    <SignupFlow
      onComplete={() => {
        router.replace("/app")
        router.refresh()
      }}
    />
  )
}

