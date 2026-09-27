import ScrollVideo from './components/ScrollVideo'
import Navbar from './components/Navbar'
import SectionOne from './components/SectionOne'
import SectionTwo from './components/SectionTwo'

export default function App() {
  return (
    <div className="relative">
      <ScrollVideo />
      <Navbar />
      <main>
        <SectionOne />
        <div aria-hidden className="h-[80vh]" />
        <SectionTwo />
      </main>
    </div>
  )
}
