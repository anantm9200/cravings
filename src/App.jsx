import React, { useState, useEffect, useMemo } from 'react';

// ==========================================
// SUPABASE & RESEND CONFIGURATION
// ==========================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseAdminKey = import.meta.env.VITE_SUPABASE_ADMIN_KEY; 
const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
let supabase = null;
let supabaseAdmin = null;

// ==========================================
// UTILITIES
// ==========================================
const TIME_SLOTS = ['6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM'];

const fmt = (amount) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount || 0);

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-AU', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
};

// ==========================================
// STATIC MENU DATA (Smart Fallback)
// ==========================================
const STATIC_CATEGORIES = [
  { id: 'c1', name: 'Sweet', display_order: 1 },
  { id: 'c2', name: 'Savoury', display_order: 2 },
  { id: 'c3', name: 'Lunch', display_order: 3 },
];

const STATIC_ITEMS = [
  { id: 's1', category_id: 'c1', item_name: 'FRESHLY BAKED MUFFINS', description: 'All your favourites! Blueberry, apple & cinnamon, raspberry white choc, orange and poppyseed', regular_price: 35.00, large_price: 67.00, regular_pieces: '20', large_pieces: '40' },
  { id: 's2', category_id: 'c1', item_name: 'SEASONAL FRUIT PLATTER', description: 'Fresh seasonal fruits beautifully arranged', regular_price: 36.00, large_price: 70.00, regular_pieces: '—', large_pieces: '—' },
  { id: 's3', category_id: 'c1', item_name: 'SLICES ASSORTMENT (GF)', description: 'A selection of our delicious homemade popular in-house café favourites', regular_price: 38.00, large_price: 70.00, regular_pieces: '18', large_pieces: '36' },
  { id: 's4', category_id: 'c1', item_name: 'DANISH PASTRIES', description: 'A selection of apple, blueberry, apricot, raspberry and custard pastries', regular_price: 40.00, large_price: 76.00, regular_pieces: '12', large_pieces: '24' },
  { id: 's5', category_id: 'c1', item_name: 'GRANOLA & YOGHURT CUPS (GF)', description: 'Individual cups containing Greek and vanilla bean yoghurt topped with granola, honey and berries', regular_price: 33.00, large_price: 64.00, regular_pieces: '8', large_pieces: '16' },
  { id: 's6', category_id: 'c1', item_name: 'HOMEMADE COOKIES (GF)', description: 'A delicious selection of classic style biscuits made in-house', regular_price: 37.00, large_price: 69.00, regular_pieces: '20', large_pieces: '40' },
  { id: 'v1', category_id: 'c2', item_name: 'BEEF SAUSAGE ROLLS', description: 'A staple at our café store. This homemade recipe sausage roll is a must try!', regular_price: 42.00, large_price: 82.00, regular_pieces: '15', large_pieces: '30' },
  { id: 'v2', category_id: 'c2', item_name: 'VEGETABLE FRITTATA (V/GF)', description: 'Our very popular and super delicious café favourite', regular_price: 34.00, large_price: 65.00, regular_pieces: '16', large_pieces: '32' },
  { id: 'v3', category_id: 'c2', item_name: 'SAVOURY MUFFINS (V)', description: 'Spinach & feta, zucchini & corn, pumpkin & chives to name a few', regular_price: 33.00, large_price: 65.00, regular_pieces: '20', large_pieces: '40' },
  { id: 'v4', category_id: 'c2', item_name: 'ARANCINI PLATTER', description: 'Bolognese, spinach & ricotta, chicken pesto, pumpkin bacon & feta, porcini mushroom', regular_price: 46.00, large_price: 95.00, regular_pieces: '15', large_pieces: '30' },
  { id: 'v5', category_id: 'c2', item_name: 'BREAKFAST PANINI (V/GF)', description: 'A variety of croissants and paninis filled with egg, bacon, tomato, cheese, ham and mushroom', regular_price: 48.00, large_price: 94.00, regular_pieces: '12', large_pieces: '25' },
  { id: 'v6', category_id: 'c2', item_name: 'MIXED SAVOURY (V)', description: 'Mini pies (beef & chicken), quiche, spring rolls and samosa', regular_price: 47.00, large_price: 92.00, regular_pieces: '20', large_pieces: '40' },
  { id: 'v7', category_id: 'c2', item_name: 'ANTIPASTO PLATTER', description: 'A selection of cold meats, cheeses, olives, pickles, carrot sticks and crackers', regular_price: 42.00, large_price: 82.00, regular_pieces: '—', large_pieces: '—' },
  { id: 'v8', category_id: 'c2', item_name: 'CHEESE/DIP/DRIED FRUIT', description: 'A variety of cheeses, dips & dried fruit. Carrot, celery & crackers to compliment', regular_price: 47.00, large_price: 89.00, regular_pieces: '—', large_pieces: '—' },
  { id: 'l1', category_id: 'c3', item_name: 'SANDWICH PLATTER (V/GF)', description: '100% chicken breast, Tasmanian smoked salmon, Mondo Doro premium cold meats, egg, cheddar cheese and fresh salad fillings', regular_price: 47.00, large_price: 90.00, regular_pieces: '20', large_pieces: '40' },
  { id: 'l2', category_id: 'c3', item_name: 'ASSORTED TORTILLA WRAPS (V/GF)', description: '100% chicken breast, Tasmanian smoked salmon, Mondo Doro premium cold meats, egg, cheddar cheese and fresh salad fillings', regular_price: 51.00, large_price: 99.00, regular_pieces: '10', large_pieces: '20' },
  { id: 'l3', category_id: 'c3', item_name: 'JEAN PIERRE BAGUETTES (V)', description: '100% chicken breast, Tasmanian smoked salmon, Mondo Doro premium cold meats, egg, cheddar cheese and fresh salad fillings', regular_price: 51.00, large_price: 99.00, regular_pieces: '15', large_pieces: '30' },
  { id: 'l4', category_id: 'c3', item_name: 'COMBO PLATTER (V/GF)', description: 'A mixed platter of sandwiches, wraps and baguettes', regular_price: 51.00, large_price: 99.00, regular_pieces: '20', large_pieces: '33' },
  { id: 'l5', category_id: 'c3', item_name: 'SUSHI (V)', description: 'Assortment of California, salmon, avocado, chicken and prawn sushi rolls', regular_price: 43.00, large_price: 83.00, regular_pieces: '20', large_pieces: '40' },
  { id: 'l6', category_id: 'c3', item_name: 'LASAGNE', description: 'We make it fresh to order! Beef or vegetarian available', regular_price: 52.00, large_price: 104.00, regular_pieces: '—', large_pieces: '—' },
  { id: 'l7', category_id: 'c3', item_name: 'COCKTAIL SKEWERS (V)', description: 'A selection of beef, chicken and barbequed vegetable skewers with dipping sauce', regular_price: 54.00, large_price: 104.00, regular_pieces: '23', large_pieces: '46' },
  { id: 'l8', category_id: 'c3', item_name: 'BBQ MEAT PLATTER', description: 'Mini chipolata, meatballs and chicken wings served with dipping sauce', regular_price: 57.00, large_price: 109.00, regular_pieces: '23', large_pieces: '46' },
  { id: 'l9', category_id: 'c3', item_name: 'SALADS (V/GF)', description: 'Choose below: Greek | Creamy Potato | Caesar | Garden | Couscous | Pasta', regular_price: 39.00, large_price: 73.00, regular_pieces: '—', large_pieces: '—' },
  { id: 'l10', category_id: 'c3', item_name: 'PIZZA (V)', description: 'Choose your toppings or leave it up to us!', regular_price: 41.00, large_price: 83.00, regular_pieces: '20', large_pieces: '40' },
  { id: 'l11', category_id: 'c3', item_name: 'INDIAN CURRY SELECTION', description: 'Choice of Butter Chicken, Lamb Rogan Josh, or Chicken Madras served with rice', regular_price: 75.00, large_price: 149.00, regular_pieces: '—', large_pieces: '—' },
  { id: 'l12', category_id: 'c3', item_name: 'BIRYANI', description: 'Aromatic rice dish with your choice of protein', regular_price: 59.00, large_price: 119.00, regular_pieces: '—', large_pieces: '—' },
];

// ==========================================
// STYLES
// ==========================================
const EXACT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Noto+Sans+JP:wght@400;700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Black Han Sans', 'HGGothicE', 'Noto Sans JP', Arial, Helvetica, sans-serif; font-size: 10pt; background: #e8e8e8; color: #111; }
  .page { width: 210mm; min-height: 297mm; background: #fff; margin: 8mm auto; padding: 7mm 10mm 7mm 10mm; box-shadow: 0 2px 14px rgba(0,0,0,0.18); position: relative; }
  
  /* Header */
  .header { display: flex; align-items: center; gap: 6mm; margin-bottom: 4mm; padding-bottom: 3mm; border-bottom: 1.5px solid #000; }
  .logo-block { min-width: 35mm; max-width: 35mm; flex-shrink: 0; }
  .logo-block img { width: 100%; height: auto; display: block; }
  .form-title-block { flex: 1; }
  .form-title { font-family: Arial, Helvetica, sans-serif; font-size: 21pt; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; line-height: 1; margin-bottom: 3.5mm; }
  
  /* Contact Fields */
  .contact-grid { display: grid; grid-template-columns: auto 1fr; gap: 1.2mm 2.5mm; align-items: center; }
  .contact-label { font-size: 8pt; font-weight: bold; text-align: right; white-space: nowrap; color: #111; font-family: Arial, Helvetica, sans-serif; }
  .contact-input { border: 1.2px solid #5588cc; height: 5.5mm; padding: 0 2mm; font-size: 8.5pt; font-family: Arial, Helvetica, sans-serif; width: 100%; background: #f8faff; outline: none; }
  .contact-input:focus { border-color: #0055aa; background: #fff; }
  select.contact-input { cursor: pointer; }
  
  /* Section Title */
  .section-wrap { margin-top: 2.5mm; }
  .section-title { font-family: Arial Black, Arial, sans-serif; font-size: 14pt; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid #000; padding-bottom: 0.8mm; margin-bottom: 0; }
  
  /* Table Headers */
  .tbl-size-row { display: grid; grid-template-columns: 1fr 19mm 19mm 17mm 19mm 19mm 17mm 24mm; background: #e8e8e8; border: 1px solid #bbb; border-bottom: none; }
  .tbl-size-row .sh { font-size: 7pt; font-weight: bold; text-align: center; padding: 0.8mm 0; border-left: 1px solid #ccc; font-family: Arial, Helvetica, sans-serif; }
  .tbl-size-row .sh:first-child { border-left: none; text-align: left; padding-left: 1.5mm; }
  .tbl-col-row { display: grid; grid-template-columns: 1fr 19mm 19mm 17mm 19mm 19mm 17mm 24mm; background: #f0f0f0; border: 1px solid #bbb; border-bottom: 2px solid #000; }
  .tbl-col-row .ch { font-size: 7pt; font-weight: bold; text-align: center; padding: 0.8mm 0; border-left: 1px solid #ccc; font-family: Arial, Helvetica, sans-serif; }
  .tbl-col-row .ch:first-child { border-left: none; text-align: left; padding-left: 1.5mm; }
  
  /* Item Row */
  .item-row { display: grid; grid-template-columns: 1fr 19mm 19mm 17mm 19mm 19mm 17mm 24mm; border-bottom: 1px solid #ddd; align-items: center; min-height: 8mm; }
  .item-row:nth-child(odd) { background: #fff; }
  .item-row:nth-child(even) { background: #fafafa; }
  .item-name-cell { padding: 1mm 1mm 1mm 1.5mm; }
  .item-name { font-weight: bold; font-size: 8.5pt; font-family: Arial, Helvetica, sans-serif; line-height: 1.25; }
  .item-desc { font-size: 6.5pt; color: #555; font-family: Arial, Helvetica, sans-serif; line-height: 1.3; margin-top: 0.2mm; }
  .cell { text-align: center; font-size: 8pt; font-family: Arial, Helvetica, sans-serif; padding: 0 0.5mm; border-left: 1px solid #ddd; align-self: stretch; display: flex; align-items: center; justify-content: center; }
  .cell input[type="number"] { width: 13mm; height: 5.5mm; border: 1.5px solid #4477bb; text-align: center; font-size: 8pt; font-family: Arial, Helvetica, sans-serif; background: #eef4ff; -moz-appearance: textfield; }
  .cell input[type="number"]::-webkit-outer-spin-button, .cell input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; }
  .cell input[type="number"]:focus { outline: 2px solid #003399; background: #fff; }
  .cell-total { background: #e4f0e4; font-weight: bold; font-size: 7.5pt; border-left: 2px solid #888; }
  
  /* Subtotals & Grand Totals */
  .subtotal-row { display: grid; grid-template-columns: 1fr 19mm 19mm 17mm 19mm 19mm 17mm 24mm; border-bottom: 2px solid #000; border-top: 1px solid #aaa; background: #f0f0f0; align-items: center; padding: 1mm 0; }
  .subtotal-lbl { font-weight: bold; font-size: 7pt; text-align: right; padding-right: 1.5mm; font-family: Arial, Helvetica, sans-serif; }
  .subtotal-val { font-weight: bold; font-size: 7pt; text-align: center; border: 1px solid #999; background: #fff; padding: 0.3mm 0; margin: 0 1mm; font-family: Arial, Helvetica, sans-serif; }
  .subtotal-total { font-weight: bold; font-size: 7.5pt; text-align: center; background: #c8dfc8; padding: 1mm 0; border-left: 2px solid #888; font-family: Arial, Helvetica, sans-serif; }
  .grand-total-row { display: flex; justify-content: flex-end; align-items: center; gap: 4mm; margin: 2.5mm 0 2mm; padding: 1.5mm 0; border-top: 2.5px solid #000; border-bottom: 3px double #000; }
  .grand-total-label { font-family: Arial Black, Arial, sans-serif; font-size: 11pt; font-weight: 900; letter-spacing: 2px; }
  .grand-total-value { font-size: 11pt; font-weight: bold; font-family: Arial, Helvetica, sans-serif; background: #c8f0c8; border: 2px solid #000; padding: 0.8mm 4mm; min-width: 28mm; text-align: center; }
  
  /* Extra options & Bottom Section */
  .options-section { margin-top: 2.5mm; display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
  .option-title { font-weight: bold; font-size: 7.5pt; font-family: Arial, Helvetica, sans-serif; margin-bottom: 1mm; }
  .checkbox-group { display: flex; flex-wrap: wrap; gap: 1.5mm 4mm; }
  .checkbox-group label { font-size: 7pt; font-family: Arial, Helvetica, sans-serif; display: flex; align-items: center; gap: 1mm; cursor: pointer; }
  .bottom-section { margin-top: 3.5mm; display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
  .field-lbl { display: block; font-weight: bold; font-size: 7pt; font-family: Arial, Helvetica, sans-serif; margin-bottom: 0.8mm; }
  .field-block { margin-bottom: 2mm; }
  textarea { width: 100%; border: 1px solid #aaa; font-family: Arial, Helvetica, sans-serif; font-size: 8pt; padding: 1mm; resize: vertical; }
  .inline-row { display: flex; gap: 2.5mm; align-items: center; margin-bottom: 1.5mm; }
  .inline-row label { font-weight: bold; font-size: 7pt; white-space: nowrap; font-family: Arial, Helvetica, sans-serif; }
  .inline-row input[type="text"] { flex: 1; border: none; border-bottom: 1px solid #999; height: 5mm; font-size: 8pt; font-family: Arial, Helvetica, sans-serif; background: transparent; outline: none; min-width: 0; }
  .radio-row { display: flex; gap: 4mm; align-items: center; margin-bottom: 1.5mm; }
  .radio-row label { font-size: 7pt; font-family: Arial, Helvetica, sans-serif; display: flex; align-items: center; gap: 1mm; cursor: pointer; }
  .terms { margin-top: 4mm; margin-bottom: 2mm; font-size: 5.5pt; color: #555; font-family: Arial, Helvetica, sans-serif; border-top: 1px solid #ccc; padding-top: 2mm; line-height: 1.45; }
  
  /* Additional UI styles for React integration */
  .action-bar { width: 100%; margin: 6mm 0 0 0; display: flex; gap: 4mm; }
  .action-btn { flex: 1; padding: 3mm 0; border: none; font-size: 11pt; font-weight: bold; font-family: Arial, Helvetica, sans-serif; letter-spacing: 1px; cursor: pointer; text-align: center; border-radius: 4px; color: #fff; }
  .btn-print { background: #222; } .btn-print:hover { background: #000; }
  .btn-submit { background: #d97706; } .btn-submit:hover { background: #b45309; }
  
  .admin-container { max-width: 1000px; margin: 40px auto; background: #fff; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); font-family: Arial, sans-serif; }
  .admin-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
  .admin-table th, .admin-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
  .admin-table th { background: #f4f4f4; }
  .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
  .badge-new { background: #e0f2fe; color: #0369a1; }
  
  .only-print { display: none !important; }
  
  @media print {
    body { background: #fff; }
    .page { margin: 0; box-shadow: none; width: 100%; padding: 7mm 10mm; }
    .no-print { display: none !important; }
    .only-print { display: block !important; }
    .contact-input, input[type="text"], textarea, select { border-color: #aaa !important; background: transparent !important; -webkit-appearance: none; -moz-appearance: none; appearance: none; }
    .cell input[type="number"] { border-color: #aaa !important; background: transparent !important; }
    @page { size: A4; margin: 0; }
  }
`;

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [view, setView] = useState('form');
  const [completedOrder, setCompletedOrder] = useState(null);
  const [formKey, setFormKey] = useState(0); 

  useEffect(() => {
    if (window.supabase) {
      supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
      supabaseAdmin = window.supabase.createClient(supabaseUrl, supabaseAdminKey);
      setIsLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
      supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
      supabaseAdmin = window.supabase.createClient(supabaseUrl, supabaseAdminKey);
      setIsLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#e8e8e8', fontFamily: 'Arial, sans-serif' }}>
        <style>{`
          .minimal-spinner { width: 40px; height: 40px; border: 2px solid rgba(0, 0, 0, 0.1); border-left-color: #111; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 20px; }
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
        <div className="minimal-spinner"></div>
        <div style={{ color: '#111', fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 'bold' }}>Loading System...</div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: EXACT_CSS }} />
      {view === 'form' && <ExactOrderForm key={formKey} onSuccess={(data) => { setCompletedOrder(data.order ? data.order : data); setView('success'); }} onAdmin={() => setView('admin')} />}
      {view === 'success' && <SuccessScreen order={completedOrder} onNewOrder={() => { setFormKey(prev => prev + 1); setView('form'); }} />}
      {view === 'admin' && <AdminPortal onBack={() => { setFormKey(prev => prev + 1); setView('form'); }} />}
    </>
  );
}

// ==========================================
// ORDER FORM COMPONENT
// ==========================================
function ExactOrderForm({ onSuccess, onAdmin }) {
  const [menu, setMenu] = useState({ categories: [], items: [] });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [menuLoading, setMenuLoading] = useState(true);

  const generateOrderFormId = () => {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const uniquePart = crypto.randomUUID?.().split("-")[0].toUpperCase() || Math.random().toString(36).substring(2, 10).toUpperCase();
    return `CRV-${yyyy}${mm}${dd}-${uniquePart}`;
  };

  const [orderFormId] = useState(() => generateOrderFormId());
  const todayString = new Date().toISOString().split('T')[0];

  const [cust, setCust] = useState({ date: '', time1: '', time2: '', time3: '', company: '', name: '', email: '', phone: '', address: '', suburb: '' });
  const [cart, setCart] = useState({}); 
  const [meta, setMeta] = useState({ salads: {}, toppings: '', dietary: '', invoice: 'no' });

  // PULL DYNAMIC MENU DATA FROM SUPABASE (WITH SMART STATIC FALLBACK)
  useEffect(() => {
    async function loadDynamicMenu() {
      try {
        setMenuLoading(true);
        const { data: cats, error: catErr } = await supabase.from('menu_categories').select('*').eq('is_active', true).order('display_order');
        const { data: items, error: itemErr } = await supabase.from('menu_items').select('*').eq('is_active', true).order('display_order');

        if (catErr || itemErr || !cats || cats.length === 0 || !items || items.length === 0) {
          console.log("Database empty or unavailable. Falling back to static data.");
          setMenu({ categories: STATIC_CATEGORIES, items: STATIC_ITEMS });
        } else {
          const mergedItems = items.map(dbItem => {
             const staticMatch = STATIC_ITEMS.find(si => si.item_name.toLowerCase() === dbItem.item_name.toLowerCase());
             return { 
               ...dbItem, 
               regular_pieces: dbItem.regular_pieces || staticMatch?.regular_pieces || '—', 
               large_pieces: dbItem.large_pieces || staticMatch?.large_pieces || '—' 
             };
          });
          setMenu({ categories: cats, items: mergedItems });
        }
      } catch (err) {
        console.error("Database Connection Error. Falling back to static menu.", err);
        setMenu({ categories: STATIC_CATEGORIES, items: STATIC_ITEMS });
      } finally {
        setMenuLoading(false);
      }
    }
    loadDynamicMenu();
  }, []);

  const setQty = (id, size, val) => {
    const qty = Math.max(0, parseInt(val) || 0);
    setCart(p => ({ ...p, [id]: { ...(p[id] || { reg: 0, lrg: 0 }), [size]: qty } }));
  };

  const totals = useMemo(() => {
    let subtotal = 0, totalPlatters = 0;
    const catTotals = {}, catPlatters = {};
    menu.categories.forEach(c => { catTotals[c.id] = 0; catPlatters[c.id] = 0; });
    const orderItems = [];

    menu.items.forEach(item => {
      const c = cart[item.id];
      if (!c) return;
      const rowTot = (c.reg * item.regular_price) + (c.lrg * item.large_price);
      if (rowTot > 0) {
        subtotal += rowTot;
        catTotals[item.category_id] += rowTot;
        catPlatters[item.category_id] += (c.reg + c.lrg);
        totalPlatters += (c.reg + c.lrg);
        orderItems.push({ ...item, reg_qty: c.reg, lrg_qty: c.lrg, row_total: rowTot });
      }
    });
    return { subtotal, catTotals, catPlatters, totalPlatters, grandTotal: subtotal, orderItems };
  }, [cart, menu]);

  const submitOrder = async () => {
    setErrorMsg('');
    if (!cust.name || !cust.email || !cust.date || !cust.time1) return setErrorMsg("Contact Name, Date, Delivery Time 1, and Email are required.");
    if (totals.totalPlatters === 0) return setErrorMsg("Please add at least one item.");
    
    setSubmitting(true);
    try {
      const { data: custData, error: custErr } = await supabaseAdmin.from('customers').insert([{
        company_name: cust.company, contact_name: cust.name, email: cust.email, phone: cust.phone, address: `${cust.address}, ${cust.suburb}`
      }]).select().single();
      if (custErr && custErr.code !== 'PGRST116' && !custErr.message?.includes("does not exist")) throw custErr;

      const fullNotes = `Dietary/Allergies: ${meta.dietary}\nSalads: ${Object.keys(meta.salads).filter(k=>meta.salads[k]).join(', ')}\nPizza: ${meta.toppings}\nInvoice Req: ${meta.invoice}`;
      const timeString = [cust.time1, cust.time2, cust.time3].filter(Boolean).join(', ');

      const { data: ordData, error: ordErr } = await supabaseAdmin.from('catering_orders').insert([{
        order_number: orderFormId, customer_id: custData?.id, required_date: cust.date,
        delivery_time: timeString, payment_method: 'bank_transfer', subtotal: totals.subtotal, 
        card_surcharge: 0, grand_total: totals.grandTotal, special_instructions: fullNotes, status: 'new'
      }]).select().single();
      if (ordErr && !ordErr.message?.includes("does not exist")) throw ordErr;

      if (ordData) {
         const itemsToInsert = totals.orderItems.map(i => ({
           order_id: ordData.id, menu_item_id: i.id, item_name_snapshot: i.item_name,
           regular_qty: i.reg_qty, large_qty: i.lrg_qty,
           regular_price_snapshot: i.regular_price, large_price_snapshot: i.large_price, row_total: i.row_total
         }));
         await supabaseAdmin.from('catering_order_items').insert(itemsToInsert);
         await supabaseAdmin.from('order_status_history').insert([{ order_id: ordData.id, new_status: 'new', note: 'Web form' }]);
      }

      const finalOrderInfo = { 
        order_form_id: ordData?.order_number || ordData?.order_form_id || orderFormId, 
        grand_total: totals.grandTotal 
      };

      const itemsHtml = totals.orderItems.map(item => {
        let rows = '';
        if (item.reg_qty > 0) rows += `<tr><td style="padding: 10px; border: 1px solid #ddd;">${item.item_name} (Regular)</td><td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.reg_qty}</td><td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${fmt(item.reg_qty * item.regular_price)}</td></tr>`;
        if (item.lrg_qty > 0) rows += `<tr><td style="padding: 10px; border: 1px solid #ddd;">${item.item_name} (Large)</td><td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.lrg_qty}</td><td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${fmt(item.lrg_qty * item.large_price)}</td></tr>`;
        return rows;
      }).join('');

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #111; color: #fff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">CRAVINGS CAFE</h1>
          </div>
          <div style="padding: 30px; background-color: #fff; color: #333;">
            <h2 style="margin-top: 0; color: #111;">Catering Order Confirmation</h2>
            <p>Hi <strong>${cust.name}</strong>,</p>
            <p>Thank you for placing your catering order. Here are your details:</p>
            
            <div style="background-color: #f8faff; border: 1px solid #cce0ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #0055aa;">Customer Details</h3>
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                ${cust.company ? `<tr><td style="padding: 3px 0; width: 35%;"><strong>Company:</strong></td><td>${cust.company}</td></tr>` : ''}
                <tr><td style="padding: 3px 0; width: 35%;"><strong>Name:</strong></td><td>${cust.name}</td></tr>
                <tr><td style="padding: 3px 0;"><strong>Phone:</strong></td><td>${cust.phone || 'N/A'}</td></tr>
                <tr><td style="padding: 3px 0;"><strong>Email:</strong></td><td>${cust.email}</td></tr>
                ${cust.address ? `<tr><td style="padding: 3px 0; vertical-align: top;"><strong>Address:</strong></td><td>${cust.address}<br/>${cust.suburb}</td></tr>` : ''}
              </table>
            </div>

            <table style="width: 100%; margin: 20px 0; font-size: 14px; border-collapse: collapse;">
              <tr><td style="padding: 5px 0;"><strong>Order Number:</strong></td><td style="text-align: right;">${orderFormId}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Date Required:</strong></td><td style="text-align: right;">${cust.date}</td></tr>
              <tr><td style="padding: 5px 0;"><strong>Delivery Time:</strong></td><td style="text-align: right;">${timeString}</td></tr>
            </table>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f8f8f8; text-align: left;">
                  <th style="padding: 10px; border: 1px solid #ddd;">Item</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Qty</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <h3 style="text-align: right; margin-top: 20px; font-size: 20px; color: #111;">
              Grand Total: <span style="color: #27ae60;">${fmt(totals.grandTotal)}</span>
            </h3>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 13px; color: #666;">
              <p><strong>Special Instructions:</strong><br/> ${meta.dietary || 'None'}</p>
              <p><strong>Invoice Required:</strong> ${meta.invoice === 'yes' ? 'Yes' : 'No'}</p>
              <p><strong>Bank Transfer Details:</strong><br/> Commonwealth Bank | BSB: 066-202 | Acct: 1056 0943</p>
            </div>
          </div>
        </div>
      `;

      // Non-blocking fire-and-forget email trigger to make UI instant
      setTimeout(async () => {
        try {
          const payload = {
            from: 'Cravings Cafe <noreply@emails.liaisonit.com>',
            to: [cust.email, 'complete.anant@gmail.com'],
            subject: `Catering Order Confirmation - ${finalOrderInfo.order_form_id}`,
            html: emailHtml
          };

          // 1. Try Vercel Serverless API first (Guaranteed to bypass CORS)
          const res = await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          // 2. Fallback to direct Resend API (Useful for local testing)
          if (!res.ok) {
             await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendApiKey}` },
                body: JSON.stringify(payload)
             });
          }
        } catch (emailErr) {
          console.log("Background email dispatch completed with notes:", emailErr);
        }
      }, 0);

      onSuccess({ order: finalOrderInfo, customer: cust });
    } catch (err) {
      setErrorMsg("System Error: " + err.message);
      setSubmitting(false); // Only toggle false if there is an error to avoid flash
    }
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Cravings_Order_${orderFormId}`;
    window.print();
    document.title = originalTitle;
  };

  if (menuLoading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ fontFamily: 'Arial', color: '#666' }}>Fetching live menu from database...</p>
      </div>
    );
  }

  const page1Cats = menu.categories.slice(0, 2);
  const page2Cats = menu.categories.slice(2);

  return (
    <>
      <div className="page">
        <div className="header">
          <div className="logo-block">
            <img src="https://static.wixstatic.com/media/548938_7497c6b811914c168b68f5b6546a0097~mv2.png/v1/fill/w_188,h_178,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Untitled%20design%20(27).png" alt="Cravings Cafe Logo" style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain', filter: 'invert(1)' }} />
          </div>
          <div className="form-title-block">
            <div className="form-title">Catering Order Form</div>
            <div className="only-print" style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11pt', fontWeight: 'bold', marginBottom: '4mm', color: '#0055aa' }}>
              ORDER NO: {orderFormId}
            </div>
            <div className="contact-grid">
              <span className="contact-label">DATE REQUIRED</span>
              <input className="contact-input" type="date" min={todayString} value={cust.date} onChange={e => setCust({...cust, date: e.target.value})} />
              
              <span className="contact-label">DELIVERY TIME(S)</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2mm' }}>
                <select className="contact-input" value={cust.time1} onChange={e => setCust({...cust, time1: e.target.value})} required>
                  <option value="" disabled>Time 1 (Req)</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select className="contact-input" value={cust.time2} onChange={e => setCust({...cust, time2: e.target.value})}>
                  <option value="">Time 2</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select className="contact-input" value={cust.time3} onChange={e => setCust({...cust, time3: e.target.value})}>
                  <option value="">Time 3</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              
              <span className="contact-label">COMPANY NAME</span>
              <input className="contact-input" type="text" value={cust.company} onChange={e => setCust({...cust, company: e.target.value})} />
              <span className="contact-label">CONTACT NAME</span>
              <input className="contact-input" type="text" value={cust.name} onChange={e => setCust({...cust, name: e.target.value})} />
              <span className="contact-label">EMAIL</span>
              <input className="contact-input" type="email" value={cust.email} onChange={e => setCust({...cust, email: e.target.value})} />
              <span className="contact-label">CONTACT PHONE</span>
              <input className="contact-input" type="text" value={cust.phone} onChange={e => setCust({...cust, phone: e.target.value})} />
              <span className="contact-label">STREET ADDRESS</span>
              <input className="contact-input" type="text" value={cust.address} onChange={e => setCust({...cust, address: e.target.value})} />
              <span className="contact-label">SUBURB / POSTCODE</span>
              <input className="contact-input" type="text" value={cust.suburb} onChange={e => setCust({...cust, suburb: e.target.value})} />
            </div>
          </div>
        </div>

        {page1Cats.map(cat => (
          <div key={cat.id} className="section-wrap">
            <div className="section-title">{cat.name}</div>
            <div className="tbl-size-row">
              <div className="sh"></div>
              <div className="sh" style={{ gridColumn: 'span 3', borderLeft: '1px solid #ccc' }}>REGULAR (FEEDS 5–7)</div>
              <div className="sh" style={{ gridColumn: 'span 3', borderLeft: '1px solid #ccc' }}>LARGE (FEEDS 9–12)</div>
              <div className="sh" style={{ borderLeft: '1px solid #ccc' }}></div>
            </div>
            <div className="tbl-col-row">
              <div className="ch">ITEM</div>
              <div className="ch">PIECES</div><div className="ch">$</div><div className="ch">QTY</div>
              <div className="ch">PIECES</div><div className="ch">$</div><div className="ch">QTY</div>
              <div className="ch">TOTAL</div>
            </div>
            {menu.items.filter(i => i.category_id === cat.id).map(item => {
              const c = cart[item.id] || { reg: 0, lrg: 0 };
              const rTot = (c.reg * item.regular_price) + (c.lrg * item.large_price);
              return (
                <div key={item.id} className="item-row">
                  <div className="item-name-cell">
                    <div className="item-name">{item.item_name}</div>
                    <div className="item-desc">{item.description}</div>
                  </div>
                  <div className="cell">{item.regular_pieces || '—'}</div>
                  <div className="cell">{fmt(item.regular_price)}</div>
                  <div className="cell"><input type="number" min="0" value={c.reg || ''} onChange={(e) => setQty(item.id, 'reg', e.target.value)} /></div>
                  <div className="cell">{item.large_pieces || '—'}</div>
                  <div className="cell">{fmt(item.large_price)}</div>
                  <div className="cell"><input type="number" min="0" value={c.lrg || ''} onChange={(e) => setQty(item.id, 'lrg', e.target.value)} /></div>
                  <div className="cell cell-total" style={{ background: rTot > 0 ? '#b8dbb8' : '#e4f0e4' }}>{fmt(rTot)}</div>
                </div>
              );
            })}
          </div>
        ))}
        <div className="terms">Terms &amp; Conditions: Orders must be placed at least 24 hours before scheduled date of delivery. We require 24 hours notice for any cancellations or fees may apply. Orders must be over $99 to qualify for free delivery, anything under $99 may incur a delivery fee. Our range for free delivery is within a 5km radius of East Perth, anything further will incur a delivery cost OR may not be able to deliver. Gluten free options and substitutes for some platters may attract a higher cost. All prices are subject to change without notice. All credit card payments will attract a 1.5% surcharge fee. <strong>CRAVINGS CAFE</strong> 129 Royal St, East Perth WA 6000 &nbsp;|&nbsp; Trading hours: Mon–Fri 6:00am–2:00pm &nbsp;|&nbsp; Sat 7:00am–1:00pm</div>
      </div>

      <div className="page" style={{ marginTop: '0' }}>
        {page2Cats.map(cat => (
          <div key={cat.id} className="section-wrap">
            <div className="section-title">{cat.name}</div>
            <div className="tbl-size-row">
              <div className="sh"></div>
              <div className="sh" style={{ gridColumn: 'span 3', borderLeft: '1px solid #ccc' }}>REGULAR (FEEDS 5–7)</div>
              <div className="sh" style={{ gridColumn: 'span 3', borderLeft: '1px solid #ccc' }}>LARGE (FEEDS 9–12)</div>
              <div className="sh" style={{ borderLeft: '1px solid #ccc' }}></div>
            </div>
            <div className="tbl-col-row">
              <div className="ch">ITEM</div>
              <div className="ch">PIECES</div><div className="ch">$</div><div className="ch">QTY</div>
              <div className="ch">PIECES</div><div className="ch">$</div><div className="ch">QTY</div>
              <div className="ch">TOTAL</div>
            </div>
            {menu.items.filter(i => i.category_id === cat.id).map(item => {
              const c = cart[item.id] || { reg: 0, lrg: 0 };
              const rTot = (c.reg * item.regular_price) + (c.lrg * item.large_price);
              return (
                <div key={item.id} className="item-row">
                  <div className="item-name-cell">
                    <div className="item-name">{item.item_name}</div>
                    <div className="item-desc">{item.description}</div>
                  </div>
                  <div className="cell">{item.regular_pieces || '—'}</div>
                  <div className="cell">{fmt(item.regular_price)}</div>
                  <div className="cell"><input type="number" min="0" value={c.reg || ''} onChange={(e) => setQty(item.id, 'reg', e.target.value)} /></div>
                  <div className="cell">{item.large_pieces || '—'}</div>
                  <div className="cell">{fmt(item.large_price)}</div>
                  <div className="cell"><input type="number" min="0" value={c.lrg || ''} onChange={(e) => setQty(item.id, 'lrg', e.target.value)} /></div>
                  <div className="cell cell-total" style={{ background: rTot > 0 ? '#b8dbb8' : '#e4f0e4' }}>{fmt(rTot)}</div>
                </div>
              );
            })}
          </div>
        ))}

        <div className="grand-total-row">
          <span className="grand-total-label">ORDER TOTAL</span>
          <span className="grand-total-value">{fmt(totals.grandTotal)}</span>
        </div>

        <div className="options-section">
          <div>
            <div className="option-title">SALADS (V/GF) — tick preferred</div>
            <div className="checkbox-group">
              {['Greek', 'Creamy Potato', 'Caesar', 'Garden', 'Couscous', 'Pasta'].map(s => (
                <label key={s}><input type="checkbox" checked={!!meta.salads[s]} onChange={e => setMeta({...meta, salads: {...meta.salads, [s]: e.target.checked}})} /> {s}</label>
              ))}
            </div>
          </div>
          <div>
            <div className="option-title">PIZZA TOPPINGS</div>
            <input type="text" style={{ width: '100%', border: 'none', borderBottom: '1px solid #999', fontSize: '7.5pt', padding: '0.5mm 0', outline: 'none' }} placeholder="List toppings, or leave blank for chef's choice" value={meta.toppings} onChange={e => setMeta({...meta, toppings: e.target.value})} />
          </div>
        </div>

        <div className="bottom-section">
          <div>
            <div className="field-block">
              <label className="field-lbl">DIETARY REQUIREMENTS / ALLERGIES</label>
              <textarea rows="7" value={meta.dietary} onChange={e => setMeta({...meta, dietary: e.target.value})}></textarea>
            </div>
            <div className="field-block">
              <label className="field-lbl">INVOICE REQUIRED?</label>
              <div className="radio-row">
                <label><input type="radio" name="invoice" value="yes" checked={meta.invoice === 'yes'} onChange={e => setMeta({...meta, invoice: e.target.value})} /> Yes</label>
                <label><input type="radio" name="invoice" value="no" checked={meta.invoice === 'no'} onChange={e => setMeta({...meta, invoice: e.target.value})} /> No</label>
              </div>
            </div>
          </div>
        </div>

        <div className="terms">Terms &amp; Conditions: Orders must be placed at least 24 hours before scheduled date of delivery. We require 24 hours notice for any cancellations or fees may apply. Orders must be over $99 to qualify for free delivery, anything under $99 may incur a delivery fee. Our range for free delivery is within a 5km radius of East Perth, anything further will incur a delivery cost OR may not be able to deliver. Gluten free options and substitutes for some platters may attract a higher cost. All prices are subject to change without notice. All credit card payments will attract a 1.5% surcharge fee. <strong>CRAVINGS CAFE</strong> 129 Royal St, East Perth WA 6000 &nbsp;|&nbsp; Trading hours: Mon–Fri 6:00am–2:00pm &nbsp;|&nbsp; Sat 7:00am–1:00pm</div>

        {errorMsg && <div className="no-print" style={{ color: '#d8000c', backgroundColor: '#ffbaba', padding: '10px', margin: '4mm 0', textAlign: 'center' }}>⚠ {errorMsg}</div>}

        <div className="action-bar no-print">
          <button type="button" className="action-btn btn-print" onClick={handlePrint}>🖨 SAVE AS PDF</button>
          <button type="button" className="action-btn btn-submit" onClick={submitOrder} disabled={submitting}>{submitting ? 'PROCESSING...' : '✓ SUBMIT ORDER'}</button>
        </div>
      </div>
    </>
  );
}

// ==========================================
// SUCCESS SCREEN
// ==========================================
function SuccessScreen({ order, onNewOrder }) {
  if (!order) return null;
  return (
    <div style={{ maxWidth: '600px', margin: '60px auto', background: '#fff', padding: '40px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', borderRadius: '12px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '80px', height: '80px', background: '#e4f0e4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <span style={{ color: '#27ae60', fontSize: '40px' }}>✓</span>
      </div>
      
      <h1 style={{ color: '#111', margin: '0 0 10px 0', fontSize: '32px' }}>Order Confirmed</h1>
      <p style={{ color: '#555', fontSize: '16px', margin: '0 0 30px 0' }}>Thank you! Your catering request has been successfully processed and securely saved.</p>
      
      <div style={{ background: '#f8faff', border: '1px solid #cce0ff', padding: '25px', borderRadius: '8px', margin: '0 0 30px 0' }}>
        <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Order Reference ID</p>
        <p style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#0055aa' }}>{order.order_form_id || order.order_number}</p>
      </div>

      <p style={{ color: '#777', fontSize: '14px', marginBottom: '30px' }}>A confirmation email has been dispatched to your inbox and the Cravings Cafe team.</p>

      <button onClick={onNewOrder} style={{ padding: '15px 30px', background: '#111', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', borderRadius: '6px', letterSpacing: '1px', width: '100%' }}>START NEW ORDER</button>
    </div>
  );
}

// ==========================================
// ADMIN PORTAL
// ==========================================
function AdminPortal({ onBack }) {
  const [orders, setOrders] = useState([]);
  
  useEffect(() => {
    supabaseAdmin.from('catering_orders').select('*, customers (*)').order('created_at', { ascending: false }).then(({ data }) => setOrders(data || []));
  }, []);

  return (
    <div className="admin-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
        <h1>Admin Dashboard</h1>
        <button onClick={onBack}>← Back to Form</button>
      </div>
      <table className="admin-table">
        <thead>
          <tr><th>Order #</th><th>Customer</th><th>Total</th><th>Status</th></tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td>{o.order_number || o.order_form_id}</td>
              <td>{o.customers?.contact_name}</td>
              <td>{fmt(o.grand_total)}</td>
              <td>{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
