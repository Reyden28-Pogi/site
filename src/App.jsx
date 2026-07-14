import { Routes, Route } from 'react-router-dom'
import { BusinessProvider } from './lib/businessContext'

import PublicLayout from './components/public/PublicLayout.jsx'
import Home from './routes/public/Home.jsx'
import About from './routes/public/About.jsx'
import Packages from './routes/public/Packages.jsx'
import Gallery from './routes/public/Gallery.jsx'
import Blog from './routes/public/Blog.jsx'
import BlogPost from './routes/public/BlogPost.jsx'
import Contact from './routes/public/Contact.jsx'

import AdminLogin from './routes/admin/AdminLogin.jsx'
import AcceptInvite from './routes/admin/AcceptInvite.jsx'
import AdminLayout from './routes/admin/AdminLayout.jsx'
import Dashboard from './routes/admin/Dashboard.jsx'
import PackagesAdmin from './routes/admin/PackagesAdmin.jsx'
import GalleryAdmin from './routes/admin/GalleryAdmin.jsx'
import BlogAdmin from './routes/admin/BlogAdmin.jsx'
import TestimonialsAdmin from './routes/admin/TestimonialsAdmin.jsx'
import LeadsAdmin from './routes/admin/LeadsAdmin.jsx'
import ReviewsAdmin from './routes/admin/ReviewsAdmin.jsx'
import SettingsAdmin from './routes/admin/SettingsAdmin.jsx'
import ProtectedRoute from './components/admin/ProtectedRoute.jsx'

import SuperAdminLogin from './routes/super-admin/SuperAdminLogin.jsx'
import SuperAdminLayout from './routes/super-admin/SuperAdminLayout.jsx'
import BusinessesList from './routes/super-admin/BusinessesList.jsx'
import EditBusiness from './routes/super-admin/EditBusiness.jsx'
import CreateBusiness from './routes/super-admin/CreateBusiness.jsx'

export default function App() {
  return (
    <Routes>
      {/* ---------- Public, tenant-scoped marketing site ---------- */}
      <Route
        path="/*"
        element={
          <BusinessProvider>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="packages" element={<Packages />} />
                <Route path="gallery" element={<Gallery />} />
                <Route path="blog" element={<Blog />} />
                <Route path="blog/:slug" element={<BlogPost />} />
                <Route path="contact" element={<Contact />} />
              </Route>
            </Routes>
          </BusinessProvider>
        }
      />

      {/* ---------- Business Admin ---------- */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/accept-invite" element={<AcceptInvite />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="business_admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="packages" element={<PackagesAdmin />} />
        <Route path="gallery" element={<GalleryAdmin />} />
        <Route path="blog" element={<BlogAdmin />} />
        <Route path="testimonials" element={<TestimonialsAdmin />} />
        <Route path="leads" element={<LeadsAdmin />} />
        <Route path="reviews" element={<ReviewsAdmin />} />
        <Route path="settings" element={<SettingsAdmin />} />
      </Route>

      {/* ---------- Super Admin (tenant management only) ---------- */}
      <Route path="/super-admin/login" element={<SuperAdminLogin />} />
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute role="super_admin">
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<BusinessesList />} />
        <Route path="edit/:businessId" element={<EditBusiness />} />
        <Route path="new" element={<CreateBusiness />} />
      </Route>
    </Routes>
  )
}