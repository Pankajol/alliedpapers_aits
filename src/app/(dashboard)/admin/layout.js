'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import LogoutButton from '@/components/LogoutButton';
import {
  HiMenu, HiX, HiHome, HiUsers, HiViewGrid, HiCurrencyDollar, HiChevronDown,
  HiChevronRight, HiShoppingCart, HiUserGroup, HiOutlineCube, HiOutlineCreditCard,
  HiPuzzle, HiOutlineLibrary, HiGlobeAlt, HiFlag, HiOutlineOfficeBuilding, HiCube,
  HiReceiptTax, HiChartSquareBar,
} from 'react-icons/hi';
import { SiCivicrm } from 'react-icons/si';
import { GiStockpiles } from 'react-icons/gi';

export default function AdminSidebar({ children }) {
  const router = useRouter();

  /* ---------- auth check ---------- */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/');
    try { jwtDecode(token); } catch { localStorage.removeItem('token'); router.push('/'); }
  }, [router]);

  /* ---------- UI state ---------- */
  const [openMenu, setOpenMenu] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);        // mobile drawer

  const toggleMenu = (key) => {
    setOpenMenu((prev) => (prev === key ? null : key));
    setOpenSubmenu(null);
  };
  const toggleSubmenu = (key) => {
    setOpenSubmenu((prev) => (prev === key ? null : key));
  };

  /* ---------- helpers ---------- */
  const closeSidebar = () => setIsSidebarOpen(false);

  /* ---------- component ---------- */
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile top‑bar --------------------------------------------------- */}
      <header className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-14 bg-white dark:bg-gray-800 shadow">
        <button
          aria-label="Open menu"
          onClick={() => setIsSidebarOpen(true)}
          className="text-2xl text-gray-700 dark:text-gray-200"
        >
          <HiMenu />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white">Dashboard</h1>
      </header>

      {/* Backdrop (mobile) ------------------------------------------------ */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar ---------------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto bg-gray-700 dark:bg-gray-800 text-white transform transition-transform duration-200 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static`}
      >
        {/* mobile close btn */}
        <div className="md:hidden flex items-center justify-between px-4 h-14">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HiHome /> Dashboard
          </h2>
          <button aria-label="Close menu" onClick={closeSidebar} className="text-2xl">
            <HiX />
          </button>
        </div>

        <nav className="mt-6 px-2 pb-6 space-y-3">
          {/* Masters ----------------------------------------------------- */}
          <Section title="Masters" icon={<HiUsers />} isOpen={openMenu === 'master'} onToggle={() => toggleMenu('master')}>
            <Item href="/admin/createCustomers" icon={<HiUserGroup />} label="Create Customer" close={closeSidebar} />
            <Item href="/admin/Countries" icon={<HiGlobeAlt />} label="Countries" close={closeSidebar} />
            <Item href="/admin/company" icon={<HiHome />} label="Company" close={closeSidebar} />
            <Item href="/admin/State" icon={<HiFlag />} label="State" close={closeSidebar} />
            <Item href="/admin/City" icon={<HiOutlineOfficeBuilding />} label="City" close={closeSidebar} />
            <Item href="/admin/supplier" icon={<HiUserGroup />} label="Supplier" close={closeSidebar} />
            <Item href="/admin/item" icon={<HiCube />} label="Item" close={closeSidebar} />
            <Item href="/admin/WarehouseDetailsForm" icon={<HiOutlineLibrary />} label="Warehouse Details" close={closeSidebar} />
            <Item href="/admin/CreateGroup" icon={<HiUserGroup />} label="Create Group" close={closeSidebar} />
            <Item href="/admin/CreateItemGroup" icon={<HiOutlineCube />} label="Create Item Group" close={closeSidebar} />
            <Item href="/admin/account-bankhead" icon={<HiOutlineLibrary />} label="Account Head" close={closeSidebar} />
            <Item href="/admin/bank-head-details" icon={<HiCurrencyDollar />} label="Bank Head" close={closeSidebar} />
          </Section>

          {/* Masters View ------------------------------------------------ */}
          <Section title="Masters View" icon={<HiViewGrid />} isOpen={openMenu === 'masterView'} onToggle={() => toggleMenu('masterView')}>
            <Item href="/admin/customer-view" icon={<HiUsers />} label="Customer View" close={closeSidebar} />
            <Item href="/admin/supplier" icon={<HiUserGroup />} label="Supplier View" close={closeSidebar} />
            <Item href="/admin/item" icon={<HiCube />} label="Item View" close={closeSidebar} />
            <Item href="/admin/account-head-view" icon={<HiOutlineLibrary />} label="Account Head View" close={closeSidebar} />
            <Item href="/admin/bank-head-details-view" icon={<HiCurrencyDollar />} label="Bank Head View" close={closeSidebar} />
          </Section>

          {/* Transactions ------------------------------------------------ */}
          <div>
            <MenuButton
              isOpen={openMenu === 'transactions'}
              onToggle={() => toggleMenu('transactions')}
              icon={<HiCurrencyDollar />}
              label="Transactions"
            />
            {openMenu === 'transactions' && (
              <div className="ml-6 mt-2 space-y-1">
                {/* Sales Submenu */}
                <Submenu
                  isOpen={openSubmenu === 'sales'}
                  onToggle={() => toggleSubmenu('sales')}
                  icon={<HiShoppingCart />}
                  label="Sales"
                >
                  <Item href="/admin/sales-quotation" icon={<HiChevronDown />} label="Quotation" close={closeSidebar} />
                  <Item href="/admin/sales-order" icon={<HiChevronRight />} label="Order" close={closeSidebar} />
                  <Item href="/admin/delivery" icon={<HiOutlineCube />} label="Delivery" close={closeSidebar} />
                  <Item href="/admin/sales-invoice" icon={<HiOutlineCreditCard />} label="Invoice" close={closeSidebar} />
                  <Item href="/admin/credit-memo" icon={<HiReceiptTax />} label="Credit Memo" close={closeSidebar} />
                </Submenu>

                {/* Purchase Submenu */}
                <Submenu
                  isOpen={openSubmenu === 'purchase'}
                  onToggle={() => toggleSubmenu('purchase')}
                  icon={<HiPuzzle />}
                  label="Purchase"
                >
                  <Item href="/admin/purchase-quotation" icon={<HiChevronDown />} label="Quotation" close={closeSidebar} />
                  <Item href="/admin/purchase-order" icon={<HiChevronRight />} label="Order" close={closeSidebar} />
                  <Item href="/admin/purchase-receipt" icon={<HiReceiptTax />} label="Receipt" close={closeSidebar} />
                  <Item href="/admin/purchase-invoice" icon={<HiCurrencyDollar />} label="Invoice" close={closeSidebar} />
                  <Item href="/admin/debit-memo" icon={<HiOutlineCreditCard />} label="Debit Memo" close={closeSidebar} />
                </Submenu>
              </div>
            )}
          </div>

          {/* Transactions View ------------------------------------------ */}
          <div>
            <MenuButton
              isOpen={openMenu === 'transactionsView'}
              onToggle={() => toggleMenu('transactionsView')}
              icon={<HiOutlineCreditCard />}
              label="Transactions View"
            />
            {openMenu === 'transactionsView' && (
              <div className="ml-6 mt-2 space-y-1">
                {/* TV Sales */}
                <Submenu
                  isOpen={openSubmenu === 'tvSales'}
                  onToggle={() => toggleSubmenu('tvSales')}
                  icon={<HiShoppingCart />}
                  label="Sales"
                >
                  <Item href="/admin/sales-quotation-view" icon={<HiChevronDown />} label="Quotation View" close={closeSidebar} />
                  <Item href="/admin/sales-order-view" icon={<HiChevronRight />} label="Order View" close={closeSidebar} />
                  <Item href="/admin/delivery-view" icon={<HiOutlineCube />} label="Delivery View" close={closeSidebar} />
                  <Item href="/admin/sales-invoice-view" icon={<HiOutlineCreditCard />} label="Invoice View" close={closeSidebar} />
                  <Item href="/admin/credit-memo-veiw" icon={<HiReceiptTax />} label="Credit Memo View" close={closeSidebar} />
                  <Item href="/admin/sales-report" icon={<HiChartSquareBar />} label="Report" close={closeSidebar} />
                </Submenu>

                {/* TV Purchase */}
                <Submenu
                  isOpen={openSubmenu === 'tvPurchase'}
                  onToggle={() => toggleSubmenu('tvPurchase')}
                  icon={<GiStockpiles />}
                  label="Purchase"
                >
                  <Item href="/admin/PurchaseQuotationList" icon={<HiChevronDown />} label="Quotation View" close={closeSidebar} />
                  <Item href="/admin/purchase-order-view" icon={<HiChevronRight />} label="Order View" close={closeSidebar} />
                  <Item href="/admin/grn-view" icon={<HiOutlineCube />} label="GRN View" close={closeSidebar} />
                  <Item href="/admin/purchaseInvoice-view" icon={<HiOutlineCreditCard />} label="Invoice View" close={closeSidebar} />
                  <Item href="/admin/debit-notes-view" icon={<HiReceiptTax />} label="Debit Notes View" close={closeSidebar} />
                  <Item href="/admin/purchase-report" icon={<HiChartSquareBar />} label="Report" close={closeSidebar} />
                </Submenu>
              </div>
            )}
          </div>

          {/* CRM --------------------------------------------------------- */}
          <Section title="CRM" icon={<SiCivicrm />} isOpen={openMenu === 'CRM'} onToggle={() => toggleMenu('CRM')}>
            <Item href="/admin/LeadDetailsFormMaster" icon={<HiUserGroup />} label="Lead Generation" close={closeSidebar} />
            <Item href="/admin/OpportunityDetailsForm" icon={<HiPuzzle />} label="Opportunity" close={closeSidebar} />
          </Section>


             {/* user View ---------------------------------------------------- */}
          <Section title="User" icon={<SiCivicrm />} isOpen={openMenu === 'user'} onToggle={() => toggleMenu('user')}>
            <Item href="/admin/users" icon={<HiUserGroup />} label="user" close={closeSidebar} />
            {/* <Item href="/admin/opportunities" icon={<HiPuzzle />} label="Opportunity" close={closeSidebar} />
            <Item href="#" icon={<HiPuzzle />} label="Report" close={closeSidebar} /> */}
          </Section>

          {/* CRM View ---------------------------------------------------- */}
          <Section title="CRM‑View" icon={<SiCivicrm />} isOpen={openMenu === 'CRM-View'} onToggle={() => toggleMenu('CRM-View')}>
            <Item href="/admin/leads-view" icon={<HiUserGroup />} label="Lead Generation" close={closeSidebar} />
            <Item href="/admin/opportunities" icon={<HiPuzzle />} label="Opportunity" close={closeSidebar} />
            <Item href="#" icon={<HiPuzzle />} label="Report" close={closeSidebar} />
          </Section>

          {/* Stock ------------------------------------------------------- */}
          <Section title="Stock" icon={<HiOutlineCube />} isOpen={openMenu === 'Stock'} onToggle={() => toggleMenu('Stock')}>
            <Item href="/admin/InventoryView" icon={<HiOutlineLibrary />} label="Inventory View" close={closeSidebar} />
            <Item href="/admin/InventoryEntry" icon={<HiOutlineLibrary />} label="Inventory Entry" close={closeSidebar} />
            <Item href="/admin/InventoryView" icon={<HiOutlineLibrary />} label="Inventory View" close={closeSidebar} />
          </Section>

          {/* Payment ----------------------------------------------------- */}
          <Section title="Payment" icon={<HiOutlineCreditCard />} isOpen={openMenu === 'Payment'} onToggle={() => toggleMenu('Payment')}>
            <Item href="/admin/Payment" icon={<HiCurrencyDollar />} label="Payment Form" close={closeSidebar} />
          </Section>

          {/* Production -------------------------------------------------- */}
          <Section title="Production" icon={<HiPuzzle />} isOpen={openMenu === 'Production'} onToggle={() => toggleMenu('Production')}>
            <Item href="/admin/bom" icon={<HiOutlineCube />} label="BoM" close={closeSidebar} />
            <Item href="/admin/ProductionOrder" icon={<HiReceiptTax />} label="Production Order" close={closeSidebar} />
          </Section>

          {/* Production View -------------------------------------------- */}
          <Section title="Production View" icon={<HiOutlineLibrary />} isOpen={openMenu === 'ProductionView'} onToggle={() => toggleMenu('ProductionView')}>
            <Item href="/admin/bom-view" icon={<HiOutlineCube />} label="BoM View" close={closeSidebar} />
            <Item href="/admin/productionorders-list-view" icon={<HiReceiptTax />} label="Production Orders View" close={closeSidebar} />
          </Section>

          {/* Logout ------------------------------------------------------ */}
          <div className="pt-4">
            <LogoutButton />
          </div>
        </nav>
      </aside>

      {/* Main content ---------------------------------------------------- */}
      <main className="flex-1  ">{children}</main>
    </div>
  );
}

/* ============= helper components ====================================== */
function Section({ title, icon, children, isOpen, onToggle }) {
  return (
    <div>
      <MenuButton isOpen={isOpen} onToggle={onToggle} icon={icon} label={title} />
      {isOpen && <div className="ml-6 mt-2 space-y-1">{children}</div>}
    </div>
  );
}

function MenuButton({ isOpen, onToggle, icon, label }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full px-4 py-2 rounded hover:bg-gray-600"
    >
      <div className="flex items-center gap-2">
        {icon} {label}
      </div>
      {isOpen ? <HiChevronDown /> : <HiChevronRight />}
    </button>
  );
}

function Submenu({ isOpen, onToggle, icon, label, children }) {
  return (
    <>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-4 py-2 rounded hover:bg-gray-600"
      >
        <div className="flex items-center gap-2">
          {icon} {label}
        </div>
        {isOpen ? <HiChevronDown /> : <HiChevronRight />}
      </button>
      {isOpen && <div className="ml-4 mt-1 space-y-1">{children}</div>}
    </>
  );
}

function Item({ href, icon, label, close }) {
  return (
    <Link
      href={href}
      onClick={close}
      className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-600"
    >
      {icon} {label}
    </Link>
  );
}





// "use client";

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { jwtDecode } from "jwt-decode";
// import LogoutButton from "@/components/LogoutButton";
// import {
//   HiHome,
//   HiUsers,
//   HiViewGrid,
//   HiCurrencyDollar,
//   HiChevronDown,
//   HiChevronRight,
//   HiShoppingCart,
//   HiUserGroup,
//   HiOutlineCube,
//   HiOutlineCreditCard,
//   HiPuzzle,
//   HiOutlineLibrary,
//   HiGlobeAlt,
//   HiFlag,
//   HiOutlineOfficeBuilding,
//   HiCube,
//   HiReceiptTax,
//   HiChartSquareBar
// } from "react-icons/hi";
// import { SiCivicrm } from "react-icons/si";
// import { GiStockpiles } from "react-icons/gi";
// import TopBar from "@/components/TopBar";

// export default function AdminSidebar({ children }) {
//   const router = useRouter();
//   const [openMenu, setOpenMenu] = useState(null);
//   const [openSubmenu, setOpenSubmenu] = useState(null);

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) router.push("/");
//     else {
//       try { jwtDecode(token); }
//       catch { localStorage.removeItem("token"); router.push("/"); }
//     }
//   }, [router]);

//   const toggleMenu = (key) => {
//     setOpenMenu(prev => prev === key ? null : key);
//     setOpenSubmenu(null);
//   };
//   const toggleSubmenu = (key) => {
//     setOpenSubmenu(prev => prev === key ? null : key);
//   };

//   return (
//     <div className="min-h-screen flex">
//         {/* <TopBar /> */}
//       <aside className="fixed w-64 h-full overflow-y-auto bg-gray-700 text-white p-4">
//         <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><HiHome /> Dashboard</h2>
//         <nav className="space-y-3">

//           {/* Masters */}
//           <Section title="Masters" icon={<HiUsers />} isOpen={openMenu==='master'} onToggle={()=>toggleMenu('master')}>
//             <Item href="/admin/createCustomers" icon={<HiUserGroup />} label="Create Customer" />
//             <Item href="/admin/Countries" icon={<HiGlobeAlt />} label="Countries" />
//             <Item href="/admin/State" icon={<HiFlag />} label="State" />
//             <Item href="/admin/City" icon={<HiOutlineOfficeBuilding />} label="City" />
//             <Item href="/admin/supplier" icon={<HiUserGroup />} label="Supplier" />
//             <Item href="/admin/item" icon={<HiCube />} label="Item" />
//             {/* <Item href="/admin/PaymentDetailsForm" icon={<HiCurrencyDollar />} label="Payment Details Form" />
//             <Item href="/admin/PaymentDetailsForm1" icon={<HiOutlineCreditCard />} label="Payment Details Form1" /> */}
//             {/* <Item href="/admin/PurchaseReceiptForm" icon={<HiReceiptTax />} label="Purchase Receipt Form" /> */}
//             <Item href="/admin/WarehouseDetailsForm" icon={<HiOutlineLibrary />} label="Warehouse Details Form" />
//             <Item href="/admin/CreateGroup" icon={<HiUserGroup />} label="Create Group" />
//             <Item href="/admin/CreateItemGroup" icon={<HiOutlineCube />} label="Create Item Group" />
//             <Item href="/admin/account-bankhead" icon={<HiOutlineLibrary />} label="Account Head Details" />
//             <Item href="/admin/bank-head-details" icon={<HiCurrencyDollar />} label="Bank Head Details" />
//           </Section>

//           {/* Masters View */}
//           <Section title="Masters View" icon={<HiViewGrid />} isOpen={openMenu==='masterView'} onToggle={()=>toggleMenu('masterView')}>
//             <Item href="/admin/customer-view" icon={<HiUsers />} label="Customer View" />
//             <Item href="/admin/supplier" icon={<HiUserGroup />} label="Supplier View" />
//             <Item href="/admin/item" icon={<HiCube />} label="Item View" />
//             <Item href="/admin/account-head-view" icon={<HiOutlineLibrary />} label="Account Head View" />
//             <Item href="/admin/bank-head-details-view" icon={<HiCurrencyDollar />} label="Bank Head Details View" />
//           </Section>

//           {/* Transactions */}
//           <div>
//             <button onClick={()=>toggleMenu('transactions')} className="flex items-center justify-between w-full px-4 py-2 rounded hover:bg-gray-600">
//               <div className="flex items-center gap-2"><HiCurrencyDollar /> Transactions</div>
//               {openMenu==='transactions'?<HiChevronDown/>:<HiChevronRight/>}
//             </button>
//             {openMenu==='transactions'&&(
//               <div className="ml-6 mt-2 space-y-1">
//                 <button onClick={()=>toggleSubmenu('sales')} className="flex items-center justify-between w-full px-4 py-2 rounded hover:bg-gray-600">
//                   <div className="flex items-center gap-2"><HiShoppingCart /> Sales</div>
//                   {openSubmenu==='sales'?<HiChevronDown/>:<HiChevronRight/>}
//                 </button>
//                 {openSubmenu==='sales'&&(
//                   <div className="ml-4 mt-1 space-y-1">
//                     <Item href="/admin/sales-quotation" icon={<HiChevronDown />} label="Quotation" />
//                     <Item href="/admin/sales-order" icon={<HiChevronRight />} label="Order" />
//                     <Item href="/admin/delivery" icon={<HiOutlineCube />} label="Delivery" />
//                     <Item href="/admin/sales-invoice" icon={<HiOutlineCreditCard />} label="Invoice" />
//                     <Item href="/admin/credit-memo" icon={<HiReceiptTax />} label="Credit Memo" />
//                   </div>
//                 )}
//                 <button onClick={()=>toggleSubmenu('purchase')} className="flex items-center justify-between w-full px-4 py-2 rounded hover:bg-gray-600">
//                   <div className="flex items-center gap-2"><HiPuzzle /> Purchase</div>
//                   {openSubmenu==='purchase'?<HiChevronDown/>:<HiChevronRight/>}
//                 </button>
//                 {openSubmenu==='purchase'&&(
//                   <div className="ml-4 mt-1 space-y-1">
//                     <Item href="/admin/purchase-quotation" icon={<HiChevronDown />} label="Quotation" />
//                     <Item href="/admin/purchase-order" icon={<HiChevronRight />} label="Order" />
//                     <Item href="/admin/purchase-receipt" icon={<HiReceiptTax />} label="Receipt" />
//                     <Item href="/admin/purchase-invoice" icon={<HiCurrencyDollar />} label="Invoice" />
//                     <Item href="/admin/debit-memo" icon={<HiOutlineCreditCard />} label="Debit Memo" />
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* Transactions View */}
//           <div>
//             <button onClick={()=>toggleMenu('transactionsView')} className="flex items-center justify-between w-full px-4 py-2 rounded hover:bg-gray-600">
//               <div className="flex items-center gap-2"><HiOutlineCreditCard /> Transactions View</div>
//               {openMenu==='transactionsView'?<HiChevronDown/>:<HiChevronRight/>}
//             </button>
//             {openMenu==='transactionsView'&&(
//               <div className="ml-6 mt-2 space-y-1">
//                 <button onClick={()=>toggleSubmenu('tvSales')} className="flex items-center justify-between w-full px-4 py-2 rounded hover:bg-gray-600">
//                   <div className="flex items-center gap-2"><HiShoppingCart /> Sales</div>
//                   {openSubmenu==='tvSales'?<HiChevronDown/>:<HiChevronRight/>}
//                 </button>
//                 {openSubmenu==='tvSales'&&(
//                   <div className="ml-4 mt-1 space-y-1">
//                     <Item href="/admin/sales-quotation-view" icon={<HiChevronDown />} label="Quotation View" />
//                     <Item href="/admin/sales-order-view" icon={<HiChevronRight />} label="Order View" />
//                     <Item href="/admin/delivery-view" icon={<HiOutlineCube />} label="Delivery View" />
//                     <Item href="/admin/sales-invoice-view" icon={<HiOutlineCreditCard />} label="Invoice View" />
//                     <Item href="/admin/credit-memo-veiw" icon={<HiReceiptTax />} label="Credit Memo View" />
//                     <Item href="/admin/sales-report" icon={<HiChartSquareBar />} label="Report" />
//                   </div>
//                 )}
//                 <button onClick={()=>toggleSubmenu('tvPurchase')} className="flex items-center justify-between w-full px-4 py-2 rounded hover:bg-gray-600">
//                   <div className="flex items-center gap-2"><GiStockpiles /> Purchase</div>
//                   {openSubmenu==='tvPurchase'?<HiChevronDown/>:<HiChevronRight/>}
//                 </button>
//                 {openSubmenu==='tvPurchase'&&(
//                   <div className="ml-4 mt-1 space-y-1">
//                     <Item href="/admin/PurchaseQuotationList" icon={<HiChevronDown />} label="Quotation View" />
//                     <Item href="/admin/purchase-order-view" icon={<HiChevronRight />} label="Order View" />
//                     <Item href="/admin/grn-view" icon={<HiOutlineCube />} label="GRN View" />
//                     <Item href="/admin/purchaseInvoice-view" icon={<HiOutlineCreditCard />} label="Invoice View" />
//                     <Item href="/admin/debit-notes-view" icon={<HiReceiptTax />} label="Debit Notes View" />
//                     <Item href="/admin/purchase-report" icon={<HiChartSquareBar />} label="Report" />
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* CRM */}
//           <Section title="CRM" icon={<SiCivicrm />} isOpen={openMenu==='CRM'} onToggle={()=>toggleMenu('CRM')}>
//             <Item href="/admin/LeadDetailsFormMaster" icon={<HiUserGroup />} label="Lead Generation" />
//             <Item href="/admin/OpportunityDetailsForm" icon={<HiPuzzle />} label="Opportunity" />
//           </Section>
//            {/* CRM-View */}
//           <Section title="CRM-View" icon={<SiCivicrm />} isOpen={openMenu==='CRM-View'} onToggle={()=>toggleMenu('CRM-View')}>
//             <Item href="/admin/leads-view" icon={<HiUserGroup />} label="Lead Generation  " />
//             <Item href="/admin/opportunities" icon={<HiPuzzle />} label="Opportunity" />
//                 <Item href="#" icon={<HiPuzzle />} label="Report" />
//           </Section>

//           {/* Stock */}
//           <Section title="Stock" icon={<HiOutlineCube />} isOpen={openMenu==='Stock'} onToggle={()=>toggleMenu('Stock')}>
//             <Item href="/admin/InventoryView" icon={<HiOutlineLibrary />} label="Inventory View" />
//              <Item href="/admin/InventoryEntry" icon={<HiOutlineLibrary />} label="Inventory Entry" />
//               <Item href="/admin/InventoryView" icon={<HiOutlineLibrary />} label="Inventory View" />
//           </Section>

//           {/* Payment */}
//           <Section title="Payment" icon={<HiOutlineCreditCard />} isOpen={openMenu==='Payment'} onToggle={()=>toggleMenu('Payment')}>
//             <Item href="/admin/Payment" icon={<HiCurrencyDollar />} label="Payment Form" />
//           </Section>

//           {/* Production */}
//           <Section title="Production" icon={<HiPuzzle />} isOpen={openMenu==='Production'} onToggle={()=>toggleMenu('Production')}>
//             <Item href="/admin/bom" icon={<HiOutlineCube />} label="BoM" />
//             <Item href="/admin/ProductionOrder" icon={<HiReceiptTax />} label="Production Order" />
//             {/* <Item href="/admin/issueForProduction" icon={<HiOutlineLibrary />} label="Issue for Production" />
//             <Item href="/admin/reciptFromProduction" icon={<HiOutlineOfficeBuilding />} label="Receipt from Production" /> */}
//           </Section>

//           {/* Production View */}
//           <Section title="Production View" icon={<HiOutlineLibrary />} isOpen={openMenu==='ProductionView'} onToggle={()=>toggleMenu('ProductionView')}>
//             <Item href="/admin/bom-view" icon={<HiOutlineCube />} label="BoM View" />
//             <Item href="/admin/productionorders-list-view" icon={<HiReceiptTax />} label="Production Orders View" />
//             {/* <Item href="/admin/issueForProduction-view" icon={<HiOutlineLibrary />} label="Issue for Production View" />
//             <Item href="/admin/reciptFromProduction-view" icon={<HiOutlineOfficeBuilding />} label="Receipt for Production View" /> */}
//           </Section>

//           {/* Logout */}
//           <div className="mt-6"><LogoutButton /></div>
//         </nav>
//       </aside>
//       <main className="flex-1 ml-64 p-6 bg-gray-100 min-h-screen">{children}</main>
//     </div>
//   );
// }

// function Section({ title, icon, children, isOpen, onToggle }) {
//   return (
//     <div className="relative">
//       <button onClick={onToggle} className="flex items-center justify-between w-full px-4 py-2 rounded hover:bg-gray-600">
//         <div className="flex items-center gap-2">{icon} {title}</div>
//         {isOpen ? <HiChevronDown /> : <HiChevronRight />}
//       </button>
//       {isOpen && <div className="ml-6 mt-2 space-y-1">{children}</div>}
//     </div>
//   );
// }

// function Item({ href, icon, label }) {
//   return <Link href={href} className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-600">{icon} {label}</Link>;
// }


