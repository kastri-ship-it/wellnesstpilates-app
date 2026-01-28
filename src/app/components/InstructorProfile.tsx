import { ChevronLeft, Award, Briefcase } from 'lucide-react';
import { Language, translations } from '../translations';
import logo from '../../assets/d3b087d995c1120c4f6f827938a39596d087b710.png';
import rinaPhoto from '../../assets/2747ea72ef6b5ae1a5cdaf469d96b6ca8cb7d30f.png';

type InstructorProfileProps = {
  onBack: () => void;
  language: Language;
};

export function InstructorProfile({ onBack, language }: InstructorProfileProps) {
  const t = translations[language];
  return (
    <div className="h-full overflow-y-auto px-4 py-3 pt-12">
      {/* Header with Back Button */}
      <div className="flex items-center mb-5">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-[#6b5949] hover:bg-[#f5f0ed] rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg text-[#3d2f28] ml-2">Rina Krasniqi</h1>
      </div>

      {/* Profile Image */}
      <div className="mb-5">
        <img
          src={rinaPhoto}
          alt="Rina Krasniqi"
          className="w-full h-56 object-cover rounded-2xl shadow-lg"
        />
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-3">
        <h3 className="text-sm text-[#6b5949] mb-2 flex items-center gap-2">
          <Award className="w-4 h-4" />
          {t.about}
        </h3>
        <p className="text-sm text-[#3d2f28] leading-relaxed">
          {t.instructorBio}
        </p>
      </div>

      {/* Certifications */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-3">
        <h3 className="text-sm text-[#6b5949] mb-2 flex items-center gap-2">
          <Award className="w-4 h-4" />
          {t.certifications}
        </h3>
        <ul className="space-y-1.5 text-sm text-[#3d2f28]">
          <li className="flex items-start gap-2">
            <span className="text-[#6b5949] mt-0.5">•</span>
            <span>{t.cert1}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#6b5949] mt-0.5">•</span>
            <span>{t.cert2}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#6b5949] mt-0.5">•</span>
            <span>{t.cert3}</span>
          </li>
        </ul>
      </div>

      {/* Experience */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-5">
        <h3 className="text-sm text-[#6b5949] mb-2 flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          {t.experience}
        </h3>
        <ul className="space-y-1.5 text-sm text-[#3d2f28]">
          <li className="flex items-start gap-2">
            <span className="text-[#6b5949] mt-0.5">•</span>
            <span>{t.exp1}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#6b5949] mt-0.5">•</span>
            <span>{t.exp2}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#6b5949] mt-0.5">•</span>
            <span>{t.exp3}</span>
          </li>
        </ul>
      </div>

      <button
        onClick={onBack}
        className="w-full bg-[#d4c4ba] text-[#3d2f28] py-3 rounded-lg text-sm hover:bg-[#c4b4aa] transition-colors mb-3"
      >
        {t.backToBooking}
      </button>

      {/* Logo */}
      <div className="text-center mt-5 mb-3">
        <img src={logo} alt="Logo" className="w-12 h-12 mx-auto mb-2" />
        <p className="text-xs text-[#8b7764]">{t.location}</p>
        <p className="text-xs text-[#8b7764] mt-1">{t.copyright}</p>
      </div>
    </div>
  );
}