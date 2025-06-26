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

// Analyze aspiration images endpoint (OpenAI Vision) - supports 1-3 images
app.post('/analyze-aspiration', upload.array('images', 3), async (req, res) => {
  try {
    console.log('🔍 Starting aspiration analysis...');
    console.log('OpenAI client initialized:', !!openai);
    console.log('OpenAI API key available:', !!openaiApiKey);
    console.log('Number of images received:', req.files?.length || 0);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '이미지를 업로드해주세요.' });
    }

    if (req.files.length > 3) {
      return res.status(400).json({ error: '최대 3장까지 업로드 가능합니다.' });
    }

    // Convert all images to base64
    const imageContents = req.files.map(file => {
      const base64Image = file.buffer.toString('base64');
      const imageDataUrl = `data:${file.mimetype};base64,${base64Image}`;
      console.log(`Image converted to base64, size: ${base64Image.length}`);
      return { type: 'image_url', image_url: { url: imageDataUrl } };
    });

    // Prepare the content array with text prompt first, then images
    const messageContent = [
      { 
        type: 'text', 
        text: `당신은 사용자의 사진 1~3장을 분석하여, 해당 사용자의 현재 이미지 스타일과 성향을 바탕으로 "추구미 프로필"을 생성해주는 AI입니다.

사용자는 별도의 텍스트를 입력하지 않고, 본인의 사진(프사 후보 또는 평소 좋아하는 이미지)을 1~3장 업로드합니다. 당신은 이 이미지들만을 바탕으로 다음과 같은 정보를 구성해야 합니다.

요구 응답 형식 (JSON):

{
  "main_message": string,  // 추구미를 대표하는 한 줄 감성 요약 (예: "✨잔잔한 도시형 감성✨")
  "one_liner": string,  // 사용자 스타일을 대표하는 유머러스한 한 줄 소개 (예: "감성 서초 하나로 사계절 우려먹는 남자")
  "character_summary": [string],  // 해당 스타일을 표현하는 멘트 2~3개
  "profile_traits": {
    "대표표정": string,         // 이미지에서 추출된 인상/표정 특징
    "대표의상": string,         // 의상 톤, 스타일 요약
    "사진톤": string,           // 전체 이미지의 색감/무드
    "찐친이 부르는 별명": string,  // 친구들이 붙일 법한 농담 섞인 별명
    "스타일 요약": string       // 전반적 인상 요약 (예: "따뜻한데 거리감 있는 도회적 분위기")
  },
  "behavior_summary": [string],  // 해당 스타일을 가진 사람이 할 법한 일상 습관
  "ai_comment": string,  // 스타일을 감성적으로 요약한 블로그형 멘트 (예: "도시 속 감성주의자, 따뜻한데 거리를 두는 그 느낌... 분위기... 있어...")
  "recommended_action_buttons": [string]  // 프론트에서 사용할 버튼 텍스트 (예: ["결과 공유하기", "프사 추천받기", "이미지로 저장"])  
}

조건:
- 반드시 JSON 형식으로만 응답할 것
- 이미지 속 인물/배경/구도/색감/무드 등 모든 시각 요소를 종합 분석해 스타일을 추론
- 문체는 캐주얼하며 사용자에게 공감과 재미를 줄 수 있어야 함
- 한국어로 출력 (문법적으로 자연스럽고 부드럽게)
- 예측에 자신 없는 경우에도 적절한 감성적 문구로 포장해줄 것

입력으로는 이미지 1~3장이 제공됩니다. 각 이미지를 분석하여 공통된 인상과 스타일을 잡아내고 위 JSON 구조에 맞춰 응답해주세요.` 
      },
      ...imageContents
    ];

    console.log('📡 Calling OpenAI Vision API with', req.files.length, 'images...');
    // Call OpenAI Vision
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ],
      max_tokens: 1000,
    });

    console.log('✅ OpenAI API call successful!');
    console.log('Response received, choices:', completion.choices.length);

    // Parse the response
    const text = completion.choices[0].message.content;
    console.log('Raw OpenAI response:', text);
    
    // Try to extract JSON from the response
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    let analysis = {};
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      try {
        analysis = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
        console.log('✅ JSON parsed successfully');
        
        // Validate the required fields
        if (!analysis.main_message || !analysis.profile_traits) {
          throw new Error('Invalid JSON structure');
        }
      } catch (parseError) {
        console.log('⚠️ JSON parsing failed, creating fallback response');
        analysis = {
          main_message: "✨독특한 개성이 담긴 감성✨",
          one_liner: "나만의 스타일로 살아가는 사람",
          character_summary: ["감성적이면서도 개성 있는", "자연스러운 매력을 가진"],
          profile_traits: {
            "대표표정": "자연스럽고 편안한 표정",
            "대표의상": "개성 있는 스타일링",
            "사진톤": "따뜻하고 감성적인 톤",
            "찐친이 부르는 별명": "감성러",
            "스타일 요약": "자연스러우면서도 개성 있는 매력"
          },
          behavior_summary: ["카페에서 창가 자리를 선호한다", "감성적인 음악을 즐겨 듣는다"],
          ai_comment: "자연스러운 매력이 돋보이는 스타일... 편안하면서도 개성이 있어...",
          recommended_action_buttons: ["결과 공유하기", "프사 추천받기", "이미지로 저장"],
          raw: text
        };
      }
    } else {
      console.log('⚠️ Could not find JSON in response, creating fallback');
      analysis = {
        main_message: "✨독특한 개성이 담긴 감성✨",
        one_liner: "나만의 스타일로 살아가는 사람",
        character_summary: ["감성적이면서도 개성 있는", "자연스러운 매력을 가진"],
        profile_traits: {
          "대표표정": "자연스럽고 편안한 표정",
          "대표의상": "개성 있는 스타일링",
          "사진톤": "따뜻하고 감성적인 톤",
          "찐친이 부르는 별명": "감성러",
          "스타일 요약": "자연스러우면서도 개성 있는 매력"
        },
        behavior_summary: ["카페에서 창가 자리를 선호한다", "감성적인 음악을 즐겨 듣는다"],
        ai_comment: "자연스러운 매력이 돋보이는 스타일... 편안하면서도 개성이 있어...",
        recommended_action_buttons: ["결과 공유하기", "프사 추천받기", "이미지로 저장"],
        raw: text
      };
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