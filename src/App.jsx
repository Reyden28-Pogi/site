import { lazy, Suspense } from 'react'
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

import ProtectedRoute from './components/admin/ProtectedRoute.jsx'

// Admin and super-admin routes are lazy-loaded: a public-site visitor
// should never have to download admin-only code (including react-quill,
// a genuinely heavy dependency) just to view a business's marketing site.
// This is the biggest single lever on bundle size for this app — splitting
// these out means the public bundle no longer carries the entire admin
// surface with it.
const AdminLogin = lazy(() => import('./routes/admin/AdminLogin.jsx'))
const AcceptInvite = lazy(() => import('./routes/admin/AcceptInvite.jsx'))
const AdminLayout = lazy(() => import('./routes/admin/AdminLayout.jsx'))
const Dashboard = lazy(() => import('./routes/admin/Dashboard.jsx'))
const PackagesAdmin = lazy(() => import('./routes/admin/PackagesAdmin.jsx'))
const GalleryAdmin = lazy(() => import('./routes/admin/GalleryAdmin.jsx'))
const BlogAdmin = lazy(() => import('./routes/admin/BlogAdmin.jsx'))
const TestimonialsAdmin = lazy(() => import('./routes/admin/TestimonialsAdmin.jsx'))
const LeadsAdmin = lazy(() => import('./routes/admin/LeadsAdmin.jsx'))
const ReviewsAdmin = lazy(() => import('./routes/admin/ReviewsAdmin.jsx'))
const SettingsAdmin = lazy(() => import('./routes/admin/SettingsAdmin.jsx'))

const SuperAdminLogin = lazy(() => import('./routes/super-admin/SuperAdminLogin.jsx'))
const SuperAdminLayout = lazy(() => import('./routes/super-admin/SuperAdminLayout.jsx'))
const BusinessesList = lazy(() => import('./routes/super-admin/BusinessesList.jsx'))
const EditBusiness = lazy(() => import('./routes/super-admin/EditBusiness.jsx'))
const CreateBusiness = lazy(() => import('./routes/super-admin/CreateBusiness.jsx'))

function AdminLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper text-ink/50">
      Loading…
    </div>
  )
}

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
      <Route
        path="/admin/login"
        element={
          <Suspense fallback={<AdminLoadingFallback />}>
            <AdminLogin />
          </Suspense>
        }
      />
      <Route
        path="/admin/accept-invite"
        element={
          <Suspense fallback={<AdminLoadingFallback />}>
            <AcceptInvite />
          </Suspense>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="business_admin">
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminLayout />
            </Suspense>
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="packages"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <PackagesAdmin />
            </Suspense>
          }
        />
        <Route
          path="gallery"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <GalleryAdmin />
            </Suspense>
          }
        />
        <Route
          path="blog"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <BlogAdmin />
            </Suspense>
          }
        />
        <Route
          path="testimonials"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <TestimonialsAdmin />
            </Suspense>
          }
        />
        <Route
          path="leads"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <LeadsAdmin />
            </Suspense>
          }
        />
        <Route
          path="reviews"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <ReviewsAdmin />
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <SettingsAdmin />
            </Suspense>
          }
        />
      </Route>

      {/* ---------- Super Admin (tenant management only) ---------- */}
      <Route
        path="/super-admin/login"
        element={
          <Suspense fallback={<AdminLoadingFallback />}>
            <SuperAdminLogin />
          </Suspense>
        }
      />
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute role="super_admin">
            <Suspense fallback={<AdminLoadingFallback />}>
              <SuperAdminLayout />
            </Suspense>
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <BusinessesList />
            </Suspense>
          }
        />
        <Route
          path="edit/:businessId"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <EditBusiness />
            </Suspense>
          }
        />
        <Route
          path="new"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <CreateBusiness />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}
