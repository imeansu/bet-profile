'use client';
import React from 'react';
import Link from 'next/link';

export default function IntroPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 상단 헤더 */}
      <header className="bg-red-600 text-white text-center py-4 font-bold text-xl">
        테스트 시작
      </header>
      
      {/* 메인 섹션 */}
      <main className="flex-1 flex flex-col">
        {/* 메인 텍스트 부분 */}
        <div className="bg-gray-200 py-2 text-center text-sm">
          추구미/1 테스트 메인
        </div>
        
        {/* 카드 섹션 */}
        <div className="flex-1 p-4 flex flex-col items-center justify-center">
          <div className="bg-white rounded-lg shadow-md w-full max-w-md p-6 text-center">
            <div className="mb-10">
              <h2 className="text-xl font-bold mb-4">나도 몰랐던 나를 찾아주는</h2>
              <h1 className="text-3xl font-bold">AI 추구미 테스트</h1>
            </div>
            
            {/* 가이드 이미지들 */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 border-2 border-blue-400 bg-blue-50 flex items-center justify-center rounded-md mb-2">
                  <span className="text-xs text-blue-600">추구미</span>
                </div>
                <p className="text-sm">추구미 가이드</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 border-2 border-blue-400 bg-blue-50 flex items-center justify-center rounded-md mb-2">
                  <span className="text-xs text-blue-600">추구미</span>
                </div>
                <p className="text-sm">추구미 가이드</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 border-2 border-blue-400 bg-blue-50 flex items-center justify-center rounded-md mb-2">
                  <span className="text-xs text-blue-600">추구미</span>
                </div>
                <p className="text-sm">추구미 가이드</p>
              </div>
            </div>
            
            {/* 버튼 */}
            <div className="mb-6">
              <Link href="/upload">
                <button 
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-full w-full transition-colors"
                >
                  내 추구미 알아보기
                </button>
              </Link>
              <p className="text-xs text-gray-500 mt-2">지금까지 (아무도) 참여했어요</p>
            </div>
            
            {/* 하단 정보 */}
            <div className="text-left border-t pt-4 space-y-3">
              <div>
                <p className="text-gray-700 font-bold mb-1">[타이틀]</p>
                <p className="text-gray-700">&ldquo;요즘 나랑 어울리는 포지, 뭐가 좋을까?&rdquo;</p>
              </div>
              
              <div>
                <p className="text-gray-700 font-bold mb-1">[설명 문구]</p>
                <p className="text-gray-700 mb-1">AI한테 물어보세요.</p>
                <p className="text-gray-700">내가 좋아하는 사진들만 보여주면 스타일을 알려줄게요.</p>
              </div>
              
              <div>
                <p className="text-gray-700 font-bold mb-1">[버튼]</p>
                <p className="text-gray-700">[추구미 알아보기]</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
