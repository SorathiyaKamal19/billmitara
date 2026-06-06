import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

export type AppLanguage = 'gu' | 'en';

const STORAGE_KEY = 'poss_language';

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (gujarati: string, english: string) => string;
}

const LanguageContext =
  createContext<LanguageContextValue | undefined>(
    undefined
  );

const guToEn: Record<string, string> = {
  'ડેશબોર્ડ': 'Dashboard',
  'ટેબલ': 'Tables',
  'ઓર્ડર': 'Orders',
  'ટેકઅવે': 'Takeaway',
  'રસોડું': 'Kitchen',
  'મેનુ': 'Menu',
  'રિપોર્ટ': 'Reports',
  'ગ્રાહકો': 'Customers',
  'સેટિંગ્સ': 'Settings',
  'સ્માર્ટ રેસ્ટોરન્ટ POS': 'Smart Restaurant POS',
  'સ્માર્ટ રેસ્ટોરન્ટ POS સિસ્ટમ': 'Smart Restaurant POS System',
  'ભાષા': 'Language',
  'ગુજરાતી': 'Gujarati',
  'English': 'English',

  'માલિક પેનલ': 'Owner Panel',
  'વ્યવસાય વિશ્લેષણ': 'Business analytics',
  'આજે': 'Today',
  'ગઈકાલે': 'Yesterday',
  'આ અઠવાડિયું': 'This Week',
  'ગયા અઠવાડિયે': 'Last Week',
  'ગયા મહિને': 'Last Month',
  'કુલ આવક': 'Total Revenue',
  'આજના ઓર્ડર': "Today's Orders",
  'ટેકઅવે ઓર્ડર': 'Takeaway Orders',
  'ટેબલ ઓર્ડર': 'Dine-In Orders',
  'વેચાણ ટ્રેન્ડ': 'Sales trend',
  'સૌથી વધુ વેચાતી વસ્તુઓ': 'Top selling items',
  'વેચાયા': 'sold',
  'વ્યસ્ત સમય': 'Peak hours',
  'પેમેન્ટ વસૂલાત': 'Payment collection',
  'વિભાગિત પેમેન્ટ': 'Partial payments',
  'તાજેતરના બિલ': 'Recent bills',

  'ફ્લોર': 'Floor',
  'ટેબલ મેનેજમેન્ટ': 'Table management',
  'ટેબલનું નામ': 'Table name',
  'ઉમેરો': 'Add',
  'બેઠકો': 'seats',
  'ચાલુ બિલ': 'Running bill',
  'વસ્તુઓ': 'line items',
  'નવા ઓર્ડર માટે તૈયાર': 'Ready for new order',
  'ઓર્ડર જુઓ': 'View order',
  'વસ્તુઓ ઉમેરો': 'Add items',
  'ઓર્ડર લો': 'Take order',
  'બિલ': 'Bill',

  'ચાલુ ઓર્ડર': 'Running orders',
  'ગ્રાહક માંગે ત્યારે બિલ બનાવો': 'Generate bill when customer asks',
  'રિફ્રેશ': 'Refresh',
  'નવો ટેકઅવે': 'New Takeaway',
  'ચાલુ કુલ': 'Running total',
  'નવો ઓર્ડર': 'New order',
  'વેઇટર મોડ': 'Waiter mode',
  'ટેબલમાં વસ્તુઓ ઉમેરો': 'Add items to table',
  'ટેકઅવે કાઉન્ટર': 'Takeaway counter',

  'મેનુ શોધો': 'Search menu instantly',
  'બધા': 'All',
  'સૌથી વધુ વેચાતા': 'Most Selling',
  'હાલનો ઓર્ડર': 'Current order',
  'ગ્રાહકનું નામ': 'Customer name',
  'WhatsApp બિલ માટે મોબાઇલ': 'Mobile for WhatsApp bill',
  'રસોડા માટે નોંધ': 'Kitchen notes',
  'પ્રતિ વસ્તુ': 'each',
  'સબટોટલ': 'Subtotal',
  'ડિસ્કાઉન્ટ': 'Discount',
  'ટેકઅવે ચાર્જ': 'Takeaway charge',
  'કુલ': 'Total',
  'વસ્તુઓ રસોડામાં ઉમેરો': 'Add Items to Kitchen',
  'રસોડામાં મોકલો': 'Send to Kitchen',
  'ઓછામાં ઓછી એક વસ્તુ ઉમેરો': 'Add at least one item',
  'ટેકઅવે બિલિંગ માટે ગ્રાહકનો મોબાઇલ જરૂરી છે':
    'Customer mobile is required for takeaway billing',
  'વધુ વસ્તુઓ રસોડામાં મોકલાઈ':
    'More items sent to kitchen',
  'ઓર્ડર રસોડામાં મોકલાયો': 'Order sent to kitchen',

  'શેફ સ્ક્રીન': 'Chef Screen',
  'રસોડાના ઓર્ડર': 'Kitchen Orders',
  'ઇતિહાસ': 'History',
  'મહેમાન': 'Guest',
  'તૈયાર તરીકે માર્ક કરો': 'Mark Ready',
  'રસોડામાં કોઈ સક્રિય ઓર્ડર નથી':
    'No active kitchen orders',
  'રસોડાનો ઇતિહાસ': 'Kitchen History',
  'આજના પૂર્ણ થયેલા ઓર્ડર': "Today's completed orders",
  'રસોડાનો ઇતિહાસ ઉપલબ્ધ નથી':
    'No kitchen history available',
  'નવો રસોડાનો ઓર્ડર': 'New kitchen order',
  'ઓર્ડર તૈયાર તરીકે માર્ક કર્યો': 'Order marked ready',

  'બિલ પૂર્વદર્શન': 'Invoice Preview',
  'રેસ્ટોરન્ટ બિલ': 'Professional restaurant bill',
  'વૉક-ઇન': 'Walk-in',
  'મોબાઇલ નથી': 'No mobile',
  'નોંધ ઉમેરો...': 'Add note...',
  'વસ્તુઓ સંપાદિત કરો': 'Edit Items',
  'ફેરફારો સાચવો': 'Save Changes',
  'રદ કરો': 'Cancel',
  'અંતિમ રકમ': 'Final amount',
  'બિલ ક્રિયાઓ': 'Bill actions',
  'PDF અને WhatsApp બિલ બનાવવા પહેલાં પેમેન્ટ પુષ્ટિ જરૂરી છે.':
    'Payment confirmation is required before PDF and WhatsApp bill generation.',
  'પેમેન્ટ અને બિલ બનાવો': 'Payment & Generate',
  'PDF ખોલો': 'Open PDF',
  'બિલ પ્રિન્ટ કરો': 'Print bill',
  'ફ્લોર પર પાછા જાઓ': 'Back to floor',
  'પેમેન્ટ પુષ્ટિ કરો': 'Confirm payment',
  'પેમેન્ટ પુષ્ટિ પછી જ બિલ બનશે.':
    'Bill generates only after payment confirmation.',
  'વિભાગિત કુલ': 'Split total',
  'પુષ્ટિ કરો અને બિલ બનાવો': 'Confirm & Bill',

  'મેનુ મેનેજમેન્ટ': 'Menu Management',
  'રેસ્ટોરન્ટ મેનુ': 'Restaurant Menu',
  'ખાદ્ય વસ્તુઓ બનાવો, અપડેટ કરો અને મેનેજ કરો.':
    'Create, update and manage your food items.',
  'કુલ વસ્તુઓ': 'Total Items',
  'ખાદ્ય વસ્તુ': 'Food item',
  'વસ્તુ કોડ': 'Item code',
  'કેટેગરી': 'Category',
  'કિંમત દાખલ કરો': 'Enter price',
  'વેજ': 'Veg',
  'નોન-વેજ': 'Non-Veg',
  'ઇંડા': 'Egg',
  'ઉપલબ્ધ': 'Available',
  'ઉપલબ્ધ નથી': 'Unavailable',
  'બદલો': 'Toggle',
  'મેનુ વસ્તુ સંપાદિત કરો': 'Edit Menu Item',
  'મેનુ અપડેટ કરો': 'Update Menu',

  'ગ્રાહક મેનેજમેન્ટ': 'Customer Management',
  'ગ્રાહક મુલાકાતો, ખર્ચની રીતો અને રેસ્ટોરન્ટ સંબંધો ટ્રેક કરો.':
    'Track customer visits, spending patterns and build stronger restaurant relationships.',
  'ટોચનો ગ્રાહક': 'Top Customer',
  'ખર્ચ્યા': 'spent',
  'કુલ ગ્રાહકો': 'Total Customers',
  'ગ્રાહક આવક': 'Customer Revenue',
  'કુલ મુલાકાતો': 'Total Visits',
  'સરેરાશ ખર્ચ': 'Avg Spending',
  'ગ્રાહકનું નામ અથવા મોબાઇલ નંબર શોધો...':
    'Search customer name or mobile number...',
  'મહેમાન ગ્રાહક': 'Guest Customer',
  'મુલાકાતો': 'Visits',
  'કુલ ખર્ચ': 'Total Spending',
  'સરેરાશ બિલ': 'Avg Bill',
  'લોયલ્ટી સ્થિતિ': 'Loyalty Status',
  'VIP ગ્રાહક': 'VIP Customer',
  'નિયમિત ગ્રાહક': 'Regular Customer',
  'નવો ગ્રાહક': 'New Customer',
  'કોઈ ગ્રાહક મળ્યા નથી': 'No Customers Found',
  'ઓર્ડર થયા પછી ગ્રાહક રેકોર્ડ અહીં દેખાશે.':
    'Customer records will appear here once orders are placed.',

  'વેચાણ અને GST રિપોર્ટ': 'Sales & GST reports',
  'Excel એક્સપોર્ટ કરો': 'Export Excel',
  'આવક': 'Revenue',
  'GST વસૂલાત': 'GST Collected',
  'ગ્રાહક': 'Customer',
  'પેમેન્ટ': 'Payment',
  'તારીખ': 'Date',
  'સંપાદન': 'Edit',
  'સંપાદિત કરો': 'Edit',
  'ઇન્વોઇસ એડિટર': 'Invoice Editor',
  'વૉક-ઇન ગ્રાહક': 'Walk-in Customer',
  'હાલનું કુલ': 'Current Total',
  'ડિસ્કાઉન્ટ પ્રકાર': 'Discount Type',
  '₹ નિશ્ચિત રકમ': '₹ Fixed Amount',
  '% ટકા': '% Percentage',
  'ડિસ્કાઉન્ટ મૂલ્ય': 'Discount Value',
  'ડિસ્કાઉન્ટ મૂલ્ય દાખલ કરો':
    'Enter discount value',
  'સંપાદનનું કારણ': 'Reason For Edit',
  'આ ઇન્વોઇસ કેમ સંપાદિત થઈ રહ્યું છે તે લખો...':
    'Explain why this invoice is being edited...',
  'ઇન્વોઇસ ફેરફાર સૂચના': 'Invoice Modification Notice',
  'આ ઇન્વોઇસ પહેલેથી બન્યું છે. ફેરફારો નોંધાશે અને અંતિમ રિપોર્ટમાં દેખાશે.':
    'This invoice has already been generated. Changes will be recorded and reflected in the final report.',

  'ડિજિટલ મેનુ': 'Digital menu',
  'QR કોડ મેનુ': 'QR code menu',

  'રેસ્ટોરન્ટ સેટિંગ્સ': 'Restaurant Settings',
  'રેસ્ટોરન્ટ પ્રોફાઇલ, ટેક્સ, બ્રાન્ડિંગ, ટેકઅવે ચાર્જ અને POS સેટિંગ્સ મેનેજ કરો.':
    'Manage restaurant profile, taxation, branding, takeaway charges and POS configuration.',
  'સંચાલિત': 'Powered By',
  'રેસ્ટોરન્ટ માહિતી': 'Restaurant Information',
  'રેસ્ટોરન્ટ વિગતો ગોઠવો': 'Configure your restaurant details',
  'POS ડિસ્પ્લે નામ': 'POS Display Name',
  'રેસ્ટોરન્ટનું નામ': 'Restaurant name',
  'ફોન નંબર': 'Phone Number',
  'ફોન': 'Phone',
  'રેસ્ટોરન્ટ સરનામું': 'Restaurant Address',
  'GST ગોઠવણી': 'GST Configuration',
  'GST ગણતરી અને ટેક્સ ગોઠવો':
    'Setup GST calculation and taxation',
  'GST ચાલુ': 'GST Enabled',
  'ઇન્વોઇસ અને બિલિંગમાં GST ચાલુ કરો':
    'Enable GST in invoices and billing',
  'GST નંબર': 'GST Number',
  'GST ટકા': 'GST Percentage',
  'ટેકઅવે અને પાર્સલ ફી ગોઠવો':
    'Configure takeaway and parcel fees',
  'ચાર્જ ચાલુ કરો': 'Enable Charges',
  'પાર્સલ ફી લાગુ કરો': 'Apply parcel fees',
  'ચાર્જ': 'Charge',
  'બ્રાન્ડિંગ': 'Branding',
  'POS દેખાવ બદલો': 'Customize POS appearance',
  'બ્રાન્ડ રંગ': 'Brand Color',
  'ગોઠવણી સારાંશ': 'Configuration Summary',
  'હાલની ગોઠવણીની ઝલક': 'Current setup overview',
  'GST સ્થિતિ': 'GST Status',
  'ચાલુ': 'Running',
  'સક્રિય': 'Enabled',
  'બંધ': 'Disabled',
  'GST દર': 'GST Rate',
  'રેસ્ટોરન્ટ સેટિંગ્સ સાચવો':
    'Save Restaurant Settings',
  'GST ફેરફારોની પુષ્ટિ કરો': 'Confirm GST Changes',
  'આ ભવિષ્યના બધા ઇન્વોઇસને અસર કરશે.':
    'This affects all future invoices.',
  'પુષ્ટિ કરો': 'Confirm',

  'ફરી સ્વાગત છે': 'Welcome back',
  'રેસ્ટોરન્ટ વર્કસ્પેસ ચાલુ રાખવા માટે સાઇન ઇન કરો.':
    'Sign in to continue to your restaurant workspace.',
  'ઇમેઇલ': 'Email',
  'પાસવર્ડ': 'Password',
  'સાઇન ઇન થઈ રહ્યું છે...': 'Signing in...',
  'લોગિન': 'Login',
  'ડેમો': 'demo',
  'માલિક': 'Owner',
  'મેનેજર': 'Manager',
  'શેફ': 'Chef'
};

const enToGu = Object.fromEntries(
  Object.entries(guToEn).map(([gu, en]) => [en, gu])
);

function replaceKnownText(
  text: string,
  language: AppLanguage
) {
  const dictionary =
    language === 'en' ? guToEn : enToGu;

  return Object.entries(dictionary)
    .sort((a, b) => b[0].length - a[0].length)
    .reduce(
      (value, [from, to]) => value.split(from).join(to),
      text
    );
}

function translateDom(language: AppLanguage) {
  const root = document.getElementById('root');
  if (!root) return;

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT
  );

  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  textNodes.forEach((node) => {
    const next = replaceKnownText(
      node.nodeValue || '',
      language
    );
    if (next !== node.nodeValue) {
      node.nodeValue = next;
    }
  });

  root
    .querySelectorAll<HTMLElement>(
      '[placeholder], [aria-label], [title]'
    )
    .forEach((element) => {
      ['placeholder', 'aria-label', 'title'].forEach(
        (attribute) => {
          const value = element.getAttribute(attribute);
          if (!value) return;
          const next = replaceKnownText(value, language);
          if (next !== value) {
            element.setAttribute(attribute, next);
          }
        }
      );
    });
}

export function LanguageProvider({
  children
}: {
  children: ReactNode;
}) {
  const [language, setLanguageState] =
    useState<AppLanguage>(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'gu' ? 'gu' : 'en';
    });

  function setLanguage(next: AppLanguage) {
    localStorage.setItem(STORAGE_KEY, next);
    setLanguageState(next);
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang =
      language === 'en' ? 'en' : 'gu';

    const run = () => translateDom(language);
    run();

    const observer = new MutationObserver(run);
    const root = document.getElementById('root');
    if (root) {
      observer.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: [
          'placeholder',
          'aria-label',
          'title'
        ]
      });
    }

    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (gujarati: string, english: string) =>
        language === 'en' ? english : gujarati
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error(
      'useLanguage must be used inside LanguageProvider'
    );
  }
  return context;
}

export function currentLanguage(): AppLanguage {
  return localStorage.getItem(STORAGE_KEY) === 'gu'
    ? 'gu'
    : 'en';
}
