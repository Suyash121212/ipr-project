import React, { useState } from 'react';
import { Copyright, FileText, ChevronDown, Shield, BookOpen, Music, Camera, Code, Copy } from 'lucide-react';

const IndustrialDesignServices = () => {
  const [openFAQ, setOpenFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const processSteps = [
    {
      number: 1,
      title: "Design Assessment",
      description: "Evaluate design for protection eligibility"
    },
    {
      number: 2,
      title: "Application Preparation",
      description: "Prepare drawings and application materials"
    },
    {
      number: 3,
      title: "Filing",
      description: "Submit design application"
    },
    {
      number: 4,
      title: "Examination",
      description: "Patent office examines application"
    },
    {
      number: 5,
      title: "Registration",
      description: "Receive design protection certificate"
    }
  ];

  const faqs = [
    "What qualifies for design protection?",
    "How long does design protection last?",
    "Can I protect multiple designs in one application?"
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-emerald-500 w-16 h-16 rounded-2xl mx-auto mb-8 flex items-center justify-center">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-6">Industrial Design Services</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Protect the visual design and aesthetics of your products
          </p>
        </div>
      </section>

      {/* What is this service */}
      <section className="py-16 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">What is this service?</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                Industrial design protection covers the visual design of objects that are 
                not purely utilitarian. This includes the shape, configuration, patterns, or 
                ornamentation of a product.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-120 h-80 bg-gray-700 rounded-lg flex items-center justify-center">
                <img
                  src="industrialdesign.png"
                  alt="Industrial Design Services"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-teal-500 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">Why it matters</h2>
              <p className="text-gray-300 text-lg leading-relaxed">
                Design protection prevents competitors from copying the appearance of 
                your products, helps maintain market differentiation, and can be valuable 
                for licensing and business development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Process */}
      <section className="py-16 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Process</h2>
            <p className="text-gray-300 text-lg">
              A systematic approach to protecting your intellectual property
            </p>
          </div>
          <div className="space-y-4">
            {processSteps.map((step, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-6 flex items-center space-x-4">
                <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">{step.number}</span>
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

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-300 text-lg">
              Get answers to common questions about our services
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-800 rounded-lg">
                <button
                  className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-700 rounded-lg transition-colors"
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="text-lg font-medium">{faq}</span>
                  <svg
                    className={`w-5 h-5 transform transition-transform ${openFAQ === index ? 'rotate-180' : ''}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {openFAQ === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-300">
                      This would contain the answer to the question. Content would be customized based on the specific FAQ item.
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

export default IndustrialDesignServices;