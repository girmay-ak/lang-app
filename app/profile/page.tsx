"use client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Globe, MapPin, Calendar, Mail, Phone } from "lucide-react"
import { useState } from "react"

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    full_name: "John Doe",
    bio: "Software Developer",
    email: "john.doe@example.com",
    phone: "123-456-7890",
    location: "New York",
    is_available: true,
    native_languages: ["English", "Spanish"],
    learning_languages: ["French", "German"],
    created_at: new Date().toISOString(),
  })
  const [isEditing, setIsEditing] = useState(false)
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-pink-900">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header Card */}
        <Card className="p-6 mb-6 card-float">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                {profile.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
              {profile.is_available && (
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-gray-800 animate-pulse-ring" />
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {profile.full_name || "Anonymous User"}
                  </h1>
                  {profile.bio && <p className="text-gray-600 dark:text-gray-300 text-lg">{profile.bio}</p>}
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
                {profile.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {profile.email}
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {profile.phone}
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </div>
                )}
              </div>

              {/* Availability Badge */}
              <div className="mt-4">
                <Badge variant={profile.is_available ? "default" : "secondary"} className="text-sm">
                  {profile.is_available ? "Available for Exchange" : "Not Available"}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Languages Section with Flag Display */}
        <Card className="p-6 mb-6 card-float">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Globe className="w-6 h-6" />
              My Languages
            </h2>
            <Button variant="outline" size="sm" onClick={() => setShowLanguageSelector(true)} className="gap-2">
              <Pencil className="w-4 h-4" />
              Edit Languages
            </Button>
          </div>

          {profile.native_languages && profile.native_languages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                Native Languages
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {profile.native_languages.map((lang) => (
                  <div
                    key={lang}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-700 card-transition hover:shadow-lg"
                  >
                    <span className="text-4xl">{getLanguageFlag(lang)}</span>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{lang}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile.learning_languages && profile.learning_languages.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                Learning Languages
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {profile.learning_languages.map((lang) => (
                  <div
                    key={lang}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-2 border-green-200 dark:border-green-700 card-transition hover:shadow-lg"
                  >
                    <span className="text-4xl">{getLanguageFlag(lang)}</span>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{lang}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!profile.native_languages || profile.native_languages.length === 0) &&
            (!profile.learning_languages || profile.learning_languages.length === 0) && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No languages added yet. Click "Edit Languages" to get started!</p>
              </div>
            )}
        </Card>

        {/* Stats Card */}
        <Card className="p-6 card-float">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Activity
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {profile.native_languages?.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Native Languages</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {profile.learning_languages?.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Learning Languages</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {new Date(profile.created_at).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Member Since</div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}

// Helper function to get language flags
function getLanguageFlag(language: string): string {
  const flagMap: Record<string, string> = {
    English: "🇬🇧",
    Spanish: "🇪🇸",
    French: "🇫🇷",
    German: "🇩🇪",
    Italian: "🇮🇹",
    Portuguese: "🇵🇹",
    Russian: "🇷🇺",
    Chinese: "🇨🇳",
    Japanese: "🇯🇵",
    Korean: "🇰🇷",
    Arabic: "🇸🇦",
    Hindi: "🇮🇳",
    Dutch: "🇳🇱",
    Swedish: "🇸🇪",
    Polish: "🇵🇱",
    Turkish: "🇹🇷",
    Greek: "🇬🇷",
    Hebrew: "🇮🇱",
    Thai: "🇹🇭",
    Vietnamese: "🇻🇳",
  }
  return flagMap[language] || "🌐"
}

export default ProfilePage
