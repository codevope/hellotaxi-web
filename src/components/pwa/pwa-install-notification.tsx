"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, Smartphone, Share, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWANotificationProps {
  showOnHome?: boolean;
}

export default function PWAInstallNotification({
  showOnHome = false,
}: PWANotificationProps) {
  console.log("PWAInstallNotification renderizado con showOnHome:", showOnHome);

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { toast } = useToast();

  // Log cuando cambie el estado del modal
  useEffect(() => {
    console.log("showInstallModal cambió a:", showInstallModal);
  }, [showInstallModal]);

  useEffect(() => {
    // Detectar iOS y si ya está instalado
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isInStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsIOS(isIOSDevice);
    setIsStandalone(isInStandalone);

    console.log("PWA Check inicial:", {
      isIOSDevice,
      isInStandalone,
      showOnHome,
    });

    // No mostrar nada si ya está instalado
    if (isInStandalone) {
      console.log("App ya está instalada, no mostrar PWA notification");
      return;
    }

    // Lógica inteligente para mostrar la notificación
    const checkShouldShowNotification = () => {
      const lastShown = localStorage.getItem("pwa-last-shown");
      const dismissCount = parseInt(
        localStorage.getItem("pwa-dismiss-count") || "0"
      );
      const permanentDismiss = localStorage.getItem("pwa-permanent-dismiss");

      // Si el usuario la rechazó 3 veces, no mostrar más (hasta que limpie localStorage)
      if (permanentDismiss === "true" && dismissCount >= 3) {
        console.log(
          "PWA notification permanentemente rechazada después de 3 intentos"
        );
        return false;
      }

      // Primera vez que entra
      if (!lastShown) {
        console.log("Primera visita - mostrar PWA notification");
        return true;
      }

      // Verificar si han pasado suficientes días según el número de rechazos
      const daysSinceLastShown =
        (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
      let cooldownDays = 1; // Por defecto 1 día

      if (dismissCount === 1) cooldownDays = 3; // Después del primer rechazo, esperar 3 días
      if (dismissCount === 2) cooldownDays = 7; // Después del segundo, esperar 1 semana
      if (dismissCount >= 3) cooldownDays = 30; // Después del tercero, esperar 1 mes

      console.log("PWA Check temporal:", {
        daysSinceLastShown: daysSinceLastShown.toFixed(1),
        cooldownDays,
        dismissCount,
        shouldShow: daysSinceLastShown >= cooldownDays,
      });

      return daysSinceLastShown >= cooldownDays;
    };

    // Verificar si ya fue rechazado
    const shouldShow = checkShouldShowNotification();
    console.log("PWA Check detallado:", {
      isIOSDevice,
      showOnHome,
      shouldShow,
      isInStandalone,
      serviceWorkerSupport: "serviceWorker" in navigator,
      pushManagerSupport: "PushManager" in window,
    });

    // Registrar Service Worker primero
    if ("serviceWorker" in navigator) {
      // Temporalmente deshabilitado para evitar error de workbox en desarrollo
      console.log("Service Worker registration disabled during development");
      /*
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado exitosamente:', registration);
        })
        .catch((error) => {
          console.log('Error al registrar el Service Worker:', error);
        });
      */
    }

    // Manejar evento de instalación PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("beforeinstallprompt triggered");
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);

      // Mostrar modal después de un tiempo si debe mostrarse
      if (shouldShow && showOnHome) {
        console.log("Programando PWA modal para Chrome/Edge en 2 segundos");
        setTimeout(() => {
          console.log("Showing PWA modal (Chrome/Edge)");
          setShowInstallModal(true);
          // Actualizar timestamp de última vez mostrada
          localStorage.setItem("pwa-last-shown", Date.now().toString());
        }, 2000);
      }
    };

    // Mostrar notificación automáticamente si debe mostrarse
    if (showOnHome && shouldShow) {
      console.log("✅ PWA modal programado para mostrarse en 3 segundos");
      setTimeout(() => {
        console.log("🚀 MOSTRANDO PWA modal automáticamente");
        setShowInstallModal(true);
        // Actualizar timestamp de última vez mostrada
        localStorage.setItem("pwa-last-shown", Date.now().toString());
      }, 3000);
    } else if (showOnHome && !shouldShow) {
      console.log("❌ PWA modal NO se muestra - aún en período de espera");
    }

    // Para dispositivos que soportan PWA pero no tienen el evento, mostrar instrucciones
    // if (showOnHome && !wasPromptDismissed) {
    //   // Detectar si es un navegador que soporta PWA
    //   const isPWACapable = 'serviceWorker' in navigator && 'PushManager' in window;

    //   if (isPWACapable || isIOSDevice) {
    //     setTimeout(() => {
    //       console.log('Showing PWA modal (fallback for PWA-capable browsers)');
    //       setShowInstallModal(true);
    //     }, 4000);
    //   }
    // }

    // Detectar si ya está instalada
    const handleAppInstalled = () => {
      console.log("App installed");
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowInstallModal(false);
      localStorage.removeItem("pwa-install-dismissed");

      toast({
        title: "¡HelloTaxi instalada!",
        description: "La aplicación se ha instalado correctamente.",
        duration: 3000,
      });
    };

    // Registrar listeners
    console.log("Registrando event listeners para PWA");
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      console.log("Limpiando event listeners para PWA");
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [showOnHome, toast]);

  // Función para instalar la PWA
  const installPWA = async () => {
    // Si hay un prompt nativo de instalación disponible, usarlo
    if (deferredPrompt) {
      try {
        toast({
          title: "Instalando...",
          description: "HelloTaxi se está instalando en tu dispositivo.",
          duration: 2000,
        });

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          console.log("Usuario aceptó instalar la PWA");
          toast({
            title: "¡Instalación iniciada!",
            description: "HelloTaxi se está instalando en tu dispositivo.",
            duration: 3000,
          });
        } else {
          toast({
            title: "Instalación cancelada",
            description: "Puedes instalar la aplicación más tarde.",
            duration: 3000,
          });
        }

        setDeferredPrompt(null);
        setIsInstallable(false);
        setShowInstallModal(false);
      } catch (error) {
        console.error("Error instalando PWA:", error);
        toast({
          title: "Error de instalación",
          description: "Hubo un problema al instalar la aplicación.",
          duration: 3000,
        });
      }
    } else {
      // Fallback: mostrar instrucciones manuales
      toast({
        title: "Instalación manual",
        description:
          "Ve al menú del navegador y busca 'Instalar aplicación' o 'Agregar a pantalla de inicio'.",
        duration: 5000,
      });

      setShowInstallModal(false);
    }
  };

  const dismissModal = () => {
    setShowInstallModal(false);

    // Incrementar contador de rechazos
    const currentDismissCount = parseInt(
      localStorage.getItem("pwa-dismiss-count") || "0"
    );
    const newDismissCount = currentDismissCount + 1;
    localStorage.setItem("pwa-dismiss-count", newDismissCount.toString());
    localStorage.setItem("pwa-last-shown", Date.now().toString());

    // Si ya rechazó 3 veces, marcar como rechazo permanente
    if (newDismissCount >= 3) {
      localStorage.setItem("pwa-permanent-dismiss", "true");
      toast({
        title: "Notificación ocultada permanentemente",
        description:
          "No volveremos a mostrar esta notificación. Puedes instalar desde el menú del navegador.",
        duration: 5000,
      });
    } else {
      const nextShowDays =
        newDismissCount === 1 ? 3 : newDismissCount === 2 ? 7 : 30;
      toast({
        title: "Notificación ocultada",
        description: `La volveremos a mostrar en ${nextShowDays} día${
          nextShowDays > 1 ? "s" : ""
        }. Puedes instalar desde el menú del navegador.`,
        duration: 4000,
      });
    }

    console.log("PWA modal rechazado:", {
      dismissCount: newDismissCount,
      permanentDismiss: newDismissCount >= 3,
    });
  };

  // No renderizar si no está en pantalla de inicio o si ya está instalado
  if (!showOnHome || isStandalone) {
    console.log("No renderizando PWA notification:", {
      showOnHome,
      isStandalone,
    });
    return null;
  }

  // PARA TESTING - TEMPORAL
  console.log("PWA notification render check:", {
    showOnHome,
    isStandalone,
    showInstallModal,
    lastShown: localStorage.getItem("pwa-last-shown"),
    dismissCount: localStorage.getItem("pwa-dismiss-count"),
    permanentDismiss: localStorage.getItem("pwa-permanent-dismiss"),
  });

  console.log(
    "Renderizando PWA notification, showInstallModal:",
    showInstallModal
  );

  return (
    <AnimatePresence>
      {showInstallModal && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={dismissModal}
          />

          {/* Modal de instalación */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 24 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl border-0 overflow-hidden">
              <CardContent className="p-0 relative">
                {/* Cabecera con logo y título */}
                <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-[#E6F6FF] to-[#F0F9FF] dark:from-transparent dark:to-transparent">
                  <div className="flex-shrink-0">
                    <img
                      src="/img/logo2.png"
                      alt="HelloTaxi logo"
                      className="h-14 w-auto block dark:hidden"
                    />
                    <img
                      src="/img/logo3.png"
                      alt="HelloTaxi logo alt"
                      className="h-14 w-auto hidden dark:block"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Accede rápido y ahorra tiempo desde tu pantalla de inicio
                    </p>
                  </div>

                  <div className="ml-auto flex items-center gap-3">
                    <img
                      src="/img/logo.png"
                      alt="logo dark"
                      className="h-10 w-auto hidden dark:block rounded-md bg-slate-800 p-1"
                    />
                  </div>
                </div>

                {/* Contenido principal */}
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      {
                        icon: Zap,
                        title: "Rápido",
                        desc: "Carga instantánea, siempre listo",
                      },
                      {
                        icon: Download,
                        title: "Ligero",
                        desc: "Sin descargas pesadas",
                      },
                      {
                        icon: Smartphone,
                        title: "Nativo",
                        desc: "Se siente como app nativa",
                      },
                    ].map((b, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                      >
                        <div className="p-2 rounded-full bg-white shadow-sm dark:bg-slate-700">
                          <b.icon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {b.title}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-300">
                            {b.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Botones: instalación destacada */}
                  <div className="space-y-3">
                    {isIOS ? (
                      <>
                        <div className="text-center">
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                            Instrucciones para iPhone: usa el menú compartir en
                            Safari y selecciona "Agregar a pantalla de inicio".
                          </p>
                          <Button
                            onClick={dismissModal}
                            className="w-full py-3 font-semibold rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 text-white"
                          >
                            Entendido
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <motion.button
                          onClick={installPWA}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full flex items-center justify-center gap-4 py-4 px-5 text-lg font-bold rounded-2xl bg-gradient-to-r from-[#0066FF] to-[#0052CC] text-white shadow-xl"
                        >
                          <Share className="w-5 h-5" />

                          <span>
                            {deferredPrompt
                              ? "Instalar Hello TAXI"
                              : "Ver instrucciones de instalación"}
                          </span>
                        </motion.button>

                        <Button
                          onClick={dismissModal}
                          variant="outline"
                          className="w-full py-3 rounded-2xl border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          Ahora no
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Cerrar */}
                <Button
                  onClick={dismissModal}
                  size="sm"
                  variant="link"
                  className="absolute top-2 right-6 text-slate-700 dark:text-slate-300 p-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
