const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change_me_now';
const KIWIFY_SECRET = process.env.KIWIFY_SECRET_TOKEN || '';
const CAKTO_SECRET = process.env.CAKTO_SECRET_TOKEN || '';

// ─── SECURITY MIDDLEWARE ────────────────────────────────────────────────────

// 1. HTTP Security Headers (XSS, Clickjacking, MIME sniffing, etc.)
app.use(helmet({
  contentSecurityPolicy: false // disabled to allow fonts/external scripts in frontend
}));

// 2. CORS – Allow only configured origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., server-to-server webhooks from Kiwify/Cakto)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origem bloqueada pelo CORS: ${origin}`));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token']
}));

// 3. Body size limit – 2MB max (enough for pasted text + base64 image preview)
app.use(express.json({ limit: '2mb' }));

// 4. Global rate limiter – 100 req/15min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' }
});
app.use('/api/', globalLimiter);

// 5. Strict rate limiter for analysis creation – 10 req/hour per IP (prevent abuse)
const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Limite de análises atingido. Tente novamente em 1 hora.' }
});

// ─── ADMIN AUTHENTICATION MIDDLEWARE ────────────────────────────────────────
// Validates 'X-Admin-Token' header using constant-time comparison to prevent timing attacks
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.adminToken;
  if (!token) {
    return res.status(401).json({ error: 'Autenticação de administrador necessária.' });
  }
  // Constant-time comparison prevents timing attacks
  try {
    const tokenBuf = Buffer.from(token);
    const passBuf = Buffer.from(ADMIN_PASSWORD);
    if (tokenBuf.length !== passBuf.length || !crypto.timingSafeEqual(tokenBuf, passBuf)) {
      return res.status(403).json({ error: 'Token de administrador inválido.' });
    }
  } catch {
    return res.status(403).json({ error: 'Token de administrador inválido.' });
  }
  next();
}

// ─── INPUT SANITIZATION HELPER ───────────────────────────────────────────────
function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  // Limit to 8000 characters (prevents huge payloads going to OpenAI)
  return text.substring(0, 8000).replace(/<[^>]*>/g, ''); // strip HTML tags
}

// ─── WEBHOOK SIGNATURE VALIDATION ────────────────────────────────────────────
// Kiwify and Cakto both sign payloads with HMAC-SHA256
// In simulation mode we skip if no secret is configured
function validateKiwifySignature(req) {
  if (!KIWIFY_SECRET) return true; // skip in dev mode if no secret set
  const signature = req.headers['x-kiwify-signature'] || req.headers['x-signature'];
  if (!signature) return false;
  const computed = crypto
    .createHmac('sha256', KIWIFY_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
  } catch { return false; }
}

function validateCaktoSignature(req) {
  if (!CAKTO_SECRET) return true; // skip in dev mode if no secret set
  const signature = req.headers['x-cakto-signature'] || req.headers['x-signature'];
  if (!signature) return false;
  const computed = crypto
    .createHmac('sha256', CAKTO_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
  } catch { return false; }
}

// Database initialization
const DB_PATH = path.join(__dirname, 'db.json');

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    const defaultDb = {
      users: [],
      analyses: [],
      transactions: [],
      metrics: { visits: 0 }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { users: [], analyses: [], transactions: [], metrics: { visits: 0 } };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing database:', error);
  }
}

// Ensure DB exists
readDb();

// Increment site visits for admin analytics
app.use((req, res, next) => {
  if (req.path === '/' || req.path.includes('/landing')) {
    const db = readDb();
    db.metrics = db.metrics || { visits: 0 };
    db.metrics.visits = (db.metrics.visits || 0) + 1;
    writeDb(db);
  }
  next();
});

// Zodiac Compatibility Data Matrix
const ZODIAC_COMPATIBILITY = {
  aries: {
    aries: { love: 85, emotional: 75, comm: 80, summary: "Duas potências de fogo! Muita paixão e atitude, mas cuidado com as discussões impulsivas." },
    touro: { love: 70, emotional: 80, comm: 65, summary: "Fogo e Terra. Touro busca estabilidade, enquanto Áries quer velocidade. Exige paciência." },
    gemeos: { love: 88, emotional: 70, comm: 90, summary: "Muito dinâmico! Conversas fluidas e diversão garantida, embora falte um pouco de foco emocional." },
    cancer: { love: 60, emotional: 85, comm: 60, summary: "Áries pode ser direto demais para o sensível Câncer. Relação exige empatia mútua." },
    leao: { love: 95, emotional: 90, comm: 85, summary: "Magnetismo puro! Dois signos de fogo que se apoiam e brilham juntos, desde que dominem os egos." },
    virgem: { love: 65, emotional: 70, comm: 75, summary: "Ousadia de Áries versus detalhismo de Virgem. Funciona se focarem no aprendizado mútuo." },
    libra: { love: 90, emotional: 85, comm: 80, summary: "Opostos que se atraem. Libra traz a diplomacia que falta à impulsividade de Áries." },
    escorpiao: { love: 80, emotional: 88, comm: 70, summary: "Intensidade vulcânica! Muita atração física, mas a necessidade de controle de ambos pode gerar atritos." },
    sagitario: { love: 98, emotional: 88, comm: 92, summary: "Aventura e conexão intelectual perfeitas. Liberdade e entusiasmo definem este casal." },
    capricornio: { love: 68, emotional: 75, comm: 70, summary: "Ambições em comum, mas métodos diferentes. Capricórnio planeja e Áries simplesmente executa." },
    aquario: { love: 85, emotional: 78, comm: 95, summary: "Companheirismo e ideias revolucionárias. Uma amizade forte que facilmente vira amor livre." },
    peixes: { love: 72, emotional: 90, comm: 68, summary: "Áries protege a fragilidade pisciana, mas precisa suavizar o tom para não ferir Peixes." }
  },
  touro: {
    aries: { love: 70, emotional: 80, comm: 65, summary: "Ritmos diferentes. Touro vai devagar e planeja, Áries corre sem rumo. Precisa de ajuste." },
    touro: { love: 90, emotional: 92, comm: 80, summary: "Conforto, lealdade e rotina agradável. Pode faltar um pouco de novidade, mas sobra segurança." },
    gemeos: { love: 68, emotional: 60, comm: 82, summary: "Gêmeos quer novidades e movimento; Touro prefere paz e sossego. Diálogo será a chave." },
    cancer: { love: 92, emotional: 95, comm: 88, summary: "Uma das melhores combinações. Sensibilidade de Câncer acolhe a estabilidade de Touro perfeitamente." },
    leao: { love: 80, emotional: 82, comm: 75, summary: "Orgulhosos e teimosos, mas muito fiéis. Quando se alinham, constroem um império juntos." },
    virgem: { love: 96, emotional: 90, comm: 94, summary: "Pés no chão e objetivos claros. Relação extremamente sólida, produtiva e afetuosa." },
    libra: { love: 82, emotional: 80, comm: 85, summary: "Ambos regidos por Vênus! Amam a beleza, o romance e o conforto. Conexão charmosa e pacífica." },
    escorpiao: { love: 94, emotional: 92, comm: 80, summary: "Opostos magnéticos. Atração magnética inegável e lealdade profunda, mas possessividade é um perigo." },
    sagitario: { love: 65, emotional: 70, comm: 75, summary: "Sagitário quer explorar o mundo, Touro quer decorar a casa. Zonas de conforto incompatíveis." },
    capricornio: { love: 98, emotional: 92, comm: 90, summary: "Parceria de sucesso total. Compartilham valores de segurança, carreira e compromisso real." },
    aquario: { love: 62, emotional: 65, comm: 78, summary: "Aquário vive no futuro e Touro valoriza a tradição. Choque cultural frequente." },
    peixes: { love: 88, emotional: 94, comm: 82, summary: "Romantismo poético. A doçura de Peixes abranda o lado prático de Touro, criando um lar acolhedor." }
  },
  gemeos: {
    aries: { love: 88, emotional: 70, comm: 90, summary: "Parceria eletrizante e cheia de risadas. Gostam de novidades e estimulam a mente um do outro." },
    touro: { love: 68, emotional: 60, comm: 82, summary: "Touro busca constância, Gêmeos busca estímulo constante. Necessitam ceder para dar certo." },
    gemeos: { love: 85, emotional: 70, comm: 98, summary: "Conversa infinita! Ideias borbulhando e excelente humor, mas precisam aprender a aprofundar sentimentos." },
    cancer: { love: 70, emotional: 82, comm: 75, summary: "Câncer busca segurança e aconchego; Gêmeos quer liberdade e socializar. Relação delicada." },
    leao: { love: 88, emotional: 78, comm: 90, summary: "Combinação animada e social. O brilho de Leão atrai a curiosidade inteligente de Gêmeos." },
    virgem: { love: 75, emotional: 70, comm: 95, summary: "Ambos intelectuais, regidos por Mercúrio. Muita análise mental, mas podem racionalizar demais o afeto." },
    libra: { love: 94, emotional: 85, comm: 96, summary: "Sintonia mental fantástica. Compartilham bom gosto, amor à arte e discussões filosóficas leves." },
    escorpiao: { love: 72, emotional: 80, comm: 78, summary: "Intriga e mistério. A profundidade de Escorpião choca-se com a leveza de Gêmeos. Desafio constante." },
    sagitario: { love: 90, emotional: 80, comm: 94, summary: "Opostos que se divertem! Adoram viajar e aprender. Uma conexão que nunca cai no tédio." },
    capricornio: { love: 60, emotional: 68, comm: 72, summary: "Gêmeos acha Capricórnio sério demais; Capricórnio vê Gêmeos como imaturo. Difícil conexão." },
    aquario: { love: 96, emotional: 82, comm: 98, summary: "Excelente afinidade mental e liberdade mútua. Ideias inovadoras e amizade colorida ideal." },
    peixes: { love: 70, emotional: 85, comm: 75, summary: "Peixes é pura emoção e intuição; Gêmeos é lógica e dispersão. Podem se desencontrar no sentir." }
  },
  cancer: {
    aries: { love: 60, emotional: 85, comm: 60, summary: "Sensibilidade versus pressa. Áries machuca sem querer; Câncer guarda rancor. Muito cuidado." },
    touro: { love: 92, emotional: 95, comm: 88, summary: "Conexão afetuosa, segura e duradoura. Adoram cozinhar, ficar em casa e cuidar um do outro." },
    gemeos: { love: 70, emotional: 82, comm: 75, summary: "Gêmeos é mental e instável; Câncer é sentimental e carente. Requer paciência e diálogo lento." },
    cancer: { love: 88, emotional: 95, comm: 80, summary: "Ninho de amor ultra-sensível. Muita empatia e carinho, mas cuidado para não se isolarem do mundo real." },
    leao: { love: 82, emotional: 88, comm: 78, summary: "O Sol (Leão) e a Lua (Câncer). Câncer gosta de cuidar nos bastidores; Leão adora os holofotes." },
    virgem: { love: 90, emotional: 92, comm: 88, summary: "Organização e cuidado. Virgem ajuda a estruturar as emoções de Câncer, que retribui com carinho doce." },
    libra: { love: 75, emotional: 80, comm: 80, summary: "Buscadores de harmonia, mas expressam de formas diferentes. Podem evitar conflitos até acumular tensão." },
    escorpiao: { love: 97, emotional: 98, comm: 85, summary: "Fusão de almas! Compreensão mútua quase telepática. Paixão intensa e laços inquebráveis." },
    sagitario: { love: 68, emotional: 75, comm: 70, summary: "Câncer quer criar raízes; Sagitário quer asas. Ritmos emocionais muito conflitantes." },
    capricornio: { love: 88, emotional: 90, comm: 82, summary: "Opostos complementares excelentes. Capricórnio provê a estrutura prática e Câncer traz calor emocional." },
    aquario: { love: 64, emotional: 70, comm: 75, summary: "Aquário é frio e racional; Câncer é pura emoção. Distanciamento emocional frequente." },
    peixes: { love: 98, emotional: 99, comm: 88, summary: "Romance dos sonhos. Sintonia espiritual e empatia profunda. Parecem ler a mente um do outro." }
  },
  leao: {
    aries: { love: 95, emotional: 90, comm: 85, summary: "Química explosiva e lealdade feroz. Juntos, motivam-se a conquistar qualquer meta." },
    touro: { love: 80, emotional: 82, comm: 75, summary: "Obstinação em dobro. Touro não cede; Leão quer mandar. Mas o afeto físico é muito forte." },
    gemeos: { love: 88, emotional: 78, comm: 90, summary: "Divertido, social e repleto de elogios mútuos. Uma dinâmica leve e cheia de glamour." },
    cancer: { love: 82, emotional: 88, comm: 78, summary: "Acolhimento lunar e brilho solar. Se ajustarem as expectativas de atenção, formam um lindo par." },
    leao: { love: 85, emotional: 80, comm: 80, summary: "Muito drama, paixão e orgulho. O relacionamento é uma passarela de moda, mas disputas de ego cansam." },
    virgem: { love: 70, emotional: 75, comm: 82, summary: "Virgem critica e analisa; Leão exige elogios e adoração. Precisa de moderação de ambos os lados." },
    libra: { love: 92, emotional: 88, comm: 90, summary: "Elegância pura. Amam a beleza, festas e romance tradicional. Apoiam a auto-estima um do outro." },
    escorpiao: { love: 78, emotional: 85, comm: 72, summary: "Batalha de titãs. Intensidade altíssima e possessividade. Pode ser o céu ou o inferno." },
    sagitario: { love: 96, emotional: 90, comm: 92, summary: "Felicidade, risos e entusiasmo sem limites. Adoram a vida e vivem aventuras incríveis juntos." },
    capricornio: { love: 72, emotional: 75, comm: 78, summary: "Ambição os une, mas o estilo de vida diverge. Capricórnio é discreto; Leão quer aplausos." },
    aquario: { love: 88, emotional: 80, comm: 88, summary: "Opostos que se atraem. Aquário foca no coletivo e Leão no indivíduo. Muito magnetismo mútuo." },
    peixes: { love: 74, emotional: 85, comm: 70, summary: "Leão pode dominar o sensível Peixes. Requer que Leão seja protetor em vez de autoritário." }
  },
  virgem: {
    aries: { love: 65, emotional: 70, comm: 75, summary: "Impulsividade ariana irrita o planejamento virginiano. Muita atrito no dia a dia." },
    touro: { love: 96, emotional: 90, comm: 94, summary: "Estabilidade impecável. Valorizam a rotina bem feita, honestidade e o conforto pragmático." },
    gemeos: { love: 75, emotional: 70, comm: 95, summary: "Conversas inteligentes, mas tendem a discutir excessivamente em vez de agir com o coração." },
    cancer: { love: 90, emotional: 92, comm: 88, summary: "Virgem cuida organizando a vida prática; Câncer traz calor emocional. Sintonia muito bonita." },
    leao: { love: 70, emotional: 75, comm: 82, summary: "Leão quer ser o centro; Virgem prefere discrição e analisa defeitos. Conflitos de postura." },
    virgem: { love: 88, emotional: 85, comm: 90, summary: "Muita organização, rotina perfeita e silêncio. Precisam tomar cuidado para não virar só cobranças." },
    libra: { love: 80, emotional: 78, comm: 88, summary: "Libra busca harmonia estética; Virgem busca precisão prática. Funciona com acordos claros." },
    escorpiao: { love: 92, emotional: 90, comm: 90, summary: "Conexão profunda e analítica. Respeito mútuo pelo espaço do outro e lealdade de aço." },
    sagitario: { love: 68, emotional: 72, comm: 80, summary: "Sagitário improvisa; Virgem planeja no milímetro. A liberdade sagitariana assusta Virgem." },
    capricornio: { love: 97, emotional: 92, comm: 95, summary: "Dupla imbatível na vida prática. Sucesso, organização, metas de longo prazo e respeito mútuo." },
    aquario: { love: 72, emotional: 68, comm: 85, summary: "Ambos racionais. Falta calor emocional no início, mas podem cooperar muito bem como parceiros de projetos." },
    peixes: { love: 88, emotional: 94, comm: 85, summary: "Opostos complementares. Peixes ensina Virgem a sonhar; Virgem ensina Peixes a se estruturar." }
  },
  libra: {
    aries: { love: 90, emotional: 85, comm: 80, summary: "Áries traz atitude e Libra traz charme e diplomacia. Química complementar intensa." },
    touro: { love: 82, emotional: 80, comm: 85, summary: "Unidos pelo apreço pela arte, luxo e amor romântico. Uma convivência elegante e macia." },
    gemeos: { love: 94, emotional: 85, comm: 96, summary: "Fascinados pela mente um do outro. Conversam por horas, amam sair e detestam ciúmes." },
    cancer: { love: 75, emotional: 80, comm: 80, summary: "Câncer é muito íntimo e familiar; Libra é social e diplomático. Relação exige ajustes de foco." },
    leao: { love: 92, emotional: 88, comm: 90, summary: "Um casal digno de cinema. Leão ama a elegância de Libra, que adora ser cortejado pelo rei do zodíaco." },
    virgem: { love: 80, emotional: 78, comm: 88, summary: "Libra quer romance estético, Virgem quer eficiência doméstica. Podem colaborar se houver flexibilidade." },
    libra: { love: 88, emotional: 82, comm: 90, summary: "Extremamente charmosos e pacíficos, mas com imensa dificuldade em tomar decisões conjuntas." },
    escorpiao: { love: 82, emotional: 85, comm: 78, summary: "Sedutores e misteriosos. Escorpião quer fusão intensa; Libra prefere leveza social. Requer limites." },
    sagitario: { love: 90, emotional: 82, comm: 92, summary: "Leveza, viagens e otimismo. Libra organiza socialmente os impulsos aventureiros de Sagitário." },
    capricornio: { love: 70, emotional: 72, comm: 78, summary: "Capricórnio é focado em deveres; Libra quer prazer social. Choque de prioridades de vida." },
    aquario: { love: 95, emotional: 80, comm: 97, summary: "Sintonia libertária e intelectual. Respeitam a individualidade e criam uma dinâmica leve e moderna." },
    peixes: { love: 82, emotional: 88, comm: 80, summary: "Poesia e amor idealizado. Podem se perder em ilusões e esquecer de pagar as contas do mês." }
  },
  escorpiao: {
    aries: { love: 80, emotional: 88, comm: 70, summary: "Fogo e água em ebulição. Muita paixão e ciúmes. Precisam aprender a ceder para evitar explosões." },
    touro: { love: 94, emotional: 92, comm: 80, summary: "Atração animal fortíssima. Fidelidade à toda prova, mas conflitos de possessão exigem maturidade." },
    gemeos: { love: 72, emotional: 80, comm: 78, summary: "Gêmeos fala demais e esconde sentimentos; Escorpião cala e sente profundamente. Muita desconfiança." },
    cancer: { love: 97, emotional: 98, comm: 85, summary: "Conexão quase magnética e psíquica. Apoio emocional total e lealdade inabalável." },
    leao: { love: 78, emotional: 85, comm: 72, summary: "Ambos dominantes e orgulhosos. Se aprenderem a cooperar, tornam-se um casal de extremo poder." },
    virgem: { love: 92, emotional: 90, comm: 90, summary: "Análise profunda de tudo. Virgem compreende as nuances silenciosas de Escorpião perfeitamente." },
    libra: { love: 82, emotional: 85, comm: 78, summary: "Libra quer seduzir o mundo; Escorpião quer privacidade total. Ciúmes constante se não houver acordos." },
    escorpiao: { love: 90, emotional: 94, comm: 75, summary: "Segredos e tempestades emocionais. A paixão é absoluta, mas as crises de desconfiança também." },
    sagitario: { love: 75, emotional: 78, comm: 82, summary: "Sagitário é livre e otimista; Escorpião é intenso e reservado. Choques de atitude constantes." },
    capricornio: { love: 92, emotional: 90, comm: 88, summary: "Grande respeito e solidez. Escorpião entra com a paixão contida e Capricórnio com a fundação estável." },
    aquario: { love: 68, emotional: 70, comm: 80, summary: "Aquário racionaliza e quer distância; Escorpião quer fusão de almas. Sentem-se em mundos diferentes." },
    peixes: { love: 98, emotional: 99, comm: 90, summary: "Sintonia mística e romântica. O amor mais profundo e compassivo do zodíaco, com aceitação total." }
  },
  sagitario: {
    aries: { love: 98, emotional: 88, comm: 92, summary: "Fogo sagrado. Alegria de viver, espontaneidade e total sintonia para aventuras e viagens." },
    touro: { love: 65, emotional: 70, comm: 75, summary: "Touro se apega ao lar físico; Sagitário se apega à liberdade. Difícil de conciliar no longo prazo." },
    gemeos: { love: 90, emotional: 80, comm: 94, summary: "Movimento contínuo. Adoram debater, rir e passear. Uma relação leve onde a amizade é a base." },
    cancer: { love: 68, emotional: 75, comm: 70, summary: "Câncer chora de saudade; Sagitário esquece de mandar mensagem enquanto viaja. Ritmos incompatíveis." },
    leao: { love: 96, emotional: 90, comm: 92, summary: "Combinação cheia de vitalidade e brilho. Apoiam-se mutuamente e irradiam otimismo por onde passam." },
    virgem: { love: 68, emotional: 72, comm: 80, summary: "Virgem aponta as regras; Sagitário quer quebrá-las. A mania de controle de Virgem sufoca o arqueiro." },
    libra: { love: 90, emotional: 82, comm: 92, summary: "Charmoso e expansivo. Um casal sociável que adora receber amigos e discutir arte/viagens." },
    escorpiao: { love: 75, emotional: 78, comm: 82, summary: "Sagitário é direto e sincero até a grosseria; Escorpião lê entrelinhas e planeja. Muita fricção." },
    sagitario: { love: 92, emotional: 85, comm: 90, summary: "Duas flechas apontadas para o infinito. Muita diversão e liberdade, mas cuidado para não faltar estabilidade." },
    capricornio: { love: 70, emotional: 75, comm: 80, summary: "Sagitário gasta e arrisca; Capricórnio poupa e previne. Otimismo versus realismo absoluto." },
    aquario: { love: 94, emotional: 84, comm: 96, summary: "Amigos ideais, parceiros de causas sociais. Valorizam a independência e odeiam o ciúme possessivo." },
    peixes: { love: 78, emotional: 88, comm: 80, summary: "Compartilham sonhos elevados (regidos por Júpiter). Mas Peixes pode se afogar na sinceridade sagitariana." }
  },
  capricornio: {
    aries: { love: 68, emotional: 75, comm: 70, summary: "Capricórnio quer planejar anos antes, Áries quer agir agora. Conflitos de andamento." },
    touro: { love: 98, emotional: 92, comm: 90, summary: "Aliança de sucesso absoluto. Valores idênticos sobre trabalho, responsabilidade e família." },
    gemeos: { love: 60, emotional: 68, comm: 72, summary: "Gêmeos é volátil e brincalhão; Capricórnio é sério e focado. Relação exige enorme paciência." },
    cancer: { love: 88, emotional: 90, comm: 82, summary: "Opostos magnéticos. O amor maduro e seguro. Capricórnio protege e Câncer nutre a alma." },
    leao: { love: 72, emotional: 75, comm: 78, summary: "Muito orgulho profissional. Capricórnio prefere discrição elegante; Leão quer holofotes e festa." },
    virgem: { love: 97, emotional: 92, comm: 95, summary: "Praticidade e metas concluídas com perfeição. Um casal que realiza tudo o que planeja junto." },
    libra: { love: 70, emotional: 72, comm: 78, summary: "Libra busca leveza romântica; Capricórnio foca nas obrigações práticas da vida. Distanciamento." },
    escorpiao: { love: 92, emotional: 90, comm: 88, summary: "Conexão silenciosa e poderosa. Lealdade indestrutível e compreensão das ambições do outro." },
    sagitario: { love: 70, emotional: 75, comm: 80, summary: "O pessimista prudente versus o otimista aventureiro. Difícil de alinhar expectativas." },
    capricornio: { love: 90, emotional: 88, comm: 85, summary: "Metas de carreira perfeitas, mas a relação pode esfriar se virar uma reunião de negócios permanente." },
    aquario: { love: 76, emotional: 70, comm: 84, summary: "Mentes estruturadas, mas Aquário questiona as tradições que Capricórnio tanto preza." },
    peixes: { love: 88, emotional: 92, comm: 80, summary: "Uma bela combinação. A doçura pisciana amolece a armadura de Capricórnio, que traz segurança a Peixes." }
  },
  aquario: {
    aries: { love: 85, emotional: 78, comm: 95, summary: "Ideias e aventuras dinâmicas. Relação livre, estimulante e com zero tédio." },
    touro: { love: 62, emotional: 65, comm: 78, summary: "Touro é possessivo e tradicional; Aquário é livre e vanguardista. Grande chance de faíscas." },
    gemeos: { love: 96, emotional: 82, comm: 98, summary: "Parceria intelectual excelente. Adoram novidades tecnológicas, conversar e manter a liberdade." },
    cancer: { love: 64, emotional: 70, comm: 75, summary: "Câncer pede carinho físico e presença; Aquário quer espaço e racionaliza o afeto. Desajuste emocional." },
    leao: { love: 88, emotional: 80, comm: 88, summary: "Atração magnética de opostos. O líder magnético (Leão) encontra o rebelde humanitário (Aquário)." },
    virgem: { love: 72, emotional: 68, comm: 85, summary: "Pouco romantismo, mas ótima colaboração racional e lógica. Bons para construir coisas juntos." },
    libra: { love: 95, emotional: 80, comm: 97, summary: "Grande sintonia social. Amam liberdade, debater ideias inovadoras e respeitam o espaço alheio." },
    escorpiao: { love: 68, emotional: 70, comm: 80, summary: "Escorpião busca profundidade total e ciúmes; Aquário quer ser livre e detesta drama. Colisão frontal." },
    sagitario: { love: 94, emotional: 84, comm: 96, summary: "Aventura intelectual constante. Adoram viajar, debater filosofias e vivem sem amarras." },
    capricornio: { love: 76, emotional: 70, comm: 84, summary: "Pés no chão versus olhar no futuro. Podem se respeitar intelectualmente, mas há pouco romance." },
    aquario: { love: 88, emotional: 78, comm: 95, summary: "Dois espíritos livres e excêntricos. Relação super original, mas precisam tomar cuidado com a frieza." },
    peixes: { love: 75, emotional: 85, comm: 80, summary: "Peixes é místico e ultra-emocional; Aquário é racional e focado no social. Necessitam de empatia." }
  },
  peixes: {
    aries: { love: 72, emotional: 90, comm: 68, summary: "Peixes é sensível e precisa de calma; Áries é impulsivo e ríspido. Funciona se Áries for gentil." },
    touro: { love: 88, emotional: 94, comm: 82, summary: "A união do sonho (Peixes) com a realidade estável (Touro). Muito afeto físico e romântico." },
    gemeos: { love: 70, emotional: 85, comm: 75, summary: "Gêmeos é lógico e disperso; Peixes é intuitivo e focado no sentir. Risco de incompreensão emocional." },
    cancer: { love: 98, emotional: 99, comm: 88, summary: "O topo do romantismo. Conexão espiritual e emocional profunda. Sensibilidade absoluta e mútua." },
    leao: { love: 74, emotional: 85, comm: 70, summary: "Leão pode ofuscar a quietude de Peixes. Mas se Leão agir com nobreza e proteção, o amor floresce." },
    virgem: { love: 88, emotional: 94, comm: 85, summary: "Opostos que se curam. Virgem organiza os sonhos piscianos; Peixes amacia a rigidez virginiana." },
    libra: { love: 82, emotional: 88, comm: 80, summary: "Relação pacífica, poética e artística. No entanto, ambos carecem de senso prático no dia a dia." },
    escorpiao: { love: 98, emotional: 99, comm: 90, summary: "Amor cármico. Intensidade total, romance e profundidade inabalável. Uma fusão emocional irresistível." },
    sagitario: { love: 78, emotional: 88, comm: 80, summary: "Júpiter une os dois nos sonhos ideológicos, mas a franqueza sagitariana pode magoar o pisciano." },
    capricornio: { love: 88, emotional: 92, comm: 80, summary: "A rocha e a água. Capricórnio dá a estabilidade que o sonhador Peixes precisa para não se perder." },
    aquario: { love: 75, emotional: 85, comm: 80, summary: "Aquário vive no intelecto e causas globais; Peixes vive na emoção interna. Conexão delicada." },
    peixes: { love: 90, emotional: 95, comm: 82, summary: "Doce, poético e místico. Compartilham o mesmo mundo interior idealizado, mas precisam de âncoras na realidade." }
  }
};

// High-fidelity Simulator Responses generator based on conversation context
function generateSimulatedAnalysis(text, settings) {
  const { tone, targetGoal, signs } = settings;
  
  // Basic text scanning for interest keywords
  const lowerText = (text || "").toLowerCase();
  
  let interestVal = 65;
  let reciprocityVal = 60;
  
  // Count words and analyze length
  const textLength = lowerText.length;
  
  // Keywords indicating interest
  const highInterestWords = ["te amo", "saudade", "lindo", "linda", "beijo", "querendo", "vamos nos ver", "quero te ver", "gosto de você", "perfeito", "amo"];
  const mediumInterestWords = ["haha", "kkk", "tudo bem", "e você", "verdade", "legal", "sim", "claro", "bom", "boa"];
  const lowInterestWords = ["sumido", "depois vejo", "corrido", "ocupado", "desculpa", "visto", "...", "não sei", "talvez"];
  
  let highHits = highInterestWords.filter(w => lowerText.includes(w)).length;
  let medHits = mediumInterestWords.filter(w => lowerText.includes(w)).length;
  let lowHits = lowInterestWords.filter(w => lowerText.includes(w)).length;

  interestVal += (highHits * 8) + (medHits * 2) - (lowHits * 5);
  reciprocityVal += (highHits * 6) + (medHits * 3) - (lowHits * 8);

  // Clamp values
  interestVal = Math.min(Math.max(interestVal, 30), 98);
  reciprocityVal = Math.min(Math.max(reciprocityVal, 25), 96);

  // Determine detected emotions based on keywords
  const emotions = [];
  if (highHits > 0 || lowerText.includes("beijo") || lowerText.includes("amo")) emotions.push("Carinho", "Atração");
  if (lowerText.includes("kkk") || lowerText.includes("haha") || lowerText.includes("rsrs")) emotions.push("Humor", "Descontraído");
  if (lowerText.includes("sumido") || lowerText.includes("visto") || lowerText.includes("corrido")) emotions.push("Ansiedade", "Ausência");
  if (emotions.length === 0) emotions.push("Neutro", "Formalidade");

  // Determine potential intentions
  let intention = "Aproximação romântica gradual.";
  if (lowerText.includes("vamos nos ver") || lowerText.includes("encontrar")) {
    intention = "Desejo claro de encontro físico e avanço da relação.";
  } else if (lowHits > highHits) {
    intention = "Manutenção de distância segura ou falta de prioridade no momento.";
  } else if (lowerText.includes("amigo") || lowerText.includes("amiga")) {
    intention = "Estabelecimento de limites de amizade (zona de amizade).";
  }

  // Generate response suggestions based on tone and text
  const responseCategories = {
    romantica: [
      "Que tal a gente continuar esse papo tomando um café essa semana?",
      "Gosto de como a conversa flui fácil com você. Já estou com saudades.",
      "Você sempre sabe o que dizer para me fazer sorrir, sabia?"
    ],
    engracada: [
      "Se nossa conversa fosse um filme, já teria ganhado o Oscar de melhor comédia dramática.",
      "Gostei do papo, mas estou aceitando suborno em forma de chocolate para responder mais rápido.",
      "Minha mãe disse que eu não deveria falar com estranhos, mas por você eu abro uma exceção!"
    ],
    misteriosa: [
      "Interessante... mas acho que tem coisas que são muito melhores se ditas pessoalmente.",
      "Você acha mesmo que me conhece tão fácil assim? Tenho algumas surpresas guardadas...",
      "Talvez eu te conte o segredo, mas vai ter que merecer primeiro."
    ],
    confiante: [
      "Eu sei que você estava esperando minha mensagem. O que vamos fazer hoje à noite?",
      "A melhor parte do meu dia é quando a gente conversa. E do seu também, né?",
      "Não vamos perder tempo enrolando: quando a gente vai se ver?"
    ],
    direta: [
      "Gostei muito de falar com você. Que tal irmos direto ao ponto e marcarmos algo?",
      "Vou ser sincero: quero muito te ver de novo. Qual o seu melhor dia?",
      "Chega de mensagens. Me diz quando você está livre para um encontro de verdade."
    ]
  };

  // Build simulated analysis object
  const userSign = signs?.user?.toLowerCase();
  const crushSign = signs?.crush?.toLowerCase();
  let zodiacAnalysis = null;
  
  if (userSign && crushSign && ZODIAC_COMPATIBILITY[userSign] && ZODIAC_COMPATIBILITY[userSign][crushSign]) {
    const zodiacData = ZODIAC_COMPATIBILITY[userSign][crushSign];
    zodiacAnalysis = {
      love: zodiacData.love,
      emotional: zodiacData.emotional,
      communication: zodiacData.comm,
      general: Math.round((zodiacData.love + zodiacData.emotional + zodiacData.comm) / 3),
      summary: zodiacData.summary,
      disclaimer: "Atenção: A análise de compatibilidade astral é baseada em arquétipos do zodíaco e possui caráter exclusivamente recreativo e de entretenimento."
    };
  }

  return {
    interestScore: interestVal,
    reciprocityScore: reciprocityVal,
    emotions: emotions,
    intentions: intention,
    positivePoints: [
      "Respostas rápidas e uso de risadas sinalizam conforto na conversa.",
      "Perguntas de retorno demonstram que a pessoa quer manter o diálogo ativo.",
      "Termos afetuosos sutis indicam abertura para intimidade."
    ],
    attentionPoints: [
      "Uso ocasional de respostas curtas em momentos chaves.",
      "Ausência de iniciativa direta para propor um encontro (pode indicar timidez ou indecisão)."
    ],
    evolutionProbability: interestVal > 75 ? "Muito Alta (85%+)" : (interestVal > 55 ? "Média-Alta (65%)" : "Moderada (45%)"),
    summary: `A conversa demonstra uma dinâmica de ${interestVal > 70 ? 'forte atração' : 'interesse morno'} e envolvimento. A outra pessoa responde ativamente, demonstrando um nível de reciprocidade saudável. O foco deve ser guiar a conversa das mensagens para o contato físico de forma natural e sem pressa, reforçando os pontos de conexão intelectual e de humor compartilhados.`,
    suggestions: [
      { category: "Romântica", text: responseCategories.romantica[Math.floor(Math.random() * 3)] },
      { category: "Engraçada", text: responseCategories.engracada[Math.floor(Math.random() * 3)] },
      { category: "Misteriosa", text: responseCategories.misteriosa[Math.floor(Math.random() * 3)] },
      { category: "Confiante", text: responseCategories.confiante[Math.floor(Math.random() * 3)] },
      { category: "Direta", text: responseCategories.direta[Math.floor(Math.random() * 3)] }
    ],
    insights: {
      toAvoid: "Evite pressionar por respostas imediatas ou mandar múltiplos blocos de mensagens quando a pessoa demorar a visualizar.",
      bestTime: "No início da noite (entre 19:30 e 21:30), quando o ritmo do dia diminui e há mais espaço para respostas descontraídas.",
      worthInsisting: interestVal > 50 ? "Sim, com certeza! O interesse é nítido e a conversa tem excelente fluidez." : "Sim, mas reduza um pouco o ritmo e deixe a outra pessoa tomar a iniciativa para testar a reciprocidade real.",
      evolutionChances: `${interestVal - 5}% de chances de evoluir para um encontro físico nos próximos 15 dias caso o canal de comunicação se mantenha aberto.`,
      recommendations: "Foque em histórias divertidas do seu dia em vez de perguntas burocráticas ('tudo bem', 'como foi o dia'). Crie ganchos de conversa abertos."
    },
    zodiacCompatibility: zodiacAnalysis
  };
}

// Call OpenAI API
async function callOpenAI(text, settings) {
  if (!process.env.OPENAI_API_KEY) {
    return generateSimulatedAnalysis(text, settings);
  }

  const { tone, targetGoal, signs } = settings;
  const userSign = signs?.user || "Não informado";
  const crushSign = signs?.crush || "Não informado";

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: "json_object" },
        messages: [
          {
            role: 'system',
            content: `Você é uma Inteligência Artificial especialista em relações humanas, psicologia comportamental e dinâmicas de paquera. Sua função é analisar um trecho ou print de conversa de chat e fornecer um relatório detalhado.
            Retorne obrigatoriamente um objeto JSON estruturado da seguinte forma:
            {
              "interestScore": (número de 0 a 100),
              "reciprocityScore": (número de 0 a 100),
              "emotions": ["emoção 1", "emoção 2"],
              "intentions": "Resumo das possíveis intenções da outra pessoa",
              "positivePoints": ["ponto positivo 1", "ponto positivo 2"],
              "attentionPoints": ["ponto de atenção 1", "ponto de atenção 2"],
              "evolutionProbability": "Alta / Média / Baixa com porcentagem",
              "summary": "Resumo detalhado sobre a dinâmica da conversa",
              "suggestions": [
                { "category": "Romântica", "text": "sugestão de resposta romântica" },
                { "category": "Engraçada", "text": "sugestão de resposta engraçada" },
                { "category": "Misteriosa", "text": "sugestão de resposta misteriosa" },
                { "category": "Confiante", "text": "sugestão de resposta confiante" },
                { "category": "Direta", "text": "sugestão de resposta direta" }
              ],
              "insights": {
                "toAvoid": "o que evitar dizer",
                "bestTime": "melhor momento para responder",
                "worthInsisting": "se vale a pena insistir",
                "evolutionChances": "chances de evolução da relação",
                "recommendations": "recomendações gerais para melhorar a conversa"
              }
            }`
          },
          {
            role: 'user',
            content: `Analise esta conversa. 
            Estilo/Tom desejado para as respostas: ${tone}. 
            Objetivo do usuário: ${targetGoal}.
            Signo do usuário: ${userSign}. 
            Signo do Crush: ${crushSign}.
            
            Conversa:
            """
            ${text}
            """`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    // Add Zodiac calculation on the backend to guarantee consistency
    const userSignLower = userSign.toLowerCase();
    const crushSignLower = crushSign.toLowerCase();
    if (ZODIAC_COMPATIBILITY[userSignLower] && ZODIAC_COMPATIBILITY[userSignLower][crushSignLower]) {
      const zodiacData = ZODIAC_COMPATIBILITY[userSignLower][crushSignLower];
      result.zodiacCompatibility = {
        love: zodiacData.love,
        emotional: zodiacData.emotional,
        communication: zodiacData.comm,
        general: Math.round((zodiacData.love + zodiacData.emotional + zodiacData.comm) / 3),
        summary: zodiacData.summary,
        disclaimer: "Atenção: A análise de compatibilidade astral é baseada em arquétipos do zodíaco e possui caráter exclusivamente recreativo e de entretenimento."
      };
    }
    
    return result;
  } catch (error) {
    console.error("Error communicating with OpenAI, falling back to simulator:", error);
    return generateSimulatedAnalysis(text, settings);
  }
}

// --- API ROUTES ---

// Local dev simulation endpoint to approve payment without signatures — only in non-production
app.post('/api/analyses/:id/simulate-payment', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: "Simulação de pagamento permitida apenas em ambiente de desenvolvimento." });
  }

  const { id } = req.params;
  const { gateway } = req.body;
  const db = readDb();
  const analysis = db.analyses.find(a => a.id === id);

  if (!analysis) {
    return res.status(404).json({ error: "Análise não encontrada." });
  }

  if (analysis.status === 'paid') {
    return res.json({ success: true, message: 'Análise já estava liberada.' });
  }

  analysis.status = 'paid';
  db.transactions.push({
    id: 'tx_sim_' + crypto.randomBytes(5).toString('hex'),
    analysisId: id,
    gateway: gateway || 'DevSimulation',
    amount: 19.90,
    orderId: 'sim_' + crypto.randomBytes(5).toString('hex'),
    createdAt: new Date().toISOString()
  });
  writeDb(db);

  res.json({ success: true, message: "Pagamento simulado com sucesso. Análise liberada." });
});

// OCR transcription endpoint — calls OpenAI GPT-4o-mini vision if available, otherwise simulates
app.post('/api/ocr', async (req, res) => {
  const { image } = req.body;
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: "A imagem é obrigatória." });
  }

  // Fallback simulated dialogues
  const simulatedConvs = [
    "Crush: Oi sumido, tudo bem? Vi sua foto e lembrei de você...\nEu: Oi! Tudo bem por aqui. Que bom que lembrou, andava ocupado. E você?\nCrush: Também! Temos que marcar alguma coisa qualquer dia desses, faz tempo que não nos vemos. O que acha?",
    "Eu: E aí, o que vai fazer hoje à noite?\nCrush: Hum, acho que nada ainda... Por quê?\nEu: Pensei em tomarmos um vinho. Topa?\nCrush: Hahaha você é bem direto né? Acho que topo sim, que horas?",
    "Crush: Oi, desculpa a demora para responder! Estava super corrido no trabalho.\nEu: Imagina, sem problemas. Conseguiu descansar um pouco?\nCrush: Sim! Mas o dia foi tenso. O que você anda aprontando de bom?",
    "Eu: Gostei muito de te ver no sábado.\nCrush: Eu também! Foi bem legal. Precisamos repetir mais vezes, de verdade.\nEu: Com certeza! Quando você tiver livre me avisa."
  ];

  if (!process.env.OPENAI_API_KEY) {
    const randomConv = simulatedConvs[Math.floor(Math.random() * simulatedConvs.length)];
    return res.json({ text: randomConv, simulated: true });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Você é um assistente de OCR especializado em conversas de chat. Transcreva todas as mensagens de texto presentes nesta imagem, organizando-as exatamente no seguinte formato:\nEu: <mensagem>\nCrush: <mensagem>\nou\n<Nome/Remetente>: <mensagem>\nRetorne APENAS a transcrição pura do chat, sem comentários, sem explicações e sem blocos de código markdown (como ```).'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API status ${response.statusText}`);
    }

    const data = await response.json();
    const transcribedText = data.choices[0].message.content.trim();
    res.json({ text: transcribedText, simulated: false });
  } catch (error) {
    console.error("OpenAI OCR failed, using simulation:", error);
    const randomConv = simulatedConvs[Math.floor(Math.random() * simulatedConvs.length)];
    res.json({ text: randomConv, simulated: true, error: error.message });
  }
});

// Create an analysis request (pending payment) — rate limited
app.post('/api/analyses', analysisLimiter, (req, res) => {
  const { text, settings } = req.body;
  if (!text || typeof text !== 'string' || text.trim().length < 10) {
    return res.status(400).json({ error: "O texto da conversa é obrigatório e deve ter pelo menos 10 caracteres." });
  }

  const cleanText = sanitizeText(text);
  const db = readDb();
  const analysisId = 'anl_' + crypto.randomBytes(6).toString('hex'); // cryptographically secure ID
  
  const safeSettings = {
    tone: typeof settings?.tone === 'string' ? settings.tone.substring(0, 50) : 'default',
    targetGoal: typeof settings?.targetGoal === 'string' ? settings.targetGoal.substring(0, 50) : 'default',
    signs: {
      user: typeof settings?.signs?.user === 'string' ? settings.signs.user.substring(0, 20) : '',
      crush: typeof settings?.signs?.crush === 'string' ? settings.signs.crush.substring(0, 20) : ''
    }
  };

  const fullAnalysisResult = generateSimulatedAnalysis(cleanText, safeSettings);
  
  const newAnalysis = {
    id: analysisId,
    text: cleanText,
    settings: safeSettings,
    status: 'pending',
    createdAt: new Date().toISOString(),
    result: fullAnalysisResult
  };

  db.analyses.push(newAnalysis);
  writeDb(db);

  res.json({
    id: analysisId,
    status: 'pending',
    price: 19.90
  });
});

// Retrieve an analysis by ID
app.get('/api/analyses/:id', async (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const analysis = db.analyses.find(a => a.id === id);

  if (!analysis) {
    return res.status(404).json({ error: "Análise não encontrada." });
  }

  if (analysis.status === 'pending') {
    return res.json({
      id: analysis.id,
      status: 'pending',
      price: 19.90,
      checkoutUrl: `http://localhost:5000/checkout/${analysis.id}`
    });
  }

  // If paid, return the full analysis result (and compute OpenAI if configured)
  // Check if we need to run real OpenAI API call on payment success
  if (process.env.OPENAI_API_KEY && !analysis.openAiExecuted) {
    try {
      const openAiResult = await callOpenAI(analysis.text, analysis.settings);
      analysis.result = openAiResult;
      analysis.openAiExecuted = true;
      writeDb(db);
    } catch (e) {
      console.error("OpenAI Execution on paid unlock failed, fallback exists.", e);
    }
  }

  res.json({
    id: analysis.id,
    status: 'paid',
    createdAt: analysis.createdAt,
    result: analysis.result
  });
});

// Webhook endpoint for Kiwify – validates HMAC-SHA256 signature
app.post('/api/webhooks/kiwify', (req, res) => {
  // Validate signature in production (skipped if KIWIFY_SECRET_TOKEN not set)
  if (KIWIFY_SECRET && !validateKiwifySignature(req)) {
    console.warn('[SECURITY] Kiwify webhook with invalid signature rejected.');
    return res.status(401).json({ error: 'Assinatura do webhook inválida.' });
  }

  const { order_status, custom_fields, order_id } = req.body;
  const analysisId = custom_fields?.analysis_id || req.body.external_reference;

  if (!analysisId || typeof analysisId !== 'string') {
    return res.status(400).json({ error: "ID da análise não fornecido no metadata/custom_fields." });
  }

  const db = readDb();
  const analysis = db.analyses.find(a => a.id === analysisId);

  if (!analysis) {
    return res.status(404).json({ error: "Análise correspondente não encontrada." });
  }

  // Prevent double-processing
  if (analysis.status === 'paid') {
    return res.json({ success: true, message: 'Análise já estava liberada.' });
  }

  if (order_status === 'paid' || order_status === 'approved') {
    analysis.status = 'paid';
    db.transactions.push({
      id: 'tx_' + crypto.randomBytes(5).toString('hex'),
      analysisId: analysisId,
      gateway: 'Kiwify',
      amount: 19.90,
      orderId: typeof order_id === 'string' ? order_id.substring(0, 100) : 'kiw_' + crypto.randomBytes(5).toString('hex'),
      createdAt: new Date().toISOString()
    });
    writeDb(db);
    return res.json({ success: true, message: "Análise liberada com sucesso." });
  }

  res.json({ success: false, message: `Status '${order_status}' não processa liberação.` });
});

// Webhook endpoint for Cakto – validates HMAC-SHA256 signature
app.post('/api/webhooks/cakto', (req, res) => {
  if (CAKTO_SECRET && !validateCaktoSignature(req)) {
    console.warn('[SECURITY] Cakto webhook with invalid signature rejected.');
    return res.status(401).json({ error: 'Assinatura do webhook inválida.' });
  }

  const { status, external_id, transaction_id } = req.body;

  if (!external_id || typeof external_id !== 'string') {
    return res.status(400).json({ error: "ID da análise não fornecido em external_id." });
  }

  const db = readDb();
  const analysis = db.analyses.find(a => a.id === external_id);

  if (!analysis) {
    return res.status(404).json({ error: "Análise correspondente não encontrada." });
  }

  // Prevent double-processing
  if (analysis.status === 'paid') {
    return res.json({ success: true, message: 'Análise já estava liberada.' });
  }

  if (status === 'paid' || status === 'approved' || status === 'completed') {
    analysis.status = 'paid';
    db.transactions.push({
      id: 'tx_' + crypto.randomBytes(5).toString('hex'),
      analysisId: external_id,
      gateway: 'Cakto',
      amount: 19.90,
      orderId: typeof transaction_id === 'string' ? transaction_id.substring(0, 100) : 'cak_' + crypto.randomBytes(5).toString('hex'),
      createdAt: new Date().toISOString()
    });
    writeDb(db);
    return res.json({ success: true, message: "Análise liberada com sucesso." });
  }

  res.json({ success: false, message: `Status '${status}' não processa liberação.` });
});

// Admin login endpoint – returns token (the password itself is used as bearer)
app.post('/api/admin/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Muitas tentativas de login.' } }), (req, res) => {
  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Senha obrigatória.' });
  }
  try {
    const passBuf = Buffer.from(password);
    const adminBuf = Buffer.from(ADMIN_PASSWORD);
    if (passBuf.length !== adminBuf.length || !crypto.timingSafeEqual(passBuf, adminBuf)) {
      return res.status(403).json({ error: 'Senha incorreta.' });
    }
  } catch {
    return res.status(403).json({ error: 'Senha incorreta.' });
  }
  res.json({ token: ADMIN_PASSWORD, message: 'Login de administrador realizado com sucesso.' });
});

// Get admin panel stats — PROTECTED by requireAdmin middleware
app.get('/api/admin/metrics', requireAdmin, (req, res) => {
  const db = readDb();
  
  const totalVisits = db.metrics?.visits || 0;
  const totalAnalyses = db.analyses.length;
  const paidAnalyses = db.analyses.filter(a => a.status === 'paid').length;
  const totalRevenue = db.transactions.reduce((acc, curr) => acc + curr.amount, 0);
  
  const conversionRate = totalAnalyses > 0 ? ((paidAnalyses / totalAnalyses) * 100).toFixed(1) : 0;

  res.json({
    visits: totalVisits,
    totalAnalyses: totalAnalyses,
    paidAnalyses: paidAnalyses,
    totalRevenue: totalRevenue,
    conversionRate: conversionRate,
    recentAnalyses: db.analyses.slice(-10).map(a => ({
      id: a.id,
      status: a.status,
      createdAt: a.createdAt,
      tone: a.settings?.tone,
      targetGoal: a.settings?.targetGoal,
      textPreview: a.text ? (a.text.length > 50 ? a.text.substr(0, 50) + '...' : a.text) : ''
    })),
    recentTransactions: db.transactions.slice(-10)
  });
});

// Serve frontend in production (dist folder)
const distPath = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API do Crush IA Premium rodando com sucesso. Inicie o servidor frontend em modo dev.');
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
