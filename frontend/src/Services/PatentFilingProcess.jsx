const backend_url = import.meta.env.VITE_BACKEND_URL;
import React, { useState } from 'react';
import {
  Upload,
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  Shield,
  Download,
  Info,
  CheckCircle,
  Send
} from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

const API_BASE_URL = `${backend_url}/api`;

const downloadSampleDocument = () => {
  const link = document.createElement('a');
  link.href = 'Patent Format.docx';
  link.download = 'Patent_Format_Sample.docx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const PatentFilingProcess = () => {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    inventionTitle: '',
    inventorName: '',
    applicantName: '',
    technicalDescription: '',
    email: '',
    phone: ''
  });
  const [technicalDrawings, setTechnicalDrawings] = useState([]);
  const [supportingDocuments, setSupportingDocuments] = useState([]);
  const [dragOver, setDragOver] = useState({ technical: false, supporting: false });
  const [completedDocuments, setCompletedDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedPatentId, setSubmittedPatentId] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const steps = [
    { id: 1, title: 'Application\nDetails', description: 'Fill in your patent information' },
    { id: 2, title: 'Payment\nInfo',        description: 'Review filing fee details' },
    { id: 3, title: 'Submit\nApplication',  description: 'Final submission' },
  ];

  const requiredDocuments = [
    { id: 1, title: 'Technical description' },
    { id: 2, title: 'Technical drawings' },
    { id: 3, title: 'Inventor details' },
    { id: 4, title: 'Power of attorney (if applicable)' }
  ];

  const toggleDocumentCompletion = (docId) => {
    setCompletedDocuments(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: '' });
    }
  };

  const handleDragOver  = (e, type) => { e.preventDefault(); setDragOver({ ...dragOver, [type]: true }); };
  const handleDragLeave = (e, type) => { e.preventDefault(); setDragOver({ ...dragOver, [type]: false }); };

  const handleDrop = (e, type) => {
    e.preventDefault();
    setDragOver({ ...dragOver, [type]: false });
    const files = Array.from(e.dataTransfer.files);
    if (type === 'technical') setTechnicalDrawings([...technicalDrawings, ...files]);
    else setSupportingDocuments([...supportingDocuments, ...files]);
  };

  const handleFileSelect = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === 'technical') setTechnicalDrawings([...technicalDrawings, ...files]);
    else setSupportingDocuments([...supportingDocuments, ...files]);
  };

  const removeFile = (index, type) => {
    if (type === 'technical') setTechnicalDrawings(technicalDrawings.filter((_, i) => i !== index));
    else setSupportingDocuments(supportingDocuments.filter((_, i) => i !== index));
  };

  // ── Step 1 validation only — NO API call ──
  const validateStep1 = () => {
    const errors = {};
    if (!formData.inventionTitle?.trim())        errors.inventionTitle        = 'Invention title is required';
    if (!formData.inventorName?.trim())          errors.inventorName          = 'Inventor name is required';
    if (!formData.applicantName?.trim())         errors.applicantName         = 'Applicant name is required';
    if (!formData.technicalDescription?.trim())  errors.technicalDescription  = 'Technical description is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Step 1 → Step 2: validate only, zero API calls ──
  const handleStep1Next = () => {
    if (!validateStep1()) {
      setError('Please fill all required fields correctly');
      return;
    }
    setError('');
    setCurrentStep(2);
  };

  // ── Step 2 → Step 3: just advance ──
  const handleStep2Next = () => {
    setError('');
    setCurrentStep(3);
  };

  // ── FINAL SUBMIT: the ONE place that touches the API ──
  // Create patent → upload files → all in one go, nothing saved before this
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      if (!user) throw new Error('User not authenticated. Please log in.');

      // ── Step A: Create patent, already marked as 'submitted' ──
      const patentData = {
        clerkUserId:          user.id,
        inventionTitle:       formData.inventionTitle.trim(),
        inventorName:         formData.inventorName.trim(),
        applicantName:        formData.applicantName.trim(),
        technicalDescription: formData.technicalDescription.trim(),
        email:                formData.email?.trim()  || undefined,
        phone:                formData.phone?.trim()  || undefined,
        currentStep:          3,
        status:               'submitted',   // ← submitted immediately, never saved as draft
        completedDocuments,
        filingDate:           new Date().toISOString(),
      };

      //console.log('📤 Sending to backend:', JSON.stringify(patentData, null, 2));

      const createRes = await fetch(`${API_BASE_URL}/patents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(patentData),
      });

      const responseText = await createRes.text();
      let createData;
      try {
        createData = JSON.parse(responseText);
      } catch {
        throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}`);
      }

      if (!createRes.ok) {
        const msg = createData.error || createData.message || createData.details || `HTTP error! status: ${createRes.status}`;
        throw new Error(msg);
      }

      if (!createData.success || !createData.data) {
        throw new Error(createData.error || createData.message || 'Failed to save patent data');
      }

      const patentId = createData.data._id || createData.data.id;
     // console.log('✅ Patent created with ID:', patentId);

      // ── Step B: Upload technical drawings (if any) ──
      if (technicalDrawings.length > 0) {
        //console.log('📤 Uploading technical drawings:', technicalDrawings.length);
        const fd = new FormData();
        technicalDrawings.forEach(file => fd.append('drawings', file));
        const uploadRes = await fetch(`${API_BASE_URL}/patents/${patentId}/technical-drawings`, {
          method: 'POST',
          body: fd,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || uploadData.message || 'Technical drawings upload failed');
      }

      // ── Step C: Upload supporting documents (if any) ──
      if (supportingDocuments.length > 0) {
        //console.log('📤 Uploading supporting documents:', supportingDocuments.length);
        const fd = new FormData();
        supportingDocuments.forEach(file => fd.append('documents', file));
        const uploadRes = await fetch(`${API_BASE_URL}/patents/${patentId}/supporting-documents`, {
          method: 'POST',
          body: fd,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || uploadData.message || 'Supporting documents upload failed');
      }

      // ── Step D: Show success ──
      setSubmittedPatentId(patentId);
      setSubmitted(true);

    } catch (err) {
      console.error('❌ Submission error:', err);
      if (err.message.includes('duplicate key')) {
        setError('Application number conflict. Please try again.');
      } else {
        setError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    setError('');
  };

  // ── Auth guard ──
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-gray-300">Please log in to access the patent filing process.</p>
        </div>
      </div>
    );
  }

  // ── Success Screen ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center">
          <div className="w-24 h-24 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-teal-500">
            <CheckCircle className="w-12 h-12 text-teal-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Application Submitted!</h1>
          <p className="text-gray-300 text-lg mb-6">
            Your patent application has been successfully submitted. Our team will review your application and contact you within 3–5 business days.
          </p>
          {submittedPatentId && (
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 mb-8">
              <p className="text-sm text-gray-400">Application Reference ID</p>
              <p className="text-teal-400 font-mono font-semibold text-lg mt-1">{submittedPatentId}</p>
            </div>
          )}
          <div className="bg-teal-900/20 border border-teal-700/40 rounded-xl p-4">
            <p className="text-teal-300 text-sm">
              📧 A confirmation will be sent to {formData.email || user?.primaryEmailAddress?.emailAddress || 'your registered email'}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white overflow-y-auto relative">
      {/* Dot grid background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25px 25px, #ffffff 2px, transparent 0)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative container mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Patent Filing Process</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">Step-by-step guidance through your patent application</p>
          <p className="text-sm text-teal-400 mt-2">
            Logged in as: {user.fullName || user.primaryEmailAddress?.emailAddress}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 max-w-4xl mx-auto p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium">{error}</p>
                <p className="text-xs text-red-300 mt-1">Please check the console for more details (F12)</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                      currentStep > step.id
                        ? 'bg-teal-500 shadow-lg shadow-teal-500/30 scale-110'
                        : currentStep === step.id
                        ? 'bg-teal-500 shadow-lg shadow-teal-500/30 scale-110'
                        : 'bg-gray-700'
                    }`}>
                      {currentStep > step.id
                        ? <Check className="w-7 h-7 text-white" />
                        : <span className="text-white">{step.id}</span>
                      }
                    </div>
                    <div className="text-center mt-2 w-24">
                      <div className={`text-xs font-medium leading-tight ${currentStep >= step.id ? 'text-teal-400' : 'text-gray-500'}`}>
                        {step.title.replace('\n', ' ')}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-20 h-1 rounded-full transition-all duration-500 mb-5 ${currentStep > step.id ? 'bg-teal-500' : 'bg-gray-700'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-800 h-2 rounded-full max-w-md mx-auto">
            <div
              className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Step heading */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-9 h-9 bg-teal-500 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {currentStep}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-teal-400">
                Step {currentStep}: {steps[currentStep - 1]?.title.replace('\n', ' ')}
              </h2>
              <p className="text-gray-400 text-sm">{steps[currentStep - 1]?.description}</p>
            </div>
          </div>

          {/* ── STEP 1: Application Details ── */}
          {currentStep === 1 && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
              {/* Checklist */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-white">Required Documents Checklist</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {requiredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => toggleDocumentCompletion(doc.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        completedDocuments.includes(doc.id)
                          ? 'bg-teal-900/30 border-teal-700'
                          : 'bg-blue-900/20 border-blue-700/40 hover:border-blue-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                          completedDocuments.includes(doc.id) ? 'bg-teal-500' : 'border-2 border-blue-400'
                        }`}>
                          {completedDocuments.includes(doc.id) && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className={completedDocuments.includes(doc.id) ? 'text-teal-200' : 'text-blue-200'}>
                          {doc.title}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-200">
                      Invention Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text" name="inventionTitle" value={formData.inventionTitle}
                      onChange={handleInputChange} placeholder="Enter invention title"
                      className={`w-full px-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all ${validationErrors.inventionTitle ? 'border-red-500' : 'border-gray-600'}`}
                    />
                    {validationErrors.inventionTitle && <p className="text-red-400 text-xs mt-1">{validationErrors.inventionTitle}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-200">
                      Inventor Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text" name="inventorName" value={formData.inventorName}
                      onChange={handleInputChange} placeholder="Full name of inventor"
                      className={`w-full px-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all ${validationErrors.inventorName ? 'border-red-500' : 'border-gray-600'}`}
                    />
                    {validationErrors.inventorName && <p className="text-red-400 text-xs mt-1">{validationErrors.inventorName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-200">
                    Applicant Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text" name="applicantName" value={formData.applicantName}
                    onChange={handleInputChange} placeholder="Name of person/entity applying"
                    className={`w-full px-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all ${validationErrors.applicantName ? 'border-red-500' : 'border-gray-600'}`}
                  />
                  {validationErrors.applicantName && <p className="text-red-400 text-xs mt-1">{validationErrors.applicantName}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-200">Email Address</label>
                    <input
                      type="email" name="email" value={formData.email}
                      onChange={handleInputChange} placeholder="your.email@example.com"
                      className={`w-full px-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all ${validationErrors.email ? 'border-red-500' : 'border-gray-600'}`}
                    />
                    {validationErrors.email && <p className="text-red-400 text-xs mt-1">{validationErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-200">Phone Number</label>
                    <input
                      type="tel" name="phone" value={formData.phone}
                      onChange={handleInputChange} placeholder="9999999999"
                      className={`w-full px-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all ${validationErrors.phone ? 'border-red-500' : 'border-gray-600'}`}
                    />
                    {validationErrors.phone && <p className="text-red-400 text-xs mt-1">{validationErrors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-200">
                    Technical Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    name="technicalDescription" value={formData.technicalDescription}
                    onChange={handleInputChange}
                    placeholder="Detailed description of your invention, how it works, and what makes it novel..."
                    rows={5}
                    className={`w-full px-4 py-3 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all resize-none ${validationErrors.technicalDescription ? 'border-red-500' : 'border-gray-600'}`}
                  />
                  {validationErrors.technicalDescription && <p className="text-red-400 text-xs mt-1">{validationErrors.technicalDescription}</p>}
                </div>

                {/* File Uploads */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Technical Drawings */}
                  <div className="flex flex-col">
                    <label className="block text-sm font-semibold mb-3 text-gray-200">Upload Technical Drawings</label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 flex-1 ${dragOver.technical ? 'border-teal-400 bg-teal-400/10' : 'border-gray-600 hover:border-teal-500'}`}
                      onDragOver={(e) => handleDragOver(e, 'technical')}
                      onDragLeave={(e) => handleDragLeave(e, 'technical')}
                      onDrop={(e) => handleDrop(e, 'technical')}
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-300 mb-1">Drag & drop or click to browse</p>
                      <p className="text-xs text-gray-500 mb-3">PDF, JPG, PNG, DWG</p>
                      <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.dwg"
                        onChange={(e) => handleFileSelect(e, 'technical')} className="hidden" id="technical-upload" />
                      <label htmlFor="technical-upload"
                        className="inline-block px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors cursor-pointer text-sm">
                        Choose Files
                      </label>
                    </div>
                    {technicalDrawings.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {technicalDrawings.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-700/50 px-3 py-2 rounded-lg">
                            <span className="text-sm text-gray-300 truncate">{file.name}</span>
                            <button onClick={() => removeFile(index, 'technical')} className="text-red-400 hover:text-red-300 text-xs ml-2 flex-shrink-0">Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Supporting Documents */}
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-200">Upload Supporting Documents</label>
                      <button onClick={downloadSampleDocument}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors">
                        <Download className="w-3.5 h-3.5" /> Sample Format
                      </button>
                    </div>
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 flex-1 ${dragOver.supporting ? 'border-teal-400 bg-teal-400/10' : 'border-gray-600 hover:border-teal-500'}`}
                      onDragOver={(e) => handleDragOver(e, 'supporting')}
                      onDragLeave={(e) => handleDragLeave(e, 'supporting')}
                      onDrop={(e) => handleDrop(e, 'supporting')}
                    >
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-300 mb-1">Drag & drop or click to browse</p>
                      <p className="text-xs text-gray-500 mb-3">PDF, DOC, DOCX</p>
                      <input type="file" multiple accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileSelect(e, 'supporting')} className="hidden" id="supporting-upload" />
                      <label htmlFor="supporting-upload"
                        className="inline-block px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors cursor-pointer text-sm">
                        Choose Files
                      </label>
                    </div>
                    <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                      <p className="text-xs text-blue-300 flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 flex-shrink-0" />
                        Download the sample format above and upload documents in the same format
                      </p>
                    </div>
                    {supportingDocuments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {supportingDocuments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-700/50 px-3 py-2 rounded-lg">
                            <span className="text-sm text-gray-300 truncate">{file.name}</span>
                            <button onClick={() => removeFile(index, 'supporting')} className="text-red-400 hover:text-red-300 text-xs ml-2 flex-shrink-0">Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Payment Info ── */}
          {currentStep === 2 && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-5 border border-teal-500/30">
                  <Shield className="w-10 h-10 text-teal-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">Patent Filing Fee</h3>
                <p className="text-gray-400">Review the fee breakdown before submitting your application</p>
              </div>

              <div className="max-w-md mx-auto space-y-5">
                <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
                  <h4 className="text-base font-semibold mb-5 text-white border-b border-gray-600 pb-3">Fee Breakdown</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between text-gray-300">
                      <span>Application Filing Fee</span>
                      <span className="font-medium">₹4,000</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Processing Fee</span>
                      <span className="font-medium">₹800</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Service Charges</span>
                      <span className="font-medium">₹200</span>
                    </div>
                    <div className="border-t border-gray-500 pt-4">
                      <div className="flex justify-between text-white font-bold text-xl">
                        <span>Total Amount</span>
                        <span className="text-teal-400">₹5,000</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Application Summary */}
                <div className="bg-gray-700/30 rounded-xl p-5 border border-gray-600/50">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Application Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Invention</span>
                      <span className="text-white font-medium truncate ml-4 max-w-[200px]">{formData.inventionTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Inventor</span>
                      <span className="text-white font-medium">{formData.inventorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Applicant</span>
                      <span className="text-white font-medium">{formData.applicantName}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-900/20 border border-blue-700/40 rounded-xl">
                  <p className="text-sm text-blue-300 text-center">
                    💡 Payment will be collected by our team after your application is reviewed. Click <strong>Next Step</strong> to proceed to final submission.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Submit ── */}
          {currentStep === 3 && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-5 border border-teal-500/30">
                  <Send className="w-10 h-10 text-teal-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">Ready to Submit</h3>
                <p className="text-gray-400 max-w-lg mx-auto">
                  Please review the details below. Your application will only be created and sent when you click Submit below.
                </p>
              </div>

              <div className="max-w-lg mx-auto space-y-4">
                {/* Final review */}
                <div className="bg-gray-700/40 rounded-xl p-6 border border-gray-600/50">
                  <h4 className="text-sm font-semibold text-teal-400 mb-4 uppercase tracking-wider">Application Details</h4>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: 'Invention Title', value: formData.inventionTitle },
                      { label: 'Inventor Name',   value: formData.inventorName },
                      { label: 'Applicant Name',  value: formData.applicantName },
                      { label: 'Email',           value: formData.email || '—' },
                      { label: 'Phone',           value: formData.phone || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-start gap-4">
                        <span className="text-gray-400 flex-shrink-0">{label}</span>
                        <span className="text-white font-medium text-right">{value}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-600 pt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Files Attached</span>
                        <span className="text-white font-medium">
                          {technicalDrawings.length + supportingDocuments.length} file(s)
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Filing Fee</span>
                      <span className="text-teal-400 font-bold">₹5,000</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-900/20 border border-amber-700/40 rounded-xl">
                  <p className="text-sm text-amber-300 text-center">
                    ⚠️ Nothing has been saved yet. Clicking Submit will create and send your application in one step.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                    loading
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:scale-[1.02] shadow-lg shadow-teal-500/20'
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
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
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
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            {/* Next button only on steps 1 & 2 */}
            {currentStep < 3 && (
              <button
                onClick={currentStep === 1 ? handleStep1Next : handleStep2Next}
                disabled={loading}
                className="inline-flex items-center px-8 py-3 rounded-xl font-semibold transition-all duration-200 bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:scale-105 shadow-lg shadow-teal-500/20"
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatentFilingProcess;