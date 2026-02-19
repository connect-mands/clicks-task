import { Request, Response } from 'express';
import { prisma } from '../prisma.js';

export const track = async (req: Request, res: Response) => {
  console.log('[track] Request received, body:', req.body);
  const { feature_name } = req.body;
  const userId = (req as Request & { user: { id: number } }).user.id;
  console.log('[track] userId:', userId, 'feature_name:', feature_name);

  if (!feature_name || typeof feature_name !== 'string') {
    console.log('[track] Validation failed: feature_name required');
    return res.status(400).json({ error: 'feature_name is required' });
  }

  const click = await prisma.featureClick.create({
    data: {
      userId,
      featureName: feature_name.trim(),
    },
  });
  console.log('[track] Created featureClick:', click.id, click.featureName, click.timestamp);

  res.json({ success: true });
};

export const getAnalytics = async (req: Request, res: Response) => {
  console.log('[getAnalytics] Request received, query:', req.query);
  const { start_date, end_date, age, gender, feature_name } = req.query;
  console.log('[getAnalytics] Parsed params:', { start_date, end_date, age, gender, feature_name });

  const userWhere: { age?: { lt?: number; gte?: number; lte?: number; gt?: number }; gender?: string } = {};
  if (age === '<18') userWhere.age = { lt: 18 };
  else if (age === '18-40') userWhere.age = { gte: 18, lte: 40 };
  else if (age === '>40') userWhere.age = { gt: 40 };
  if (gender) userWhere.gender = gender as string;
  console.log('[getAnalytics] userWhere:', userWhere);

  const timestampWhere: { gte?: Date; lte?: Date } = {};
  if (start_date) timestampWhere.gte = new Date(start_date as string);
  if (end_date) timestampWhere.lte = new Date(end_date as string);
  console.log('[getAnalytics] timestampWhere:', timestampWhere);

  const baseWhere = {
    ...(Object.keys(timestampWhere).length ? { timestamp: timestampWhere } : {}),
    ...(Object.keys(userWhere).length ? { user: userWhere } : {}),
  };
  console.log('[getAnalytics] baseWhere (final):', JSON.stringify(baseWhere, null, 2));

  // Bar chart: group by feature
  console.log('[getAnalytics] Fetching bar chart data...');
  const barRows = await prisma.featureClick.groupBy({
    by: ['featureName'],
    where: baseWhere as never,
    _count: { id: true },
  });
  const barChart = barRows
    .map((r) => ({ feature_name: r.featureName, total_clicks: (r._count as { id: number }).id }))
    .sort((a, b) => b.total_clicks - a.total_clicks);
  console.log('[getAnalytics] barRows count:', barRows.length, '| barChart:', barChart);

  // Line chart: fetch clicks, aggregate by date in JS
  const lineWhere = {
    ...baseWhere,
    ...(feature_name ? { featureName: feature_name as string } : {}),
  };
  console.log('[getAnalytics] lineWhere:', JSON.stringify(lineWhere, null, 2));
  console.log('[getAnalytics] Fetching line chart data...');
  const clicks = await prisma.featureClick.findMany({
    where: lineWhere as never,
    select: { timestamp: true },
  });

  const dateMap: Record<string, number> = {};
  for (const c of clicks) {
    const date = c.timestamp.toISOString().slice(0, 10);
    dateMap[date] = (dateMap[date] || 0) + 1;
  }
  const lineChart = Object.entries(dateMap)
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => a.date.localeCompare(b.date));
  console.log('[getAnalytics] clicks fetched:', clicks.length, '| lineChart points:', lineChart.length, '| lineChart:', lineChart);
  console.log('[getAnalytics] Response ready: barChart', barChart.length, 'items, lineChart', lineChart.length, 'items');

  res.json({ barChart, lineChart });
};
