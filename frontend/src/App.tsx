import { useState, useCallback } from 'react';
import { NavState } from './types';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LRList from './pages/lorry-receipt/LRList';
import LRForm from './pages/lorry-receipt/LRForm';
import InvoiceList from './pages/lorry-invoice/InvoiceList';
import InvoiceForm from './pages/lorry-invoice/InvoiceForm';
import QuotationList from './pages/quotations/QuotationList';
import QuotationForm from './pages/quotations/QuotationForm';
import DeliveryStatus from './pages/delivery-status/DeliveryStatus';
import CustomerList from './pages/customers/CustomerList';
import VehicleList from './pages/vehicles/VehicleList';
import DriverList from './pages/drivers/DriverList';
import ItemList from './pages/items/ItemList';
import ReportBase from './pages/reports/ReportBase';
import Settings from './pages/settings/Settings';

export default function App() {
  const [nav, setNav] = useState<NavState>({ page: 'dashboard' });

  const onNav = useCallback((state: NavState) => {
    setNav(state);
    window.scrollTo(0, 0);
  }, []);

  function renderPage() {
    switch (nav.page) {
      case 'dashboard': return <Dashboard onNav={onNav} />;
      case 'lr-list': return <LRList onNav={onNav} />;
      case 'lr-create': return <LRForm onNav={onNav} fromQuotationId={nav.fromQuotationId} />;
      case 'lr-edit': return <LRForm editId={nav.id} autoPreview={nav.autoPreview || nav.autoPrint} autoPrint={nav.autoPrint} onNav={onNav} />;
      case 'invoice-list': return <InvoiceList onNav={onNav} />;
      case 'invoice-create': return <InvoiceForm onNav={onNav} fromQuotationId={nav.fromQuotationId} />;
      case 'invoice-edit': return <InvoiceForm editId={nav.id} onNav={onNav} />;
      case 'quotation-list': return <QuotationList onNav={onNav} />;
      case 'quotation-create': return <QuotationForm onNav={onNav} />;
      case 'quotation-edit': return <QuotationForm editId={nav.id} onNav={onNav} />;
      case 'delivery-status': return <DeliveryStatus onNav={onNav} />;
      case 'customers': return <CustomerList onNav={onNav} />;
      case 'vehicles': return <VehicleList />;
      case 'drivers': return <DriverList />;
      case 'items': return <ItemList />;
      case 'report-lr': return <ReportBase type="lr" onNav={onNav} />;
      case 'report-invoice': return <ReportBase type="invoice" onNav={onNav} />;
      case 'report-quotation': return <ReportBase type="quotation" onNav={onNav} />;
      case 'settings': return <Settings />;
      default: return <Dashboard onNav={onNav} />;
    }
  }

  const splitViewPages: string[] = [];
  const isSplitView = splitViewPages.includes(nav.page);

  return (
    <Layout nav={nav} onNav={onNav} isSplitView={isSplitView}>
      {renderPage()}
    </Layout>
  );
}
