import DeliveryRoadmap from "@/components/delivery-roadmap";
import HeroSection from "@/components/hero-section";
import ProductBoundary from "@/components/product-boundary";
import ProductWorkflow from "@/components/product-workflow";
import SiteFooter from "@/components/site-footer";
import { HeroHeader } from "@/components/site-header";
import WorkflowSummary from "@/components/workflow-summary";

export default function Home() {
  return (
    <>
      <HeroHeader />
      <main>
        <HeroSection />
        <ProductWorkflow />
        <WorkflowSummary />
        <ProductBoundary />
        <DeliveryRoadmap />
      </main>
      <SiteFooter />
    </>
  );
}
