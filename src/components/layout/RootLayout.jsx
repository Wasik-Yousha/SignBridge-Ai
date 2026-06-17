import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import GridPattern from '../ui/GridPattern';

/**
 * RootLayout - Wraps every page with the Navbar, Footer, and animated grid background.
 */
const RootLayout = () => (
  <GridPattern>
    <div className="min-h-screen text-slate-800 font-sans flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  </GridPattern>
);

export default RootLayout;
