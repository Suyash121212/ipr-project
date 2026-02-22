import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Scale, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export default function Footer() {
  const location = useLocation();

  // Hide footer on dashboard page
  if (location.pathname === "/dashboard") return null;

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Scale className="h-8 w-8 text-teal-400" />
              <span className="font-playfair text-xl font-bold">IPSecure Legal</span>
            </div>
            <p className="text-gray-400 text-sm">
              Protecting your intellectual property rights with expertise, dedication, and innovative legal solutions.
            </p>
            <div className="flex space-x-4">
              <Link to="#" className="text-gray-400 hover:text-teal-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link to="#" className="text-gray-400 hover:text-teal-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link to="#" className="text-gray-400 hover:text-teal-400 transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link to="#" className="text-gray-400 hover:text-teal-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/patentservice" className="text-gray-400 hover:text-teal-400">Patents</Link></li>
              <li><Link to="/trademarkservices" className="text-gray-400 hover:text-teal-400">Trademarks</Link></li>
              <li><Link to="/copyrightservices" className="text-gray-400 hover:text-teal-400">Copyrights</Link></li>
              <li><Link to="/industrialdesignservices" className="text-gray-400 hover:text-teal-400">Industrial Design</Link></li>
              <li><Link to="/iplitigationpage" className="text-gray-400 hover:text-teal-400">IP Litigation</Link></li>
              <li><Link to="/patentGuide" className="text-gray-400 hover:text-teal-400">Patent Filing Process</Link></li>
              <li><Link to="/copyrightGuide" className="text-gray-400 hover:text-teal-400">Copyright Filing Process</Link></li>
              <li><Link to="/requirements" className="text-gray-400 hover:text-teal-400">Filing Requirements</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-gray-400 hover:text-teal-400">About Us</Link></li>
              <li><Link to="/insights" className="text-gray-400 hover:text-teal-400">Insights</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-teal-400">Contact</Link></li>
              <li><Link to="/login" className="text-gray-400 hover:text-teal-400">Client Login</Link></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-teal-400">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-teal-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400">
                  123 Main Street, Suite 400<br />
                  <br /> Pune - 411001, Maharashtra, India
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-teal-400 flex-shrink-0" />
                <span className="text-gray-400">+91 9878453838</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-teal-400 flex-shrink-0" />
                <span className="text-gray-400">info@ipsecurelegal.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} IPSecure Legal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
