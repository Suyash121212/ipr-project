import React, { useState } from 'react';
import { FileText, Upload, Search, Shield, Phone, Mail, Copyright, Eye, Users, DollarSign } from 'lucide-react';

const CopyrightGuidePage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    emailAddress: '',
    phoneNumber: '',
    copyrightNeeds: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
  };

  const processSteps = [
    {
      id: 1,
      icon: FileText,
      title: "Prepare Your Work",
      subtitle: "Submit a copy/sample of your original work.",
      duration: "1-2 weeks",
      color: "bg-blue-500",
      tasks: [
        "Gather a complete copy or representative sample of your original work",
        "Ensure the work is in its final, published form",
        "Fill out the application form online or offline",
        "Prepare supporting documentation and proof of creation",
        "Organize all materials in the required format"
      ]
    },
    {
      id: 2,
      icon: Upload,
      title: "Application Submission",
      subtitle: "We assist in completing Form XIV and filing with the Copyright Office.",
      duration: "1-4 days",
      color: "bg-green-500",
      tasks: [
        "Complete Form XIV (Application for Registration of Copyright)",
        "Submit the application along with required copies of the work",
        "We assist in completing all forms accurately",
        "File the application with the Copyright Office",
        "Pay the prescribed government fees"
      ]
    },
    {
      id: 3,
      icon: Search,
      title: "Examination",
      subtitle: "The Copyright Registrar examines the application.",
      duration: "2-4 months",
      color: "bg-purple-500",
      tasks: [
        "Copyright Registrar examines the application for completeness",
        "Verification of originality and copyrightability",
        "If queries arise, we help in submitting clarifications",
        "Additional documentation may be requested if needed",
        "Examination ensures compliance with copyright law requirements"
      ]
    },
    {
      id: 4,
      icon: Shield,
      title: "Registration Certificate",
      subtitle: "Upon acceptance, you receive an official copyright registration certificate.",
      duration: "2-4 weeks after approval",
      color: "bg-teal-500",
      tasks: [
        "Copyright Office issues the registration certificate",
        "Certificate serves as prima facie evidence of copyright",
        "Registration details are entered in the Register of Copyrights",
        "You receive official confirmation of copyright protection",
        "Copyright protection is effective from the date of creation"
      ]
    }
  ];

  const benefits = [
    {
      icon: Eye,
      title: "Legal Evidence",
      subtitle: "Prima facie evidence of ownership",
      color: "bg-blue-500"
    },
    {
      icon: Shield,
      title: "Public Record",
      subtitle: "Official record of your copyright",
      color: "bg-green-500"
    },
    {
      icon: Users,
      title: "Legal Protection",
      subtitle: "Enhanced legal remedies",
      color: "bg-purple-500"
    },
    {
      icon: DollarSign,
      title: "Commercial Value",
      subtitle: "Facilitates licensing and transfers",
      color: "bg-teal-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-teal-900 ">

      {/* Hero Section */}
      <div className="relative pt-12 pb-32 px-4 sm:px-6 lg:px-8 ">
        <div className="max-w-4xl mx-auto text-center mt-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-500 rounded-2xl mb-8">
            <Copyright className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            How to Register Your Copyright
          </h1>
          
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Protect your creative works with our step-by-step copyright registration guide. Secure your 
            intellectual property rights today.
          </p>
        </div>
      </div>

      {/* Process Section */}
      <div className="relative px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Copyright Registration Process
            </h2>
            <p className="text-lg text-blue-100">
              Simple and straightforward steps to register your creative works
            </p>
          </div>

          <div className="grid gap-8 md:gap-12">
            {processSteps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={step.id} className="relative">
                  {/* Connector Line */}
                  {index < processSteps.length - 1 && (
                    <div className="hidden md:block absolute left-8 top-20 w-0.5 h-20 bg-gradient-to-b from-slate-600 to-transparent"></div>
                  )}
                  
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                      {/* Step Number and Icon */}
                      <div className="flex items-center gap-4 md:flex-col md:items-center">
                        <div className="flex items-center justify-center w-16 h-16 bg-slate-700 rounded-xl">
                          <span className="text-2xl font-bold text-white">{step.id}</span>
                        </div>
                        <div className={`flex items-center justify-center w-12 h-12 ${step.color} rounded-lg`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                            <p className="text-slate-300 text-lg">{step.subtitle}</p>
                          </div>
                          <div className="mt-2 sm:mt-0">
                            <span className="inline-block px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm font-medium">
                              {step.duration}
                            </span>
                          </div>
                        </div>

                        <ul className="space-y-2">
                          {step.tasks.map((task, taskIndex) => (
                            <li key={taskIndex} className="flex items-start gap-3 text-slate-300">
                              <div className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="relative px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Benefits of Copyright Registration
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${benefit.color} rounded-2xl mb-4`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                  <p className="text-slate-300">{benefit.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>    
    </div>
  );
};

export default CopyrightGuidePage;