import { OrderComposer } from '../components/OrderComposer';
import { useLanguage } from '../context/LanguageContext';

export function ParcelPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-saffron">{t('પાર્સલ કાઉન્ટર', 'Parcel counter')}</p>
        <h1 className="text-2xl font-black sm:text-3xl">{t('પાર્સલ ઓર્ડર', 'Parcel order')}</h1>
      </div>
      <OrderComposer defaultType="takeaway" mobileSummaryFirst />
    </div>
  );
}
