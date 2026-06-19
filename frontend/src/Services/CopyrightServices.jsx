import React, { useState } from 'react';
import { Copyright, FileText, ChevronDown, Shield, BookOpen, Music, Camera, Code, Copy } from 'lucide-react';

const CopyrightServices = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    services: ''
  });

  const [openFaq, setOpenFaq] = useState(null);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you! Your copyright services request has been submitted successfully.');
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      services: ''
    });
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const processSteps = [
    {
      number: 1,
      title: "Work Assessment",
      description: "Evaluate copyrightability and originality of your creative work"
    },
    {
      number: 2,
      title: "Registration Preparation",
      description: "Prepare copyright application and required deposit materials"
    },
    {
      number: 3,
      title: "Filing & Submission",
      description: "Submit application to the U.S. Copyright Office"
    },
    {
      number: 4,
      title: "Examination Review",
      description: "Copyright Office reviews application for compliance"
    },
    {
      number: 5,
      title: "Certificate Issued",
      description: "Receive official copyright registration certificate"
    }
  ];

  const faqData = [
    {
      question: "What can be copyrighted?",
      answer: "Original works of authorship including literary works, musical compositions, artistic works, photographs, software code, architectural designs, and other creative expressions fixed in a tangible medium."
    },
    {
      question: "How long does copyright protection last?",
      answer: "Copyright protection typically lasts for the life of the author plus 70 years. For works made for hire, protection lasts 95 years from publication or 120 years from creation, whichever is shorter."
    },
    {
      question: "Do I need to register my copyright?",
      answer: "Copyright exists automatically upon creation, but registration provides additional legal benefits including the ability to sue for infringement and seek statutory damages and attorney fees."
    }
  ];

  const copyrightTypes = [
    { icon: BookOpen, title: "Literary Works", desc: "Books, articles, blogs, scripts" },
    { icon: Music, title: "Musical Works", desc: "Songs, compositions, soundtracks" },
    { icon: Camera, title: "Visual Arts", desc: "Photography, paintings, graphics" },
    { icon: Code, title: "Software Code", desc: "Applications, websites, algorithms" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-800">
      

      {/* Hero Section */}
            <section className="bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-900 py-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="bg-emerald-500 w-16 h-16 rounded-2xl mx-auto mb-8 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-5xl font-bold mb-6 text-white">Copyright Services</h1>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  Safeguard your creative works and artistic expressions
                </p>
              </div>
            </section>

      {/* Main Content Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            {/* Left Side - Service Description */}
            <div className="space-y-8">
              <div className="flex items-start space-x-6">
                <div className="bg-emerald-500 p-4 rounded-xl flex-shrink-0 shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-6">What is this service?</h2>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    Copyrights protect original works of authorship including literary, 
                    artistic, musical, and dramatic works. They provide creators with 
                    exclusive rights to reproduce, distribute, display, and create 
                    derivative works from their original creations.
                  </p>
                </div>
              </div>

              {/* Copyright Types */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                {copyrightTypes.map((type, index) => (
                  <div key={index} className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
                    <type.icon className="w-8 h-8 text-emerald-400 mb-3" />
                    <h3 className="text-white font-semibold mb-1">{type.title}</h3>
                    <p className="text-gray-400 text-sm">{type.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Video Placeholder */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl aspect-video flex items-center justify-center shadow-2xl">
                <img
                  src="copyright.png"
                  alt="Copyright Services"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent rounded-2xl"></div>
            </div>
          </div>

          {/* Why it matters */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
            <div className="flex items-start space-x-6">
              <div className="bg-emerald-500 p-4 rounded-xl flex-shrink-0 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">Why it matters</h2>
                <p className="text-gray-300 leading-relaxed text-lg">
                  Copyright protection is crucial for maintaining competitive advantage, 
                  protecting your creative investments, and monetizing your innovations. 
                  It provides a legal framework to protect your R&D costs and establish 
                  market exclusivity for your creative works and expressions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Process Section */}
      <section className="py-20 bg-gray-900/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Our Process</h2>
            <p className="text-gray-300 text-lg">A systematic approach to protecting your intellectual property</p>
          </div>

          <div className="space-y-6">
            {processSteps.map((step, index) => (
              <div key={index} className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 hover:bg-gray-800/80 transition-all duration-300">
                <div className="flex items-center space-x-6">
                  <div className="bg-emerald-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg flex-shrink-0">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-gray-300 text-lg">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-800/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            <p className="text-gray-300 text-lg">Get answers to common questions about our services</p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between text-white hover:bg-gray-700/50 transition-all duration-200"
                >
                  <span className="font-semibold text-lg">{faq.question}</span>
                  <ChevronDown className={`h-6 w-6 transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-8 pb-6 border-t border-gray-700/50">
                    <p className="text-gray-300 leading-relaxed pt-4">
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
}

export default CopyrightServices;