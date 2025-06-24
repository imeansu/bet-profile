require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { OpenAI } = require('openai');
const fetch = require('node-fetch');
const { initializeApiKeys } = require('./secrets');

// Global variables for API keys
let openaiApiKey = null;
let bflApiKey = null;
let openai = null;

const app = express();
const PORT = 4000;

// Initialize API keys on startup
async function initializeApp() {
  try {
    const apiKeys = await initializeApiKeys();
    openaiApiKey = apiKeys.openaiApiKey;
    bflApiKey = apiKeys.bflApiKey;
    
    console.log('API keys loaded:');
    console.log('- OpenAI API Key length:', openaiApiKey ? openaiApiKey.length : 0);
    console.log('- BFL API Key length:', bflApiKey ? bflApiKey.length : 0);
    console.log('- OpenAI API Key starts with:', openaiApiKey ? openaiApiKey.substring(0, 7) + '...' : 'undefined');
    
    // Initialize OpenAI client
    openai = new OpenAI({ apiKey: openaiApiKey });
    
    // Test OpenAI connection
    console.log('Testing OpenAI connection...');
    try {
      const testResponse = await openai.models.list();
      console.log('✅ OpenAI connection successful! Available models:', testResponse.data.length);
    } catch (testError) {
      console.error('❌ OpenAI connection test failed:', testError.message);
      console.error('Error details:', testError);
    }
    
    console.log('API keys initialized successfully');
  } catch (error) {
    console.error('Failed to initialize API keys:', error);
    process.exit(1);
  }
}

// Enable CORS for all origins (for development)
app.use(cors());

// Set up Multer for file uploads (in-memory for MVP)
const upload = multer({ storage: multer.memoryStorage() });

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Analyze aspiration image endpoint (OpenAI Vision)
app.post('/analyze-aspiration', upload.single('image'), async (req, res) => {
  try {
    console.log('🔍 Starting aspiration analysis...');
    console.log('OpenAI client initialized:', !!openai);
    console.log('OpenAI API key available:', !!openaiApiKey);
    
    // Convert image buffer to base64
    const base64Image = req.file.buffer.toString('base64');
    const imageDataUrl = `data:${req.file.mimetype};base64,${base64Image}`;
    console.log('Image converted to base64, size:', base64Image.length);

    console.log('📡 Calling OpenAI Vision API...');
    // Call OpenAI Vision
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `이 이미지를 아래 JSON 포맷에 맞춰 추구미를 분석해줘. 반드시 JSON만 반환해줘.

{
  "keywords": [ "키워드1", "키워드2", ... ],
  "style": "스타일 설명",
  "impression": "인상 설명",
  "keyFeatures": [ "핵심 포인트1", "핵심 포인트2", ... ]
}
` },
            { type: 'image_url', image_url: { url: imageDataUrl } }
          ]
        }
      ],
      max_tokens: 500,
    });

    console.log('✅ OpenAI API call successful!');
    console.log('Response received, choices:', completion.choices.length);

    // Parse the response (you may need to adjust this based on OpenAI's output)
    const text = completion.choices[0].message.content;
    console.log('Raw OpenAI response:', text);
    
    // Try to extract JSON from the response
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    let analysis = {};
    if (jsonStart !== -1 && jsonEnd !== -1) {
      analysis = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
      console.log('✅ JSON parsed successfully');
    } else {
      analysis = {
        keywords: [],
        style: '',
        impression: '',
        keyFeatures: [],
        raw: text
      };
      console.log('⚠️ Could not parse JSON, using raw response');
    }

    res.json(analysis);
  } catch (err) {
    console.error('❌ Error in analyze-aspiration:', err);
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    
    // Provide more specific error messages
    let errorMessage = 'AI 분석 실패';
    if (err.name === 'OpenAIError') {
      if (err.message.includes('401')) {
        errorMessage = 'OpenAI API 키가 유효하지 않습니다';
      } else if (err.message.includes('429')) {
        errorMessage = 'OpenAI API 요청 한도를 초과했습니다';
      } else if (err.message.includes('500')) {
        errorMessage = 'OpenAI 서버 오류가 발생했습니다';
      }
    }
    
    res.status(500).json({ 
      error: errorMessage, 
      details: err.message,
      type: err.name 
    });
  }
});

// AI-powered profile analysis endpoint
app.post('/analyze-profile', upload.fields([
  { name: 'aspiration', maxCount: 1 },
  { name: 'profiles', maxCount: 3 }
]), async (req, res) => {
  try {
    console.log('req.files:', req.files);
    console.log('req.files keys:', Object.keys(req.files));
    if (req.files['profiles']) {
      req.files['profiles'].forEach((f, i) => {
        console.log(`profiles[${i}]: name=${f.originalname}, size=${f.size}`);
      });
    }
    if (req.files['aspiration']) {
      req.files['aspiration'].forEach((f, i) => {
        console.log(`aspiration[${i}]: name=${f.originalname}, size=${f.size}`);
      });
    }
    const aspirationFile = req.files['aspiration']?.[0];
    const profileFiles = req.files['profiles'] || [];
    console.log('Received aspiration file:', !!aspirationFile);
    console.log('Received profile files:', profileFiles.length);
    if (!aspirationFile || profileFiles.length === 0) {
      return res.status(400).json({ error: 'aspiration image and at least one profile image are required' });
    }

    // Convert aspiration image to base64 data URL
    const aspirationBase64 = aspirationFile.buffer.toString('base64');
    const aspirationDataUrl = `data:${aspirationFile.mimetype};base64,${aspirationBase64}`;

    // Analyze each profile image
    const results = [];
    for (const profileFile of profileFiles) {
      const profileBase64 = profileFile.buffer.toString('base64');
      const profileDataUrl = `data:${profileFile.mimetype};base64,${profileBase64}`;

      // Improved prompt and message structure for OpenAI
      const prompt = `아래 두 이미지를 비교해줘.\n첫 번째 이미지는 '추구미(aspiration)'이고, 두 번째 이미지는 '프로필(profile)'이야.\n프로필이 추구미와 얼마나 비슷한지, 스타일, 인상, 개선점 등을 아래 JSON 포맷으로 평가해줘. 반드시 JSON만 반환해줘.\n\n{\n  "similarityScore": 0-10,\n  "feedback": "피드백",\n  "improvement": "개선점"\n}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: "첫 번째 이미지는 '추구미(aspiration)'입니다." },
              { type: 'image_url', image_url: { url: aspirationDataUrl } },
              { type: 'text', text: "두 번째 이미지는 '프로필(profile)'입니다." },
              { type: 'image_url', image_url: { url: profileDataUrl } },
              { type: 'text', text: "이 두 이미지를 위 설명대로 비교해줘. 반드시 JSON만 반환해줘.\n\n{\n  \"similarityScore\": 0-10,\n  \"feedback\": \"피드백\",\n  \"improvement\": \"개선점\"\n}" }
            ]
          }
        ],
        max_tokens: 500,
      });

      const text = completion.choices[0].message.content;
      console.log('OpenAI response:', text);
      // Try to extract JSON from the response
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      let analysis = {};
      if (jsonStart !== -1 && jsonEnd !== -1) {
        analysis = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
      } else {
        analysis = { raw: text };
      }
      results.push(analysis);
    }

    res.json({ results });
  } catch (err) {
    console.error('Error in /analyze-profile:', err);
    res.status(500).json({ error: '프로필 AI 분석 실패', details: err.message });
  }
});

// Helper function to translate Korean to English using OpenAI
async function translateToEnglish(text, openai) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'Translate the following Korean text to natural and extract only improvement for second picture, concise English for an image editing AI prompt. Only return the English translation.' },
      { role: 'user', content: text }
    ],
    max_tokens: 100,
  });
  return completion.choices[0].message.content.trim();
}

// AI image editing endpoint
app.post('/edit-image', upload.single('image'), async (req, res) => {
  try {
    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Extract improvement for the second profile image from the request
    let improvementKorean = 'improvement: 개선점';
    try {
      // Try to parse JSON from req.body.improvements (should be a JSON stringified array)
      if (req.body.improvements) {
        const improvements = JSON.parse(req.body.improvements);
        if (Array.isArray(improvements) && improvements[1]) {
          improvementKorean = improvements[1];
        }
      } else if (req.body.prompt) {
        improvementKorean = req.body.prompt;
      }
    } catch (e) {
      // fallback to default
    }
    console.log('Improvement (Korean):', improvementKorean);

    // Translate to English
    const improvementEnglish = await translateToEnglish(improvementKorean, openai);
    console.log('Improvement (English):', improvementEnglish);

    // Convert image buffer to base64
    const base64Image = req.file.buffer.toString('base64');
    console.log('BFL prompt:', improvementEnglish);
    console.log('Base64 image length:', base64Image.length);

    // Step 1: Create the edit request
    const createRes = await fetch('https://api.bfl.ai/v1/flux-kontext-pro', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'x-key': bflApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: improvementEnglish,
        input_image: base64Image
      })
    });

    const createData = await createRes.json();
    console.log('BFL create response:', createData);
    if (!createData.polling_url) {
      throw new Error('Failed to create image edit request: ' + JSON.stringify(createData));
    }

    // Step 2: Poll for result
    let resultUrl = null;
    for (let i = 0; i < 20; i++) { // Poll up to 10 seconds
      await new Promise(r => setTimeout(r, 500));
      const pollRes = await fetch(createData.polling_url, {
        headers: {
          'accept': 'application/json',
          'x-key': bflApiKey
        }
      });
      const pollData = await pollRes.json();
      console.log('BFL poll response:', pollData);
      if (pollData.status === 'Ready') {
        resultUrl = pollData.result.sample;
        break;
      } else if (pollData.status === 'Error' || pollData.status === 'Failed') {
        throw new Error('Image editing failed: ' + JSON.stringify(pollData));
      }
    }

    if (!resultUrl) {
      throw new Error('Timed out waiting for image edit result');
    }

    res.json({ editedImageUrl: resultUrl });
  } catch (err) {
    console.error('Error in /edit-image:', err);
    res.status(500).json({ error: 'AI 이미지 편집 실패', details: err.message });
  }
});

// Serve static files from the Next.js export
app.use(express.static(path.join(__dirname, '../frontend/out')));

// Catch-all: serve index.html for any non-API and non-analyze- route
app.get(/^\/(?!api|analyze-).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/out/index.html'));
});

// Initialize app and start server
initializeApp().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 