import Image from 'next/image'
import Link from 'next/link'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function DashMate() {
  return (
    <div className={`h-screen overflow-hidden ${inter.className}`}>
      {/* Main container with yellow to white gradient background */}
      <div className="h-full bg-gradient-to-b from-yellow-300 via-yellow-200 to-white flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        
        {/* Content Container - Two column layout for desktop, single column for mobile */}
        <div className="w-full max-w-6xl mx-auto h-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
          
          {/* Mobile Layout - Single Column */}
          <div className="flex flex-col items-center justify-center text-center space-y-6 lg:hidden">
            {/* Main Title */}
            <h1 className="text-5xl sm:text-6xl font-bold text-blue-600 leading-tight">
              DashMate
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-blue-600 leading-relaxed px-4">
              Get your needs delivered to your doorstep
            </p>
            
            {/* Bus Image */}
            <div className="relative w-full max-w-md sm:max-w-lg">
              <Image
                src="/bus.png"
                alt="DashMate delivery truck with worker loading packages"
                width={600}
                height={400}
                className="w-full h-auto drop-shadow-lg"
                priority
              />
            </div>
            
            {/* Bottom text */}
            <h2 className="text-xl sm:text-2xl font-medium text-blue-600">
              From peers, to you
            </h2>
            
            {/* Get Started Button */}
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-10 sm:py-5 sm:px-14 rounded-full text-lg sm:text-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300">
              <Link href="/login">
                Get Started
              </Link>
            </button>
          </div>
          
          {/* Desktop Layout - Two Columns (hidden on mobile) */}
          <div className="hidden lg:flex w-full h-full items-center justify-center gap-16">
            
            {/* Left Side - Text Content */}
            <div className="flex-1 flex flex-col justify-center text-left space-y-8">
              
              {/* Main Title */}
              <h1 className="text-6xl xl:text-8xl font-bold text-blue-600 leading-tight">
                DashMate
              </h1>
              
              {/* Subtitle */}
              <p className="text-2xl xl:text-3xl text-blue-600 max-w-md leading-relaxed">
                Get your needs delivered to your doorstep
              </p>
              
              {/* Bottom text */}
              <h2 className="text-3xl xl:text-4xl font-medium text-blue-600">
                From peers, to you
              </h2>
              
              {/* Get Started Button */}
              <div className="pt-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-16 xl:py-5 xl:px-20 rounded-full text-xl xl:text-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300">
                  <Link href="/login">
                    Get Started
                  </Link>
                </button>
              </div>
              
            </div>
            
            {/* Right Side - Image */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-full max-w-lg xl:max-w-xl">
                <Image
                  src="/bus.png"
                  alt="DashMate delivery truck with worker loading packages"
                  width={600}
                  height={400}
                  className="w-full h-auto drop-shadow-lg"
                  priority
                />
              </div>
            </div>
            
          </div>
          
        </div>
        
      </div>
    </div>
  )
}

