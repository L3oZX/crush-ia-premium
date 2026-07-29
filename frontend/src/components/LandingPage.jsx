import React, { useState, useEffect } from 'react';

const ZODIAC_LIST = [
  { name: 'Áries', value: 'aries', emoji: '♈' },
  { name: 'Touro', value: 'touro', emoji: '♉' },
  { name: 'Gêmeos', value: 'gemeos', emoji: '♊' },
  { name: 'Câncer', value: 'cancer', emoji: '♋' },
  { name: 'Leão', value: 'leao', emoji: '♌' },
  { name: 'Virgem', value: 'virgem', emoji: '♍' },
  { name: 'Libra', value: 'libra', emoji: '♎' },
  { name: 'Escorpião', value: 'escorpiao', emoji: '♏' },
  { name: 'Sagitário', value: 'sagitario', emoji: '♐' },
  { name: 'Capricórnio', value: 'capricornio', emoji: '♑' },
  { name: 'Aquário', value: 'aquario', emoji: '♒' },
  { name: 'Peixes', value: 'peixes', emoji: '♓' }
];

const TESTIMONIALS = [
  { name: 'Ana L., 23 anos', city: 'São Paulo', text: 'Cara, eu estava na dúvida total se ele gostava de mim. Comprei o relatório e descobri que o interesse era 91%. Tomei coragem e hoje estamos namorando! 😍', stars: 5 },
  { name: 'Fernanda C., 27 anos', city: 'Rio de Janeiro', text: 'As sugestões de resposta são incríveis! Usei a "confiante" e ele me chamou pra sair no mesmo dia. Recomendo demais!', stars: 5 },
  { name: 'Mariana R., 21 anos', city: 'Belo Horizonte', text: 'Pensei que era só mais um app igual. Mas a análise foi tão precisa que até me assustei. Valia muito mais do que paguei.', stars: 5 },
  { name: 'Juliana M., 25 anos', city: 'Curitiba', text: 'Sempre tive insegurança em conversas com crushes. Agora entendo o que ele está sentindo e sei exatamente o que responder!', stars: 5 },
  { name: 'Carolina S., 29 anos', city: 'Porto Alegre', text: 'O relatório de compatibilidade de signos foi super detalhado e certeiro. Parei de me preocupar e passei a agir com mais confiança.', stars: 5 },
];

function CountdownTimer() {
  const [time, setTime] = useState({ h: 23, m: 47, s: 12 });
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = n => String(n).padStart(2, '0');

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
      {[['h', time.h], ['m', time.m], ['s', time.s]].map(([label, val]) => (
        <React.Fragment key={label}>
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244,63,94,0.4)',
            borderRadius: 8, padding: '0.35rem 0.65rem', textAlign: 'center', minWidth: 48
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--secondary)', lineHeight: 1 }}>{pad(val)}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
          </div>
          {label !== 's' && <span style={{ color: 'var(--secondary)', fontWeight: 800, fontSize: '1.2rem' }}>:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

function Stars({ count = 5 }) {
  return <span style={{ color: '#fbbf24', fontSize: '1rem' }}>{'★'.repeat(count)}</span>;
}

export default function LandingPage({ onStartAnalysis }) {
  const [activeFaq, setActiveFaq] = useState(null);
  const [userSign, setUserSign] = useState('leao');
  const [crushSign, setCrushSign] = useState('libra');
  const [teaserScore, setTeaserScore] = useState(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrentTestimonial(prev => (prev + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const handleTestCompatibility = (e) => {
    e.preventDefault();
    setTeaserScore(Math.floor(Math.random() * 20) + 70); // teaser only — real result in report
  };

  return (
    <div>

      {/* ━━━ URGENCY BAR ━━━ */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(244,63,94,0.9) 0%, rgba(139,92,246,0.9) 100%)',
        padding: '0.6rem 1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap'
      }}>
        <span>🔥 Oferta por tempo limitado: desconto encerra em</span>
        <CountdownTimer />
      </div>

      {/* ━━━ HERO ━━━ */}
      <section style={{ textAlign: 'center', padding: '4rem 1rem 3rem', position: 'relative' }}>

        {/* Badge acima do H1 */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: 50, padding: '0.35rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#c084fc', marginBottom: '1.5rem' }}>
          <span>✨</span> Mais de 50.000 conversas analisadas
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.8rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}>
          Ele está com interesse<br />
          <span className="text-gradient">ou só te usando?</span>
        </h1>

        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Cole a conversa do seu crush e descubra em <strong style={{ color: 'white' }}>30 segundos</strong> o nível real de interesse, as intenções dele e as melhores respostas para conquistá-lo de vez.
        </p>

        {/* Price + CTA */}
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1rem', color: 'var(--text-dark)', textDecoration: 'line-through' }}>R$ 49,90</span>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>R$ 19,90</span>
            <span style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, padding: '0.2rem 0.5rem', fontSize: '0.8rem', fontWeight: 700 }}>-60%</span>
          </div>
          <button
            className="btn btn-primary"
            onClick={onStartAnalysis}
            style={{ padding: '1rem 2.5rem', fontSize: '1.15rem', borderRadius: 16, letterSpacing: '-0.01em' }}
          >
            Descobrir o que ele sente agora ⚡
          </button>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ color: 'var(--success)' }}>🔒</span> Pagamento 100% seguro via Cakto · Resultado em 30 segundos
          </p>
        </div>

        {/* Social Proof mini */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex' }}>
            {['👩', '👩🏽', '👩🏻', '👩🏾', '👩🏼'].map((e, i) => (
              <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: `hsl(${270 + i * 20},60%,40%)`, border: '2px solid var(--bg-primary)', marginLeft: i ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{e}</div>
            ))}
          </div>
          <div style={{ textAlign: 'left' }}>
            <Stars />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>+50k análises · 4.9/5 estrelas</div>
          </div>
        </div>
      </section>

      {/* ━━━ CREDIBILITY STATS ━━━ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
        {[
          { icon: '💝', val: '50.000+', label: 'Conversas Analisadas' },
          { icon: '⚡', val: '< 30s', label: 'Resultado Instantâneo' },
          { icon: '⭐', val: '4.9/5', label: 'Avaliação Média' },
          { icon: '🔒', val: '100%', label: 'Privacidade Garantida' },
        ].map((s, i) => (
          <div key={i} className="glass-card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white' }}>{s.val}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ━━━ PAIN/PROBLEM SECTION ━━━ */}
      <section className="glass-card" style={{ marginBottom: '4rem', padding: '2.5rem', borderColor: 'rgba(244,63,94,0.2)' }}>
        <h2 style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '2rem' }}>
          Você também fica assim? 👇
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1.5rem' }}>
          {[
            { emoji: '😰', text: '"Mando mensagem e fico esperando horas pela resposta…"' },
            { emoji: '🤔', text: '"Não sei se o que ele escreve é flerte ou só amizade."' },
            { emoji: '😤', text: '"Já fui ignorada depois de mandar uma mensagem animada."' },
            { emoji: '💭', text: '"Quero saber se ele gosta de mim de verdade ou é enrolação."' },
          ].map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'rgba(244,63,94,0.04)', borderRadius: 12, border: '1px solid rgba(244,63,94,0.1)' }}>
              <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{p.emoji}</span>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>{p.text}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Se você se identificou com alguma dessas situações, a Crush IA foi feita pra você. 💜
          </p>
          <button className="btn btn-primary" onClick={onStartAnalysis} style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
            Quero descobrir agora →
          </button>
        </div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '0.5rem' }}>Como funciona?</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1rem' }}>3 passos. 30 segundos. Uma clareza total.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '2rem' }}>
          {[
            { step: '01', icon: '💬', title: 'Cole a conversa', desc: 'Copie as mensagens do WhatsApp, Instagram, Tinder ou qualquer app de chat e cole no campo indicado.' },
            { step: '02', icon: '🧠', title: 'IA analisa tudo', desc: 'Nossa IA lê o tom, a frequência, os emojis e as entrelinhas da conversa em segundos.' },
            { step: '03', icon: '📊', title: 'Receba o relatório', desc: 'Veja o nível de interesse, as emoções detectadas e as 5 melhores respostas pra você usar agora.' },
          ].map((s, i) => (
            <div key={i} className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -10, right: -5, fontSize: '5rem', fontWeight: 900, color: 'rgba(139,92,246,0.06)', lineHeight: 1, userSelect: 'none' }}>{s.step}</div>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{s.icon}</div>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.15rem' }}>{s.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ WHAT YOU GET (benefits) ━━━ */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '0.5rem' }}>O que você recebe por R$ 19,90</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Um relatório completo que você não encontra em nenhum outro lugar</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.5rem' }}>
          {[
            { icon: '🌡️', color: 'var(--primary)', title: 'Termômetro de Interesse', desc: 'Nota de 0 a 100 mostrando o quanto ele(a) realmente está interessado(a) em você.' },
            { icon: '💬', color: 'var(--secondary)', title: '5 Sugestões de Resposta', desc: 'Respostas prontas nas categorias Romântica, Engraçada, Misteriosa, Confiante e Direta. Copie e envie!' },
            { icon: '🧠', color: 'var(--accent)', title: 'Insights Estratégicos', desc: 'Descubra o que evitar dizer, o melhor horário para responder e se vale a pena insistir.' },
            { icon: '❤️', color: 'var(--secondary)', title: 'Emoções Detectadas', desc: 'Quais emoções estão presentes nas mensagens — carinho, ansiedade, indiferença, atração.' },
            { icon: '📈', color: 'var(--success)', title: 'Probabilidade de Evolução', desc: 'Qual a chance real desse papo virar um encontro ou um relacionamento.' },
            { icon: '🔮', color: '#fbbf24', title: 'Compatibilidade de Signos', desc: 'Análise amorosa, emocional e de comunicação entre os signos (entretenimento recreativo).' },
          ].map((b, i) => (
            <div key={i} className="glass-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1.5rem' }}>
              <div style={{ fontSize: '1.8rem', flexShrink: 0, width: 48, height: 48, borderRadius: 12, background: `${b.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{b.icon}</div>
              <div>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>{b.title}</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ TESTIMONIALS ━━━ */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '0.5rem' }}>O que dizem quem já usou</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>Resultados reais de clientes reais</p>

        {/* Featured rotating testimonial */}
        <div className="glass-card" style={{ maxWidth: 680, margin: '0 auto 2rem', padding: '2.5rem', textAlign: 'center', borderColor: 'rgba(139,92,246,0.3)', transition: 'all 0.4s ease' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>"</div>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '1.5rem', fontStyle: 'italic' }}>
            {TESTIMONIALS[currentTestimonial].text}
          </p>
          <Stars count={TESTIMONIALS[currentTestimonial].stars} />
          <div style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
            {TESTIMONIALS[currentTestimonial].name} · {TESTIMONIALS[currentTestimonial].city}
          </div>
          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1.5rem' }}>
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setCurrentTestimonial(i)} style={{
                width: i === currentTestimonial ? 20 : 8, height: 8, borderRadius: 4,
                background: i === currentTestimonial ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                border: 'none', cursor: 'pointer', transition: 'all 0.3s'
              }} />
            ))}
          </div>
        </div>

        {/* Grid of other testimonials */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1.5rem' }}>
          {TESTIMONIALS.slice(0, 3).map((t, i) => (
            <div key={i} className="glass-card" style={{ padding: '1.5rem' }}>
              <Stars count={t.stars} />
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0.75rem 0', fontStyle: 'italic' }}>"{t.text}"</p>
              <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.name} · <span style={{ color: 'var(--text-dark)' }}>{t.city}</span></p>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ ZODIAC TEASER ━━━ */}
      <section className="glass-card" style={{ marginBottom: '4rem', borderColor: 'rgba(251,191,36,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#fbbf24', fontWeight: 700, marginBottom: '0.5rem' }}>Bônus incluído no relatório</div>
          <h2 style={{ fontSize: '1.8rem' }}>🔮 Veja uma prévia da sua compatibilidade</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
            O relatório completo inclui amor, emoção e comunicação detalhados.
          </p>
        </div>

        <form onSubmit={handleTestCompatibility} style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className="zodiac-selector-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label>Seu Signo</label>
              <select className="form-select" value={userSign} onChange={e => setUserSign(e.target.value)}>
                {ZODIAC_LIST.map(z => <option key={z.value} value={z.value}>{z.emoji} {z.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Signo do Crush</label>
              <select className="form-select" value={crushSign} onChange={e => setCrushSign(e.target.value)}>
                {ZODIAC_LIST.map(z => <option key={z.value} value={z.value}>{z.emoji} {z.name}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>
            Ver prévia da compatibilidade 🔮
          </button>
        </form>

        {teaserScore !== null && (
          <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#fbbf24' }}>{teaserScore}%</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Afinidade Geral (prévia)</div>
            <div className="glass-card" style={{ display: 'inline-block', padding: '1rem 2rem', background: 'rgba(251,191,36,0.06)', borderColor: 'rgba(251,191,36,0.2)', maxWidth: 460 }}>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                🔑 Para ver a análise completa de Amor, Emocional e Comunicação + o relatório da sua conversa:
              </p>
              <button className="btn btn-primary" onClick={onStartAnalysis} style={{ width: '100%' }}>
                Quero o relatório completo — R$ 19,90 ⚡
              </button>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-dark)', marginTop: '1rem' }}>*Conteúdo de entretenimento. Não constitui previsão garantida.</p>
          </div>
        )}
      </section>

      {/* ━━━ FAQ ━━━ */}
      <section style={{ maxWidth: 760, margin: '0 auto 4rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '2.5rem' }}>Perguntas frequentes</h2>
        {[
          { q: 'Como envio a conversa para análise?', a: 'Você pode copiar as mensagens de qualquer app (WhatsApp, Instagram, Tinder…) e colar no campo de texto. Ou tirar um print e fazer upload da imagem — nossa IA lê os dois formatos.' },
          { q: 'O pagamento é seguro?', a: 'Sim. O checkout é feito pela plataforma Cakto, líder em pagamentos digitais no Brasil. Suporta PIX e cartão de crédito com criptografia SSL.' },
          { q: 'Quando recebo o resultado?', a: 'Em menos de 30 segundos após a confirmação do pagamento. A análise é gerada instantaneamente e aparece direto na tela.' },
          { q: 'Minha conversa fica salva em algum lugar?', a: 'Não. Sua conversa é processada apenas para gerar o relatório e não é compartilhada ou exposta para terceiros. Total privacidade.' },
          { q: 'A análise funciona para conversas do Instagram e Tinder?', a: 'Sim! Funciona com qualquer conversa de texto — WhatsApp, Instagram DM, Tinder, Bumble, qualquer app. Basta copiar e colar.' },
          { q: 'Isso é garantido? E se eu não gostar do resultado?', a: 'A Crush IA é uma ferramenta de reflexão e entretenimento baseada em IA. Os resultados não são diagnósticos e podem variar. Recomendamos usar como apoio, não como verdade absoluta.' },
        ].map((f, i) => (
          <div key={i} className={`faq-item ${activeFaq === i ? 'active' : ''}`}>
            <button className="faq-question" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
              {f.q}
            </button>
            <div className="faq-answer"><p>{f.a}</p></div>
          </div>
        ))}
      </section>

      {/* ━━━ FINAL CTA BLOCK ━━━ */}
      <section className="glass-card" style={{
        textAlign: 'center', padding: '3.5rem 2rem', marginBottom: '3rem',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(244,63,94,0.1) 100%)',
        borderColor: 'rgba(139,92,246,0.3)'
      }}>
        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--secondary)', fontWeight: 700, marginBottom: '1rem' }}>Última chance</div>
        <h2 style={{ fontSize: 'clamp(1.5rem,4vw,2.2rem)', marginBottom: '1rem' }}>
          Você merece saber a verdade<br />sobre o que ele sente por você.
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Pare de ficar na dúvida. Por menos do que um café, descubra se ele está genuinamente interessado — e saiba exatamente o que responder para conquistá-lo.
        </p>

        {/* Price box */}
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: '1.5rem 2.5rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Investimento único</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ textDecoration: 'line-through', color: 'var(--text-dark)', fontSize: '1rem' }}>R$ 49,90</span>
            <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--success)' }}>R$ 19,90</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>por análise completa · resultado em 30 segundos</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={onStartAnalysis} style={{ padding: '1.1rem 2.8rem', fontSize: '1.15rem', borderRadius: 16 }}>
            Analisar minha conversa agora ⚡
          </button>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span>🔒 Pagamento seguro via Cakto</span>
            <span>⚡ Resultado em 30s</span>
            <span>🔐 Conversa privada</span>
          </div>
        </div>
      </section>

    </div>
  );
}
