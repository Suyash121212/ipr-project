import { useState } from 'react'
import { Users, Award, Building, Globe, ChevronRight } from 'lucide-react'

function About() {
  const [activeYear, setActiveYear] = useState(2019)

  const stats = [
    { number: '50+', label: 'Expert Lawyers', icon: Users },
    { number: '15+', label: 'Years Experience', icon: Award },
    { number: '1000+', label: 'Cases Won', icon: Building },
    { number: '25+', label: 'Countries Served', icon: Globe }
  ]

  const founders = [
    {
      name: 'Anjali S.',
      title: 'Managing Partner',
      description: 'Anjali brings over 15 years of IP law experience, having previously worked at top-tier firms specializing in patent prosecution and IP strategy.',
      education: 'JD from Harvard Law School, BS in Engineering'
    },
    {
      name: 'Rajesh P.',
      title: 'Senior Partner',
      description: 'Rajesh is a seasoned expert in trademark law and IP litigation. He has successfully represented clients in high-stakes IP disputes.',
      education: 'JD from Stanford Law, MBA from Wharton'
    }
  ]

  const teamMembers = [
    { name: 'Jennifer Walsh', title: 'Patent Attorney', specialty: 'Biotechnology & Pharmaceuticals' },
    { name: 'Robert Kim', title: 'Trademark Counsel', specialty: 'Brand Protection & Licensing' },
    { name: 'Maria Rodriguez', title: 'IP Litigation Partner', specialty: 'Complex IP Disputes' },
    { name: 'James Thompson', title: 'Copyright Attorney', specialty: 'Entertainment & Media' },
    { name: 'Lisa Park', title: 'Technology Transfer Counsel', specialty: 'University & Research Partnerships' },
    { name: 'Michael Brown', title: 'International IP Specialist', specialty: 'Global IP Strategy' }
  ]

  const timeline = [
    {
      year: 2019,
      title: 'Firm Founded',
      description: 'IPSecure Legal established with a vision to provide exceptional IP services.'
    },
    {
      year: 2020,
      title: 'First Major Victory',
      description: 'Won landmark trademark case establishing key litigation precedent.'
    },
    {
      year: 2021,
      title: 'International Expansion',
      description: 'Opened offices in London and Tokyo to serve global clients.'
    },
    {
      year: 2022,
      title: 'Industry Recognition',
      description: 'Named "IP Law Firm of the Year" by Legal Excellence Awards.'
    },
    {
      year: 2023,
      title: '1000th Patent',
      description: 'Reached milestone of securing our 1000th patent for clients.'
    },
    {
      year: 2024,
      title: 'Technology Innovation',
      description: 'Launched AI-powered IP portfolio management platform.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-teal-700 py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About IPSecure Legal</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Vighnaharta TechFabrica Innovations LLP, Pune is MSME registered enterprise having LLPIN:ACK-7462 and Udyam registration: UDYAM-MH-01-0210491. VTFI LLP is a forward-looking intellectual property and technology consultancy that empowers innovators, researchers, entrepreneurs, and institutions to protect, commercialize, and scale their ideas. With a core focus on Patent, Trademark and Copyright consulting, innovation management, and technology-driven solutions, the LLP has established itself as a trusted partner for hundreds of innovators across India.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <div key={index} className="text-center">
                  <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-blue-100">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="py-20 bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Details</h2>
              <p className="text-gray-300 mb-6">
                VTFI registration details:
              </p>
              <p className="text-gray-300 mb-6">
                MSME registered entrprise.
              </p>
              <p className="text-gray-300">
                LLP identification number: ACK-7462
              </p>
              <p className="text-gray-300">
                Udyam registration: UDYAM-MH-01-0210491
              </p>
            </div>
            <div className="bg-gray-700 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <Building className="w-24 h-24 text-teal-500 mx-auto mb-4" />
                <p className="text-gray-300">Our Modern Legal Office</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission, Vision, Values Section */}
      <div className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-8 rounded-lg">
              <h3 className="text-xl font-bold mb-4 text-teal-400">Our Mission</h3>
              <p className="text-gray-300">
                To provide end-to-end Patent, Trademark and Copyright consultancy services including search, drafting, filing, publication, and grant support.  

                To act as a growth catalyst for startups and researchers, by connecting technical creativity with IP law and business opportunities.  

                To create an ecosystem of innovation and entrepreneurship, where academic research is not just published but also protected and commercialized.  

                To simplify complex legal and technical processes with the help of expert patent agents and consultants
              </p>
            </div>
            <div className="bg-gray-800 p-8 rounded-lg">
              <h3 className="text-xl font-bold mb-4 text-blue-400">Our Vision</h3>
              <p className="text-gray-300">
                 To democratize innovation and make intellectual property (IP) protection accessible, affordable, and impactful for every researcher, innovator, and entrepreneur.
                 We envision a future where every idea is safeguarded and transformed into a global asset, enabling innovators to lead with confidence in a knowledge-driven economy. 
              </p>
            </div>
            <div className="bg-gray-800 p-8 rounded-lg">
              <h3 className="text-xl font-bold mb-4 text-purple-400">Our Values</h3>
              <p className="text-gray-300">
                Excellence, integrity, innovation, and client-focused solutions drive everything we do. We believe in transparent communication and ethical practices.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Meet Our Founders
      <div className="py-20 bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Meet Our Founders</h2>
            <p className="text-gray-300">
              Visionary leaders with decades of combined experience in intellectual property law
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {founders.map((founder, index) => (
              <div key={index} className="bg-gray-700 p-8 rounded-lg text-center">
                <div className="w-32 h-32 bg-gray-600 rounded-full mx-auto mb-6"></div>
                <h3 className="text-xl font-bold mb-2">{founder.name}</h3>
                <p className="text-teal-400 mb-4">{founder.title}</p>
                <p className="text-gray-300 mb-4">{founder.description}</p>
                <div>
                  <h4 className="font-semibold text-gray-200 mb-2">Education</h4>
                  <p className="text-sm text-gray-400">{founder.education}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div> */}

      {/* Our Expert Team */}
      {/* <div className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Expert Team</h2>
            <p className="text-gray-300">
              Dedicated professionals with specialized expertise across all areas of intellectual property law
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-gray-800 p-6 rounded-lg text-center">
                <div className="w-24 h-24 bg-gray-600 rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-bold mb-1">{member.name}</h3>
                <p className="text-teal-400 text-sm mb-2">{member.title}</p>
                <p className="text-gray-400 text-sm">{member.specialty}</p>
              </div>
            ))}
          </div>
        </div>
      </div> */}

      
      
    </div>
  )
}

export default About