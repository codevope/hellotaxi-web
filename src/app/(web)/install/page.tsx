"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  Zap,
  Bell,
  Share,
  Chrome,
  Plus,
  CheckCircle,
  Wifi,
  Battery
} from "lucide-react";
import Link from "next/link";
import { usePWA } from "@/hooks/use-pwa.mode";
import Img from "next/image";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function InstallPage() {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { isStandalone, showInstallPrompt } = usePWA();

  useEffect(() => {
    // Detectar el dispositivo
    const userAgent = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent));
    setIsAndroid(/Android/.test(userAgent));

    // Listener para el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    } else if (showInstallPrompt) {
      showInstallPrompt();
    }
  };

  const features = [
    {
      icon: Zap,
      title: "Acceso instantáneo",
      description:
        "Inicia la app directamente desde tu pantalla de inicio, sin necesidad de abrir el navegador",
    },
    {
      icon: Bell,
      title: "Notificaciones push",
      description:
        "Recibe alertas en tiempo real sobre el estado de tu viaje y mensajes del conductor",
    },
    {
      icon: Wifi,
      title: "Funciona sin conexión",
      description:
        "Accede a funciones básicas y tu historial de viajes incluso sin conexión a internet",
    },
    {
      icon: Battery,
      title: "Optimizada para móvil",
      description:
        "Diseño nativo que consume menos batería y funciona más rápido que en el navegador",
    },
  ];

  const steps = {
    ios: [
      { icon: Share, text: "Toca el botón 'Compartir' en Safari" },
      { icon: Plus, text: "Selecciona 'Añadir a pantalla de inicio'" },
      { icon: CheckCircle, text: "¡Listo! Encuentra HelloTaxi en tu inicio" },
    ],
    android: [
      { icon: Chrome, text: "Abre HelloTaxi en Chrome" },
      { icon: Download, text: "Toca 'Instalar' cuando aparezca el banner" },
      { icon: CheckCircle, text: "¡La app se instalará automáticamente!" },
    ],
  };

  if (isStandalone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2E4CA6] via-[#0477BF] to-[#049DD9] flex items-center justify-center p-4">
        <motion.div
          className="text-center text-white"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-4">
            ¡Ya tienes HelloTaxi instalado! 🎉
          </h1>
          <p className="text-lg text-white/90 mb-8">
            Estás usando la versión de app instalada. Disfruta de la mejor
            experiencia.
          </p>
          <Link href="/">
            <Button className="bg-white text-[#2E4CA6] hover:bg-white/90 font-semibold px-8 py-3">
              Ir a la App
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E4CA6] via-[#0477BF] to-[#049DD9]">
      {/* Header */}
      <motion.div
        className="relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        <div className="relative px-4 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div
              className="inline-flex items-center justify-center mb-8"
            >
              <Img src="/img/logo.png" alt="Hello TAXI" className="drop-shadow-md" width={200} height={85} />
            </div>

            <motion.h1
              className="text-4xl sm:text-6xl font-bold text-white mb-6"
              {...fadeInUp}
            >
              Instala{" "}
              <span className="bg-gradient-to-r from-[#05C7F2] to-white bg-clip-text text-transparent">
                Hello TAXI
              </span>
            </motion.h1>

            <motion.p
              className="text-xl text-white/90 mb-12 max-w-2xl mx-auto"
              {...fadeInUp}
              transition={{ delay: 0.2 }}
            >
              Obtén la mejor experiencia con nuestra app nativa. Más rápida, más
              confiable y siempre a tu alcance.
            </motion.p>
            {/* Botón de instalación principal */}
            {isInstallable && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={handleInstallClick}
                  className="bg-white text-[#2E4CA6] hover:bg-white/90 text-lg font-bold px-8 py-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  <Download className="w-6 h-6 mr-3" />
                  Instalar Hello TAXI
                </Button>
              </motion.div>
            )}
            {!isInstallable && (
              <p className="text-white/80 italic">
                La instalación no está disponible en tu dispositivo.
              </p>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#05C7F2]/10 rounded-full blur-2xl"></div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        className="py-16 px-4"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerChildren}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-white text-center mb-16"
            variants={fadeInUp}
          >
            ¿Por qué instalar HelloTaxi?
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white h-full hover:bg-white/20 transition-all duration-300 hover:scale-105">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="w-8 h-8 text-[#2E4CA6]" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Installation Steps */}
      <motion.div
        className="py-16 px-4 bg-white/5 backdrop-blur-sm"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={staggerChildren}
      >
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="text-3xl sm:text-4xl font-bold text-white text-center mb-16"
            variants={fadeInUp}
          >
            Cómo instalar en tu dispositivo
          </motion.h2>

          {(isIOS || isAndroid) && (
            <motion.div variants={fadeInUp}>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 mb-8">
                <h3 className="text-2xl font-bold text-white mb-8 text-center">
                  {isIOS ? "iPhone / iPad" : "🤖 Android"}
                </h3>

                <div className="grid md:grid-cols-3 gap-8">
                  {(isIOS ? steps.ios : steps.android).map((step, index) => (
                    <div key={index} className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-white to-[#05C7F2] rounded-full flex items-center justify-center mx-auto mb-4">
                        <step.icon className="w-8 h-8 text-[#2E4CA6]" />
                      </div>
                      <div className="w-8 h-8 bg-white text-[#2E4CA6] rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                        {index + 1}
                      </div>
                      <p className="text-white font-medium">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Fallback para otros dispositivos */}
          {!isIOS && !isAndroid && (
            <motion.div variants={fadeInUp}>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 text-center">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Navegador de Escritorio
                </h3>
                <p className="text-white/80 mb-6">
                  Busca el botón "Instalar" en la barra de direcciones de tu
                  navegador o usa Ctrl+Shift+I.
                </p>
                {isInstallable && (
                  <Button
                    onClick={handleInstallClick}
                    className="bg-white text-[#2E4CA6] hover:bg-white/90 font-semibold"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Instalar Ahora
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        className="py-16 px-4"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            ¿Listo para una mejor experiencia?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Únete a miles de usuarios que ya disfrutan de HelloTaxi como app
            nativa.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isInstallable ? (
              <Button
                onClick={handleInstallClick}
                className="bg-white text-[#2E4CA6] hover:bg-white/90 text-lg font-bold px-8 py-4 rounded-full"
              >
                <Download className="w-6 h-6 mr-2" />
                Instalar HelloTaxi
              </Button>
            ) : (
              <Link href="/">
                <Button className="bg-white text-[#2E4CA6] hover:bg-white/90 text-lg font-bold px-8 py-4 rounded-full">
                  Usar en Navegador
                </Button>
              </Link>
            )}

            <Link href="/about">
              <Button
                variant="outline"
                className="border-white hover:bg-white hover:text-[#2E4CA6] text-lg font-bold px-8 py-4 rounded-full"
              >
                Más Información
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 -left-1/4 w-96 h-96 bg-gradient-to-br from-[#05C7F2]/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 -right-1/4 w-96 h-96 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
