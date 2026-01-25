import { useState, useEffect } from 'react';
import { Globe, User, Shield } from 'lucide-react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { translations } from '@/app/translations';
import { TrainingTypeSelection } from './TrainingTypeSelection';
import { BookingScreen } from './BookingScreen';
import { PackageOverview } from './PackageOverview';
import { IndividualTraining } from './IndividualTraining';
import { DuoTraining } from './DuoTraining';
import { ConfirmationScreen } from './ConfirmationScreen';
import { SuccessScreen } from './SuccessScreen';
import { InstructorProfile } from './InstructorProfile';
import { MemberActivationModal } from './MemberActivationModal';
import { LoginRegisterModal } from './LoginRegisterModal';
import { UserDashboard } from './UserDashboard';
import { AdminLogin } from './AdminLogin';
import { AdminPanel } from './AdminPanel';
import { projectId, publicAnonKey } from '/utils/supabase/info';

type Screen =
  | { type: 'trainingType' }
  | { type: 'booking'; trainingType: 'single' | 'package' | 'individual' }
  | { type: 'package' }
  | { type: 'individual' }
  | { type: 'duo' }
  | { type: 'confirmation'; bookingData: any }
  | { type: 'success'; bookingData: any }
  | { type: 'instructorProfile'; instructorName: string }
  | { type: 'userDashboard'; userEmail: string; userName: string; userSurname: string; userPackage: string | null; sessionsRemaining: number }
  | { type: 'adminLogin' }
  | { type: 'adminPanel' };

export function MainApp() {
  const { language, setLanguage } = useLanguage();
  const t = translations[language];
  
  const [screen, setScreen] = useState<Screen>({ type: 'trainingType' });
  const [showMemberActivation, setShowMemberActivation] = useState(false);
  const [showLoginRegister, setShowLoginRegister] = useState(false);
  const [hasCleared, setHasCleared] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [logoClickTimer, setLogoClickTimer] = useState<NodeJS.Timeout | null>(null);

  // Scroll to top on every screen change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  // Clear all data on first load
  useEffect(() => {
    const clearData = async () => {
      if (hasCleared) return;
      
      try {
        console.log('🧹 Clearing all existing data...');
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-b87b0c07/dev/clear-all-data`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        const data = await response.json();
        if (response.ok) {
          console.log('✅ Data cleared successfully:', data);
          setHasCleared(true);
        } else {
          console.error('❌ Failed to clear data:', data);
        }
      } catch (error) {
        console.error('Error clearing data:', error);
      }
    };

    clearData();
  }, [hasCleared]);

  const handleSelectTrainingType = (type: 'single' | 'package' | 'individual' | 'duo') => {
    if (type === 'individual') {
      setScreen({ type: 'individual' });
    } else if (type === 'duo') {
      setScreen({ type: 'duo' });
    } else if (type === 'package') {
      setScreen({ type: 'package' });
    } else {
      setScreen({ type: 'booking', trainingType: type });
    }
  };

  const handleBookingSubmit = (bookingData: any) => {
    setScreen({ type: 'confirmation', bookingData });
  };

  const handleConfirmBooking = (bookingData: any) => {
    setScreen({ type: 'success', bookingData });
  };

  const handleInstructorClick = (instructorName: string) => {
    setScreen({ type: 'instructorProfile', instructorName });
  };

  const handleBack = () => {
    setScreen({ type: 'trainingType' });
  };

  const handleSuccessBack = () => {
    setScreen({ type: 'trainingType' });
  };

  const handleMemberActivation = () => {
    setShowMemberActivation(true);
  };

  const handleLoginSuccess = (user: any, needsActivation: boolean) => {
    setShowLoginRegister(false);
    setScreen({
      type: 'userDashboard',
      userEmail: user.email,
      userName: user.name,
      userSurname: user.surname,
      userPackage: user.package,
      sessionsRemaining: user.sessionsRemaining
    });
  };

  const handleUserDashboardBack = () => {
    setScreen({ type: 'trainingType' });
  };

  const cycleLanguage = () => {
    const languages: Language[] = ['sq', 'mk', 'en'];
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
  };

  const getLanguageLabel = () => {
    const labels = { sq: 'SQ', mk: 'МК', en: 'EN' };
    return labels[language];
  };

  const handleLogoClick = () => {
    setLogoClickCount(prevCount => prevCount + 1);

    if (logoClickTimer) {
      clearTimeout(logoClickTimer);
    }

    const newTimer = setTimeout(() => {
      if (logoClickCount >= 5) {
        setScreen({ type: 'adminLogin' });
      }
      setLogoClickCount(0);
    }, 1000);

    setLogoClickTimer(newTimer);
  };

  return (
    <div className="relative w-full max-w-[440px] h-[956px] mx-auto bg-[#f5f0ed] overflow-hidden shadow-2xl">
      {/* Main Content */}
      {screen.type === 'trainingType' && (
        <TrainingTypeSelection 
          onSelectType={handleSelectTrainingType} 
          language={language}
          onLanguageChange={setLanguage}
          onMemberLoginClick={() => setShowLoginRegister(true)}
          onLogoClick={handleLogoClick}
          onAdminClick={() => setScreen({ type: 'adminLogin' })}
        />
      )}

      {screen.type === 'booking' && (
        <BookingScreen
          trainingType={screen.trainingType}
          onBack={handleBack}
          onSubmit={handleBookingSubmit}
          onInstructorClick={handleInstructorClick}
          language={language}
        />
      )}

      {screen.type === 'package' && (
        <PackageOverview
          onBack={handleBack}
          language={language}
        />
      )}

      {screen.type === 'individual' && (
        <IndividualTraining
          onBack={handleBack}
          language={language}
          onLogoClick={handleLogoClick}
        />
      )}

      {screen.type === 'duo' && (
        <DuoTraining
          onBack={handleBack}
          language={language}
          onLogoClick={handleLogoClick}
        />
      )}

      {screen.type === 'confirmation' && (
        <ConfirmationScreen
          bookingData={screen.bookingData}
          onBack={handleBack}
          onConfirm={handleConfirmBooking}
          language={language}
        />
      )}

      {screen.type === 'success' && (
        <SuccessScreen
          bookingData={screen.bookingData}
          onBack={handleSuccessBack}
          language={language}
        />
      )}

      {screen.type === 'instructorProfile' && (
        <InstructorProfile instructorName={screen.instructorName} onBack={handleBack} language={language} />
      )}

      {screen.type === 'userDashboard' && (
        <UserDashboard
          userEmail={screen.userEmail}
          onLogout={handleBack}
          onBookSession={() => {
            // Navigate back to training type selection to book a new session
            setScreen({ type: 'trainingType' });
          }}
          language={language}
        />
      )}

      {screen.type === 'adminLogin' && (
        <AdminLogin
          onBack={handleBack}
          onLogin={() => setScreen({ type: 'adminPanel' })}
        />
      )}

      {screen.type === 'adminPanel' && (
        <AdminPanel onLogout={handleBack} />
      )}

      {/* Member Activation Modal */}
      {showMemberActivation && (
        <MemberActivationModal
          onClose={() => setShowMemberActivation(false)}
          language={language}
        />
      )}

      {/* Login/Register Modal */}
      {showLoginRegister && (
        <LoginRegisterModal
          onClose={() => setShowLoginRegister(false)}
          onLoginSuccess={handleLoginSuccess}
          language={language}
        />
      )}
    </div>
  );
}