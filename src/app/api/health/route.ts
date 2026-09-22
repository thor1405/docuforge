import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    memoryUsage: process.memoryUsage(),
    engine: "DocuForge-Core-2.0",
    activeWorkers: 4,
    queue: {
      pending: 0,
      active: 0,
      completed: 14940,
      failed: 2,
    },
  });
}
