import RideDebugger from '@/components/admin/ride-debugger';

export default function DebugRidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Debug de Viajes
          </h1>
          <p className="text-gray-600">
            Herramienta para diagnosticar problemas con los viajes
          </p>
        </div>
        
        <RideDebugger />
      </div>
    </div>
  );
}