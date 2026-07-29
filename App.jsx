import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Analyzer from './components/Analyzer';
import Report from './components/Report';
import CheckoutMock from './components/CheckoutMock';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // landing, analyzer, processing, report
  const [activeAnalysisId, setActiveAnalysisId] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [loadingText, setLoadingText] = useState('Escaneando conversa...');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Creates analysis and redirects to Cakto checkout or opens local simulator
  const handleCreateAnalysis = async (payload) => {
    try {
      const response = await fetch('/api/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Falha ao registrar conversa.');

      const data = await response.json();
      setActiveAnalysisId(data.id);

      // Redirect to checkout passing the analysis ID (supports Cakto and Kiwify)
      const checkoutUrl = import.meta.env.VITE_CAKTO_CHECKOUT_URL || '';
      if (checkoutUrl) {
        const separator = checkoutUrl.includes('?') ? '&' : '?';
        window.location.href = `${checkoutUrl}${separator}external_id=${data.id}&ref=${data.id}&external_reference=${data.id}`;
      } else {
        // Dev mode: show checkout mock
        setShowCheckoutModal(true);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao processar. Verifique sua conexão e tente novamente.");
    }
  };

  // Called when user returns from Cakto after payment
  const handlePaymentSuccess = (analysisId) => {
    const id = analysisId || activeAnalysisId;
    setCurrentView('processing');

    const messages = [
      'Processando prints da conversa...',
      'Calculando nível de interesse...',
      'Analisando dinâmica emocional...',
      'Gerando sugestões inteligentes...',
      'Calculando compatibilidade astral...',
    ];

    let i = 0;
    setLoadingText(messages[0]);
    const interval = setInterval(() => {
      i++;
      if (i < messages.length) {
        setLoadingText(messages[i]);
      } else {
        clearInterval(interval);
        fetchReport(id);
      }
    }, 900);
  };

  const fetchReport = async (analysisId) => {
    try {
      const response = await fetch(`/api/analyses/${analysisId}`);
      if (!response.ok) throw new Error("Erro ao resgatar análise.");
      const data = await response.json();
      setAnalysisData(data);
      setCurrentView('report');
    } catch (e) {
      console.error(e);
      alert("Erro ao buscar relatório. Tente novamente.");
      setCurrentView('landing');
    }
  };

  // Check for ?analysis_id= in URL (return from Cakto)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnedId = params.get('analysis_id') || params.get('external_id') || params.get('ref');
    if (returnedId) {
      setActiveAnalysisId(returnedId);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Wait for webhook to process then fetch
      setTimeout(() => fetchReport(returnedId), 2000);
      setCurrentView('processing');
      setLoadingText('Confirmando seu pagamento...');
    }
  }, []);

  return (
    <div>
      <nav style={{
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(7,7,20,0.6)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); setCurrentView('landing'); }}>
            <span style={{ color: 'var(--secondary)' }}>💝</span> Crush IA
          </a>
        </div>
      </nav>

      {/* Main view router */}
      <main className="app-container">
        {currentView === 'landing' && (
          <LandingPage onStartAnalysis={() => setCurrentView('analyzer')} />
        )}

        {currentView === 'analyzer' && (
          <Analyzer onSubmit={handleCreateAnalysis} onBack={() => setCurrentView('landing')} />
        )}

        {currentView === 'processing' && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: 600, margin: '3rem auto' }}>
            <div className="radar-container">
              <div className="radar-circle"></div>
              <div className="radar-circle"></div>
              <div className="radar-circle"></div>
              <div className="radar-sweep"></div>
              <div className="radar-heart">💖</div>
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }} className="text-gradient">{loadingText}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nossa IA está decifrando as entrelinhas da sua conversa...</p>
          </div>
        )}

        {currentView === 'report' && (
          <Report data={analysisData} onNewAnalysis={() => setCurrentView('landing')} />
        )}
      </main>

      <footer className="footer">
        <p>© 2026 Crush IA Premium. Todos os direitos reservados.</p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
          Análises geradas por IA para fins de entretenimento e reflexão. Não constituem diagnóstico ou terapia.
        </p>
      </footer>

      {showCheckoutModal && (
        <CheckoutMock 
          analysisId={activeAnalysisId} 
          onClose={() => setShowCheckoutModal(false)} 
          onPaymentSuccess={() => {
            setShowCheckoutModal(false);
            handlePaymentSuccess(activeAnalysisId);
          }} 
        />
      )}
    </div>
  );
}
