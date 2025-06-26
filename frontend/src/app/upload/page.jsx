'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Upload, Camera, Star, Target, Palette, Users, Sparkles, ArrowRight, RotateCcw, ArrowLeft, User, Instagram, Share, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

function Page() {
  const [step, setStep] = useState(1);
  const [aspirationImage, setAspirationImage] = useState(null);
  const [aspirationImages, setAspirationImages] = useState([]);
  const [profileImages, setProfileImages] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [profileAnalysis, setProfileAnalysis] = useState(null);
  const [isAnalyzingProfile, setIsAnalyzingProfile] = useState(false);
  const [profileFile, setProfileFile] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState(null);
  const [improvedScore, setImprovedScore] = useState(null);
  const [aspirationFile, setAspirationFile] = useState(null);
  const [aspirationFiles, setAspirationFiles] = useState([]);
  const [profileFiles, setProfileFiles] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [currentEmoji, setCurrentEmoji] = useState('');
  const [chugumiAnalysis, setChugumiAnalysis] = useState(null);
  const [isDetailedInterpretationExpanded, setIsDetailedInterpretationExpanded] = useState(false);
  const [generatedBackgrounds, setGeneratedBackgrounds] = useState(null);
  const [isGeneratingBackgrounds, setIsGeneratingBackgrounds] = useState(false);

  // 결과 화면 캡쳐를 위한 ref
  const resultRef = useRef(null);

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

  // useEffect(() => {
  //   if (profileFiles.length > 0) {
  //     analyzeProfile();
  //   }
  // }, [profileFiles]);

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

  const analyzeAspiration = async () => {
    if (aspirationFiles.length === 0) {
      alert('먼저 이미지를 업로드해주세요.');
      return;
    }

    setIsAnalyzing(true);
    setCurrentMessage('분석을 시작합니다...');
    setCurrentEmoji('🔍');

    try {
      const formData = new FormData();
      aspirationFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('http://localhost:4000/analyze-aspiration', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysis(data);
        setStep(3);
      } else {
        alert(data.error || '분석 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('분석 오류:', error);
      alert('분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeProfile = async () => {
    if (!profileFile || !analysis) {
      alert('프로필 사진과 추구미 분석 결과가 필요합니다.');
      return;
    }

    setIsAnalyzingProfile(true);
    setStep(5); // Step 5로 이동 (로딩 화면)
    setCurrentMessage('프로필 사진 분석을 시작합니다...');
    setCurrentEmoji('📸');

    try {
      const formData = new FormData();
      formData.append('profileImage', profileFile);
      formData.append('aspirationAnalysis', JSON.stringify(analysis));

      const response = await fetch('http://localhost:4000/analyze-profile', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setProfileAnalysis(data);
        setStep(6); // 결과 화면으로 이동
        
        // 프로필 분석 완료 후 자동으로 배경 이미지 생성 시작
        generateBackgrounds(data, analysis.one_liner);
      } else {
        alert(data.error || '프로필 분석 중 오류가 발생했습니다.');
        setStep(4); // 오류 시 업로드 화면으로 돌아가기
      }
    } catch (error) {
      console.error('프로필 분석 오류:', error);
      alert('프로필 분석 중 오류가 발생했습니다.');
      setStep(4); // 오류 시 업로드 화면으로 돌아가기
    } finally {
      setIsAnalyzingProfile(false);
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
    const files = Array.from(e.target.files).slice(0, 1); // 최대 1장만
    if (files.length > 0) {
      const urls = files.map(file => URL.createObjectURL(file));
      setProfileImages(urls);
      setProfileFiles(files);
      setProfileFile(files[0]);
      // 바로 다음 단계로 넘어가지 않고 미리보기만 표시
    }
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
      setStep(7);
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

  const handleShareResult = async () => {
    let buttons = null;
    let tempStylesheet = null;
    try {
      if (!resultRef.current) {
        alert('캡쳐할 화면을 찾을 수 없습니다.');
        return;
      }

      // 버튼들을 임시로 숨기기
      buttons = resultRef.current.querySelectorAll('.action-buttons');
      buttons.forEach(btn => btn.style.display = 'none');

      // oklch 색상 문제 해결을 위한 임시 스타일시트 생성
      tempStylesheet = document.createElement('style');
      tempStylesheet.textContent = `
        /* html2canvas용 포괄적 색상 오버라이드 */
        * {
          color: inherit !important;
          background-color: inherit !important;
          border-color: inherit !important;
        }
        
        /* 배경 색상 */
        .bg-gradient-to-r { background: linear-gradient(to right, #8b5cf6, #ec4899) !important; }
        .bg-gradient-to-br { background: linear-gradient(to bottom right, #faf5ff, #fdf2f8, #eff6ff) !important; }
        .from-purple-50 { background: #faf5ff !important; }
        .via-pink-50 { background: #fdf2f8 !important; }
        .to-blue-50 { background: #eff6ff !important; }
        .from-purple-500 { background: #8b5cf6 !important; }
        .to-pink-500 { background: #ec4899 !important; }
        .from-purple-600 { background: #7c3aed !important; }
        .to-pink-600 { background: #db2777 !important; }
        .from-blue-500 { background: #3b82f6 !important; }
        .to-cyan-500 { background: #06b6d4 !important; }
        .from-blue-600 { background: #2563eb !important; }
        .to-cyan-600 { background: #0891b2 !important; }
        .from-green-500 { background: #10b981 !important; }
        .to-emerald-500 { background: #059669 !important; }
        .from-green-600 { background: #059669 !important; }
        .to-emerald-600 { background: #047857 !important; }
        .bg-purple-50 { background: #faf5ff !important; }
        .bg-pink-50 { background: #fdf2f8 !important; }
        .bg-blue-50 { background: #eff6ff !important; }
        .bg-gray-50 { background: #f9fafb !important; }
        .bg-gray-100 { background: #f3f4f6 !important; }
        .bg-gray-200 { background: #e5e7eb !important; }
        .bg-white { background: #ffffff !important; }
        .bg-green-100 { background: #dcfce7 !important; }
        .bg-orange-100 { background: #fed7aa !important; }
        .bg-red-100 { background: #fee2e2 !important; }
        .bg-blue-100 { background: #dbeafe !important; }
        
        /* 텍스트 색상 */
        .text-gray-800 { color: #1f2937 !important; }
        .text-gray-700 { color: #374151 !important; }
        .text-gray-600 { color: #4b5563 !important; }
        .text-gray-500 { color: #6b7280 !important; }
        .text-purple-600 { color: #9333ea !important; }
        .text-pink-600 { color: #db2777 !important; }
        .text-blue-600 { color: #2563eb !important; }
        .text-white { color: #ffffff !important; }
        .text-green-800 { color: #166534 !important; }
        .text-green-700 { color: #15803d !important; }
        .text-orange-800 { color: #9a3412 !important; }
        .text-orange-700 { color: #c2410c !important; }
        .text-red-800 { color: #991b1b !important; }
        .text-red-700 { color: #b91c1c !important; }
        .text-blue-800 { color: #1e40af !important; }
        .text-blue-700 { color: #1d4ed8 !important; }
        
        /* 테두리 색상 */
        .border-gray-200 { border-color: #e5e7eb !important; }
        .border-gray-300 { border-color: #d1d5db !important; }
        .border { border-width: 1px !important; border-style: solid !important; }
        
        /* hover 효과 제거 (캡쳐 시에는 불필요) */
        .hover\\:bg-gray-100:hover { background: #f3f4f6 !important; }
        .hover\\:from-purple-600:hover { background: #7c3aed !important; }
        .hover\\:to-pink-600:hover { background: #db2777 !important; }
        .hover\\:from-blue-600:hover { background: #2563eb !important; }
        .hover\\:to-cyan-600:hover { background: #0891b2 !important; }
        .hover\\:from-green-600:hover { background: #059669 !important; }
        .hover\\:to-emerald-600:hover { background: #047857 !important; }
      `;
      document.head.appendChild(tempStylesheet);

      // 잠시 기다린 후 캡쳐 (DOM 업데이트 대기)
      await new Promise(resolve => setTimeout(resolve, 200));

      // html2canvas로 화면 캡쳐
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: '#f9fafb', // oklch 대신 일반 색상 사용
        scale: 2, // 고화질
        useCORS: true,
        allowTaint: true,
        logging: false, // 로깅 비활성화
        width: resultRef.current.scrollWidth,
        height: resultRef.current.scrollHeight,
        removeContainer: true, // 임시 컨테이너 제거
        foreignObjectRendering: false, // SVG 렌더링 비활성화
        ignoreElements: (element) => {
          // 문제가 될 수 있는 요소들 무시
          return element.classList && element.classList.contains('action-buttons');
        },
        onclone: (clonedDoc) => {
          // 클론된 문서에서 추가 스타일 정리
          const clonedButtons = clonedDoc.querySelectorAll('.action-buttons');
          clonedButtons.forEach(btn => btn.style.display = 'none');
          
          // 클론된 문서에도 안전한 색상 스타일 적용
          const clonedStyle = clonedDoc.createElement('style');
          clonedStyle.textContent = tempStylesheet.textContent;
          clonedDoc.head.appendChild(clonedStyle);
          
          // 모든 oklch 색상을 강제로 제거
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            if (computedStyle.backgroundColor && computedStyle.backgroundColor.includes('oklch')) {
              el.style.backgroundColor = '#ffffff';
            }
            if (computedStyle.color && computedStyle.color.includes('oklch')) {
              el.style.color = '#000000';
            }
            if (computedStyle.borderColor && computedStyle.borderColor.includes('oklch')) {
              el.style.borderColor = '#e5e7eb';
            }
          });
        }
      });

      if (!canvas) {
        throw new Error('캔버스 생성에 실패했습니다.');
      }

      // Canvas를 Blob으로 변환
      canvas.toBlob(async (blob) => {
        if (navigator.share && navigator.canShare) {
          // Web Share API 사용 (모바일/최신 브라우저)
          try {
            const file = new File([blob], 'my-chuguemi-result.png', { type: 'image/png' });
            await navigator.share({
              title: '내 추구미 분석 결과',
              text: 'AI가 분석한 내 추구미 결과를 확인해보세요!',
              files: [file]
            });
          } catch (shareError) {
            console.log('Web Share API 실패, 클립보드로 복사 시도');
            await copyImageToClipboard(blob);
          }
        } else {
          // Web Share API 미지원시 클립보드 복사
          await copyImageToClipboard(blob);
        }
      }, 'image/png');

    } catch (error) {
      console.error('공유 중 오류:', error);
      alert('결과 공유 중 오류가 발생했습니다.');
    } finally {
      // 오류 발생 여부와 상관없이 정리
      if (buttons) {
        buttons.forEach(btn => btn.style.display = '');
      }
      if (tempStylesheet) {
        document.head.removeChild(tempStylesheet);
      }
    }
  };

  const copyImageToClipboard = async (blob) => {
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        alert('이미지가 클립보드에 복사되었습니다! 원하는 곳에 붙여넣기 하세요.');
      } else {
        // 클립보드 API 미지원시 다운로드로 대체
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-chuguemi-result.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('이미지가 다운로드되었습니다!');
      }
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      // 최후 수단으로 다운로드
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-chuguemi-result.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('이미지가 다운로드되었습니다!');
    }
  };

  const handleSaveAsImage = async () => {
    let buttons = null;
    let tempStylesheet = null;
    try {
      if (!resultRef.current) {
        alert('캡쳐할 화면을 찾을 수 없습니다.');
        return;
      }

      // 버튼들을 임시로 숨기기
      buttons = resultRef.current.querySelectorAll('.action-buttons');
      buttons.forEach(btn => btn.style.display = 'none');

      // oklch 색상 문제 해결을 위한 임시 스타일시트 생성
      tempStylesheet = document.createElement('style');
      tempStylesheet.textContent = `
        /* html2canvas용 포괄적 색상 오버라이드 */
        * {
          color: inherit !important;
          background-color: inherit !important;
          border-color: inherit !important;
        }
        
        /* 배경 색상 */
        .bg-gradient-to-r { background: linear-gradient(to right, #8b5cf6, #ec4899) !important; }
        .bg-gradient-to-br { background: linear-gradient(to bottom right, #faf5ff, #fdf2f8, #eff6ff) !important; }
        .from-purple-50 { background: #faf5ff !important; }
        .via-pink-50 { background: #fdf2f8 !important; }
        .to-blue-50 { background: #eff6ff !important; }
        .from-purple-500 { background: #8b5cf6 !important; }
        .to-pink-500 { background: #ec4899 !important; }
        .from-purple-600 { background: #7c3aed !important; }
        .to-pink-600 { background: #db2777 !important; }
        .from-blue-500 { background: #3b82f6 !important; }
        .to-cyan-500 { background: #06b6d4 !important; }
        .from-blue-600 { background: #2563eb !important; }
        .to-cyan-600 { background: #0891b2 !important; }
        .from-green-500 { background: #10b981 !important; }
        .to-emerald-500 { background: #059669 !important; }
        .from-green-600 { background: #059669 !important; }
        .to-emerald-600 { background: #047857 !important; }
        .bg-purple-50 { background: #faf5ff !important; }
        .bg-pink-50 { background: #fdf2f8 !important; }
        .bg-blue-50 { background: #eff6ff !important; }
        .bg-gray-50 { background: #f9fafb !important; }
        .bg-gray-100 { background: #f3f4f6 !important; }
        .bg-gray-200 { background: #e5e7eb !important; }
        .bg-white { background: #ffffff !important; }
        .bg-green-100 { background: #dcfce7 !important; }
        .bg-orange-100 { background: #fed7aa !important; }
        .bg-red-100 { background: #fee2e2 !important; }
        .bg-blue-100 { background: #dbeafe !important; }
        
        /* 텍스트 색상 */
        .text-gray-800 { color: #1f2937 !important; }
        .text-gray-700 { color: #374151 !important; }
        .text-gray-600 { color: #4b5563 !important; }
        .text-gray-500 { color: #6b7280 !important; }
        .text-purple-600 { color: #9333ea !important; }
        .text-pink-600 { color: #db2777 !important; }
        .text-blue-600 { color: #2563eb !important; }
        .text-white { color: #ffffff !important; }
        .text-green-800 { color: #166534 !important; }
        .text-green-700 { color: #15803d !important; }
        .text-orange-800 { color: #9a3412 !important; }
        .text-orange-700 { color: #c2410c !important; }
        .text-red-800 { color: #991b1b !important; }
        .text-red-700 { color: #b91c1c !important; }
        .text-blue-800 { color: #1e40af !important; }
        .text-blue-700 { color: #1d4ed8 !important; }
        
        /* 테두리 색상 */
        .border-gray-200 { border-color: #e5e7eb !important; }
        .border-gray-300 { border-color: #d1d5db !important; }
        .border { border-width: 1px !important; border-style: solid !important; }
        
        /* hover 효과 제거 (캡쳐 시에는 불필요) */
        .hover\\:bg-gray-100:hover { background: #f3f4f6 !important; }
        .hover\\:from-purple-600:hover { background: #7c3aed !important; }
        .hover\\:to-pink-600:hover { background: #db2777 !important; }
        .hover\\:from-blue-600:hover { background: #2563eb !important; }
        .hover\\:to-cyan-600:hover { background: #0891b2 !important; }
        .hover\\:from-green-600:hover { background: #059669 !important; }
        .hover\\:to-emerald-600:hover { background: #047857 !important; }
      `;
      document.head.appendChild(tempStylesheet);

      // 잠시 기다린 후 캡쳐 (DOM 업데이트 대기)
      await new Promise(resolve => setTimeout(resolve, 200));

      // html2canvas로 화면 캡쳐
      const canvas = await html2canvas(resultRef.current, {
        backgroundColor: '#f9fafb', // oklch 대신 일반 색상 사용
        scale: 2, // 고화질
        useCORS: true,
        allowTaint: true,
        logging: false, // 로깅 비활성화
        width: resultRef.current.scrollWidth,
        height: resultRef.current.scrollHeight,
        removeContainer: true, // 임시 컨테이너 제거
        foreignObjectRendering: false, // SVG 렌더링 비활성화
        ignoreElements: (element) => {
          // 문제가 될 수 있는 요소들 무시
          return element.classList && element.classList.contains('action-buttons');
        },
        onclone: (clonedDoc) => {
          // 클론된 문서에서 추가 스타일 정리
          const clonedButtons = clonedDoc.querySelectorAll('.action-buttons');
          clonedButtons.forEach(btn => btn.style.display = 'none');
          
          // 클론된 문서에도 안전한 색상 스타일 적용
          const clonedStyle = clonedDoc.createElement('style');
          clonedStyle.textContent = tempStylesheet.textContent;
          clonedDoc.head.appendChild(clonedStyle);
          
          // 모든 oklch 색상을 강제로 제거
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            if (computedStyle.backgroundColor && computedStyle.backgroundColor.includes('oklch')) {
              el.style.backgroundColor = '#ffffff';
            }
            if (computedStyle.color && computedStyle.color.includes('oklch')) {
              el.style.color = '#000000';
            }
            if (computedStyle.borderColor && computedStyle.borderColor.includes('oklch')) {
              el.style.borderColor = '#e5e7eb';
            }
          });
        }
      });

      if (!canvas) {
        throw new Error('캔버스 생성에 실패했습니다.');
      }

      // Canvas를 이미지로 다운로드
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `my-chuguemi-result-${new Date().getTime()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          alert('이미지가 저장되었습니다!');
        } else {
          throw new Error('이미지 생성에 실패했습니다.');
        }
      }, 'image/png');

    } catch (error) {
      console.error('이미지 저장 중 오류:', error);
      alert(`이미지 저장 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      // 오류 발생 여부와 상관없이 정리
      if (buttons) {
        buttons.forEach(btn => btn.style.display = '');
      }
      if (tempStylesheet) {
        document.head.removeChild(tempStylesheet);
      }
    }
  };

  // 배경 이미지 생성 함수
  const generateBackgrounds = async (profileAnalysisData, chugumiSummary) => {
    setIsGeneratingBackgrounds(true);
    setGeneratedBackgrounds(null);
    
    try {
      const formData = new FormData();
      formData.append('profileAnalysis', JSON.stringify(profileAnalysisData));
      formData.append('chugumiSummary', chugumiSummary || '독특한 개성을 가진 감성적인 스타일');

      const response = await fetch('http://localhost:4000/generate-backgrounds', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('배경 이미지 생성 요청 실패');
      }

      const result = await response.json();
      setGeneratedBackgrounds(result.backgrounds);
      
    } catch (error) {
      console.error('배경 이미지 생성 오류:', error);
      // 실패해도 에러 메시지만 로그, 사용자에게는 알리지 않음
    } finally {
      setIsGeneratingBackgrounds(false);
    }
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
            <span className="text-sm text-gray-500">{step}/7 단계</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(step / 7) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: 추구미 업로드 */}
        {step === 1 && (
          <div className="max-w-md mx-auto px-4 py-8 space-y-8">
            {/* 메인 타이틀 */}
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">
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
                    analyzeAspiration();
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
          <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 bg-white border-b">
              <button 
                onClick={() => setStep(2)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-800">당신의 추구미는...</h1>
              <div className="w-10"></div>
            </div>

            {/* 캡쳐할 결과 영역 */}
            <div ref={resultRef} className="px-4 py-6 space-y-6">
              {/* 업로드된 이미지들 */}
              <div className="grid grid-cols-3 gap-3">
                {aspirationImages.slice(0, 3).map((img, index) => (
                  <div key={index} className="aspect-square">
                    <img 
                      src={img} 
                      alt={`추구미 ${index + 1}`} 
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                ))}
              </div>

              {/* 메인 문구 */}
              <div className="bg-gradient-to-r from-purple-400 to-purple-500 rounded-2xl p-6 text-center">
                <h2 className="text-2xl font-bold text-white">
                  {analysis.main_message || "✨독특한 개성이 담긴 감성✨"}
                </h2>
              </div>

              {/* 추구미 프로필 */}
              <div className="bg-white rounded-2xl p-6 space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-2xl">
                    😊
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {analysis.one_liner || "나만의 스타일로 살아가는 사람"}
                    </h3>
                    <div className="space-y-2">
                      {analysis.character_summary?.map((summary, index) => (
                        <p key={index} className="text-gray-600 leading-relaxed">
                          {summary}
                        </p>
                      )) || (
                        <p className="text-gray-600 leading-relaxed">
                          자연스러운 매력이 돋보이는 스타일
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 프로필 특성 */}
              {analysis.profile_traits && (
                <div className="bg-white rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="mr-2">👤</span>
                    프로필 특성
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(analysis.profile_traits).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-600 font-medium">{key}</span>
                        <span className="text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 행동으로 말하면 */}
              <div className="bg-white rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="mr-2">🎬</span>
                  행동으로 말하면...
                </h3>
                <div className="space-y-3">
                  {analysis.behavior_summary?.map((behavior, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <span className="text-purple-500 font-bold">•</span>
                      <p className="text-gray-700">{behavior}</p>
                    </div>
                  )) || (
                    <div className="flex items-start space-x-3">
                      <span className="text-purple-500 font-bold">•</span>
                      <p className="text-gray-700">개성 있는 라이프스타일을 추구한다</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI 코멘트 인용구 */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl p-6 border-l-4 border-purple-400">
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-800 italic leading-relaxed">
                    "{analysis.ai_comment || "자연스러운 매력이 돋보이는 스타일... 편안하면서도 개성이 있어..."}"
                  </p>
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="grid grid-cols-1 gap-4 action-buttons">
                {analysis.recommended_action_buttons?.map((buttonText, index) => {
                  if (buttonText.includes('프사 추천받기') || buttonText.includes('프사')) {
                    return (
                      <button
                        key={index}
                        onClick={() => setStep(4)}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        {buttonText}
                      </button>
                    );
                  } else if (buttonText.includes('결과 공유') || buttonText.includes('공유')) {
                    return (
                      <button
                        key={index}
                        onClick={handleShareResult}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        {buttonText}
                      </button>
                    );
                  } else if (buttonText.includes('이미지로 저장') || buttonText.includes('저장')) {
                    return (
                      <button
                        key={index}
                        onClick={handleSaveAsImage}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        {buttonText}
                      </button>
                    );
                  } else {
                    return (
                      <button
                        key={index}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        {buttonText}
                      </button>
                    );
                  }
                }) || (
                  <>
                    <button 
                      onClick={handleShareResult}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      결과 공유하기
                    </button>
                    <button 
                      onClick={() => setStep(4)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      프사 추천받기
                    </button>
                    <button 
                      onClick={handleSaveAsImage}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      이미지로 저장
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: 프로필 사진 업로드 */}
        {step === 4 && (
          <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 bg-white border-b">
              <button 
                onClick={() => setStep(3)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-800">프사 추천받기</h1>
              <div className="w-10"></div>
            </div>

            <div className="px-4 py-6 space-y-8">
              {/* 메인 타이틀 */}
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  할까 말까 고민중인<br />
                  프로필 사진을 올려보세요
                </h2>
                <div className="space-y-2">
                  <p className="text-gray-600">
                    프사 후보 사진을 올리면
                  </p>
                  <p className="text-gray-600">
                    내 추구미에 어울리는지 알려드려요
                  </p>
                </div>
              </div>

              {/* 추구미 vs 프사 후보 비교 */}
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  {/* 추구미 섹션 */}
                  <div className="flex-1 text-center space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800">추구미</h3>
                    <div className="aspect-square bg-gray-200 rounded-2xl overflow-hidden">
                      {aspirationImages.length > 0 ? (
                        <img 
                          src={aspirationImages[0]} 
                          alt="추구미" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center space-y-2">
                            <Instagram className="w-8 h-8 text-gray-400 mx-auto" />
                            <p className="text-sm text-gray-500">업로드한<br />SNS 피드</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 화살표 */}
                  <div className="flex items-center justify-center px-2">
                    <div className="text-2xl text-gray-400">⇔</div>
                  </div>

                  {/* 프사 후보 섹션 */}
                  <div className="flex-1 text-center space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800">프사 후보</h3>
                    <div className="aspect-square bg-gray-200 rounded-2xl overflow-hidden">
                      {profileFile ? (
                        <img 
                          src={URL.createObjectURL(profileFile)} 
                          alt="프사 후보" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center space-y-2">
                            <User className="w-8 h-8 text-gray-400 mx-auto" />
                            <p className="text-sm text-gray-500">프사 예시</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 유사도 결과 (더미) */}
                <div className="text-center">
                  <p className="text-lg text-gray-600">
                    우리 사이 거리.. <span className="font-semibold">12m</span> 🚶
                  </p>
                </div>
              </div>

              {/* 업로드 버튼 또는 분석 버튼 */}
              <div className="space-y-4">
                {profileImages.length === 0 ? (
                  <>
                    <label className="block w-full cursor-pointer">
                      <div className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center">
                        <Camera className="w-5 h-5 mr-2" />
                        사진 올리기 (최대 1장)
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleProfileUpload}
                      />
                    </label>
                    
                    <p className="text-xs text-gray-500 text-center">
                      업로드한 사진은 저장이나 학습되지 않습니다
                    </p>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={analyzeProfile}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      AI 프로필 분석 시작하기
                    </button>
                    
                    <button 
                      onClick={() => setProfileFile(null)}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-2xl transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      다른 사진으로 변경
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: 프로필 분석 로딩 화면 */}
        {step === 5 && (
          <div className="min-h-screen flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 bg-white">
              <button 
                onClick={() => {
                  setIsAnalyzingProfile(false);
                  setStep(4);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-800">프로필 분석 중</h1>
              <div className="w-10"></div>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 space-y-12">
              {/* 메인 타이틀 */}
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-gray-800">
                  프로필 사진을 분석 중이에요...
                </h2>
                <p className="text-gray-500 text-lg">
                  AI가 추구미와 매칭도를 분석하고 있어요
                </p>
              </div>

              {/* 진행 메시지 박스 */}
              <div className="w-full max-w-sm">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 text-center space-y-4">
                  {/* 이모지 */}
                  <div className="text-4xl animate-bounce">
                    📸
                  </div>
                  
                  {/* 진행 메시지 */}
                  <p className="text-lg font-medium text-gray-700">
                    프로필 감성 체크 중...
                  </p>
                  
                  {/* 로딩 바 */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: 프로필 분석 결과 */}
        {step === 6 && profileAnalysis && (
          <div className="min-h-screen bg-gray-100">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 bg-white">
              <button 
                onClick={() => setStep(4)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-800">프사 리포트 도착</h1>
              <div className="w-10"></div>
            </div>

            <div className="p-4 space-y-6">
              {/* 프로필 이미지와 거리 표시 */}
              <div className="bg-white rounded-2xl p-6 text-center space-y-4">
                {/* 프로필 이미지 */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-gray-200">
                    {profileFile && (
                      <img 
                        src={URL.createObjectURL(profileFile)}
                        alt="프로필 미리보기"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>

                {/* 거리 메시지 */}
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-gray-800">
                    추구미까지 {profileAnalysis.distance_to_chugumi}m 남았어요
                  </h2>
                  
                  {/* 거리 표시 바 */}
                  <div className="flex items-center space-x-3">
                    <div className="text-sm">🚶</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full"
                        style={{width: `${Math.max(10, 100 - (profileAnalysis.distance_to_chugumi * 2))}%`}}
                      ></div>
                    </div>
                    <div className="text-sm">🏠</div>
                  </div>
                  
                  {/* 거리 라벨 */}
                  <div className="bg-purple-100 rounded-full px-4 py-2 inline-block">
                    <span className="text-sm font-medium text-purple-700">
                      ({profileAnalysis.distance_to_chugumi}m)
                    </span>
                  </div>
                  
                  {/* 위치 설명 */}
                  <div className="bg-purple-50 rounded-lg p-3 mt-3">
                    <span className="text-sm text-purple-800 font-medium">
                      {profileAnalysis.distance_evaluation}
                    </span>
                  </div>
                </div>
              </div>

              {/* 이 사람의 추구미는... */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">이 사람의 추구미는...</h3>
                <div className="bg-white rounded-2xl p-4 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <div className="text-lg">🏙️</div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-1">
                      조용한 온기를 가진 도시형 감성
                    </h4>
                    <p className="text-sm text-gray-600">
                      {profileAnalysis.chugumi_summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* 지금 이 프사는... */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">지금 이 프사는...</h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* 조명 */}
                  <div className="bg-orange-50 rounded-2xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="text-lg">💡</div>
                      <span className="font-semibold text-orange-800">조명</span>
                    </div>
                    <p className="text-sm text-orange-700">
                      어두운 조명 속 포인트 조명 → 무채색+빛 번짐 → 차분하고 몽환적인 무드
                    </p>
                  </div>

                  {/* 의상톤 */}
                  <div className="bg-teal-50 rounded-2xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="text-lg">👔</div>
                      <span className="font-semibold text-teal-800">의상톤</span>
                    </div>
                    <p className="text-sm text-teal-700">
                      딥한 색깔 & 뉴트럴 컬러 → 정제되고 차분함
                    </p>
                  </div>

                  {/* 표정 */}
                  <div className="bg-yellow-50 rounded-2xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="text-lg">😊</div>
                      <span className="font-semibold text-yellow-800">표정</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      두 사람 다 자연스러운 미소 → 꾸안꾸, 전체적 편안함
                    </p>
                  </div>

                  {/* 배경연출 */}
                  <div className="bg-pink-50 rounded-2xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="text-lg">🎭</div>
                      <span className="font-semibold text-pink-800">배경연출</span>
                    </div>
                    <p className="text-sm text-pink-700">
                      트레이드된 느낌 + 초록식물 + 색감 톤온톤 배경 → 비현실성
                    </p>
                  </div>
                </div>
              </div>

              {/* 추구미와의 관계 요약 */}
              <div className="bg-white rounded-2xl p-6 space-y-4">
                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="text-lg font-medium text-gray-800">
                    {profileAnalysis.profile_vs_chugumi}
                  </p>
                </div>

                {/* 감성 해석 더보기 */}
                <div className="space-y-3">
                  <button
                    onClick={() => setIsDetailedInterpretationExpanded(!isDetailedInterpretationExpanded)}
                    className="w-full text-center text-gray-600 font-medium py-2 border-t border-gray-200 flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors"
                  >
                    <span>감성 해석 더보기</span>
                    <span className={`transform transition-transform ${isDetailedInterpretationExpanded ? 'rotate-180' : ''}`}>
                      ∨
                    </span>
                  </button>

                  {/* 접을 수 있는 상세 해석 */}
                  {isDetailedInterpretationExpanded && profileAnalysis.detailed_interpretation && (
                    <div className="space-y-3 pt-3">
                      {profileAnalysis.detailed_interpretation.map((interpretation, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-gray-700 text-sm">{interpretation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 그래서, 할까 말까? */}
                {profileAnalysis.comprehensive_evaluation && (
                  <div className="space-y-4 border-t border-gray-200 pt-4">
                    <h4 className="text-lg font-semibold text-gray-800">그래서, 할까 말까?</h4>
                    
                    <div className="space-y-3">
                      {/* 추구미 도달도 */}
                      <div className="flex items-center space-x-3 bg-red-50 rounded-lg p-3">
                        <div className="text-lg">📍</div>
                        <div className="flex-1">
                          <span className="font-medium text-red-800">추구미 도달도</span>
                          <div className="text-sm text-red-700">
                            ✅ {profileAnalysis.comprehensive_evaluation.chugumi_achievement}
                          </div>
                        </div>
                      </div>

                      {/* 분위기 일치도 */}
                      <div className="flex items-center space-x-3 bg-orange-50 rounded-lg p-3">
                        <div className="text-lg">🏷️</div>
                        <div className="flex-1">
                          <span className="font-medium text-orange-800">분위기 일치도</span>
                          <div className="text-sm text-orange-700">
                            😊 {profileAnalysis.comprehensive_evaluation.mood_compatibility}
                          </div>
                        </div>
                      </div>

                      {/* 조정 팁 */}
                      <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-3">
                        <div className="text-lg">🔧</div>
                        <div className="flex-1">
                          <span className="font-medium text-gray-800">조정 팁</span>
                          <div className="text-sm text-gray-700">
                            {profileAnalysis.comprehensive_evaluation.adjustment_tip}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* AI 한마디 */}
              <div className="bg-white rounded-2xl p-6 space-y-3">
                <h4 className="text-lg font-semibold text-gray-800">AI 한마디</h4>
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-gray-700 italic">
                    "{profileAnalysis.ai_comment}"
                  </p>
                </div>
              </div>

              {/* 추천 배경 */}
              {profileAnalysis.recommended_backgrounds && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">🌟 추천 배경</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {profileAnalysis.recommended_backgrounds.map((bg, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-sm text-gray-700">{bg}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 액션 버튼들 */}
              <div className="space-y-4">
                {profileAnalysis.action_buttons?.map((button, index) => (
                  <button 
                    key={index}
                    onClick={() => {
                      if (button.action === 'retry') {
                        setStep(4);
                        setProfileFile(null);
                        setProfileAnalysis(null);
                      } else if (button.action === 'share') {
                        // 공유 기능 구현
                        alert('공유 기능은 곧 추가될 예정입니다!');
                      }
                    }}
                    className={`w-full font-bold py-4 px-6 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
                      button.style === 'primary' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {button.text}
                  </button>
                ))}
                
                {/* 배경 이미지 생성 섹션 */}
                <div className="bg-white rounded-2xl p-6 space-y-6">
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-gray-800">이 분위기, 바로 설정해볼래요?</h3>
                    <p className="text-gray-600">추구미에 딱맞는 배경 사진까지 뽑아왔어요</p>
                  </div>

                  {/* 로딩 상태 */}
                  {isGeneratingBackgrounds && (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
                      <p className="text-gray-600 mb-4">AI가 당신만의 배경을 만들고 있어요...</p>
                    </div>
                  )}

                  {/* 생성된 배경 이미지들 */}
                  {generatedBackgrounds && generatedBackgrounds.length > 0 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        {generatedBackgrounds.map((bg, index) => (
                          <div key={index} className="space-y-3">
                            <div className="text-center">
                              <span className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                                {bg.label}
                              </span>
                            </div>
                            
                            <div className="relative bg-gray-100 rounded-2xl overflow-hidden aspect-[3/4]">
                              <img 
                                src={bg.url} 
                                alt={`${bg.label} 배경`}
                                className="w-full h-full object-cover"
                              />
                              
                              {/* 프로필 사진 오버레이 */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                  {profileFile && (
                                    <img 
                                      src={URL.createObjectURL(profileFile)}
                                      alt="프로필 미리보기"
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                              </div>
                              
                              {/* "나" 텍스트 */}
                              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                                <span className="bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-800 shadow-md">
                                  나
                                </span>
                              </div>
                            </div>

                            {/* 카톡에 반영하기 버튼 */}
                            <button 
                              onClick={() => {
                                // 카카오톡 연동 기능 (향후 구현)
                                alert('카카오톡 연동 기능은 곧 추가될 예정입니다!');
                              }}
                              className="w-full bg-black text-white font-medium py-3 px-4 rounded-2xl hover:bg-gray-800 transition-colors"
                            >
                              카톡에 반영하기
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* 배경 사진 저장하기 버튼 */}
                      <button 
                        onClick={() => {
                          // 배경 이미지 저장 기능
                          generatedBackgrounds.forEach((bg, index) => {
                            const link = document.createElement('a');
                            link.href = bg.url;
                            link.download = `배경이미지_${bg.type}_${index + 1}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          });
                        }}
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-6 rounded-2xl text-lg transition-colors"
                      >
                        배경 사진 저장하기
                      </button>
                    </div>
                  )}

                  {/* 재생성 버튼 (생성 완료 후 또는 실패 시) */}
                  {!isGeneratingBackgrounds && (generatedBackgrounds === null || generatedBackgrounds?.length === 0) && (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">배경 이미지 생성에 실패했습니다.</p>
                      <button 
                        onClick={() => generateBackgrounds(profileAnalysis, analysis?.one_liner)}
                        className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-6 rounded-2xl transition-colors"
                      >
                        다시 생성하기
                      </button>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => {
                    setStep(1);
                    setProfileFile(null);
                    setProfileAnalysis(null);
                    setAnalysis(null);
                    setAspirationFiles([]);
                    setAspirationImages([]);
                  }}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-2xl transition-colors flex items-center justify-center"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  처음부터 다시 시작하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: AI 편집된 이미지 제안 */}
        {step === 7 && (
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
