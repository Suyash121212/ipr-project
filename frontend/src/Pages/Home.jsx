import Footer from '../Components/Footer'
import Hero from '../Components/Hero'
import Navbar from '../Components/Navbar'
import Services from '../Components/Services'

function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* <Navbar /> */}
      <Hero />
      <Services />
      {/* <Footer /> */}
    </div>
  )
}

export default Home
