import { Routes, Route } from "react-router-dom";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import ClaimPage from "@/pages/ClaimPage";
import OpportunitiesPage from "@/pages/OpportunitiesPage";
import CategoryPage from "@/pages/CategoryPage";
import ResourcesPage from "@/pages/ResourcesPage";
import BrandPreviewPage from "@/pages/BrandPreviewPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <div className="min-h-full flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/claim" element={<ClaimPage />} />
          <Route path="/opportunities" element={<OpportunitiesPage />} />
          <Route path="/opportunities/:category" element={<CategoryPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/brand-preview" element={<BrandPreviewPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <SiteFooter />
    </div>
  );
}
