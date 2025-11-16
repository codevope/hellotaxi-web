"use client";

import { useState, useEffect } from 'react';

export interface ScreenDimensions {
  width: number;
  height: number;
}

export interface ScreenConfig {
  buttonHeight: string;
  buttonFontSize: string;
  iconSize: string;
  spacing: string;
  cardPadding: string;
}

export function useMobileDimensions() {
  const [screenDimensions, setScreenDimensions] = useState<ScreenDimensions>({ width: 0, height: 0 });

  // Detectar dimensiones de pantalla
  useEffect(() => {
    const updateDimensions = () => {
      setScreenDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Obtener configuración de estilos basada en el tamaño de pantalla
  const getScreenConfig = (): ScreenConfig => {
    const { width, height } = screenDimensions;
    const isExtraSmall = width <= 360 && height <= 640;
    const isSmall = width <= 375 && height <= 667;
    const isMedium = width <= 430 && height <= 932;
    
    if (isExtraSmall) {
      return {
        buttonHeight: '32px',
        buttonFontSize: '10px',
        iconSize: '12px',
        spacing: '8px',
        cardPadding: '8px'
      };
    } else if (isSmall) {
      return {
        buttonHeight: '36px', 
        buttonFontSize: '11px',
        iconSize: '14px',
        spacing: '10px',
        cardPadding: '12px'
      };
    } else if (isMedium) {
      return {
        buttonHeight: '40px',
        buttonFontSize: '12px', 
        iconSize: '16px',
        spacing: '12px',
        cardPadding: '16px'
      };
    } else {
      return {
        buttonHeight: '44px',
        buttonFontSize: '14px',
        iconSize: '18px', 
        spacing: '16px',
        cardPadding: '20px'
      };
    }
  };

  // Calcular alturas dinámicas del bottom sheet
  const getBottomSheetHeight = (
    isExpanded: boolean,
    contentType: 'panel' | 'request' | 'activeRide'
  ): string => {
    const { width, height } = screenDimensions;
    const isMobile = width <= 768;
    
    if (!isMobile) {
      // Desktop - usar alturas fijas
      if (contentType === 'request') return isExpanded ? '65vh' : '240px';
      if (contentType === 'activeRide') return isExpanded ? '60vh' : '180px';
      return isExpanded ? '50vh' : '240px';
    }

    // Mobile - cálculos específicos para tamaños exactos definidos
    const isExtraSmall = width <= 360 && height <= 640;
    const isSmall = width <= 375 && height <= 667;
    const isMedium = width <= 430 && height <= 932;
    
    if (contentType === 'request') {
      if (isExtraSmall) {
        return isExpanded ? `${height - 80}px` : '160px';
      } else if (isSmall) {
        return isExpanded ? `${height - 90}px` : '170px';
      } else if (isMedium) {
        return isExpanded ? `${height - 100}px` : '180px';
      }
      return isExpanded ? `${height * 0.65}px` : '190px';
    }
    
    if (contentType === 'activeRide') {
      if (isExtraSmall) {
        return isExpanded ? `${height - 100}px` : '120px';
      } else if (isSmall) {
        return isExpanded ? `${height - 110}px` : '130px';
      } else if (isMedium) {
        return isExpanded ? `${height - 120}px` : '140px';
      }
      return isExpanded ? `${height * 0.6}px` : '150px';
    }
    
    // Panel de control normal
    if (isExtraSmall) {
      return isExpanded ? `${height - 60}px` : '180px';
    } else if (isSmall) {
      return isExpanded ? `${height - 70}px` : '190px';
    } else if (isMedium) {
      return isExpanded ? `${height - 80}px` : '200px';
    }
    return isExpanded ? `${height * 0.7}px` : '220px';
  };

  // Calcular altura del mapa
  const getMapHeight = (bottomSheetHeight: string): string => {
    const { width, height } = screenDimensions;
    const isMobile = width <= 768;
    
    if (!isMobile) return '50vh';
    
    // Detectar tamaños específicos
    const isExtraSmall = width <= 360 && height <= 640;
    const isSmall = width <= 375 && height <= 667;
    const isMedium = width <= 430 && height <= 932;
    
    // Calcular altura del mapa restando el bottom sheet
    const bottomSheetHeightNum = parseInt(bottomSheetHeight.replace('px', ''));
    
    // Altura del header ajustada por tamaño de pantalla
    let headerHeight = 70;
    if (isExtraSmall) headerHeight = 60;
    else if (isSmall) headerHeight = 65;
    else if (isMedium) headerHeight = 75;
    
    const margin = 10;
    const availableHeight = height - headerHeight - bottomSheetHeightNum - margin;
    
    // Altura mínima adaptada al tamaño de pantalla
    let minHeight = height * 0.25;
    if (isExtraSmall) minHeight = height * 0.2;
    else if (isSmall) minHeight = height * 0.22;
    else if (isMedium) minHeight = height * 0.28;
    
    return `${Math.max(availableHeight, minHeight)}px`;
  };

  const screenConfig = getScreenConfig();

  return {
    screenDimensions,
    screenConfig,
    getBottomSheetHeight,
    getMapHeight
  };
}