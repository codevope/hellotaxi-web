'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Download, Smartphone, Monitor, AlertCircle, X } from 'lucide-react';

interface PWAStatusProps {
  onClose?: () => void;
  compact?: boolean;
}

export default function PWAStatus({ onClose, compact = false }: PWAStatusProps) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<string>('');
  const [canInstall, setCanInstall] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Verificar si está instalado como PWA
    const checkInstallStatus = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isIOSStandalone = isIOS && (navigator as any).standalone;
      
      setIsStandalone(isStandaloneMode || isIOSStandalone);
      setIsInstalled(isStandaloneMode || isIOSStandalone);
    };

    // Detectar plataforma
    const detectPlatform = () => {
      const userAgent = navigator.userAgent;
      if (/Android/i.test(userAgent)) {
        setPlatform('Android');
      } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
        setPlatform('iOS');
      } else if (/Windows/i.test(userAgent)) {
        setPlatform('Windows');
      } else if (/Mac/i.test(userAgent)) {
        setPlatform('macOS');
      } else {
        setPlatform('Escritorio');
      }
    };

    // Verificar si puede instalarse
    const checkCanInstall = () => {
      // Verificar si hay evento beforeinstallprompt almacenado
      const canInstallPWA = localStorage.getItem('pwa-can-install') === 'true';
      setCanInstall(canInstallPWA && !isInstalled);
    };

    checkInstallStatus();
    detectPlatform();
    checkCanInstall();

    // Listener para cambios en el modo standalone
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleStandaloneChange = () => checkInstallStatus();
    
    if (standaloneQuery.addEventListener) {
      standaloneQuery.addEventListener('change', handleStandaloneChange);
    } else {
      standaloneQuery.addListener(handleStandaloneChange);
    }

    return () => {
      if (standaloneQuery.removeEventListener) {
        standaloneQuery.removeEventListener('change', handleStandaloneChange);
      } else {
        standaloneQuery.removeListener(handleStandaloneChange);
      }
    };
  }, []);

  const getStatusMessage = () => {
    if (isInstalled) {
      return {
        icon: CheckCircle,
        title: '¡App Instalada!',
        message: 'HelloTaxi está funcionando como aplicación nativa',
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200'
      };
    }

    if (canInstall) {
      return {
        icon: Download,
        title: 'Listo para Instalar',
        message: `Puede instalar HelloTaxi en ${platform}`,
        color: 'text-[#0477BF]',
        bg: 'bg-blue-50',
        border: 'border-blue-200'
      };
    }

    return {
      icon: platform.includes('iOS') || platform.includes('Android') ? Smartphone : Monitor,
      title: 'Disponible como PWA',
      message: `Accesible desde ${platform} como aplicación web`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    };
  };

  const status = getStatusMessage();
  const Icon = status.icon;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${status.bg} ${status.border} border`}>
        <Icon className={`h-4 w-4 ${status.color}`} />
        <span className={status.color}>{status.title}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className={`p-4 ${status.bg} ${status.border} border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`h-6 w-6 ${status.color}`} />
            <div>
              <h3 className={`font-semibold ${status.color}`}>{status.title}</h3>
              <p className="text-sm text-gray-600">{status.message}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <div className="space-y-3">
          {/* Platform Info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Plataforma:</span>
            <span className="font-medium">{platform}</span>
          </div>

          {/* Installation Status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Estado:</span>
            <div className="flex items-center gap-1">
              {isInstalled ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-600">Instalado</span>
                </>
              ) : canInstall ? (
                <>
                  <Download className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-600">Disponible</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-400">Web App</span>
                </>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="pt-2 border-t">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-[#0477BF] hover:text-[#049DD9] font-medium"
            >
              {showDetails ? 'Ocultar' : 'Ver'} características PWA
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t"
            >
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Modo Offline</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Notificaciones</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Cache Inteligente</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Actualizaciones</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        {canInstall && !isInstalled && (
          <div className="mt-4 pt-4 border-t">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/install'}
              className="w-full bg-gradient-to-r from-[#0477BF] to-[#049DD9] text-white py-2.5 px-4 rounded-lg font-medium hover:from-[#2E4CA6] hover:to-[#0477BF] transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <div className="flex items-center justify-center gap-2">
                <Download className="h-4 w-4" />
                Instalar HelloTaxi
              </div>
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}