import { ArrowLeft } from 'lucide-react';
import { BookingData } from '../App';
import { Language, translations } from '../translations';
import { logo } from '../../assets/images';

type SuccessScreenProps = {
  bookingData: BookingData;
  onViewOther?: () => void;
  onViewPackages?: () => void;
  onBack: () => void;
  language: Language;
};

export function SuccessScreen({ bookingData, onViewOther, onViewPackages, onBack, language }: SuccessScreenProps) {
  const t = translations[language];

  // Determine if this is a package booking or single session
  const isPackageBooking = !!bookingData.selectedPackage;

  // Get service-specific messages
  const getSuccessTitle = () => {
    if (isPackageBooking) {
      return language === 'SQ'
        ? 'Paketa u Regjistrua!'
        : language === 'MK'
        ? 'Пакетот е Регистриран!'
        : 'Package Registered!';
    }
    return t.reservationConfirmed || 'Reservation Confirmed!';
  };

  const getSuccessMessage = () => {
    if (isPackageBooking) {
      return language === 'SQ'
        ? 'Faleminderit! Na vizitoni për të paguar dhe aktivizuar paketën tuaj. Do të merrni kredencialet për hyrje pas pagesës.'
        : language === 'MK'
        ? 'Ви благодариме! Посетете нè за да ја платите и активирате вашата пакет. Ќе ги добиете вашите податоци за најава по уплатата.'
        : 'Thank you! Please visit us to pay and activate your package. You will receive your login credentials after payment.';
    }
    return language === 'SQ'
      ? 'Rezervimi juaj u konfirmua! Ju presim në studio.'
      : language === 'MK'
      ? 'Вашата резервација е потврдена! Ве очекуваме во студиото.'
      : 'Your reservation is confirmed! We look forward to seeing you at the studio.';
  };

  const getNextSteps = () => {
    if (isPackageBooking) {
      return [
        language === 'SQ'
          ? 'Ejani në studio për të paguar paketën'
          : language === 'MK'
          ? 'Дојдете во студиото за да го платите пакетот'
          : 'Visit the studio to pay for your package',
        language === 'SQ'
          ? 'Do të merrni email me kredencialet pas pagesës'
          : language === 'MK'
          ? 'Ќе добиете емаил со податоци за најава по уплатата'
          : 'You will receive an email with login credentials after payment',
        language === 'SQ'
          ? 'Hyni në llogarinë për të rezervuar seancat e ardhshme'
          : language === 'MK'
          ? 'Најавете се на вашата сметка за да резервирате идни сесии'
          : 'Log in to your account to book future sessions',
      ];
    }
    return [
      t.step1 || 'Arrive 10 minutes early',
      t.step2 || 'Bring a towel and water bottle',
      t.step3 || 'Payment is due at the studio',
    ];
  };

  const nextSteps = getNextSteps();

  return (
    <div className="h-full overflow-y-auto px-4 py-4 pt-12 flex flex-col items-center justify-center">
      {/* Back Button */}
      <div className="w-full flex justify-start mb-4">
        <button
          onClick={onBack}
          className="hover:bg-[#e8dfd8] rounded-lg p-2 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#6b5949]" />
        </button>
      </div>

      {/* Logo */}
      <div className="flex justify-center mb-6">
        <img src={logo} alt="Logo" className="w-20 h-20 object-contain" />
      </div>

      {/* Success Message */}
      <h1 className="text-xl text-[#3d2f28] text-center mb-3">
        {getSuccessTitle()}
      </h1>

      <p className="text-sm text-[#6b5949] text-center mb-8 px-4">
        {getSuccessMessage()}
      </p>

      {/* Next Steps */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm w-full">
        <h2 className="text-sm text-[#3d2f28] mb-3">
          {language === 'SQ' ? 'Hapat e Radhës' : language === 'MK' ? 'Следни Чекори' : 'Next Steps'}
        </h2>
        <div className="space-y-2">
          {nextSteps.map((step, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-[#6b5949]">{index + 1}.</span>
              <p className="text-xs text-[#6b5949] flex-1">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Details */}
      {bookingData.dateKey && bookingData.timeSlot && (
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm w-full">
          <h2 className="text-sm text-[#3d2f28] mb-3">
            {language === 'SQ' ? 'Detajet e Rezervimit' : language === 'MK' ? 'Детали за Резервацијата' : 'Booking Details'}
          </h2>
          <div className="space-y-1 text-xs text-[#6b5949]">
            <p><strong>{language === 'SQ' ? 'Data:' : language === 'MK' ? 'Датум:' : 'Date:'}</strong> {bookingData.date}</p>
            <p><strong>{language === 'SQ' ? 'Ora:' : language === 'MK' ? 'Време:' : 'Time:'}</strong> {bookingData.timeSlot}</p>
            {isPackageBooking && (
              <p>
                <strong>{language === 'SQ' ? 'Paketa:' : language === 'MK' ? 'Пакет:' : 'Package:'}</strong>{' '}
                {bookingData.selectedPackage === 'package8' ? '8 ' : bookingData.selectedPackage === 'package10' ? '10 ' : '12 '}
                {language === 'SQ' ? 'klase' : language === 'MK' ? 'часови' : 'classes'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="space-y-2 w-full">
        <button
          onClick={onBack}
          className="w-full bg-[#9ca571] text-white py-3 rounded-lg text-sm hover:bg-[#8a9463] transition-colors"
        >
          {language === 'SQ' ? 'Kthehu në Fillim' : language === 'MK' ? 'Назад на Почеток' : 'Back to Home'}
        </button>
      </div>

      {/* Footer */}
      <div className="text-center mt-8 mb-4">
        <p className="text-xs text-[#8b7764]">{t.location}</p>
        <p className="text-xs text-[#8b7764] mt-1">{t.copyright}</p>
      </div>
    </div>
  );
}
