import React, { useState } from 'react';

export default function CheckoutMock({ analysisId, onClose, onPaymentSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('Mariana Silva');
  const [email, setEmail] = useState('mariana.silva@email.com');
  const [cpf, setCpf] = useState('123.456.789-00');
  const [cardNumber, setCardNumber] = useState('4444 5555 6666 7777');
  const [cardExpiry, setCardExpiry] = useState('12/29');
  const [cardCvv, setCardCvv] = useState('123');

  const handleSimulatePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const gateway = paymentMethod === 'pix' ? 'Kiwify' : 'Cakto';
      
      console.log(`Simulating payment for analysis ${analysisId} via ${gateway}`);

      const response = await fetch(`/api/analyses/${analysisId}/simulate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateway })
      });

      const resData = await response.json();
      console.log('Simulated payment reply:', resData);

      if (response.ok && resData.success) {
        // Wait 1.5 seconds to simulate processing
        setTimeout(() => {
          setLoading(false);
          onPaymentSuccess();
        }, 1500);
      } else {
        alert("Erro na simulação do pagamento: " + (resData.error || resData.message));
        setLoading(false);
      }
    } catch (error) {
      console.error('Error simulating payment:', error);
      alert("Falha na conexão com o servidor de pagamentos.");
      setLoading(false);
    }
  };

  return (
    <div className="checkout-overlay">
      <div className="checkout-modal">
        
        {/* Header */}
        <div className="checkout-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '800', color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              🥝 Checkout Simulado
            </span>
            <button 
              onClick={onClose} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          <h3 style={{ fontSize: '1.2rem', color: 'white', marginTop: '1rem' }}>Crush IA Premium</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Análise Individual de Conversa</p>
        </div>

        {/* Body */}
        <div className="checkout-body">
          
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Valor da Liberação</span>
            <div className="price-tag-big">R$ 19,90</div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>ID da Análise: {analysisId}</p>
          </div>

          <form onSubmit={handleSimulatePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Payment Method Selector */}
            <div className="payment-options-grid">
              <div 
                className={`payment-opt-btn ${paymentMethod === 'pix' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('pix')}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📱</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>PIX (Kiwify)</div>
              </div>
              <div 
                className={`payment-opt-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>💳</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Cartão (Cakto)</div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="form-group">
              <label>Nome Completo</label>
              <input 
                type="text" 
                className="form-input" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label>E-mail (Receber Relatório)</label>
              <input 
                type="email" 
                className="form-input" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            {paymentMethod === 'pix' ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  ⚡ Liberação instantânea no PIX
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Ao clicar em pagar, enviaremos um sinal de webhook fingindo aprovação do gateway Kiwify para destravar na hora.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Número do Cartão</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={cardNumber} 
                    onChange={(e) => setCardNumber(e.target.value)} 
                    required 
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Validade</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={cardExpiry} 
                      onChange={(e) => setCardExpiry(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={cardCvv} 
                      onChange={(e) => setCardCvv(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`} 
              disabled={loading}
              style={{ width: '100%', padding: '1rem', marginTop: '0.5rem' }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'radar-sweep-anim 1s linear infinite', marginRight: '0.5rem' }}></span>
                  Processando Simulação...
                </>
              ) : (
                `Simular Pagamento de R$ 19,90 ⚡`
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
