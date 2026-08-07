import { memo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useTheme } from '@/hooks/use-theme';

/**
 * Recharts renders plain SVG presentational attributes, and `var(--token)`
 * strings do not reliably repaint when the `.dark` class toggles later
 * (confirmed manually: charts went blank after a theme switch). Resolving
 * literal hex values from the current theme instead makes color a real prop
 * change, so React (and therefore Recharts) re-renders correctly.
 */
const LIGHT_PALETTE = {
  primary: '#2563eb',
  destructive: '#dc2626',
  border: '#dbe3ee',
  muted: '#64748b',
  popover: '#ffffff',
  popoverForeground: '#0f172a',
};

const DARK_PALETTE = {
  primary: '#0ea5e9',
  destructive: '#f87171',
  border: '#2c3746',
  muted: '#94a3b8',
  popover: '#13233f',
  popoverForeground: '#f8fafc',
};

type DashboardChartColorToken = 'primary' | 'destructive';

interface DashboardChartSeries {
  key: string;
  label: string;
  color: DashboardChartColorToken;
}

interface DashboardChartProps {
  type: 'area' | 'bar';
  data: readonly unknown[];
  xKey: string;
  series: DashboardChartSeries[];
  description: string;
  height?: number;
}

function DashboardChartComponent({
  type,
  data,
  xKey,
  series,
  description,
  height = 300,
}: DashboardChartProps) {
  const { theme } = useTheme();
  const palette = theme === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;

  return (
    <div role="img" aria-label={description} className="w-full min-w-0" style={{ height }}>
      <span className="sr-only">{description}</span>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'area' ? (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={palette.border} />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12, fill: palette.muted }}
              stroke={palette.border}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: palette.muted }}
              stroke={palette.border}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: palette.popover,
                borderColor: palette.border,
                color: palette.popoverForeground,
                fontSize: 12,
              }}
            />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {series.map((item) => (
              <Area
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={palette[item.color]}
                fill={palette[item.color]}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={palette.border} />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12, fill: palette.muted }}
              stroke={palette.border}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: palette.muted }}
              stroke={palette.border}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: palette.popover,
                borderColor: palette.border,
                color: palette.popoverForeground,
                fontSize: 12,
              }}
            />
            {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
            {series.map((item) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.label}
                fill={palette[item.color]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export const DashboardChart = memo(DashboardChartComponent);
