import React, { useState } from 'react';
import { FileText, PenTool, Users, Shield, Copyright, User, AlertTriangle, Phone, Mail } from 'lucide-react';

const FilingRequirementsPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    requirements: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-emerald-500 w-16 h-16 rounded-2xl mx-auto mb-8 flex items-center justify-center">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-6">What You Need to File</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Complete checklist of documents and information required for patent and copyright applications. Be prepared before you start.
          </p>
        </div>
      </section>

      {/* Patent Application Requirements */}
      <section className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="bg-emerald-500 w-12 h-12 rounded-xl mx-auto mb-6 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Patent Application Requirements</h2>
            <p className="text-gray-300 text-lg">
              Essential documents and information needed for patent filing
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Detailed Description and Claims */}
            <div className="bg-slate-700 rounded-xl p-8">
              <div className="flex items-center mb-6">
                <div className="bg-emerald-500 w-10 h-10 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Detailed Description and Claims</h3>
              </div>
              <p className="text-gray-300 mb-6">
                Comprehensive technical description of your invention including how it works, its components, and what makes it novel.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Complete technical specifications
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Clear and concise claims defining the invention
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Background of the invention
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Summary of the invention
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Detailed description of preferred embodiments
                </li>
              </ul>
            </div>

            {/* Technical Drawings */}
            <div className="bg-slate-700 rounded-xl p-8">
              <div className="flex items-center mb-6">
                <div className="bg-emerald-500 w-10 h-10 rounded-lg flex items-center justify-center mr-4">
                  <PenTool className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Technical Drawings</h3>
              </div>
              <p className="text-gray-300 mb-6">
                Professional drawings and diagrams that illustrate your invention clearly.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Patent drawings in prescribed format
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Multiple views if necessary (front, side, top, etc.)
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Cross-sectional views where applicable
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Flowcharts for process inventions
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Reference numerals for all components
                </li>
              </ul>
            </div>

            {/* Inventor and Applicant Details */}
            <div className="bg-slate-700 rounded-xl p-8">
              <div className="flex items-center mb-6">
                <div className="bg-emerald-500 w-10 h-10 rounded-lg flex items-center justify-center mr-4">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Inventor and Applicant Details</h3>
              </div>
              <p className="text-gray-300 mb-6">
                Complete information about inventors and applicants including personal and contact details.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Full names and addresses of all inventors
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Nationality and residence details
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Applicant information (if different from inventor)
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Contact details and correspondence address
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Inventor's declarations and signatures
                </li>
              </ul>
            </div>

            {/* Power of Attorney */}
            <div className="bg-slate-700 rounded-xl p-8">
              <div className="flex items-center mb-6">
                <div className="bg-emerald-500 w-10 h-10 rounded-lg flex items-center justify-center mr-4">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Power of Attorney (if applicable)</h3>
              </div>
              <p className="text-gray-300 mb-6">
                Legal authorization if you're using an attorney or agent to file on your behalf.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Signed power of attorney form
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Authorization for patent attorney/agent
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Notarized documents where required
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Corporate authorization for company applicants
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Assignment documents (if applicable)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Copyright Registration Requirements */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="bg-emerald-500 w-12 h-12 rounded-xl mx-auto mb-6 flex items-center justify-center">
              <Copyright className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Copyright Registration Requirements</h2>
            <p className="text-gray-300 text-lg">
              Documents needed for copyright registration
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Copy or Sample of Original Work */}
            <div className="bg-slate-700 rounded-xl p-8">
              <div className="flex items-center mb-6">
                <div className="bg-emerald-500 w-10 h-10 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Copy or Sample of Original Work</h3>
              </div>
              <p className="text-gray-300 mb-6">
                Complete copy or representative sample of the work you want to register for copyright protection.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Complete manuscript for literary works
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  High-quality prints for artistic works
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Audio files for musical/choreographic works
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Source code and documentation for software
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Published version of the work (if published)
                </li>
              </ul>
            </div>

            {/* Author and Applicant Details */}
            <div className="bg-slate-700 rounded-xl p-8">
              <div className="flex items-center mb-6">
                <div className="bg-emerald-500 w-10 h-10 rounded-lg flex items-center justify-center mr-4">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Author and Applicant Details</h3>
              </div>
              <p className="text-gray-300 mb-6">
                Information about the author/creator and the person applying for registration.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Full name and address of the author
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Nationality and birth of author
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Applicant details (if different from author)
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Nature of author's interest in copyright
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Contact information for correspondence
                </li>
              </ul>
            </div>

            {/* Declaration of Originality */}
            <div className="bg-slate-700 rounded-xl p-8">
              <div className="flex items-center mb-6">
                <div className="bg-emerald-500 w-10 h-10 rounded-lg flex items-center justify-center mr-4">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Declaration of Originality</h3>
              </div>
              <p className="text-gray-300 mb-6">
                Legal confirmation that the work is original and created by the author.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Signed declaration of originality
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Statement of authorship
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Confirmation of first publication details
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Declaration that work doesn't infringe others' rights
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Date and place of creation
                </li>
              </ul>
            </div>

            {/* Proof of Identity */}
            <div className="bg-slate-700 rounded-xl p-8">
              <div className="flex items-center mb-6">
                <div className="bg-emerald-500 w-10 h-10 rounded-lg flex items-center justify-center mr-4">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Proof of Identity</h3>
              </div>
              <p className="text-gray-300 mb-6">
                Valid identification documents of the author and applicant.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Government-issued photo ID
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Passport or national ID card
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Address proof documents
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Corporate documents for company applicants
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Notarized copies where required
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notes */}
      <section className="py-16 bg-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-400 mr-4" />
              <h3 className="text-2xl font-bold text-amber-300">Important Notes</h3>
            </div>
            <div className="space-y-4 text-gray-300">
              <p>All documents should be in English or accompanied by certified translations.</p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Ensure all information is accurate and complete to avoid delays
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Keep copies of all submitted documents for your records
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Government fees are separate from our professional fees
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  Processing times may vary based on application complexity and office workload
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FilingRequirementsPage;