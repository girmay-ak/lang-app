'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, ArrowRight, Upload, MapPin, Globe, CheckCircle2, Loader2, Shield, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { validateSignupData, getPasswordStrength } from '@/lib/validation'
import { parseAuthError, logSecurityEvent } from '@/lib/auth-helpers'

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    nativeLanguage: '',
    learningLanguage: '',
    city: '',
    country: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalSteps = 4

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      // Validate name
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required'
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters'
      }

      // Validate email
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }

      // Validate password
      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else {
        const strength = getPasswordStrength(formData.password)
        if (strength.score < 4) {
          newErrors.password = 'Password is too weak. ' + (strength.feedback.length > 0 ? 'Add ' + strength.feedback.join(', ') : '')
        }
      }

      // Validate password confirmation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    if (step === 2) {
      // Validate languages
      if (!formData.nativeLanguage) {
        newErrors.nativeLanguage = 'Please select your native language'
      }
      if (!formData.learningLanguage) {
        newErrors.learningLanguage = 'Please select a language to learn'
      }
      if (formData.nativeLanguage && formData.learningLanguage && 
          formData.nativeLanguage === formData.learningLanguage) {
        newErrors.learningLanguage = 'Learning language must be different from native language'
      }
    }

    // Step 3 (location) is optional
    // Step 4 (review) requires terms acceptance - checked in handleContinue

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    // Clear previous errors
    setErrors({})

    // Validate current step
    if (!validateStep(currentStep)) {
      toast({
        title: 'Please fix the errors',
        description: 'Check the fields marked in red',
        variant: 'destructive',
      })
      return
    }

    if (currentStep === 4) {
      // Final step - check terms acceptance
      if (!acceptedTerms) {
        toast({
          title: 'Terms Required',
          description: 'Please accept the terms and conditions to continue',
          variant: 'destructive',
        })
        return
      }
      handleSubmit()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    
    try {
      // Validate all inputs
      const validated = validateSignupData(formData)

      const supabase = createClient()
      
      // 1. Sign up the user with validated data
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          data: {
            full_name: validated.name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        logSecurityEvent({
          type: 'signup',
          email: validated.email,
          details: { error: signUpError.message, success: false }
        })

        // Handle specific errors
        let errorMessage = parseAuthError(signUpError)
        
        // Special handling for duplicate email
        if (signUpError.message.includes('already registered') || 
            signUpError.message.includes('already exists')) {
          errorMessage = 'An account with this email already exists. Try logging in instead.'
        }

        toast({
          title: 'Signup Failed',
          description: errorMessage,
          variant: 'destructive',
        })
        return
      }

      // Check if email confirmation is required
      const emailConfirmationRequired = authData.user && !authData.session

      if (authData.user) {
        // 2. Update user profile with location (sanitized)
        const { error: profileError } = await supabase
          .from('users')
          .update({
            full_name: validated.name,
            city: validated.city || null,
            country: validated.country || null,
          })
          .eq('id', authData.user.id)

        if (profileError) {
          console.warn('Profile update error:', profileError.message)
          // Don't fail signup if profile update fails
        }

        // 3. Add user languages
        const languagesToInsert = []
        if (validated.nativeLanguage) {
          languagesToInsert.push({
            user_id: authData.user.id,
            language_code: validated.nativeLanguage,
            language_type: 'native',
            proficiency_level: 'native',
          })
        }
        if (validated.learningLanguage) {
          languagesToInsert.push({
            user_id: authData.user.id,
            language_code: validated.learningLanguage,
            language_type: 'learning',
            proficiency_level: 'beginner',
          })
        }

        if (languagesToInsert.length > 0) {
          const { error: languageError } = await supabase
            .from('user_languages')
            .insert(languagesToInsert)

          if (languageError) {
            console.warn('Language insert error:', languageError.message)
            // Don't fail signup if language insert fails
          }
        }

        // Log successful signup
        logSecurityEvent({
          type: 'signup',
          userId: authData.user.id,
          email: validated.email,
          details: { success: true, emailConfirmationRequired }
        })

        // Handle different flows based on email confirmation
        if (emailConfirmationRequired) {
          toast({
            title: '✓ Account Created!',
            description: 'Please check your email to confirm your account before logging in.',
            duration: 8000,
          })

          // Redirect to login after short delay
          setTimeout(() => {
            router.replace('/auth/login?verified=false')
          }, 2000)
        } else {
          toast({
            title: '✓ Welcome to TaalMeet!',
            description: 'Your account is ready! Redirecting to dashboard...',
          })

          // Redirect to dashboard
          setTimeout(() => {
            router.replace('/dashboard')
          }, 1000)
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      
      logSecurityEvent({
        type: 'signup',
        email: formData.email,
        details: { error: error.message, success: false, type: 'validation_error' }
      })

      // Parse validation errors
      let errorMessage = 'Please check your input and try again'
      if (error.issues && Array.isArray(error.issues)) {
        // Zod validation errors
        errorMessage = error.issues[0]?.message || errorMessage
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: 'Unable to Create Account',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    { number: 1, label: 'Basics' },
    { number: 2, label: 'Languages' },
    { number: 3, label: 'Location' },
    { number: 4, label: 'Finish' }
  ]

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'nl', name: 'Dutch' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ar', name: 'Arabic' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-blue-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        {/* Progress Bar */}
        <div className="w-full max-w-4xl mb-8">
          <div className="flex items-center justify-between text-white/60 text-sm font-medium">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="text-white/80 hover:text-white hover:bg-white/10"
              disabled={currentStep === 1 || isLoading}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span>{currentStep}/{totalSteps}</span>
            <div className="w-8"></div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((step) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep >= step.number
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-110'
                    : 'bg-slate-700/50 text-slate-400'
                }`}
              >
                {currentStep > step.number ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              {step.number < totalSteps && (
                <div
                  className={`w-12 h-1 mx-1 rounded-full transition-all ${
                    currentStep > step.number ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-slate-700/50'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="w-full max-w-2xl">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
            {/* Step 1: Basics */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Welcome to TaalMeet!</h2>
                  <p className="text-white/60">Let's start with the basics</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value })
                        if (errors.name) setErrors({ ...errors, name: '' })
                      }}
                      placeholder="John Doe"
                      className={`bg-slate-900/50 border-slate-600/50 text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.name ? 'border-red-500' : ''
                      }`}
                      disabled={isLoading}
                      autoComplete="name"
                      required
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value })
                        if (errors.email) setErrors({ ...errors, email: '' })
                      }}
                      placeholder="john@example.com"
                      className={`bg-slate-900/50 border-slate-600/50 text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.email ? 'border-red-500' : ''
                      }`}
                      disabled={isLoading}
                      autoComplete="email"
                      required
                    />
                    {errors.email && (
                      <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value })
                          if (errors.password) setErrors({ ...errors, password: '' })
                        }}
                        placeholder="••••••••"
                        className={`bg-slate-900/50 border-slate-600/50 text-white pr-10 disabled:opacity-50 disabled:cursor-not-allowed ${
                          errors.password ? 'border-red-500' : ''
                        }`}
                        disabled={isLoading}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white disabled:opacity-50"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <PasswordStrengthIndicator password={formData.password} />
                    )}
                    
                    {errors.password && (
                      <p className="text-red-400 text-sm mt-1">{errors.password}</p>
                    )}
                    
                    <p className="text-xs text-white/60 mt-2">
                      Must include: 8+ characters, uppercase, lowercase, number, special character
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          setFormData({ ...formData, confirmPassword: e.target.value })
                          if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' })
                        }}
                        placeholder="••••••••"
                        className={`bg-slate-900/50 border-slate-600/50 text-white pr-10 disabled:opacity-50 disabled:cursor-not-allowed ${
                          errors.confirmPassword ? 'border-red-500' : ''
                        }`}
                        disabled={isLoading}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white disabled:opacity-50"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Languages */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Globe className="w-12 h-12 mx-auto text-purple-400 mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">Your Languages</h2>
                  <p className="text-white/60">What languages do you speak and want to learn?</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-white">I speak (Native Language)</Label>
                    <Select 
                      value={formData.nativeLanguage} 
                      onValueChange={(value) => {
                        setFormData({ ...formData, nativeLanguage: value })
                        if (errors.nativeLanguage) setErrors({ ...errors, nativeLanguage: '' })
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger className={`bg-slate-900/50 border-slate-600/50 text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.nativeLanguage ? 'border-red-500' : ''
                      }`}>
                        <SelectValue placeholder="Select your native language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.nativeLanguage && (
                      <p className="text-red-400 text-sm mt-1">{errors.nativeLanguage}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-white">I want to learn</Label>
                    <Select 
                      value={formData.learningLanguage} 
                      onValueChange={(value) => {
                        setFormData({ ...formData, learningLanguage: value })
                        if (errors.learningLanguage) setErrors({ ...errors, learningLanguage: '' })
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger className={`bg-slate-900/50 border-slate-600/50 text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.learningLanguage ? 'border-red-500' : ''
                      }`}>
                        <SelectValue placeholder="Select language to learn" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.learningLanguage && (
                      <p className="text-red-400 text-sm mt-1">{errors.learningLanguage}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <MapPin className="w-12 h-12 mx-auto text-purple-400 mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">Where are you?</h2>
                  <p className="text-white/60">Help us find language partners nearby</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="city" className="text-white">City (Optional)</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Amsterdam"
                      className="bg-slate-900/50 border-slate-600/50 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                      autoComplete="address-level2"
                    />
                    <p className="text-xs text-white/60 mt-1">
                      Helps us find language partners nearby
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="country" className="text-white">Country (Optional)</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Netherlands"
                      className="bg-slate-900/50 border-slate-600/50 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                      autoComplete="country-name"
                    />
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-sm text-blue-300">
                      💡 <strong>Privacy Note:</strong> Your exact location is never shared. Only approximate city-level information is visible to other users.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Finish */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <CheckCircle2 className="w-16 h-16 mx-auto text-green-400 mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">You're all set!</h2>
                  <p className="text-white/60">Review your details and create your account</p>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-6 space-y-4">
                  <h3 className="text-white font-semibold mb-3">Account Details</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Name:</span>
                    <span className="text-white font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Email:</span>
                    <span className="text-white font-medium">{formData.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Native Language:</span>
                    <span className="text-white font-medium">{languages.find(l => l.code === formData.nativeLanguage)?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Learning:</span>
                    <span className="text-white font-medium">{languages.find(l => l.code === formData.learningLanguage)?.name || '-'}</span>
                  </div>
                  {(formData.city || formData.country) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Location:</span>
                      <span className="text-white font-medium">
                        {[formData.city, formData.country].filter(Boolean).join(', ') || '-'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="bg-slate-900/50 rounded-xl p-4 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-slate-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 disabled:opacity-50"
                      disabled={isLoading}
                    />
                    <span className="text-sm text-white/80">
                      I agree to the{' '}
                      <Link href="/terms" target="_blank" className="text-purple-400 hover:text-purple-300 underline">
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link href="/privacy" target="_blank" className="text-purple-400 hover:text-purple-300 underline">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  
                  <div className="text-xs text-white/60 pl-7">
                    By creating an account, you agree to receive email updates about your language exchange activities.
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4">
              <Button
                onClick={handleContinue}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-6 rounded-xl shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating your account...
                  </>
                ) : (
                  <>
                    {currentStep < totalSteps ? 'Continue' : 'Create Account'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-white/60 text-sm mt-6">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Password Strength Indicator Component
function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = getPasswordStrength(password)
  const colors = ['red', 'orange', 'yellow', 'lime', 'green', 'emerald']
  
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded transition-colors ${
              i <= strength.score
                ? `bg-${colors[strength.score - 1]}-500`
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p className={`text-sm mt-1 text-${strength.color}-400`}>
        <Shield className="w-3 h-3 inline mr-1" />
        {strength.label}
      </p>
    </div>
  )
}
