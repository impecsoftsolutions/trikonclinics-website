import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ModernThemeProvider } from './contexts/ModernThemeContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Home } from './pages/Home';
import { Doctors } from './pages/Doctors';
import { Services } from './pages/Services';
import { Testimonials } from './pages/Testimonials';
import { Contact } from './pages/Contact';
import HealthLibrary from './pages/HealthLibrary';
import HealthLibraryDetail from './pages/HealthLibraryDetail';
import { HospitalProfile } from './pages/HospitalProfile';
import { ManageDoctors } from './pages/ManageDoctors';
import { ManageServices } from './pages/ManageServices';
import { ManageTestimonials } from './pages/ManageTestimonials';
import { ContactInfo } from './pages/ContactInfo';
import { SocialMedia } from './pages/SocialMedia';
import { ActivityLogs } from './pages/ActivityLogs';
import { UserManagement } from './pages/UserManagement';
import ManageIllnesses from './pages/ManageIllnesses';
import ManageCategories from './pages/ManageCategories';
import { ModernThemeSettings } from './pages/ModernThemeSettings';
import { EventsDashboard } from './pages/admin/events/EventsDashboard';
import { EventsList } from './pages/admin/events/EventsList';
import { EventFormPlaceholder } from './pages/admin/events/EventFormPlaceholder';
import { AdminLayout } from './layouts/AdminLayout';
import { PublicLayout } from './layouts/PublicLayout';

function App() {
  return (
    <AuthProvider>
      <ModernThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/services" element={<Services />} />
              <Route path="/health-library" element={<HealthLibrary />} />
              <Route path="/health-library/:slug" element={<HealthLibraryDetail />} />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="hospital-profile" element={<HospitalProfile />} />
              <Route path="modern-themes" element={<ModernThemeSettings />} />
              <Route path="doctors" element={<ManageDoctors />} />
              <Route path="services" element={<ManageServices />} />
              <Route path="testimonials" element={<ManageTestimonials />} />
              <Route path="contact" element={<ContactInfo />} />
              <Route path="social-media" element={<SocialMedia />} />
              <Route path="health-library/illnesses" element={<ManageIllnesses />} />
              <Route path="health-library/categories" element={<ManageCategories />} />
              <Route path="events/dashboard" element={<EventsDashboard />} />
              <Route path="events/list" element={<EventsList />} />
              <Route path="events/add" element={<EventFormPlaceholder />} />
              <Route path="events/edit/:id" element={<EventFormPlaceholder />} />
              <Route path="activity-logs" element={<ActivityLogs />} />
              <Route path="users" element={<UserManagement />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ModernThemeProvider>
    </AuthProvider>
  );
}

export default App;
