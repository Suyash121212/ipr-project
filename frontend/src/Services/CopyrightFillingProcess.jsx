import { Award, CheckCircle, Upload, Download, Info, Send, Plus, Trash2 } from 'lucide-react';
import { memo, useCallback, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
const backend_url = import.meta.env.VITE_BACKEND_URL;

const emptyApplicant = () => ({ name: '', email: '', phone: '', address: '' });

// Top-level memoized WorkDetails component
const WorkDetails = memo(({ formData, onChange, additionalApplicants, onAddApplicant, onRemoveApplicant, onApplicantChange, validationErrors }) => (
  <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-emerald-400 mb-1">Step 1: Work Details</h3>
      <p className="text-gray-400 text-sm">Enter information about your creative work</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-white font-medium mb-2">Title of Work <span className="text-red-400">*</span></label>
        <input
          type="text"
          placeholder="Enter the title of your work"
          value={formData.title}
          onChange={(e) => onChange('title', e.target.value)}
          className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Type of Work <span className="text-red-400">*</span></label>
        <select
          value={formData.workType}
          onChange={(e) => onChange('workType', e.target.value)}
          className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
        >
          <option value="">Select work type</option>
          <option value="literary">Literary Work</option>
          <option value="musical">Musical Work</option>
          <option value="artistic">Artistic Work</option>
          <option value="dramatic">Dramatic Work</option>
          <option value="cinematographic">Cinematographic Work</option>
          <option value="sound-recording">Sound Recording</option>
        </select>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Language <span className="text-red-400">*</span></label>
        <select
          value={formData.language}
          onChange={(e) => onChange('language', e.target.value)}
          className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
        >
          <option value="">Select language</option>
          <option value="english">English</option>
          <option value="hindi">Hindi</option>
          <option value="marathi">Marathi</option>
          <option value="gujarati">Gujarati</option>
          <option value="tamil">Tamil</option>
          <option value="telugu">Telugu</option>
          <option value="bengali">Bengali</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Author's Name <span className="text-red-400">*</span></label>
        <input
          type="text"
          placeholder="Name of the creator/author"
          value={formData.authorName}
          onChange={(e) => onChange('authorName', e.target.value)}
          className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-white font-medium mb-2">Description of Work <span className="text-red-400">*</span></label>
        <textarea
          placeholder="Brief description of your creative work..."
          value={formData.description}
          onChange={(e) => onChange('description', e.target.value)}
          rows={4}
          className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
        />
      </div>

      <div>
        <label className="block text-white font-medium mb-2">Date of First Publication</label>
        <input
          type="date"
          value={formData.publicationDate}
          onChange={(e) => onChange('publicationDate', e.target.value)}
          className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="published"
          checked={formData.isPublished}
          onChange={(e) => onChange('isPublished', e.target.checked)}
          className="w-4 h-4 text-emerald-500 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500"
        />
        <label htmlFor="published" className="ml-2 text-gray-300">Work has been published</label>
      </div>
    </div>

    {/* ── Primary Applicant ── */}
    <div className="mt-8 border border-gray-600/50 rounded-xl p-5 bg-gray-700/20">
      <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">Primary Applicant</h4>
      <div className="space-y-4">
        <div>
          <label className="block text-white font-medium mb-2">Applicant Name <span className="text-red-400">*</span></label>
          <input
            type="text"
            placeholder="Name of person/entity applying for copyright"
            value={formData.applicantName}
            onChange={(e) => onChange('applicantName', e.target.value)}
            className={`w-full p-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${validationErrors?.applicantName ? 'border-red-500' : 'border-gray-600'}`}
          />
          {validationErrors?.applicantName && <p className="text-red-400 text-xs mt-1">{validationErrors.applicantName}</p>}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white font-medium mb-2">Email Address</label>
            <input
              type="email"
              placeholder="email@example.com"
              value={formData.applicantEmail}
              onChange={(e) => onChange('applicantEmail', e.target.value)}
              className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-white font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              placeholder="9999999999"
              value={formData.applicantPhone}
              onChange={(e) => onChange('applicantPhone', e.target.value)}
              className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Address <span className="text-red-400">*</span></label>
          <textarea
            placeholder="Full address of the primary applicant"
            value={formData.applicantAddress}
            onChange={(e) => onChange('applicantAddress', e.target.value)}
            rows={2}
            className={`w-full p-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none ${validationErrors?.applicantAddress ? 'border-red-500' : 'border-gray-600'}`}
          />
          {validationErrors?.applicantAddress && <p className="text-red-400 text-xs mt-1">{validationErrors.applicantAddress}</p>}
        </div>
      </div>
    </div>

    {/* ── Additional Applicants ── */}
    {additionalApplicants.map((applicant, index) => (
      <div key={index} className="mt-4 border border-emerald-700/40 rounded-xl p-5 bg-emerald-900/10">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
            Applicant {index + 2}
          </h4>
          <button
            onClick={() => onRemoveApplicant(index)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 text-xs rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={applicant.name}
              onChange={(e) => onApplicantChange(index, 'name', e.target.value)}
              placeholder="Full name of applicant"
              className={`w-full p-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${validationErrors?.[`applicant_${index}_name`] ? 'border-red-500' : 'border-gray-600'}`}
            />
            {validationErrors?.[`applicant_${index}_name`] && (
              <p className="text-red-400 text-xs mt-1">{validationErrors[`applicant_${index}_name`]}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={applicant.email}
                onChange={(e) => onApplicantChange(index, 'email', e.target.value)}
                placeholder="email@example.com"
                className={`w-full p-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${validationErrors?.[`applicant_${index}_email`] ? 'border-red-500' : 'border-gray-600'}`}
              />
              {validationErrors?.[`applicant_${index}_email`] && (
                <p className="text-red-400 text-xs mt-1">{validationErrors[`applicant_${index}_email`]}</p>
              )}
            </div>
            <div>
              <label className="block text-white font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={applicant.phone}
                onChange={(e) => onApplicantChange(index, 'phone', e.target.value)}
                placeholder="9999999999"
                className={`w-full p-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${validationErrors?.[`applicant_${index}_phone`] ? 'border-red-500' : 'border-gray-600'}`}
              />
              {validationErrors?.[`applicant_${index}_phone`] && (
                <p className="text-red-400 text-xs mt-1">{validationErrors[`applicant_${index}_phone`]}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Address</label>
            <textarea
              value={applicant.address}
              onChange={(e) => onApplicantChange(index, 'address', e.target.value)}
              placeholder="Full address of this applicant"
              rows={2}
              className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
            />
          </div>
        </div>
      </div>
    ))}

    {/* ── Add Applicant Button ── */}
    <button
      onClick={onAddApplicant}
      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-emerald-600/50 hover:border-emerald-500 bg-emerald-900/10 hover:bg-emerald-900/20 text-emerald-400 hover:text-emerald-300 rounded-xl transition-all duration-200 text-sm font-medium"
    >
      <Plus className="w-4 h-4" />
      Add Another Applicant
    </button>
  </div>
));

export default function CopyrightFillingProcess() {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    workType: '',
    language: '',
    authorName: '',
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    applicantAddress: '',
    description: '',
    publicationDate: '',
    isPublished: false,
    primaryFile: null,
    primaryFileName: '',
    supportingFiles: [],
    supportingFilesNames: [],
  });

  const [additionalApplicants, setAdditionalApplicants] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  const [declarations, setDeclarations] = useState({
    original: false,
    noInfringement: false,
    accurate: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedAppId, setSubmittedAppId] = useState(null);

  const steps = [
    { id: 1, title: 'Work\nDetails',       description: 'Enter work information' },
    { id: 2, title: 'Upload\nWork',        description: 'Submit your creative work' },
    { id: 3, title: 'Submit\nApplication', description: 'Declare & submit' },
  ];

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [validationErrors]);

  // ── Additional Applicants ──
  const addApplicant = useCallback(() => {
    setAdditionalApplicants(prev => [...prev, emptyApplicant()]);
  }, []);

  const removeApplicant = useCallback((index) => {
    setAdditionalApplicants(prev => prev.filter((_, i) => i !== index));
    setValidationErrors(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (k.startsWith(`applicant_${index}_`)) delete next[k];
      });
      return next;
    });
  }, []);

  const handleApplicantChange = useCallback((index, field, value) => {
    setAdditionalApplicants(prev =>
      prev.map((a, i) => i === index ? { ...a, [field]: value } : a)
    );
    const key = `applicant_${index}_${field}`;
    if (validationErrors[key]) {
      setValidationErrors(prev => ({ ...prev, [key]: '' }));
    }
  }, [validationErrors]);

  const primaryInputRef    = useRef(null);
  const supportingInputRef = useRef(null);

  const handlePrimarySelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setFormData(prev => ({ ...prev, primaryFileName: file.name, primaryFile: file }));
  };

  const handleSupportingSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      supportingFiles: files,
      supportingFilesNames: files.map(f => f.name),
    }));
  };

  const downloadSampleDocument = () => {
    const link = document.createElement('a');
    link.href = '/samples/copyright-format-sample.docx';
    link.download = 'Copyright_Format_Sample.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const API_BASE = `${backend_url}/api`;

  // ── Step 1 validation ──
  const validateStep1 = () => {
    const errors = {};
    if (!formData.title?.trim())            errors.title            = 'Title is required';
    if (!formData.workType)                 errors.workType         = 'Work type is required';
    if (!formData.language)                 errors.language         = 'Language is required';
    if (!formData.authorName?.trim())       errors.authorName       = 'Author name is required';
    if (!formData.applicantName?.trim())    errors.applicantName    = 'Applicant name is required';
    if (!formData.applicantAddress?.trim()) errors.applicantAddress = 'Address is required';
    if (!formData.description?.trim())      errors.description      = 'Description is required';

    additionalApplicants.forEach((applicant, index) => {
      if (!applicant.name?.trim())
        errors[`applicant_${index}_name`] = 'Name is required';
      if (applicant.email && !/\S+@\S+\.\S+/.test(applicant.email))
        errors[`applicant_${index}_email`] = 'Enter a valid email';
      if (applicant.phone && !/^\d{10}$/.test(applicant.phone.replace(/\D/g, '')))
        errors[`applicant_${index}_phone`] = 'Enter a valid 10-digit phone number';
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    setErrorMessage('');
    if (currentStep === 1) {
      if (!validateStep1()) {
        setErrorMessage('Please fill all required fields correctly');
        return;
      }
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) setCurrentStep(3);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    setErrorMessage('');
  };

  // ── FINAL SUBMIT ──
  const handleSubmit = async () => {
    setErrorMessage('');
    if (!declarations.original || !declarations.noInfringement || !declarations.accurate) {
      setErrorMessage('Please check all declaration boxes before submitting.');
      return;
    }
    if (!user) {
      setErrorMessage('User not authenticated. Please log in.');
      return;
    }
    setLoading(true);
    try {
      const createRes = await fetch(`${API_BASE}/copyright`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:                formData.title.trim(),
          workType:             formData.workType,
          language:             formData.language,
          authorName:           formData.authorName.trim(),
          applicantName:        formData.applicantName.trim(),
          applicantEmail:       formData.applicantEmail?.trim() || undefined,
          applicantPhone:       formData.applicantPhone?.trim() || undefined,
          applicantAddress:     formData.applicantAddress.trim(),
          description:          formData.description.trim(),
          publicationDate:      formData.publicationDate || null,
          isPublished:          !!formData.isPublished,
          additionalApplicants: additionalApplicants.map(a => ({
            name:    a.name.trim(),
            email:   a.email?.trim()   || undefined,
            phone:   a.phone?.trim()   || undefined,
            address: a.address?.trim() || undefined,
          })),
          clerkUserId:  user.id,
          status:       'submitted',
          currentStep:  3,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || createData.message || 'Failed to create application');

      const appId = createData.data._id || createData.data.id;

      if (formData.primaryFile) {
        const fd = new FormData();
        fd.append('primary', formData.primaryFile);
        const uploadRes  = await fetch(`${API_BASE}/copyright/${appId}/primary-file`, { method: 'POST', body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || uploadData.message || 'Primary file upload failed');
      }

      if (formData.supportingFiles?.length > 0) {
        const fd = new FormData();
        formData.supportingFiles.forEach(f => fd.append('documents', f));
        const uploadRes  = await fetch(`${API_BASE}/copyright/${appId}/supporting-documents`, { method: 'POST', body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || uploadData.message || 'Supporting files upload failed');
      }

      setSubmittedAppId(appId);
      setSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMessage(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const allDeclared = declarations.original && declarations.noInfringement && declarations.accurate;

  // ── Success Screen ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-emerald-500">
            <Award className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Application Submitted!</h1>
          <p className="text-gray-300 text-lg mb-6">
            Your copyright application has been successfully submitted. Our team will review your application and contact you within 3–5 business days.
          </p>
          {submittedAppId && (
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 mb-8">
              <p className="text-sm text-gray-400">Application Reference ID</p>
              <p className="text-emerald-400 font-mono font-semibold text-lg mt-1">{submittedAppId}</p>
            </div>
          )}
          <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-4">
            <p className="text-emerald-300 text-sm">
              📧 A confirmation will be sent to {user?.primaryEmailAddress?.emailAddress || 'your registered email'}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Auth guard ──
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-gray-300">Please log in to access the copyright registration process.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white overflow-y-auto relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25px 25px, #ffffff 2px, transparent 0)',
          backgroundSize: '50px 50px',
        }} />
      </div>

      <div className="relative container mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Copyright Registration</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">Protect your creative work with official copyright registration</p>
          <p className="text-sm text-emerald-400 mt-2">
            Logged in as: {user.fullName || user.primaryEmailAddress?.emailAddress}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 max-w-4xl mx-auto p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                      currentStep > step.id
                        ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30 scale-110'
                        : currentStep === step.id
                        ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30 scale-110'
                        : 'bg-gray-700'
                    }`}>
                      {currentStep > step.id
                        ? <CheckCircle className="w-7 h-7 text-white" />
                        : <span className="text-white">{step.id}</span>
                      }
                    </div>
                    <div className="text-center mt-2 w-24">
                      <div className={`text-xs font-medium leading-tight ${currentStep >= step.id ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {step.title.replace('\n', ' ')}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-20 h-1 rounded-full transition-all duration-500 mb-5 ${currentStep > step.id ? 'bg-emerald-500' : 'bg-gray-700'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="w-full bg-gray-800 h-2 rounded-full max-w-md mx-auto">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {currentStep}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-emerald-400">
                Step {currentStep}: {steps[currentStep - 1]?.title.replace('\n', ' ')}
              </h2>
              <p className="text-gray-400 text-sm">{steps[currentStep - 1]?.description}</p>
            </div>
          </div>

          {currentStep === 1 && (
            <WorkDetails
              formData={formData}
              onChange={handleInputChange}
              additionalApplicants={additionalApplicants}
              onAddApplicant={addApplicant}
              onRemoveApplicant={removeApplicant}
              onApplicantChange={handleApplicantChange}
              validationErrors={validationErrors}
            />
          )}

          {currentStep === 2 && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-emerald-400 mb-1">Step 2: Upload Work</h3>
                <p className="text-gray-400 text-sm">Submit your creative work and supporting documents</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col">
                  <label className="block text-sm font-semibold mb-3 text-gray-200">Primary Work File</label>
                  <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors flex-1">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-300 mb-1">Upload the main file of your creative work</p>
                    <p className="text-xs text-gray-500 mb-3">PDF, DOC, JPG, PNG, MP3, MP4</p>
                    <input ref={primaryInputRef} type="file" className="hidden" onChange={handlePrimarySelect} />
                    <button onClick={() => primaryInputRef.current?.click()}
                      className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer text-sm">
                      Choose File
                    </button>
                    {formData.primaryFileName && (
                      <div className="mt-3 flex items-center justify-between bg-gray-700/50 px-3 py-2 rounded-lg">
                        <span className="text-sm text-gray-300 truncate">{formData.primaryFileName}</span>
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, primaryFile: null, primaryFileName: '' }))}
                          className="text-red-400 hover:text-red-300 text-xs ml-2 flex-shrink-0">
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-200">Supporting Documents</label>
                    <button onClick={downloadSampleDocument}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors">
                      <Download className="w-3.5 h-3.5" /> Sample Format
                    </button>
                  </div>
                  <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors flex-1">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-300 mb-1">Additional files, drafts, or related materials</p>
                    <p className="text-xs text-gray-500 mb-3">PDF, DOC, DOCX</p>
                    <input ref={supportingInputRef} type="file" multiple className="hidden" onChange={handleSupportingSelect} />
                    <button onClick={() => supportingInputRef.current?.click()}
                      className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer text-sm">
                      Choose Files
                    </button>
                  </div>
                  <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                    <p className="text-xs text-blue-300 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 flex-shrink-0" />
                      Download the sample format and upload documents in the same format
                    </p>
                  </div>
                  {formData.supportingFilesNames.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {formData.supportingFilesNames.map((name, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-700/50 px-3 py-2 rounded-lg">
                          <span className="text-sm text-gray-300 truncate">{name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-xl">
                <h4 className="text-orange-400 font-semibold text-sm mb-2">File Requirements:</h4>
                <ul className="text-orange-300 text-xs space-y-1">
                  <li>• Accepted formats: PDF, DOC, DOCX, JPG, PNG, MP3, MP4, etc.</li>
                  <li>• Maximum file size: 50MB per file</li>
                  <li>• Ensure files are clear and readable</li>
                  <li>• Include all relevant pages/sections</li>
                </ul>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
              <div className="mb-8 text-center">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-500/30">
                  <Send className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Ready to Submit</h3>
                <p className="text-gray-400 max-w-lg mx-auto">
                  Review your details and check all declaration boxes. Your application will only be created and sent when you click Submit below.
                </p>
              </div>

              <div className="max-w-lg mx-auto space-y-5">
                <div className="bg-gray-700/40 rounded-xl p-6 border border-gray-600/50">
                  <h4 className="text-sm font-semibold text-emerald-400 mb-4 uppercase tracking-wider">Application Summary</h4>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: 'Work Title',  value: formData.title },
                      { label: 'Work Type',   value: formData.workType || '—' },
                      { label: 'Language',    value: formData.language || '—' },
                      { label: 'Author',      value: formData.authorName },
                      { label: 'Applicant',   value: formData.applicantName },
                      { label: 'Address',     value: formData.applicantAddress || '—' },
                      { label: 'Published',   value: formData.isPublished ? `Yes${formData.publicationDate ? ` — ${formData.publicationDate}` : ''}` : 'No' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-start gap-4">
                        <span className="text-gray-400 flex-shrink-0">{label}</span>
                        <span className="text-white font-medium text-right capitalize">{value}</span>
                      </div>
                    ))}

                    {additionalApplicants.length > 0 && (
                      <div className="border-t border-gray-600 pt-3 mt-3">
                        <p className="text-gray-400 mb-2">Additional Applicants ({additionalApplicants.length})</p>
                        {additionalApplicants.map((a, i) => (
                          <div key={i} className="pl-3 border-l border-emerald-700/40 mb-2">
                            <p className="text-white font-medium">{a.name}</p>
                            {a.email   && <p className="text-gray-400 text-xs">{a.email}</p>}
                            {a.phone   && <p className="text-gray-400 text-xs">{a.phone}</p>}
                            {a.address && <p className="text-gray-400 text-xs">{a.address}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-gray-600 pt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Files Attached</span>
                        <span className="text-white font-medium">
                          {(formData.primaryFile ? 1 : 0) + formData.supportingFiles.length} file(s)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700/40 rounded-xl p-6 border border-gray-600/50">
                  <h4 className="text-sm font-semibold text-emerald-400 mb-4 uppercase tracking-wider">Declaration of Originality</h4>
                  <div className="space-y-4">
                    {[
                      { key: 'original',       label: 'I declare that the work is original and created by the stated author.' },
                      { key: 'noInfringement', label: 'I confirm that this work does not infringe on any third party rights.' },
                      { key: 'accurate',       label: 'All information provided in this application is accurate and complete.' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-start gap-3 cursor-pointer group">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                            declarations[key]
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-gray-500 group-hover:border-emerald-500'
                          }`}
                          onClick={() => setDeclarations(prev => ({ ...prev, [key]: !prev[key] }))}
                        >
                          {declarations[key] && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="text-gray-300 text-sm leading-relaxed">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-amber-900/20 border border-amber-700/40 rounded-xl">
                  <p className="text-sm text-amber-300 text-center">
                    ⚠️ Nothing has been saved yet. Clicking Submit will create and send your application in one step.
                  </p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !allDeclared}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                    loading || !allDeclared
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-[1.02] shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Copyright Application
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={currentStep === 1 || loading}
              className={`inline-flex items-center px-6 py-3 rounded-xl transition-all duration-200 ${
                currentStep === 1 || loading
                  ? 'opacity-40 cursor-not-allowed text-gray-500'
                  : 'bg-gray-700 hover:bg-gray-600 text-white hover:scale-105'
              }`}
            >
              ← Previous
            </button>
            {currentStep < 3 && (
              <button
                onClick={nextStep}
                className="inline-flex items-center px-8 py-3 rounded-xl font-semibold transition-all duration-200 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 shadow-lg shadow-emerald-500/20"
              >
                Next Step →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}