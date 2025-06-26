'use client';
import React, { useState, useEffect } from 'react';
import { Upload, Camera, Star, Target, Palette, Users, Sparkles, ArrowRight, RotateCcw, ArrowLeft, User, Instagram } from 'lucide-react';

function Page() {
  const [step, setStep] = useState(1);
  const [aspirationImage, setAspirationImage] = useState(null);
  const [aspirationImages, setAspirationImages] = useState([]);
  const [profileImages, setProfileImages] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState(null);
  const [improvedScore, setImprovedScore] = useState(null);
  const [aspirationFile, setAspirationFile] = useState(null);
  const [aspirationFiles, setAspirationFiles] = useState([]);
  const [profileFiles, setProfileFiles] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [currentEmoji, setCurrentEmoji] = useState('🔍');

  // 분석 중 메시지와 이모지 배열
  const analysisMessages = [
    { text: "유니크함 감지 중...", emoji: "🔍" },
    { text: "색감 데이터 수집 완료!", emoji: "🎨" },
    { text: "당신만의 스타일, 분석 중...", emoji: "✨" },
    { text: "스타일 DNA 디코딩 중...", emoji: "🧬" },
    { text: "색감 굿!", emoji: "🌈" },
    { text: "이런 스타일 처음이야!", emoji: "😮" },
    { text: "와우... 독특한 무드 감지!", emoji: "🤩" },
    { text: "패션 감각 측정 중...", emoji: "👗" },
    { text: "개성 지수 계산 완료!", emoji: "📊" },
    { text: "트렌드 매칭 중...", emoji: "🔥" },
    { text: "스타일 코드 해독 중...", emoji: "🔐" },
    { text: "당신의 매력 포인트 발견!", emoji: "💎" },
    { text: "센스 레벨 측정 완료!", emoji: "🎯" },
    { text: "독창성 99% 확인됨!", emoji: "🚀" }
  ];

  useEffect(() => {
    if (profileFiles.length > 0) {
      analyzeProfile();
    }
  }, [profileFiles]);

  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      // 초기 메시지 설정
      const initialMessage = analysisMessages[Math.floor(Math.random() * analysisMessages.length)];
      setCurrentMessage(initialMessage.text);
      setCurrentEmoji(initialMessage.emoji);

      // 2초마다 메시지 변경
      interval = setInterval(() => {
        const randomMessage = analysisMessages[Math.floor(Math.random() * analysisMessages.length)];
        setCurrentMessage(randomMessage.text);
        setCurrentEmoji(randomMessage.emoji);
      }, 2000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAnalyzing]);

  const analyzeAspiration = async (file) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/analyze-aspiration', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('분석 실패');

      const data = await response.json();
      setAnalysis(data);
      setStep(3);
    } catch (error) {
      alert('AI 분석에 실패했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeProfile = async () => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      if (aspirationFile) {
        formData.append('aspiration', aspirationFile);
      }
      profileFiles.forEach((file) => {
        formData.append('profiles', file);
      });
      const response = await fetch('/analyze-profile', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('분석 실패');
      const data = await response.json();
      setAnalysis(data);
      setStep(5);
    } catch (error) {
      alert('프로필 분석에 실패했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAspirationUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 3); // 최대 3장까지만
    if (files.length > 0) {
      const urls = files.map(file => URL.createObjectURL(file));
      setAspirationImages(urls);
      setAspirationFiles(files);
      // 첫 번째 이미지를 기본으로 설정 (기존 코드 호환성 위해)
      setAspirationImage(urls[0]);
      setAspirationFile(files[0]);
    }
  };

  const handleProfileUpload = (e) => {
    const files = Array.from(e.target.files);
    const urls = files.map(file => URL.createObjectURL(file));
    setProfileImages(urls);
    setProfileFiles(files);
    setStep(4);
  };

  const generateEditedImage = async () => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      const response = await fetch(profileImages[0]);
      const blob = await response.blob();
      formData.append('image', new File([blob], 'profile.jpg', { type: blob.type }));

      const improvementPrompt = analysis?.results?.[0]?.improvement || 'improvement: 개선점';
      formData.append('prompt', improvementPrompt);

      const res = await fetch('/edit-image', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('편집 실패');
      const data = await res.json();
      setEditedImageUrl(data.editedImageUrl);
      setImprovedScore(data.improvedScore);
      setStep(6);
    } catch (error) {
      alert('AI 이미지 편집에 실패했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setAspirationImage(null);
    setAspirationImages([]);
    setProfileImages([]);
    setAnalysis(null);
    setSelectedImageIndex(0);
    setIsAnalyzing(false);
    setEditedImageUrl(null);
    setImprovedScore(null);
    setAspirationFile(null);
    setAspirationFiles([]);
    setProfileFiles([]);
    setCurrentMessage('');
    setCurrentEmoji('🔍');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">이미지 올리기</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">진행 상황</span>
            <span className="text-sm text-gray-500">{step}/6 단계</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(step / 6) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: 추구미 업로드 */}
        {step === 1 && (
          <div className="max-w-md mx-auto px-4 py-8 space-y-8">
            {/* 메인 타이틀 */}
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 leading-tight">
                내가 추구하는 스타일을<br />
                사진으로 알려주세요
              </h2>
              <p className="text-gray-600">AI가 나만의 스타일을 찾아드려요</p>
            </div>

            {/* 선택 옵션 */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-700">지금의 나</span>
                <span className="text-lg font-semibold text-gray-700">닮고 싶은 나</span>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1 space-y-3">
                  <div className="w-full h-32 bg-gray-200 rounded-2xl flex items-center justify-center border-2 border-gray-300">
                    <div className="text-center">
                      <User className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <span className="text-lg font-medium text-gray-700">내 프사</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 text-center">내 프사 / 내 일상 사진</p>
                </div>
                
                <div className="flex items-center">
                  <span className="text-gray-400 font-medium">or</span>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="w-full h-32 bg-gray-200 rounded-2xl flex items-center justify-center border-2 border-gray-300">
                    <div className="text-center">
                      <Instagram className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <span className="text-lg font-medium text-gray-700">인스타피드</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    내가 좋아하는 SNS 피드<br />
                    따라하고 싶은 유명인 사진
                  </p>
                </div>
              </div>
            </div>

            {/* 선택된 이미지 미리보기 */}
            {aspirationImages.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 text-center">선택된 사진들</h3>
                <div className="grid grid-cols-3 gap-3">
                  {aspirationImages.map((img, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={img} 
                        alt={`선택된 사진 ${index + 1}`} 
                        className="w-full h-24 object-cover rounded-xl border-2 border-purple-200"
                      />
                      <button
                        onClick={() => {
                          const newImages = aspirationImages.filter((_, i) => i !== index);
                          const newFiles = aspirationFiles.filter((_, i) => i !== index);
                          setAspirationImages(newImages);
                          setAspirationFiles(newFiles);
                          if (newImages.length > 0) {
                            setAspirationImage(newImages[0]);
                            setAspirationFile(newFiles[0]);
                          } else {
                            setAspirationImage(null);
                            setAspirationFile(null);
                          }
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 업로드 버튼 */}
            <div className="space-y-4">
              <div className="w-full">
                <label className="block w-full cursor-pointer">
                  <div className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center">
                    <Upload className="w-5 h-5 mr-2" />
                    {aspirationImages.length > 0 ? `사진 추가하기 (${aspirationImages.length}/3)` : '사진 올리기 (최대 3장)'}
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                    onChange={handleAspirationUpload}
                    disabled={aspirationImages.length >= 3}
                  />
                </label>
              </div>
              
              {/* 분석 시작 버튼 */}
              {aspirationImages.length > 0 && (
                <button
                  onClick={() => {
                    setStep(2);
                    analyzeAspiration(aspirationFiles[0]);
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  AI 분석 시작하기
                </button>
              )}
              
              <p className="text-xs text-gray-500 text-center">
                업로드한 사진은 저장이나 학습되지 않습니다
              </p>
            </div>
          </div>
        )}

        {/* Step 2: 분석 중 */}
        {step === 2 && isAnalyzing && (
          <div className="min-h-screen flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 bg-white">
              <button 
                onClick={() => setStep(1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-800">추구미 분석</h1>
              <div className="w-10"></div> {/* 균형을 위한 빈 공간 */}
            </div>

            {/* 메인 콘텐츠 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 space-y-12">
              {/* 메인 타이틀 */}
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-gray-800">
                  당신의 스타일을 해석 중이에요...
                </h2>
                <p className="text-gray-500 text-lg">
                  AI가 이미지를 꼼꼼히 분석하고 있어요
                </p>
              </div>

              {/* 진행 메시지 박스 */}
              <div className="w-full max-w-sm">
                <div className="bg-gray-100 rounded-2xl p-6 text-center space-y-4">
                  {/* 이모지 */}
                  <div className="text-4xl animate-bounce">
                    {currentEmoji}
                  </div>
                  
                  {/* 진행 메시지 */}
                  <p className="text-lg font-medium text-gray-700">
                    {currentMessage}
                  </p>
                  
                  {/* 로딩 바 */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 추구미 분석 결과 */}
        {step === 3 && analysis && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto">
                <img src={aspirationImage} alt="추구미" className="w-full h-full object-cover rounded-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">당신의 추구미 분석 결과</h2>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Palette className="w-5 h-5 mr-2 text-purple-500" />
                    스타일 특성
                  </h3>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(analysis.keywords) && analysis.keywords.map((keyword, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          {keyword}
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-600 mt-3">{analysis.impression}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-purple-500" />
                    핵심 포인트
                  </h3>
                  <ul className="space-y-2">
                    {Array.isArray(analysis.keyFeatures) && analysis.keyFeatures.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep(4)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all flex items-center mx-auto"
              >
                내 프로필 사진 분석하기
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: 프로필 사진 업로드 */}
        {step === 4 && !isAnalyzing && profileImages.length === 0 && (
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto flex items-center justify-center">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">프로필 사진을 업로드해주세요</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                현재 사용 중이거나 고민 중인 프로필 사진들을 올려주세요. 최대 3장까지 분석 가능해요.
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-blue-300 border-dashed rounded-xl cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Camera className="w-12 h-12 mb-4 text-blue-500" />
                  <p className="mb-2 text-lg font-medium text-blue-700">프로필 사진 업로드</p>
                  <p className="text-sm text-blue-500">최대 3장까지 선택 가능</p>
                </div>
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleProfileUpload} />
              </label>
            </div>
          </div>
        )}

        {/* Step 4: 분석 중 */}
        {step === 4 && isAnalyzing && (
          <div className="text-center space-y-8">
            <div className="flex justify-center space-x-4">
              {profileImages.map((img, index) => (
                <div key={index} className="w-24 h-24 relative">
                  <img src={img} alt={`프로필 ${index + 1}`} className="w-full h-full object-cover rounded-xl" />
                  <div className="absolute inset-0 bg-blue-500/20 rounded-xl animate-pulse"></div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <h2 className="text-2xl font-bold text-gray-800">{currentMessage}</h2>
              <p className="text-gray-600">{currentEmoji}</p>
            </div>
          </div>
        )}

        {/* Step 5: 분석 결과 및 피드백 */}
        {step === 5 && analysis?.results && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">프로필 분석 결과 (AI)</h2>
            </div>
            <div className="grid gap-4">
              {analysis.results.map((item, index) => (
                <div key={index} className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                  <div className="flex items-center mb-2">
                    <img src={profileImages[index]} alt={`프로필 ${index + 1}`} className="w-12 h-12 object-cover rounded-lg mr-4" />
                    <div>
                      <div className="font-semibold text-gray-800">유사도 점수: {item.similarityScore}/10</div>
                      <div className="text-sm text-gray-500">{item.feedback}</div>
                      <div className="text-sm text-green-700 mt-1">개선점: {item.improvement}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <button
                onClick={generateEditedImage}
                className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all flex items-center mx-auto"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                AI로 개선된 이미지 생성하기
              </button>
            </div>
          </div>
        )}

        {/* Step 6: AI 편집된 이미지 제안 */}
        {step === 6 && (
          <div className="space-y-8">
            {isAnalyzing ? (
              <div className="text-center space-y-8">
                <div className="space-y-4">
                  <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto"></div>
                  <h2 className="text-2xl font-bold text-gray-800">{currentMessage}</h2>
                  <p className="text-gray-600">{currentEmoji}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-bold text-gray-800">✨ AI 편집 결과</h2>
                  <p className="text-gray-600">피드백을 반영하여 개선된 프로필 이미지를 제안드려요</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-center">원본 이미지</h3>
                    <div className="bg-white p-4 rounded-2xl shadow-lg">
                      <img 
                        src={profileImages[0]} 
                        alt="원본" 
                        className="w-full h-64 object-cover rounded-xl" 
                      />
                      <div className="mt-3 text-center">
                        <span className="text-2xl font-bold text-gray-600">{analysis.totalScore}/50</span>
                        <p className="text-sm text-gray-500">기존 점수</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-center">AI 편집 이미지</h3>
                    <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-green-200">
                      <div className="w-full h-64 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                        {editedImageUrl ? (
                          <img src={editedImageUrl} alt="AI 편집" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <div className="text-center space-y-2">
                            <Sparkles className="w-12 h-12 text-green-500 mx-auto animate-pulse" />
                            <p className="text-green-700 font-medium">편집된 이미지</p>
                            <p className="text-sm text-green-600">더 밝은 표정 + 자연광 효과</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 text-center">
                        <span className="text-2xl font-bold text-green-600">{improvedScore ? `${improvedScore}/50` : '45/50'}</span>
                        <p className="text-sm text-green-500">개선된 점수</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">🎉 개선 완료!</h3>
                    <p className="text-green-700">AI 편집으로 더 매력적인 프로필 이미지가 완성되었어요.</p>
                  </div>
                  
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={resetFlow}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors"
                    >
                      다시 시작하기
                    </button>
                    <button
                      onClick={() => window.location.href = '/'}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
                    >
                      처음으로 돌아가기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Page;
