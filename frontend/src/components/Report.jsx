import React, { useState } from 'react';

export default function Report({ data, onNewAnalysis }) {
  const [copiedId, setCopiedId] = useState(null);

  if (!data || !data.result) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--error)', fontSize: '1.2rem', marginBottom: '1.5rem' }}>Erro ao carregar o relatório. Nenhum resultado encontrado.</p>
        <button className="btn btn-primary" onClick={onNewAnalysis}>Tentar Novamente</button>
      </div>
    );
  }

  const {
    interestScore,
    reciprocityScore,
    emotions,
    intentions,
    positivePoints,
    attentionPoints,
    evolutionProbability,
    summary,
    suggestions,
    insights,
    zodiacCompatibility
  } = data.result;

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(idx);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    });
  };

  // Convert scores to stroke dashes for radial gauges
  // Radius is 50, circumference is 2 * pi * r = ~314
  const getCircumferenceOffset = (score) => {
    const circ = 314;
    return circ - (score / 100) * circ;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Summary */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(20, 16, 40, 0.8) 100%)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💝</div>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }} className="text-gradient">Análise Pronta!</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Análise gerada com sucesso pela Inteligência Artificial</p>
        <p style={{ maxWidth: '700px', lineHeight: '1.6', fontSize: '1.05rem' }}>{summary}</p>
      </div>

      {/* Main Gauges Section */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.4rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>🌡️ Termômetro de Conexão</h3>
        
        <div className="scores-grid">
          {/* Interest Gauge */}
          <div className="score-card">
            <div className="gauge-chart">
              <svg className="gauge-svg" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--secondary)" />
                  </linearGradient>
                </defs>
                <circle className="gauge-track" cx="60" cy="60" r="50" />
                <circle 
                  className="gauge-fill" 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  strokeDasharray="314" 
                  strokeDashoffset={getCircumferenceOffset(interestScore)}
                />
              </svg>
              <div className="gauge-text">
                <div className="gauge-value">{interestScore}%</div>
                <div className="gauge-label">Interesse</div>
              </div>
            </div>
            <p style={{ marginTop: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Mede a atração física, urgência e carinho textual detectado.
            </p>
          </div>

          {/* Reciprocity Gauge */}
          <div className="score-card">
            <div className="gauge-chart">
              <svg className="gauge-svg" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="gauge-gradient-pink" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--secondary)" />
                    <stop offset="100%" stopColor="var(--accent)" />
                  </linearGradient>
                </defs>
                <circle className="gauge-track" cx="60" cy="60" r="50" />
                <circle 
                  className="gauge-fill-pink" 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  strokeDasharray="314" 
                  strokeDashoffset={getCircumferenceOffset(reciprocityScore)}
                />
              </svg>
              <div className="gauge-text">
                <div className="gauge-value">{reciprocityScore}%</div>
                <div className="gauge-label">Reciprocidade</div>
              </div>
            </div>
            <p style={{ marginTop: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Compara o equilíbrio de esforço de ambas as partes.
            </p>
          </div>

          {/* Evolution Box */}
          <div className="score-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📈</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Chance de Evolução</span>
            <h4 style={{ fontSize: '1.6rem', marginTop: '0.5rem', color: 'var(--accent)' }}>{evolutionProbability}</h4>
            
            <div className="emotions-flex">
              {emotions.map((emo, i) => (
                <span key={i} className={`badge ${i % 2 !== 0 ? 'badge-sec' : ''}`}>{emo}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '0.95rem' }}>
            <strong>Intenção Principal Identificada:</strong> <span style={{ color: 'var(--text-muted)' }}>{intentions}</span>
          </p>
        </div>
      </div>

      {/* Pros & Attention Points */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--success)' }}>✓ Pontos Positivos</h3>
          <ul className="points-list points-positive">
            {positivePoints.map((pt, i) => (
              <li key={i}>{pt}</li>
            ))}
          </ul>
        </div>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--warning)' }}>⚠ Pontos de Atenção</h3>
          <ul className="points-list points-attention">
            {attentionPoints.map((pt, i) => (
              <li key={i}>{pt}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Strategic Response Suggestions */}
      <div className="glass-card">
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary)', fontWeight: 'bold' }}>Copie e Envie</span>
          <h3 style={{ fontSize: '1.4rem', marginTop: '0.25rem' }}>Sugestões Inteligentes de Resposta</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Respostas calculadas especificamente para destravar e engajar o seu crush.</p>
        </div>

        <div className="responses-grid">
          {suggestions.map((sug, i) => {
            const catColors = {
              Romântica: { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', border: 'rgba(244, 63, 94, 0.3)' },
              Engraçada: { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)' },
              Misteriosa: { bg: 'rgba(139, 92, 246, 0.15)', text: '#c084fc', border: 'rgba(139, 92, 246, 0.3)' },
              Confiante: { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' },
              Direta: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' }
            };
            const style = catColors[sug.category] || { bg: 'rgba(255,255,255,0.05)', text: 'white', border: 'rgba(255,255,255,0.1)' };
            
            return (
              <div key={i} className="response-item">
                <div 
                  className="response-cat"
                  style={{
                    backgroundColor: style.bg,
                    color: style.text,
                    border: `1px solid ${style.border}`
                  }}
                >
                  {sug.category}
                </div>
                <div className="response-text">{sug.text}</div>
                <button 
                  className={`btn ${copiedId === i ? 'btn-success' : 'btn-secondary'}`}
                  style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', flexShrink: 0 }}
                  onClick={() => copyToClipboard(sug.text, i)}
                >
                  {copiedId === i ? "Copiado! ✓" : "Copiar 📋"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Insights & Strategics */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>💡 Manual Estratégico da IA</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>🚫 O que evitar dizer</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{insights.toAvoid}</p>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>⏰ Melhor momento para responder</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{insights.bestTime}</p>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--gold)', marginBottom: '0.5rem' }}>🔥 Vale a pena insistir?</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{insights.worthInsisting}</p>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>🌱 Dicas de melhoria de conversa</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{insights.recommendations}</p>
          </div>
        </div>
      </div>

      {/* Zodiac Compatibility Result (if computed) */}
      {zodiacCompatibility && (
        <div className="glass-card" style={{ border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🔮</span> Compatibilidade Astral Revelada
          </h3>

          <div className="zodiac-gauge-container">
            <div className="gauge-chart" style={{ flexShrink: 0 }}>
              <svg className="gauge-svg" viewBox="0 0 120 120">
                <circle className="gauge-track" cx="60" cy="60" r="50" />
                <circle 
                  className="gauge-fill" 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  strokeDasharray="314" 
                  strokeDashoffset={getCircumferenceOffset(zodiacCompatibility.general)}
                />
              </svg>
              <div className="gauge-text">
                <div className="gauge-value">{zodiacCompatibility.general}%</div>
                <div className="gauge-label">Geral</div>
              </div>
            </div>

            <div className="zodiac-bars">
              <div className="zodiac-bar-group">
                <div className="zodiac-bar-label-flex">
                  <span>Afinidade Amorosa</span>
                  <span>{zodiacCompatibility.love}%</span>
                </div>
                <div className="zodiac-bar-bg">
                  <div className="zodiac-bar-fill" style={{ width: `${zodiacCompatibility.love}%` }}></div>
                </div>
              </div>
              
              <div className="zodiac-bar-group">
                <div className="zodiac-bar-label-flex">
                  <span>Afinidade Emocional</span>
                  <span>{zodiacCompatibility.emotional}%</span>
                </div>
                <div className="zodiac-bar-bg">
                  <div className="zodiac-bar-fill" style={{ width: `${zodiacCompatibility.emotional}%` }}></div>
                </div>
              </div>
              
              <div className="zodiac-bar-group">
                <div className="zodiac-bar-label-flex">
                  <span>Afinidade na Comunicação</span>
                  <span>{zodiacCompatibility.communication}%</span>
                </div>
                <div className="zodiac-bar-bg">
                  <div className="zodiac-bar-fill" style={{ width: `${zodiacCompatibility.communication}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', fontSize: '0.95rem' }}>
            <p><strong>Visão do Cosmos:</strong> {zodiacCompatibility.summary}</p>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--text-dark)', marginTop: '1.5rem', textAlign: 'center', lineHeight: '1.4' }}>
            ⚠️ {zodiacCompatibility.disclaimer}
          </p>
        </div>
      )}

      {/* Disclaimers & CTAs */}
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dark)', maxWidth: '600px', margin: '0 auto 2rem', lineHeight: '1.5' }}>
          *Nota Legal: As análises e sugestões fornecidas são geradas de forma automatizada por Inteligência Artificial para fins de entretenimento, reflexão e diversão recreativa. Não constituem diagnósticos psicológicos, terapia de casal ou conselhos amorosos formais e garantidos.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onNewAnalysis}>
            Analisar Nova Conversa ⚡
          </button>
        </div>
      </div>
      
    </div>
  );
}
