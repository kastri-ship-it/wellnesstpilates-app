import { LanguageProvider } from '@/contexts/LanguageContext';
import { MainApp } from '@/app/components/MainApp';

// Main application entry point
export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}