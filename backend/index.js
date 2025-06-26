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

---
<참고 예시 #1>
main_message: 감성 셔츠 하나로 사계절 우려먹는 남자 👔  
profile_traits:
  - 이름: 감정 없는 척하는 감성 장인 🧊✨
  - 얼굴: 😐 입꼬리만 0.2mm 올라간 무표정
  - 의상: 남색 셔츠 / 어깨 각 살아있는 느낌
  - 별명: “조용한 줄 알았는데 은근 웃긴 놈”
  - 스타일: 무채색 옷, 무표정, 카메라는 안 쳐다봄  
character_summary:
- 감성 셔츠 하나로 사계절 우려먹는 남자  
- 말수는 없는데 눈빛으로 소통하는 타입  
- 말은 없어도 눈빛은 많은 사람  
behavior_summary:
"책 읽다 말고 창밖 봄", "괜히 블루투스 이어폰 하나만 끼고 걷기", "블로그에 영화 감상 한 줄 쓰기"  
ai_comment:
"도시 속 감성주의자, 따뜻한데 거리를 두는 그 느낌... 분위기... 있어..."

<참고 예시 #2>
main_message: 조용히 웃기고 싶은 사람 😂  
profile_traits:
  - 이름: 무표정 개그 고수  
  - 얼굴: 입꼬리 안 올라감, 눈썹 살짝 찡그림 🤨  
  - 의상: 스트라이프 셔츠 or 맨투맨  
  - 별명: “웃기려고 한 거 아님”  
  - 스타일: 정제된 듯, 허당 끼 있음  
character_summary:
- 분위기는 진지한데 말은 웃김  
- 일부러 안 웃긴 게 포인트  
behavior_summary:
“아 그건 좀…” 한마디에 폭소 유발, 무표정으로 밈 드립 침  
ai_comment:
무표정에 개그 코드 숨어있음. 웃기면 진심 인정받음.

<참고 예시 #3>
main_message: 해 뜨면 기분 좋아지는 식물형 인간 🌱  
profile_traits:
  - 이름: 빛 받으면 광합성 함  
  - 얼굴: 눈웃음 + 볼살 가득 😄  
  - 의상: 라이트톤 셔츠 + 청바지  
  - 별명: “햇살 사람 버전”  
  - 스타일: 밝고 단정한, 미니멀 감성  
character_summary:
- 날씨 좋으면 텐션도 높아짐  
- 행복해 보이는 게 직업임  
behavior_summary:
햇살 맞으며 콧노래 흥얼, 카페에서 창가 자리 선호  
ai_comment:
진짜 식물 아니냐는 말 들어봄. 빛 받으면 광이 남.

<참고 예시 #4>
main_message: 사람 많은 곳에서 조용히 반짝이는 사람 ✨  
profile_traits:
  - 이름: 내향적 셀럽감  
  - 얼굴: 눈동자에 은은한 광채 ✨  
  - 의상: 심플한 톤 + 고급소재 느낌  
  - 별명: “조용한 아우라 깡패”  
  - 스타일: 무채색 미니멀리스트  
character_summary:
- 말수 적지만 존재감 뚜렷  
- 자리에 가만히 있어도 주목받음  
behavior_summary:
그림자처럼 움직이다 존재감 팍, 입장할 땐 조용, 시선은 강렬  
ai_comment:
아무 말 안 했는데 분위기 다 삼킴. 묘한 고급진 느낌.

<참고 예시 #5>
main_message: 온도차 심한 반전 매력러 ❄️🔥  
profile_traits:
  - 이름: 외유내강 감성투사  
  - 얼굴: 잔잔한 인상인데 눈빛 강함 👀  
  - 의상: 니트 + 롱스커트 or 스웻팬츠  
  - 별명: “생각보다 강한 사람”  
  - 스타일: 따뜻함 속 카리스마 있음  
character_summary:
- 겉은 말랑한데 내면 단단  
- 의외의 추진력과 리더십  
behavior_summary:
늘 배려하는데 정작 중심 잡음, “할게요” 한마디면 다 믿음  
ai_comment:
처음엔 몰랐는데 은근히 다 휘어잡음. 고요한 폭풍.


<참고 예시 #6>
main_message: 관찰력이 무기인 조용한 탐정형 🔍
profile_traits:
  - 이름: 감성 분석가
  - 얼굴: 잔잔한 눈매 + 미소 한 줄 🧐
  - 의상: 톤다운 니트 + 슬랙스
  - 별명: “다 들켰어요”
  - 스타일: 차분하지만 날카로운
character_summary:
- 말보다 관찰 먼저
 - 조용히 듣고 판단하는 편
behavior_summary:
대화보다 리액션 잘함
 필요할 땐 정확히 집어냄
ai_comment:
말수 적은데 왜 자꾸 찔리지? 다 알고 있는 느낌임.


<참고 예시 #7>
main_message: 항상 무언가에 감탄 중인 사람
profile_traits:
  - 이름: 소소한 감동 수집가 🌼✨
  - 얼굴: 늘 동그래진 눈 + 😲
  - 의상: 잔잔한 패턴 셔츠 or 크림톤 니트
  - 별명: “와… 대박”이 입버릇인 분
  - 스타일: 잔잔한 리액션, 리스펙 장인
character_summary:
- 아무 장면에서나 감동받음
 - '헉…'을 자주 말함
 - 남의 말 잘 들어줌
behavior_summary:
"헉 저 나뭇잎 너무 귀여워요"
 "감정의 파도에 오늘도 출렁"
ai_comment:
이 사람한테 감동 안 주면 내가 이상한 사람 된 기분…


<참고 예시 #8>
main_message: 묘하게 있어 보이는 척 하지만 정작 아무 생각 없음
profile_traits:
  - 이름: 가짜 철학가 🎩📚
  - 얼굴: 의미심장한 눈빛 + 😐
  - 의상: 무채색 터틀넥 or 긴 코트
  - 별명: “나 요즘 생각이 많아”
  - 스타일: 벽 보고 명상함 / 책 펼치고 안 읽음
character_summary:
- 카페 가면 에스프레소 시킴
 - 근데 한 모금 마시고 그대로 둠
 - 혼잣말 많이 함
behavior_summary:
"그냥… 삶이란 뭘까 생각했어"
 "에스프레소도 인생 같아, 쓰지?"
ai_comment:
철학과는 안 나왔는데 철학과보다 철학과 같음


<참고 예시 #9>
main_message: 어딜 가든 식물 먼저 찾는 사람
profile_traits:
  - 이름: 도심 속 자연인 🌿🪴
  - 얼굴: 촉촉한 눈매 + 🐿️
  - 의상: 리넨 셔츠 or 에코백
  - 별명: “선인장도 말 걸어줄 것 같아”
  - 스타일: 식물 이름 다 외움, 화분 앞에서 멈춤
character_summary:
- 친구보다 식물에 먼저 인사함
 - 늘 생기 있어 보임
 - 걷다 말고 사진 찍음
behavior_summary:
"헉 이거 금전수 아냐?"
 "이 나무… 너랑 좀 닮았다"
ai_comment:
광합성하는 사람을 본다면 그게 이 분입니다


<참고 예시 #10>
main_message: 감정 표현이 서툰 츤데레형 관찰자
profile_traits:
  - 이름: 말 없는 애정러 🧊❤️
  - 얼굴: 시선 회피 + 🙃
  - 의상: 후드 모자 푹 눌러쓴 느낌
  - 별명: “그냥… 걱정돼서 그랬어”
  - 스타일: 말없이 챙겨줌, 질문엔 대답 짧음
character_summary:
- 잔소리처럼 말하지만 결국 다 해줌
 - 먼저 연락은 안 하지만 다 보고 있음
 - 기념일은 잘 기억함
behavior_summary:
"왜 이렇게 늦게 와… 밥은 먹고 다녀"
 "그거 내가 해놨어"
ai_comment:
따뜻한 말은 없지만 말 대신 행동하는 유형


<참고 예시 #11>
main_message: 구름보다 멍 때리는 걸 잘함
profile_traits:
  - 이름: 구름 관찰 전문가 ☁️🌀
  - 얼굴: 멍한 눈빛 + 😶‍🌫️
  - 의상: 헐렁한 셔츠 + 헐렁한 머리끈
  - 별명: “아 나 방금 아무 생각 안 했어”
  - 스타일: 풍경 보다가 갑자기 철학적 질문함
character_summary:
- 생각 없어 보이는데 갑자기 깊은 말 함
 - 놀라운 타이밍에 멍 때림
 - 잘 까먹고 잘 웃음
behavior_summary:
"근데 우리는 왜 살아?"
 "아 구름 너무 예쁘다"
ai_comment:
세상에 휘둘리지 않는 자아가 여기 있음
---

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

// 배경 이미지 생성 엔드포인트
app.post('/generate-backgrounds', upload.single('profile'), async (req, res) => {
  try {
    console.log('배경 이미지 생성 요청 받음');
    
    const { profileAnalysis, chugumiSummary } = req.body;
    
    if (!profileAnalysis || !chugumiSummary) {
      return res.status(400).json({ 
        error: '프로필 분석 데이터와 추구미 요약이 필요합니다' 
      });
    }

    const parsedAnalysis = JSON.parse(profileAnalysis);
    const basePrompt = `A high-quality photographic background suitable for profile photos, inspired by "${chugumiSummary}" aesthetic. The background should complement a person with the following style: ${parsedAnalysis.current_profile_analysis}. `;

    // 두 가지 스타일의 배경 생성
    const prompts = [
      // 실사 느낌 (자연/실외)
      basePrompt + "Natural outdoor setting with soft warm lighting, gentle shadows, trees, natural elements, photorealistic style, professional photography quality, 4K resolution",
      
      // 그림 느낌 (아티스틱/실내)
      basePrompt + "Artistic painted-style background with warm tones, soft brush strokes, dreamy atmosphere, illustration style mixed with photography, creative artistic mood, warm color palette"
    ];

    console.log('DALL-E 3 API 호출 시작...');
    
    const imagePromises = prompts.map(async (prompt, index) => {
      try {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "hd",
          style: index === 0 ? "natural" : "vivid"
        });
        
        return {
          url: response.data[0].url,
          type: index === 0 ? 'realistic' : 'artistic',
          label: index === 0 ? '🌅실사 느낌' : '🎨그림 느낌'
        };
      } catch (error) {
        console.error(`배경 이미지 ${index + 1} 생성 오류:`, error);
        return null;
      }
    });

    const results = await Promise.all(imagePromises);
    const successfulImages = results.filter(img => img !== null);

    if (successfulImages.length === 0) {
      throw new Error('모든 배경 이미지 생성에 실패했습니다');
    }

    console.log(`${successfulImages.length}개의 배경 이미지 생성 완료`);
    
    res.json({ 
      success: true, 
      backgrounds: successfulImages,
      message: `${successfulImages.length}개의 배경 이미지가 생성되었습니다`
    });

  } catch (error) {
    console.error('배경 이미지 생성 오류:', error);
    res.status(500).json({ 
      error: '배경 이미지 생성 중 오류가 발생했습니다', 
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