import React, { useState } from 'react';
import { FileText, Shield, Users, Mail, Phone, MapPin, ChevronDown } from 'lucide-react';

const PatentServicesPage = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqData = [
    { question: "How long does the patent process take?", answer: "The patent process typically takes 12-18 months from filing to approval, depending on the complexity of the invention and examination backlog." },
    { question: "What can be patented?", answer: "Inventions that are new, useful, and non-obvious can be patented. This includes processes, machines, compositions of matter, and improvements to existing inventions." },
    { question: "How long does patent protection last?", answer: "Utility patents provide protection for 20 years from the filing date, while design patents last for 15 years from the grant date." }
  ];

  const processSteps = [
    { number: 1, title: "Initial Consultation", description: "Discuss your invention and assess patentability" },
    { number: 2, title: "Prior Art Search", description: "Comprehensive search to ensure novelty" },
    { number: 3, title: "Application Drafting", description: "Prepare detailed patent application" },
    { number: 4, title: "Filing & Prosecution", description: "Submit application and respond to office actions" },
    { number: 5, title: "Patent Grant", description: "Receive your patent protection" }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-emerald-500 w-16 h-16 rounded-2xl mx-auto mb-8 flex items-center justify-center">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-6">Patent Services</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Comprehensive patent protection for your innovations and inventions
          </p>
        </div>
      </section>

      {/* What is this service */}
      <section className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">What is this service?</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Patents are exclusive rights granted for inventions that are new, useful, 
                and non-obvious. They provide legal protection for your innovations, 
                preventing others from making, using, or selling your invention without 
                permission.
              </p>
              <div className="bg-emerald-500 w-12 h-12 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="bg-gray-200 rounded-2xl aspect-video flex items-center justify-center">
              <img
                  src="patent.png"
                  alt="Patent Services"
                  className="w-full h-full object-cover"
                />
            </div>
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">Why it matters</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                Patent protection is crucial for maintaining competitive advantage, 
                attracting investors and monetizing your innovations. It provides a legal 
                framework to protect your R&D investments and establish market 
                exclusivity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Process */}
      <section className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Process</h2>
            <p className="text-gray-300 text-lg">
              A systematic approach to protecting your intellectual property
            </p>
          </div>
          
          <div className="space-y-6">
            {processSteps.map((step, index) => (
              <div key={index} className="bg-slate-700 rounded-xl p-6 flex items-center space-x-6">
                <div className="bg-emerald-500 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-300">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-300 text-lg">
              Get answers to common questions about our services
            </p>
          </div>
          
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="bg-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-slate-600 transition-colors"
                >
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-300">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PatentServicesPage;