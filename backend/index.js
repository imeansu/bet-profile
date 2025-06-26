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

요구 응답 형식 (JSON 예시):

{
  "main_message": "✨잔잔한 도시형 감성✨",
  "one_liner": "감성 서초 하나로 사계절 우려먹는 남자",
  "character_summary": [
    "말수는 없는데 눈빛으로 소통하는 타입",
    "말은 없어도 노련한 많은 사람"
  ],
  "profile_traits": {
    "대표표정": "입꼬리 0.2mm 올라간 무표정",
    "대표의상": "남색 셔츠 / 어깨 각 살아있는 느낌",
    "사진톤": "따뜻한 색감 / 날씨 좋은 날 느낌",
    "찐친이 부르는 별명": "쏘울은 딥한 감정선에 있는 것 같음",
    "스타일 요약": "따뜻한데 거리감 있는 도회적 분위기"
  },
  "behavior_summary": [
    "책 읽다 말고 창밖 봄",
    "괜히 블루투스 이어폰 하나만 끼고 걷기",
    "블로그에 영화 감상 한 줄 쓰기"
  ],
  "ai_comment": "도시 속 감성주의자, 따뜻한데 거리를 두는 그 느낌... 분위기... 있어...",
  "recommended_action_buttons": [
    "결과 공유하기",
    "프사 추천받기",
    "이미지로 저장"
  ]
}

중요 가이드라인:
- main_message: 이모지와 함께 추구미를 대표하는 감성적 키워드 (예: "✨잔잔한 도시형 감성✨")
- one_liner: 유머러스하고 개성 있는 한 줄 캐릭터 소개 (지역명, 특징 활용)
- character_summary: 2~3개의 짧고 위트 있는 성격 묘사
- profile_traits: 표정, 의상, 사진톤, 별명, 스타일을 구체적이고 감성적으로 묘사
- behavior_summary: 해당 스타일을 가진 사람의 일상 습관 3가지 (감성적이고 구체적으로)
- ai_comment: 블로그 톤의 감성적 총평 (여운 있는 문체로)
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
          main_message: "✨은은한 감성이 담긴 스타일✨",
          one_liner: "조용한 매력으로 사계절을 버텨내는 사람",
          character_summary: [
            "말보다는 분위기로 소통하는 타입",
            "감성은 깊은데 표현은 조심스러운"
          ],
          profile_traits: {
            "대표표정": "살짝 미소 띤 자연스러운 표정",
            "대표의상": "편안하면서도 깔끔한 스타일링",
            "사진톤": "따뜻하고 부드러운 자연광 톤",
            "찐친이 부르는 별명": "은근 감성파",
            "스타일 요약": "조용한 매력 속에 깊은 감성이 숨어있는 스타일"
          },
          behavior_summary: [
            "카페에서 창가 자리 선점하고 책 읽기",
            "플레이리스트에 감성 발라드 숨겨놓기",
            "일기 대신 사진으로 일상 기록하기"
          ],
          ai_comment: "조용한 감성파... 말은 없어도 깊이가 있는 그런 사람... 매력적이야...",
          recommended_action_buttons: ["결과 공유하기", "프사 추천받기", "이미지로 저장"],
          raw: text
        };
      }
    } else {
      console.log('⚠️ Could not find JSON in response, creating fallback');
      analysis = {
        main_message: "✨은은한 감성이 담긴 스타일✨",
        one_liner: "조용한 매력으로 사계절을 버텨내는 사람",
        character_summary: [
          "말보다는 분위기로 소통하는 타입",
          "감성은 깊은데 표현은 조심스러운"
        ],
        profile_traits: {
          "대표표정": "살짝 미소 띤 자연스러운 표정",
          "대표의상": "편안하면서도 깔끔한 스타일링",
          "사진톤": "따뜻하고 부드러운 자연광 톤",
          "찐친이 부르는 별명": "은근 감성파",
          "스타일 요약": "조용한 매력 속에 깊은 감성이 숨어있는 스타일"
        },
        behavior_summary: [
          "카페에서 창가 자리 선점하고 책 읽기",
          "플레이리스트에 감성 발라드 숨겨놓기",
          "일기 대신 사진으로 일상 기록하기"
        ],
        ai_comment: "조용한 감성파... 말은 없어도 깊이가 있는 그런 사람... 매력적이야...",
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

// Analyze profile image endpoint (OpenAI Vision) - single image + aspiration analysis
app.post('/analyze-profile', upload.single('profileImage'), async (req, res) => {
  try {
    console.log('🔍 Starting profile analysis...');
    console.log('OpenAI client initialized:', !!openai);
    console.log('Profile image received:', !!req.file);
    console.log('Aspiration analysis data:', req.body.aspirationAnalysis ? 'received' : 'missing');
    
    if (!req.file) {
      return res.status(400).json({ error: '프로필 사진을 업로드해주세요.' });
    }

    if (!req.body.aspirationAnalysis) {
      return res.status(400).json({ error: '추구미 분석 결과가 필요합니다.' });
    }

    // Parse aspiration analysis data
    let aspirationData;
    try {
      aspirationData = typeof req.body.aspirationAnalysis === 'string' 
        ? JSON.parse(req.body.aspirationAnalysis) 
        : req.body.aspirationAnalysis;
    } catch (parseError) {
      console.error('Failed to parse aspiration analysis data:', parseError);
      return res.status(400).json({ error: '추구미 분석 데이터가 올바르지 않습니다.' });
    }

    // Convert profile image to base64
    const base64Image = req.file.buffer.toString('base64');
    const imageDataUrl = `data:${req.file.mimetype};base64,${base64Image}`;
    console.log(`Profile image converted to base64, size: ${base64Image.length}`);

    // Create chugumi summary for prompt
    const chugumiSummary = `${aspirationData.main_message || ''} - ${aspirationData.one_liner || ''} (${aspirationData.ai_comment || ''})`;

    // Prepare the content array with text prompt first, then image
    const messageContent = [
      { 
        type: 'text', 
        text: `당신은 사용자가 업로드한 프사 후보 이미지와 그 사람의 추구미 프로필을 기반으로, 현재 프로필이 추구미와 얼마나 어울리는지 분석하고, 감성적으로 요약한 진단 리포트를 생성하는 AI입니다.

입력:
- 사용자가 업로드한 이미지 1장 (프로필 사진 후보)
- 해당 사용자의 추구미 요약 정보: "${chugumiSummary}"

당신은 이 두 정보를 바탕으로 사용자의 현재 프로필 사진을 분석하고, 다음과 같은 JSON 구조로 출력해야 합니다.

요구 응답 형식 (JSON 예시):

{
  "distance_to_chugumi": 12,
  "distance_evaluation": "거의 다 왔어요! 추구미역 2번 출구 근처까지 도착했네요 ✨",
  "ai_comment": "너는 이미 추구미에 도착했을지도 몰라. 조명만 살짝, 그 감정을 더 보여줘보는 건 어때?",
  "chugumi_summary": "조용한 온기를 가진 도시형 감성 - 햇살과 나뭇잎이 있는 오후, 말을 아끼는 감각형 인간",
  "current_profile_analysis": "어두운 조명 속 포인트 조명으로 차분하고 몽환적인 무드를 연출. 딥한 색깔의 의상으로 정제되고 차분함을 표현. 자연스러운 미소로 꾸안꾸한 편안함이 돋보임. 초록식물과 톤온톤 배경으로 비현실적인 감성 완성.",
  "profile_vs_chugumi": "지금 프사는 '잔잔한 자기감각'이라는 추구미와 거의 가까워",
  "detailed_interpretation": [
    "톤이 조명이 무겁지 않고, 표정도 부드럽게 살아 있어 딱딱하지 않은 인상이야",
    "다만 문항설의 설계가 부조화되면서 '햇살+일자셔츠+랩'의 내추럴함보다는 '조금 더 연출된 미감' 쪽에 가까움",
    "요약하지면 ~~~~~~ 아"
  ],
  "comprehensive_evaluation": {
    "chugumi_achievement": "근접 (12m, 거의 다 왔어요!)",
    "mood_compatibility": "높은 편 (부드럽고 따뜻한 무드)",
    "adjustment_tip": "자연광 + 베이지톤으로 배경 보정하면 완벽. 옷기 분포도 편안한 무표정이 잘 어울려요"
  },
  "detailed_feedback": [
    "조명이 무겁지 않고, 표정도 부드럽게 살아 있어 딱딱하지 않은 인상이야",
    "다만 감성의 설계가 약간 부조화되면서 '햇살+일자셔츠' 내추럴함보다는 '조금 더 연출된 미감' 쪽에 가까움",
    "자연광 + 베이지톤으로 배경 보정하면 완벽할 것 같아. 편안한 무표정이 잘 어울려요"
  ],
  "recommended_backgrounds": [
    "노을진 자연광 + 얕은 안개가 깔린 숲 풍경",
    "따뜻한 오렌지 계열 수채화 느낌의 풍경",
    "햇살이 스며드는 카페 창가",
    "부드러운 베이지톤 미니멀 배경"
  ],
  "action_buttons": [
    {
      "text": "다른 사진으로 재시도",
      "action": "retry",
      "style": "secondary"
    },
    {
      "text": "결과 공유하기",
      "action": "share",
      "style": "primary"
    }
  ]
}

중요 가이드라인:
- distance_to_chugumi: 0~50 사이 숫자 (숫자가 낮을수록 추구미와 가까움)
- distance_evaluation: 거리에 맞는 감성적 평가 문구 (예: "추구미역 2번 출구 근처", "거의 도착!")
- ai_comment: 따뜻하고 위트 있는 한 마디 (사용자에게 격려와 재미를 주는 톤)
- profile_vs_chugumi: 현재 프사와 추구미 사이의 관계를 한 문장으로 요약
- detailed_interpretation: 감성적 해석 3~4개 (캐주얼하고 친근한 톤으로)
- comprehensive_evaluation: 추구미 도달도, 분위기 일치도, 조정 팁을 객관적으로 평가
- 조명, 의상톤, 표정, 배경연출 등 모든 시각 요소를 종합 분석
- 모든 텍스트는 한국어, 캐주얼하고 감성적인 톤
- 사용자에게 공감과 격려를 주는 따뜻한 문체 사용
- 반드시 JSON 형식으로만 응답할 것

분석해주세요!`
      },
      { type: 'image_url', image_url: { url: imageDataUrl } }
    ];

    console.log('📡 Calling OpenAI Vision API for profile analysis...');
    // Call OpenAI Vision
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ],
      max_tokens: 1500,
    });

    console.log('✅ OpenAI API call successful for profile analysis!');
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
        console.log('✅ JSON parsing successful!');
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError);
        console.error('Raw text:', text);
        
        // Fallback with basic structure
        analysis = {
          distance_to_chugumi: 25,
          distance_evaluation: "꽤 가까워요! 추구미역 3번 출구쯤에 도착했네요 😊",
          ai_comment: "현재 프사도 충분히 매력적이야! 조금만 더 다듬으면 완벽할 것 같아",
          chugumi_summary: chugumiSummary || "독특한 개성을 가진 감성적인 스타일",
          current_profile_analysis: "자연스러운 조명과 편안한 표정으로 친근한 인상을 주는 프로필 사진. 전체적으로 부드럽고 따뜻한 무드가 느껴져요.",
          profile_vs_chugumi: "지금 프사는 '잔잔한 자기감각'이라는 추구미와 거의 가까워",
          detailed_interpretation: [
            "톤이 조명이 무겁지 않고, 표정도 부드럽게 살아 있어 딱딱하지 않은 인상이야",
            "다만 문항설의 설계가 부조화되면서 '햇살+일자셔츠+랩'의 내추럴함보다는 '조금 더 연출된 미감' 쪽에 가까움",
            "요약하지면 ~~~~~~ 아"
          ],
          comprehensive_evaluation: {
            "chugumi_achievement": "근접 (12m, 거의 다 왔어요!)",
            "mood_compatibility": "높은 편 (부드럽고 따뜻한 무드)",
            "adjustment_tip": "자연광 + 베이지톤으로 배경 보정하면 완벽. 옷기 분포도 편안한 무표정이 잘 어울려요"
          },
          detailed_feedback: [
            "조명이 무겁지 않고, 표정도 부드럽게 살아 있어 딱딱하지 않은 인상이야",
            "다만 감성의 설계가 약간 부조화되면서 '햇살+일자셔츠' 내추럴함보다는 '조금 더 연출된 미감' 쪽에 가까움",
            "자연광 + 베이지톤으로 배경 보정하면 완벽할 것 같아. 편안한 무표정이 잘 어울려요"
          ],
          recommended_backgrounds: [
            "노을진 자연광 + 얕은 안개가 깔린 숲 풍경",
            "따뜻한 오렌지 계열 수채화 느낌의 풍경",
            "햇살이 스며드는 카페 창가",
            "부드러운 베이지톤 미니멀 배경"
          ],
          action_buttons: [
            {
              "text": "다른 사진으로 재시도",
              "action": "retry",
              "style": "secondary"
            },
            {
              "text": "결과 공유하기",
              "action": "share", 
              "style": "primary"
            }
          ]
        };
      }
    } else {
      console.error('❌ No JSON found in response');
      // Return fallback response
      analysis = {
        distance_to_chugumi: 35,
        distance_evaluation: "아직 조금 멀어요! 하지만 충분히 갈 수 있어요 💪",
        ai_comment: "지금도 멋진 프사야! 조금만 더 신경 써보면 추구미에 딱 맞을 것 같아",
        chugumi_summary: chugumiSummary || "나만의 독특한 감성을 추구하는 스타일",
        current_profile_analysis: "개성 있는 매력이 느껴지는 프로필 사진. 나름의 스타일이 있지만 추구미와 더 가까워질 여지가 있어요.",
        profile_vs_chugumi: "지금 프사는 '잔잔한 자기감각'이라는 추구미와 거의 가까워",
        detailed_interpretation: [
          "톤이 조명이 무겁지 않고, 표정도 부드럽게 살아 있어 딱딱하지 않은 인상이야",
          "다만 문항설의 설계가 부조화되면서 '햇살+일자셔츠+랩'의 내추럴함보다는 '조금 더 연출된 미감' 쪽에 가까움",
          "요약하지면 ~~~~~~ 아"
        ],
        comprehensive_evaluation: {
          "chugumi_achievement": "근접 (12m, 거의 다 왔어요!)",
          "mood_compatibility": "높은 편 (부드럽고 따뜻한 무드)",
          "adjustment_tip": "자연광 + 베이지톤으로 배경 보정하면 완벽. 옷기 분포도 편안한 무표정이 잘 어울려요"
        },
        detailed_feedback: [
          "조명이 무겁지 않고, 표정도 부드럽게 살아 있어 딱딱하지 않은 인상이야",
          "다만 감성의 설계가 약간 부조화되면서 '햇살+일자셔츠' 내추럴함보다는 '조금 더 연출된 미감' 쪽에 가까움",
          "자연광 + 베이지톤으로 배경 보정하면 완벽할 것 같아. 편안한 무표정이 잘 어울려요"
        ],
        recommended_backgrounds: [
          "노을진 자연광 + 얕은 안개가 깔린 숲 풍경",
          "따뜻한 오렌지 계열 수채화 느낌의 풍경",
          "햇살이 스며드는 카페 창가",
          "부드러운 베이지톤 미니멀 배경"
        ],
        action_buttons: [
          {
            "text": "다른 사진으로 재시도",
            "action": "retry",
            "style": "secondary"
          },
          {
            "text": "결과 공유하기",
            "action": "share", 
            "style": "primary"
          }
        ]
      };
    }

    console.log('📤 Sending profile analysis response...');
    res.json(analysis);

  } catch (error) {
    console.error('❌ Profile analysis error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: '프로필 분석 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// AI-powered profile analysis endpoint
app.post('/analyze-profile-old', upload.fields([
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