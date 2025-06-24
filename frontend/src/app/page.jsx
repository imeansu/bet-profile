'use client';
import React, { useState, useEffect } from 'react';
import { Upload, Camera, Star, Target, Palette, Users, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';

function Page() {
  const [step, setStep] = useState(1);
  const [aspirationImage, setAspirationImage] = useState(null);
  const [profileImages, setProfileImages] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState(null);
  const [improvedScore, setImprovedScore] = useState(null);
  const [aspirationFile, setAspirationFile] = useState(null);
  const [profileFiles, setProfileFiles] = useState([]);

  useEffect(() => {
    if (profileFiles.length > 0) {
      analyzeProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileFiles]);

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
      console.log('profileFiles before FormData append:', profileFiles);
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
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAspirationImage(url);
      setAspirationFile(file);
      setStep(2);
      analyzeAspiration(file);
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
      // const improvementPrompt = "해변 배경으로 바꿔줘"
      console.log('improvementPrompt:', improvementPrompt);
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
    setProfileImages([]);
    setAnalysis(null);
    setSelectedImageIndex(0);
    setIsAnalyzing(false);
    setEditedImageUrl(null);
    setImprovedScore(null);
    setAspirationFile(null);
    setProfileFiles([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                프로필 아이덴티티 AI
              </h1>
              <p className="text-sm text-gray-500">AI가 더 나은 첫인상을 설계해드려요</p>
            </div>
          </div>
          <button
            onClick={resetFlow}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">다시 시작</span>
          </button>
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
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">추구미를 알려주세요</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                어떤 사람처럼 보이고 싶나요? 이상적인 이미지를 업로드해주시면 AI가 분석해드릴게요.
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-purple-300 border-dashed rounded-xl cursor-pointer bg-purple-50 hover:bg-purple-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-12 h-12 mb-4 text-purple-500" />
                  <p className="mb-2 text-lg font-medium text-purple-700">추구미 이미지 업로드</p>
                  <p className="text-sm text-purple-500">PNG, JPG 파일을 선택해주세요</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleAspirationUpload} />
              </label>
            </div>
          </div>
        )}

        {/* Step 2: 분석 중 */}
        {step === 2 && isAnalyzing && (
          <div className="text-center space-y-8">
            <div className="w-32 h-32 mx-auto relative">
              <img src={aspirationImage} alt="추구미" className="w-full h-full object-cover rounded-2xl" />
              <div className="absolute inset-0 bg-purple-500/20 rounded-2xl animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
              <h2 className="text-2xl font-bold text-gray-800">AI가 추구미를 분석 중이에요</h2>
              <p className="text-gray-600">이미지의 특성과 스타일을 파악하고 있어요...</p>
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
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto flex items-center justify-center">
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
              <h2 className="text-2xl font-bold text-gray-800">프로필 사진을 분석하고 있어요</h2>
              <p className="text-gray-600">추구미와 비교하여 점수를 매기는 중...</p>
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
                  <h2 className="text-2xl font-bold text-gray-800">AI가 이미지를 편집하고 있어요</h2>
                  <p className="text-gray-600">피드백을 바탕으로 최적화된 프로필을 만들고 있어요...</p>
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
                        <div className="absolute inset-0 bg-gradient-to-t from-green-200/50 to-transparent"></div>
                      </div>
                      <div className="mt-3 text-center">
                        <span className="text-2xl font-bold text-green-600">{improvedScore ? `${improvedScore}/50` : ''}</span>
                        <p className="text-sm text-green-500">{improvedScore ? `예상 점수 (+${improvedScore - (analysis?.totalScore || 0)}점 향상!)` : ''}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">🎨 적용된 편집 사항</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">✨ 표정 개선</h4>
                      <p className="text-sm text-gray-600">미소를 더 자연스럽고 밝게 조정했어요</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">💡 조명 보정</h4>
                      <p className="text-sm text-gray-600">자연광 효과를 더해 생동감을 높였어요</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">📐 각도 조정</h4>
                      <p className="text-sm text-gray-600">추구미와 비슷한 각도로 미세 조정했어요</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">🎨 색감 보정</h4>
                      <p className="text-sm text-gray-600">전체적인 톤을 따뜻하게 조정했어요</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={resetFlow}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    다른 이미지로 다시 시도
                  </button>
                  <button className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all">
                    편집된 이미지 다운로드
                  </button>
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