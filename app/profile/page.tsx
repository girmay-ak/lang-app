'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Camera, Save, MapPin, Globe, Mail, Calendar, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState({
    full_name: '',
    bio: '',
    city: '',
    country: '',
    avatar_url: ''
  })
  const [languages, setLanguages] = useState<any[]>([])

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/')
        return
      }

      setUser(session.user)

      // Get user profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          bio: profileData.bio || '',
          city: profileData.city || '',
          country: profileData.country || '',
          avatar_url: profileData.avatar_url || ''
        })
      }

      // Get user languages
      const { data: languagesData } = await supabase
        .from('user_languages')
        .select('*')
        .eq('user_id', session.user.id)

      if (languagesData) {
        setLanguages(languagesData)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('users')
        .update({
          full_name: profile.full_name,
          bio: profile.bio,
          city: profile.city,
          country: profile.country,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: 'Success!',
        description: 'Your profile has been updated',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  const languageNames: any = {
    'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
    'nl': 'Dutch', 'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian',
    'ar': 'Arabic', 'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean'
  }

  const languageFlags: any = {
    'en': '🇬🇧', 'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪',
    'nl': '🇳🇱', 'it': '🇮🇹', 'pt': '🇵🇹', 'ru': '🇷🇺',
    'ar': '🇸🇦', 'zh': '🇨🇳', 'ja': '🇯🇵', 'ko': '🇰🇷'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">My Profile</CardTitle>
              <CardDescription>Manage your TaalMeet profile and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-pink-500 to-teal-500 text-white">
                    {profile.full_name.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    <Camera className="w-4 h-4 mr-2" />
                    Change Photo
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">JPG, PNG or GIF (max. 2MB)</p>
                </div>
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="Your name"
                  className="mt-2"
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <Label>Email</Label>
                <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-muted rounded-md text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </div>
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell others about yourself..."
                  rows={4}
                  className="mt-2"
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    placeholder="Amsterdam"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={profile.country}
                    onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                    placeholder="Netherlands"
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Save Button */}
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-pink-500 to-teal-500 hover:from-pink-600 hover:to-teal-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Languages Card */}
          <Card>
            <CardHeader>
              <CardTitle>Languages</CardTitle>
              <CardDescription>Languages you speak and want to learn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Native Languages */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="text-pink-500">●</span>
                    I Speak
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {languages
                      .filter(l => l.language_type === 'native')
                      .map(lang => (
                        <Badge key={lang.id} variant="secondary" className="text-base py-2 px-4">
                          <span className="mr-2">{languageFlags[lang.language_code] || '🌍'}</span>
                          {languageNames[lang.language_code] || lang.language_code}
                          <span className="ml-2 text-xs text-muted-foreground">Native</span>
                        </Badge>
                      ))}
                    {languages.filter(l => l.language_type === 'native').length === 0 && (
                      <p className="text-sm text-muted-foreground">No languages added yet</p>
                    )}
                  </div>
                </div>

                {/* Learning Languages */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="text-teal-500">●</span>
                    I'm Learning
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {languages
                      .filter(l => l.language_type === 'learning')
                      .map(lang => (
                        <Badge key={lang.id} variant="secondary" className="text-base py-2 px-4">
                          <span className="mr-2">{languageFlags[lang.language_code] || '🌍'}</span>
                          {languageNames[lang.language_code] || lang.language_code}
                          <span className="ml-2 text-xs text-muted-foreground capitalize">{lang.proficiency_level}</span>
                        </Badge>
                      ))}
                    {languages.filter(l => l.language_type === 'learning').length === 0 && (
                      <p className="text-sm text-muted-foreground">No languages added yet</p>
                    )}
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4">
                  <Globe className="w-4 h-4 mr-2" />
                  Add Language
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Member since</span>
                <span className="font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {profile.city && profile.country ? `${profile.city}, ${profile.country}` : 'Not set'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

