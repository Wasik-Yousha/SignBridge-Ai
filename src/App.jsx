import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RootLayout } from './components/layout';
import { HomePage, AboutPage } from './pages';

/**
 * App - Root component with client-side routing.
 */
const App = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default App;
