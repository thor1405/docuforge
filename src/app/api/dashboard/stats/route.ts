import { NextRequest, NextResponse } from "next/server";
import { getActivitiesCollection, getWorkflowsCollection } from "@/lib/db/mongodb";
import { getSessionUser } from "@/lib/auth/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const activitiesCollection = await getActivitiesCollection();
    const workflowsCollection = await getWorkflowsCollection();

    const userQuery = user
      ? { $or: [{ userId: user._id?.toString() }, { userEmail: user.email }] }
      : {};

    // 1. Calculate today's start date
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayQuery = {
      ...userQuery,
      createdAt: { $gte: startOfToday },
    };

    // 2. Fetch today's count
    const dailyCount = await activitiesCollection.countDocuments(todayQuery);
    const dailyQuota = user?.dailyQuota || 50;

    // 3. Fetch all activities for cumulative metrics
    const allActivities = await activitiesCollection
      .find(userQuery)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    let totalSavedBandwidth = 0;
    let totalProcessingTime = 0;
    let validTimeCount = 0;

    allActivities.forEach((act) => {
      if (act.bandwidthSaved && act.bandwidthSaved > 0) {
        totalSavedBandwidth += act.bandwidthSaved;
      } else if (act.originalSize && act.resultSize && act.originalSize > act.resultSize) {
        totalSavedBandwidth += act.originalSize - act.resultSize;
      }

      if (act.processingTimeMs && act.processingTimeMs > 0) {
        totalProcessingTime += act.processingTimeMs;
        validTimeCount++;
      }
    });

    const avgProcessingMs =
      validTimeCount > 0
        ? Math.round(totalProcessingTime / validTimeCount)
        : allActivities.length > 0
        ? 340
        : 0;

    // 4. Fetch saved workflows
    const savedWorkflows = await workflowsCollection
      .find(userQuery)
      .sort({ updatedAt: -1 })
      .toArray();

    const totalWorkflowRuns = savedWorkflows.reduce((acc, wf) => acc + (wf.runsCount || 0), 0);

    // 5. Format recent conversions
    const recentConversions = allActivities.slice(0, 15).map((act) => ({
      id: act._id?.toString(),
      name: act.documentName,
      toolUsed: act.toolName || act.toolId,
      originalSize: act.originalSize || 0,
      resultSize: act.resultSize || act.originalSize || 0,
      bandwidthSaved: act.bandwidthSaved || 0,
      processingTimeMs: act.processingTimeMs || 300,
      status: act.status || "completed",
      createdAt: act.createdAt,
    }));

    const formattedWorkflows = savedWorkflows.map((wf) => ({
      id: wf._id?.toString(),
      name: wf.name,
      description: wf.description,
      steps: wf.steps || [],
      stepsCount: wf.stepsCount || (wf.steps ? wf.steps.length : 0),
      runsCount: wf.runsCount || 0,
      lastRunAt: wf.lastRunAt,
      createdAt: wf.createdAt,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        dailyOperations: {
          current: dailyCount,
          quota: dailyQuota,
          plan: user?.plan || "free",
        },
        savedBandwidthBytes: totalSavedBandwidth,
        customWorkflows: {
          activeCount: savedWorkflows.length,
          totalExecutions: totalWorkflowRuns,
        },
        avgProcessingSpeedMs: avgProcessingMs,
      },
      recentConversions,
      savedWorkflows: formattedWorkflows,
    });
  } catch (err: any) {
    console.error("Dashboard stats error:", err);
    return NextResponse.json({
      success: false,
      error: err.message,
      stats: {
        dailyOperations: { current: 0, quota: 50, plan: "free" },
        savedBandwidthBytes: 0,
        customWorkflows: { activeCount: 0, totalExecutions: 0 },
        avgProcessingSpeedMs: 0,
      },
      recentConversions: [],
      savedWorkflows: [],
    });
  }
}
