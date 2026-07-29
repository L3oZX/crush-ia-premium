import React, { useState } from 'react';

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

export default function Analyzer({ onSubmit, onBack }) {
  const [inputText, setInputText] = useState('');
  const [tone, setTone] = useState('romantica');
  const [targetGoal, setTargetGoal] = useState('conquistar');
  const [userSign, setUserSign] = useState('aries');
  const [crushSign, setCrushSign] = useState('touro');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [ocrSimulatedText, setOcrSimulatedText] = useState('');
  const [dragging, setDragging] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  const handleImageUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setUploadedImage(reader.result);
      setOcrLoading(true);
      
      try {
        const response = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: reader.result })
        });
        
        if (!response.ok) throw new Error("Erro na resposta do servidor OCR");
        
        const data = await response.json();
        setInputText(data.text);
        setOcrSimulatedText(data.text);
      } catch (error) {
        console.error("Erro ao realizar OCR:", error);
        alert("Não foi possível extrair o texto automaticamente. Você ainda pode digitar a conversa manualmente.");
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!inputText.trim()) {
      alert("Por favor, cole o texto da conversa ou faça o upload de um print para extrair o chat.");
      return;
    }
    
    onSubmit({
      text: inputText,
      settings: {
        tone,
        targetGoal,
        signs: {
          user: userSign,
          crush: crushSign
        }
      }
    });
  };

  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }} onClick={onBack}>
          ← Voltar
        </button>
        <h2 style={{ fontSize: '1.5rem', textAlign: 'right' }}>Nova Análise de Conversa</h2>
      </div>

      <form onSubmit={handleSubmitForm}>
        {/* Upload Container */}
        <div className="form-group">
          <label>Enviar Print da Conversa (Opcional)</label>
          <div 
            className="upload-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={(e) => {
              if (ocrLoading) {
                e.stopPropagation();
                return;
              }
              document.getElementById('file-input').click();
            }}
            style={{ 
              borderColor: dragging ? 'var(--secondary)' : '',
              backgroundColor: dragging ? 'rgba(244, 63, 94, 0.05)' : '',
              cursor: ocrLoading ? 'not-allowed' : 'pointer'
            }}
          >
            <input 
              id="file-input" 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
              disabled={ocrLoading}
            />
            {uploadedImage ? (
              <div style={{ position: 'relative', width: '100%' }}>
                <img 
                  src={uploadedImage} 
                  alt="Conversa uploaded" 
                  style={{ 
                    maxHeight: '180px', 
                    borderRadius: '12px', 
                    display: 'block', 
                    margin: '0 auto 1rem', 
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    opacity: ocrLoading ? 0.5 : 1
                  }}
                />
                {ocrLoading ? (
                  <p style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.9rem' }}>
                    Extraindo texto da conversa pela IA... 🔍
                  </p>
                ) : (
                  <p style={{ color: 'var(--success)', fontWeight: '600', fontSize: '0.9rem' }}>
                    ✓ Print carregado! Texto extraído com sucesso pela IA.
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="upload-icon">📸</div>
                <div>
                  <p style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '0.25rem' }}>Arraste o print da conversa ou clique para buscar</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Formatos suportados: PNG, JPG. Máx: 5MB</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Text Input area */}
        <div className="form-group">
          <label>Cole a Conversa Escrita (Ou edite o texto extraído do print)</label>
          <textarea
            className="form-textarea"
            placeholder="Copie as mensagens do chat e cole aqui. Exemplo:&#10;Ele: Oi sumida&#10;Ela: Oi! Quanto tempo..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          ></textarea>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Options */}
          <div className="form-group">
            <label>Objetivo com o Crush</label>
            <select className="form-select" value={targetGoal} onChange={(e) => setTargetGoal(e.target.value)}>
              <option value="conquistar">Conquistar / Chamar Atenção</option>
              <option value="reatar">Reatar Conversa Desaparecida</option>
              <option value="amizade">Manter no campo da Amizade</option>
              <option value="desvendar">Desvendar Intenções Reais</option>
              <option value="marcar_encontro">Marcar um Encontro Físico</option>
            </select>
          </div>

          <div className="form-group">
            <label>Estilo Preferido de Resposta</label>
            <select className="form-select" value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="romantica">Romântico / Apaixonado</option>
              <option value="engracada">Engraçado / Divertido</option>
              <option value="misteriosa">Misterioso / Provocante</option>
              <option value="confiante">Confiante / Sedutor</option>
              <option value="direta">Direto / Objetivo</option>
            </select>
          </div>
        </div>

        {/* Zodiac Match (Recreational) */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.15)' }}>
          <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <span>🔮</span> Compatibilidade Astral (Opcional)
          </h4>
          <div className="zodiac-selector-grid">
            <div className="form-group">
              <label>Seu Signo</label>
              <select className="form-select" value={userSign} onChange={(e) => setUserSign(e.target.value)}>
                {ZODIAC_LIST.map(z => (
                  <option key={z.value} value={z.value}>{z.emoji} {z.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Signo do Crush</label>
              <select className="form-select" value={crushSign} onChange={(e) => setCrushSign(e.target.value)}>
                {ZODIAC_LIST.map(z => (
                  <option key={z.value} value={z.value}>{z.emoji} {z.name}</option>
                ))}
              </select>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dark)', marginTop: '0.5rem' }}>
            *Aviso: As análises de signos no relatório final possuem caráter recreativo e para fins de entretenimento.
          </p>
        </div>

        {/* Submit */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Valor da Análise Completa: <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>R$ 19,90</span>
          </p>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
            Analisar Conversa com IA 🚀
          </button>
        </div>
      </form>
    </div>
  );
}
