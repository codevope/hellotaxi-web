// Health check endpoint para Docker
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'hellotaxi-web'
  });
}