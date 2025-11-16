import NotificationTester from '@/components/testing/notification-tester';

export default function TestNotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Prueba de Notificaciones
          </h1>
          <p className="text-gray-600">
            Prueba el sistema de notificaciones con sonido para nuevos servicios
          </p>
        </div>
        
        <NotificationTester />
      </div>
    </div>
  );
}