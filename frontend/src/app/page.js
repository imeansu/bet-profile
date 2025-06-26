'use client';
import React from 'react';
import Link from 'next/link';
import { Camera, Sparkles, Heart, Palette } from 'lucide-react';

export default function IntroPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col">
      {/* 상단 헤더 */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-4 font-bold text-lg shadow-lg">
        추구미/1 테스트 메인
      </header>
      
      {/* 메인 섹션 */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {/* 메인 카드 */}
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 text-center relative overflow-hidden">
          {/* 배경 장식 */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400"></div>
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20"></div>
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-20"></div>
          
          {/* 메인 타이틀 */}
          <div className="mb-8 relative z-10">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-lg text-gray-600 mb-2 font-medium">나도 몰랐던 나를 찾아주는</h2>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              AI 추구미 테스트
            </h1>
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-4 mb-6">
              <p className="text-lg font-semibold text-gray-700">&ldquo;요즘 나랑 어울리는 프사, 뭐가 좋을까?&rdquo;</p>
            </div>
          </div>
          
          {/* 추구미 키워드 카드들 */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-purple-300 flex items-center justify-center rounded-xl mb-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                <Camera className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-xs font-medium text-gray-600">스타일 분석</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-pink-200 border-2 border-pink-300 flex items-center justify-center rounded-xl mb-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <p className="text-xs font-medium text-gray-600">매력 포인트</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-300 flex items-center justify-center rounded-xl mb-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                <Palette className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-xs font-medium text-gray-600">컬러 조합</p>
            </div>
          </div>
          
          {/* 시작 버튼 */}
          <div className="mb-6">
            <Link href="/upload">
              <button className="w-full bg-gradient-to-r from-[#8EC9FF] to-[#D1A4FF] text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
                <span className="relative z-10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  내 추구미 알아보기
                </span>
              </button>
            </Link>
          </div>
          
          {/* 설명 텍스트 */}
          <div className="text-center space-y-2">
            <p className="text-gray-600 text-sm leading-relaxed">
              <span className="font-semibold text-purple-600">AI한테 물어봐요.</span>
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              내가 좋아하는 사진들만 보여주면<br />
              지금 나한테 어울리는 스타일을 알려줄게요.
            </p>
          </div>
        </div>
        
        {/* 하단 장식 요소 */}
        <div className="mt-8 flex space-x-2 opacity-30">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </main>
    </div>
  );
}
