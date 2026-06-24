import { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, AlertCircle, Loader } from 'lucide-react'
function Contact() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    serviceType: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [submitCount, setSubmitCount] = useState(0)

const backend_url = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

  // Form validation function
  const validateForm = () => {
    const errors = {}
    
    // Full name validation
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required'
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Name must be at least 2 characters'
    } else if (formData.fullName.length > 100) {
      errors.fullName = 'Name cannot exceed 100 characters'
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.fullName.trim())) {
      errors.fullName = 'Name can only contain letters, spaces, hyphens, and apostrophes'
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address'
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone && !/^[\+]?[1-9][\d\s\-\(\)]{7,20}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number'
    }

    // Company validation (optional)
    if (formData.company && formData.company.length > 200) {
      errors.company = 'Company name cannot exceed 200 characters'
    }

    // Service type validation
    if (!formData.serviceType) {
      errors.serviceType = 'Please select a service type'
    }

    // Message validation
    if (!formData.message.trim()) {
      errors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters'
    } else if (formData.message.length > 1000) {
      errors.message = 'Message cannot exceed 1000 characters'
    }

    return errors
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevent multiple rapid submissions
    if (loading) return

    setLoading(true)
    setError('')
    setSuccess(false)
    setValidationErrors({})

    // Client-side validation
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setLoading(false)
      return
    }

    // Check submission rate limit (client-side)
    if (submitCount >= 3) {
      setError('You have submitted too many forms. Please wait a moment before trying again.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${backend_url}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone ? formData.phone.trim() : '',
          company: formData.company ? formData.company.trim() : '',
          serviceType: formData.serviceType,
          message: formData.message.trim()
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Success
        setSuccess(true)
        setSubmitCount(prev => prev + 1)
        
        // Reset form
        setFormData({ 
          fullName: '', 
          email: '', 
          phone: '', 
          company: '', 
          serviceType: '', 
          message: '' 
        })
        
        // Auto-hide success message after 10 seconds
        setTimeout(() => setSuccess(false), 10000)
        
        // Log success for analytics (optional)
        console.log('Contact form submitted successfully:', data.data?.id)
        
      } else {
        // Handle API errors
        if (data.details && Array.isArray(data.details)) {
          // Server validation errors
          const serverErrors = {}
          data.details.forEach(detail => {
            const lowerDetail = detail.toLowerCase()
            if (lowerDetail.includes('name') || lowerDetail.includes('fullname')) {
              serverErrors.fullName = detail
            } else if (lowerDetail.includes('email')) {
              serverErrors.email = detail
            } else if (lowerDetail.includes('phone')) {
              serverErrors.phone = detail
            } else if (lowerDetail.includes('service')) {
              serverErrors.serviceType = detail
            } else if (lowerDetail.includes('message')) {
              serverErrors.message = detail
            }
          })
          setValidationErrors(serverErrors)
        }
        
        setError(data.error || 'Failed to send message. Please try again.')
      }
      
    } catch (err) {
      console.error('Contact form submission error:', err)
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your internet connection and try again.')
      } else {
        setError('An unexpected error occurred. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }

    // Clear general error when user makes changes
    if (error) {
      setError('')
    }
  }

  // Reset submit count after 1 hour
  useEffect(() => {
    if (submitCount > 0) {
      const timer = setTimeout(() => {
        setSubmitCount(0)
      }, 60 * 60 * 1000) // 1 hour

      return () => clearTimeout(timer)
    }
  }, [submitCount])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-teal-700 py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Ready to protect your intellectual property? Get in touch with our expert team for a free consultation.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
              <p className="text-gray-300 mb-8">
                Our experienced IP attorneys are ready to discuss your needs and provide tailored solutions for your intellectual property challenges.
              </p>
            </div>

            {/* Contact Details */}
            <div className="space-y-6">
              {/* Main Office */}
              <div className="flex items-start space-x-4">
                <div className="bg-teal-600 p-3 rounded-lg flex-shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Main Office</h3>
                  <p className="text-gray-300">Pentagon Towers 2, MagarpattaCity,</p>
                  <p className="text-gray-300">Pune, Maharashtra</p>
                  <p className="text-gray-300">India</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start space-x-4">
                <div className="bg-teal-600 p-3 rounded-lg flex-shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Phone</h3>
                  <p className="text-gray-300">Mobile: +91 94040-60046</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start space-x-4">
                <div className="bg-teal-600 p-3 rounded-lg flex-shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Email</h3>
                  <p className="text-gray-300">General: admin@vtfi.in</p>
                </div>
              </div>

              {/* Business Hours */}
              <div className="flex items-start space-x-4">
                <div className="bg-teal-600 p-3 rounded-lg flex-shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Business Hours</h3>
                  <p className="text-gray-300">10:00 AM - 5:00 PM IST</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
            <h2 className="text-2xl font-semibold mb-6">Send us a Message</h2>
            
            <div className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-600 text-white px-4 py-3 rounded-lg flex items-center space-x-2 animate-pulse">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              
              {/* Success Message */}
              {success && (
                <div className="bg-green-600 text-white px-4 py-3 rounded-lg flex items-center space-x-2 animate-pulse">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">Message sent successfully! We'll get back to you within 24 hours.</span>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-1 transition-all duration-200 ${
                      validationErrors.fullName 
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-400' 
                        : 'border-gray-600 focus:border-teal-500 focus:ring-teal-500'
                    }`}
                    maxLength={100}
                  />
                  {validationErrors.fullName && (
                    <p className="text-red-400 text-xs mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {validationErrors.fullName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-1 transition-all duration-200 ${
                      validationErrors.email 
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-400' 
                        : 'border-gray-600 focus:border-teal-500 focus:ring-teal-500'
                    }`}
                  />
                  {validationErrors.email && (
                    <p className="text-red-400 text-xs mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {validationErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765-43210"
                    className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-1 transition-all duration-200 ${
                      validationErrors.phone 
                        ? 'border-red-500 focus:border-red-400 focus:ring-red-400' 
                        : 'border-gray-600 focus:border-teal-500 focus:ring-teal-500'
                    }`}
                  />
                  {validationErrors.phone && (
                    <p className="text-red-400 text-xs mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {validationErrors.phone}
                    </p>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Your company name"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all duration-200"
                    maxLength={200}
                  />
                  {validationErrors.company && (
                    <p className="text-red-400 text-xs mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {validationErrors.company}
                    </p>
                  )}
                </div>
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type of Service *
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white focus:ring-1 transition-all duration-200 ${
                    validationErrors.serviceType 
                      ? 'border-red-500 focus:border-red-400 focus:ring-red-400' 
                      : 'border-gray-600 focus:border-teal-500 focus:ring-teal-500'
                  }`}
                >
                  <option value="">Select a service...</option>
                  <option value="patents">Patents</option>
                  <option value="trademarks">Trademarks</option>
                  <option value="copyrights">Copyrights</option>
                  <option value="ip-litigation">IP Litigation</option>
                  <option value="licensing">Licensing</option>
                  <option value="consultation">General Consultation</option>
                </select>
                {validationErrors.serviceType && (
                  <p className="text-red-400 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {validationErrors.serviceType}
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message * ({formData.message.length}/1000)
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Tell us about your IP needs and how we can help..."
                  className={`w-full bg-gray-700 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-1 transition-all duration-200 resize-none ${
                    validationErrors.message 
                      ? 'border-red-500 focus:border-red-400 focus:ring-red-400' 
                      : 'border-gray-600 focus:border-teal-500 focus:ring-teal-500'
                  }`}
                  maxLength={1000}
                />
                {validationErrors.message && (
                  <p className="text-red-400 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {validationErrors.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading || submitCount >= 3}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  loading || submitCount >= 3
                    ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                    : 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-800'
                }`}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : submitCount >= 3 ? (
                  <span>Rate limit reached - please wait</span>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-gray-800 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Visit Our Office</h2>
            <p className="text-gray-300">Located at 305, Pentagon Towers 2</p>
          </div>
          
          <div className="bg-gray-700 rounded-lg overflow-hidden h-96 shadow-xl">
            <iframe
              title="Google Map Location"
              src="https://maps.google.com/maps?q=18.5158057,73.9271644&z=16&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact