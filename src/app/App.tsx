import { LanguageProvider } from '@/contexts/LanguageContext';
import { MainApp } from '@/app/components/MainApp';
import { CouponDebugPanel } from '@/app/components/CouponDebugPanel';

// Booking data type definition
export type BookingData = {
  name?: string;
  surname?: string;
  mobile?: string;
  email?: string;
  password?: string;
  date?: string;
  dateKey?: string;
  timeSlot?: string;
  instructor?: string;
  selectedPackage?: string;
  payInStudio?: boolean;
};

// Main application entry point
export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
      <CouponDebugPanel />
    </LanguageProvider>
  );
}