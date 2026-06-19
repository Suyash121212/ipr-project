import React, { useState } from 'react';
import { Scale, FileText, Phone, Mail, MapPin, ChevronDown } from 'lucide-react';

const IPLitigationPage = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    description: ''
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
    // Handle form submission here
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-emerald-500 w-16 h-16 rounded-2xl mx-auto mb-8 flex items-center justify-center">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-6">IP Litigation Services</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Expert legal representation in intellectual property disputes
          </p>
        </div>
      </section>

      {/* What is this service Section */}
      <section className="py-20 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">What is this service?</h2>
              <p className="text-slate-300 text-lg leading-relaxed">
                IP litigation involves legal disputes over intellectual property rights, 
                including patent enforcement, trademark disputes, copyright violations, 
                and trade secret theft.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video/Image Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-slate-200 rounded-2xl aspect-video flex items-center justify-center">
              <img
                  src="iplitigation.png"
                  alt="IP Litigation Services"
                  className="w-full h-full object-cover"
                />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">Why it matters</h2>
              <p className="text-slate-300 text-lg leading-relaxed">
                Professional litigation representation is essential to protect your IP rights, 
                recover damages from infringers, and defend against unfounded claims. 
                Strong litigation strategy can preserve business value.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Process Section */}
      <section className="py-20 bg-slate-800/30">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Process</h2>
            <p className="text-slate-300 text-lg">
              A systematic approach to protecting your intellectual property
            </p>
          </div>
          
          <div className="space-y-6">
            {[
              {
                step: 1,
                title: "Case Evaluation",
                description: "Assess the strength of your IP case"
              },
              {
                step: 2,
                title: "Strategy Development",
                description: "Develop comprehensive litigation strategy"
              },
              {
                step: 3,
                title: "Discovery Phase",
                description: "Gather evidence and conduct depositions"
              },
              {
                step: 4,
                title: "Motion Practice",
                description: "File motions and respond to opposing counsel"
              },
              {
                step: 5,
                title: "Trial or Settlement",
                description: "Achieve resolution through trial or negotiation"
              }
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-6 bg-slate-700/50 rounded-xl p-6 hover:bg-slate-700/70 transition-colors">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-slate-300">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-300 text-lg">
              Get answers to common questions about our services
            </p>
          </div>
          
          <div className="space-y-4">
            {[
              {
                question: "How long does IP litigation take?",
                answer: "IP litigation typically takes 18-36 months from filing to resolution, depending on the complexity of the case and court schedules."
              },
              {
                question: "What damages can be recovered?",
                answer: "Damages may include lost profits, reasonable royalties, and in some cases, enhanced damages for willful infringement."
              },
              {
                question: "Should I consider settlement?",
                answer: "Settlement can be a cost-effective resolution that provides certainty and avoids the risks of trial. We'll help you evaluate all options."
              }
            ].map((item, index) => (
              <div key={index} className="bg-slate-700/30 rounded-xl border border-slate-600">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-700/50 transition-colors rounded-xl"
                >
                  <span className="font-medium">{item.question}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-slate-300">{item.answer}</p>
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

export default IPLitigationPage;