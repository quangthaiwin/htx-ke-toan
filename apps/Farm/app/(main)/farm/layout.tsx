import { ServiceWorkerRegistration } from "./components/sw-register";
import { MobileBottomNav } from "./components/mobile-nav";

export default function FarmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ServiceWorkerRegistration />
      <div className="pb-16 md:pb-0">{children}</div>
      <MobileBottomNav />
    </>
  );
}
