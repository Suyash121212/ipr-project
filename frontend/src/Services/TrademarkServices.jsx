import React, { useState } from 'react';
import { Scale, FileText, ChevronDown, Shield, Search, FileCheck, Clock, Award } from 'lucide-react';

const TrademarkServices = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    services: ''
  });

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for your inquiry! We will contact you soon.');
  };

  const processSteps = [
    {
      number: 1,
      title: "Initial Consultation",
      description: "Review your trademark and assess patentability",
      icon: <Search className="w-6 h-6" />
    },
    {
      number: 2,
      title: "Prior Art Search",
      description: "Comprehensive search to ensure novelty",
      icon: <FileCheck className="w-6 h-6" />
    },
    {
      number: 3,
      title: "Application Drafting",
      description: "Prepare detailed trademark application",
      icon: <FileText className="w-6 h-6" />
    },
    {
      number: 4,
      title: "Filing & Prosecution",
      description: "Submit application and respond to office actions",
      icon: <Clock className="w-6 h-6" />
    },
    {
      number: 5,
      title: "Trademark Grant",
      description: "Receive your trademark protection",
      icon: <Award className="w-6 h-6" />
    }
  ];

  const faqs = [
    {
      question: "How long does the trademark process take?",
      answer: "The trademark registration process typically takes 8-12 months from filing to registration, depending on the complexity of the mark and any office actions that may arise."
    },
    {
      question: "What makes a strong trademark?",
      answer: "Strong trademarks are distinctive, not merely descriptive, and clearly identify the source of goods or services. Invented words, arbitrary terms, and suggestive marks are generally stronger than descriptive ones."
    },
    {
      question: "How long does trademark protection last?",
      answer: "Trademarks can last indefinitely as long as they are properly maintained and renewed. Initial registration lasts 10 years and can be renewed for successive 10-year periods."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      

      {/* Hero Section */}
            <section className="bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-900 py-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="bg-emerald-500 w-16 h-16 rounded-2xl mx-auto mb-8 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-5xl font-bold mb-6 text-white">Trademark Services</h1>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  Protect your brand identity and business reputation
                </p>
              </div>
            </section>

      {/* Main Content Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* What is this service */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-teal-500/20 p-3 rounded-xl">
                  <FileText className="w-8 h-8 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-4">What is this service?</h2>
                  <p className="text-slate-300 leading-relaxed text-lg">
                    Trademarks protect brand names, logos, slogans, and other distinctive 
                    marks that identify your goods or services. They provide exclusive rights 
                    and help consumers recognize and trust your brand in the marketplace.
                  </p>
                </div>
              </div>
            </div>

            {/* Video Placeholder */}
            <div className="relative">
              <div className="bg-slate-700/50 rounded-2xl aspect-video flex items-center justify-center backdrop-blur-sm border border-slate-600">
                <img
                  src="trademark.png"
                  alt="Trademark Services"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Why it matters */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="lg:order-2 space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-teal-500/20 p-3 rounded-xl">
                  <Shield className="w-8 h-8 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-4">Why it matters</h2>
                  <p className="text-slate-300 leading-relaxed text-lg">
                    Trademark protection is crucial for maintaining competitive advantage, 
                    enhancing investor and marketplace your innovations. It provides a legal 
                    framework to protect your R&D and establish market exclusivity.
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:order-1">
              <div className="bg-slate-700/30 rounded-2xl p-8 border border-slate-600">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-teal-400 mb-2">20 Years</div>
                    <div className="text-slate-300">Protection Period</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-teal-400 mb-2">Global</div>
                    <div className="text-slate-300">Coverage Available</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Process */}
      <section className="py-16 px-4 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Our Process</h2>
            <p className="text-slate-300 text-lg">A systematic approach to protecting your intellectual property</p>
          </div>

          <div className="space-y-4">
            {processSteps.map((step, index) => (
              <div key={index} className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600 hover:border-teal-500/50 transition-all duration-300">
                <div className="flex items-center space-x-6">
                  <div className="bg-teal-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {step.number}
                  </div>
                  <div className="bg-teal-500/20 p-3 rounded-xl">
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-slate-300">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-300 text-lg">Get answers to common questions about our services</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-slate-700/50 backdrop-blur-sm rounded-xl border border-slate-600 overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-6 text-left flex items-center justify-between text-white hover:bg-slate-600/30 transition-all duration-200"
                >
                  <span className="font-medium text-lg">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6 border-t border-slate-600">
                    <p className="text-slate-300 leading-relaxed mt-4">
                      {faq.answer}
                    </p>
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

export default TrademarkServices;