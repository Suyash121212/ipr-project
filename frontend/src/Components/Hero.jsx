import { useState, useEffect } from "react";
import { ArrowRight, Shield, Scale, Award } from "lucide-react";

export default function Hero() {
  const [currentText, setCurrentText] = useState(0);
  const texts = [
    "Protecting Your Innovations",
    "Securing Your Brand Identity",
    "Defending Your Creative Works"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentText((prev) => (prev + 1) % texts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-0"></div>

      {/* Background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-50 "
      >
        <source src="/home_bg.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
       

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="font-sans text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
          <span className="block">IPSecure Legal</span>
          <span className="block text-2xl md:text-4xl lg:text-5xl mt-4 text-teal-300 transition-all duration-500">
            {texts[currentText]}
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
          Leading intellectual property law firm specializing in patents,
          trademarks, copyrights, and IP litigation. Your innovation deserves
          the best protection.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <a
            href="/consultation"
            className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 text-lg rounded-lg flex items-center"
          >
            Get Consultation
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
          <a
            href="/patent"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-lg flex items-center"
          >
            File Patent
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
          <a
            href="/copyright"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg rounded-lg flex items-center"
          >
            File Copyright
            <ArrowRight className="ml-2 h-5 w-5" />
          </a>
          <a
            href="/requirements"
            className="border border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 text-lg rounded-lg"
          >
            Learn More (FAQs & Requirements)
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Shield className="h-8 w-8 text-teal-300" />
            </div>
            <div className="text-3xl font-bold text-white">500+</div>
            <div className="text-gray-300">Patents Secured</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Scale className="h-8 w-8 text-teal-300" />
            </div>
            <div className="text-3xl font-bold text-white">15+</div>
            <div className="text-gray-300">Years Experience</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Award className="h-8 w-8 text-teal-300" />
            </div>
            <div className="text-3xl font-bold text-white">98%</div>
            <div className="text-gray-300">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}
