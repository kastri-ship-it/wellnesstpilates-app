import { ChevronRight, Globe, User } from 'lucide-react';
import { Language, translations } from '../translations';
// Placeholder images - replace with actual images later
const logo = 'https://azqkguctispoctvmpmci.supabase.co/storage/v1/object/sign/Logo/wellnestpilates_logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yYjI3MjJkNi04NTZmLTQzZTYtYjI0My0xNTMzM2E4NzAzZWQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMb2dvL3dlbGxuZXN0cGlsYXRlc19sb2dvLnBuZyIsImlhdCI6MTc2OTU1NjYwNiwiZXhwIjoxODAxMDkyNjA2fQ.JfL5XPlVZtq1oI_abB4H5tGEJqhgB1uRNtwInmlg9KI';
const multiPackageImage = 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop';
const singleSessionImage = 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=300&fit=crop';
const individualTrainingImage = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop';
const duoTrainingImage = 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=400&h=300&fit=crop';

type TrainingTypeSelectionProps = {
  onSelectType: (type: 'single' | 'package' | 'individual' | 'duo') => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onMemberLoginClick: () => void;
  onLogoClick: () => void;
  onAdminClick: () => void;
};

export function TrainingTypeSelection({ 
  onSelectType, 
  language, 
  onLanguageChange, 
  onMemberLoginClick,
  onLogoClick,
  onAdminClick
}: TrainingTypeSelectionProps) {
  const t = translations[language];

  const trainingOptions = [
    {
      type: 'single' as const,
      title: t.singleSessionTitle,
      subtitle: t.singleSessionSubtitle,
      image: singleSessionImage,
      gradient: 'from-[#9ca571]/60 to-[#7a8556]/60',
    },
    {
      type: 'package' as const,
      title: t.multiPackageTitle,
      subtitle: t.multiPackageSubtitle,
      image: multiPackageImage,
      gradient: 'from-[#b5a582]/60 to-[#988861]/60',
    },
    {
      type: 'individual' as const,
      title: t.individualTrainingTitle,
      subtitle: t.individualTrainingSubtitle,
      image: individualTrainingImage,
      gradient: 'from-[#d4c4ba]/60 to-[#b5a090]/60',
    },
    {
      type: 'duo' as const,
      title: t.duoTrainingTitle,
      subtitle: t.duoTrainingSubtitle,
      image: duoTrainingImage,
      gradient: 'from-[#c4a582]/60 to-[#a58861]/60',
    },
  ];

  return (
    <div className="relative h-full flex flex-col px-5 py-6 pt-12">
      {/* Header with Language and Member Login */}
      <div className="relative mb-8">
        {/* Language Toggle - Left - Show all 3 languages */}
        <div className="flex items-center gap-1 px-2 py-1 bg-white/60 backdrop-blur-sm rounded-full shadow-sm inline-flex">
          <Globe className="w-3.5 h-3.5 text-[#6b5949]" />
          <button 
            onClick={() => onLanguageChange('SQ')}
            className={`text-xs font-medium px-1.5 py-0.5 rounded transition-colors ${
              language === 'SQ' ? 'text-[#3d2f28] bg-white/50' : 'text-[#8b7764] hover:text-[#6b5949]'
            }`}
          >
            SQ
          </button>
          <span className="text-[#8b7764] text-xs">|</span>
          <button 
            onClick={() => onLanguageChange('MK')}
            className={`text-xs font-medium px-1.5 py-0.5 rounded transition-colors ${
              language === 'MK' ? 'text-[#3d2f28] bg-white/50' : 'text-[#8b7764] hover:text-[#6b5949]'
            }`}
          >
            МК
          </button>
          <span className="text-[#8b7764] text-xs">|</span>
          <button 
            onClick={() => onLanguageChange('EN')}
            className={`text-xs font-medium px-1.5 py-0.5 rounded transition-colors ${
              language === 'EN' ? 'text-[#3d2f28] bg-white/50' : 'text-[#8b7764] hover:text-[#6b5949]'
            }`}
          >
            EN
          </button>
        </div>
        
        {/* Member Login - Right - Icon Only */}
        <button 
          onClick={onMemberLoginClick}
          className="absolute right-0 top-0 flex items-center justify-center w-8 h-8 bg-white/60 backdrop-blur-sm rounded-full shadow-sm hover:bg-white/80 transition-colors"
          title={t.memberLogin}
        >
          <User className="w-4 h-4 text-[#6b5949]" />
        </button>
        
        <div className="text-center mt-6">
          <h1 className="text-xl text-[#3d2f28] mb-1.5">{t.trainingTypeTitle}</h1>
        </div>
      </div>

      {/* Training Type Cards */}
      <div className="flex-1 flex flex-col gap-4">
        {trainingOptions.map((option) => (
          <button
            key={option.type}
            onClick={() => onSelectType(option.type)}
            className="relative h-36 rounded-2xl overflow-hidden group transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {/* Background Image */}
            <img
              src={option.image}
              alt={option.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-r ${option.gradient}`} />
            
            {/* Content */}
            <div className="relative h-full flex items-center justify-between px-5">
              <div className="text-left flex-1 pr-4">
                <h2 className="text-lg text-white mb-1">{option.title}</h2>
                <p className="text-xs text-white/90 whitespace-pre-line leading-relaxed">{option.subtitle}</p>
              </div>
              
              {/* Arrow */}
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 group-hover:bg-white/30 transition-colors flex-shrink-0">
                <ChevronRight className="w-5 h-5 text-white" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer - Positioned very close to the cards */}
      <div className="text-center -mt-[100px]">
        {/* Logo */}
        <img 
          src={logo} 
          alt="Logo" 
          className="w-12 h-12 mx-auto mb-2 cursor-pointer" 
          onClick={onLogoClick} 
        />
        <p className="text-[10px] text-[#8b7764]">{t.location}</p>
        <p className="text-[10px] text-[#8b7764] mt-0.5">{t.copyright}</p>
      </div>

      {/* Admin Button - Bottom Right - Within Mobile Frame - Donut Shape 99% Transparent */}
      <button
        onClick={onAdminClick}
        className="absolute bottom-6 right-6 w-11 h-11 rounded-full border-[3px] border-[#8b7764]/[0.01] hover:border-[#8b7764]/10 transition-all duration-300 flex items-center justify-center"
        aria-label="Admin"
        style={{
          background: 'transparent',
        }}
      >
        {/* Inner donut hole */}
        <div className="w-4 h-4 rounded-full border-[2px] border-[#8b7764]/[0.01] hover:border-[#8b7764]/10 transition-all duration-300" />
      </button>
    </div>
  );
}
