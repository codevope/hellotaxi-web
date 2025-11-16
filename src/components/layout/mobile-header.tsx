"use client";

import React from 'react';

interface MobileHeaderProps {
  type: 'driver' | 'passenger';
  userName?: string;
}

export function MobileHeader({
  type,
  userName
}: MobileHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-40 safe-area-inset-top">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo/Brand */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-[#2E4CA6] to-[#0477BF] p-2 rounded-lg">
            <span className="text-white font-bold text-lg">HT</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-lg leading-none">Hello Taxi</h1>
          </div>
        </div>

        {/* Profile */}
        {userName && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}