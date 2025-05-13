const Footer = () => {
    return (
      <footer className="bg-gray-800 text-white py-8 sm:py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center text-center sm:text-left text-sm sm:text-base">
          {/* Copyright Section */}
          <div className="mb-4 sm:mb-0">
            <p>&copy; 2025 Math Learning Site. All rights reserved.</p>
          </div>
          
          {/* Footer Links */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8">
            <a href="/privacy" className="hover:underline">Privacy Policy</a>
            <a href="/terms" className="hover:underline">Terms of Service</a>
            <a href="/contact" className="hover:underline">Contact</a>
          </div>
        </div>
      </footer>
    );
  };
  
  export default Footer;
  