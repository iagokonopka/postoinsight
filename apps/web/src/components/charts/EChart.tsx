/**
 * EChart — wrapper React manual para Apache ECharts
 * Gerencia: init, setOption, resize (ResizeObserver), dispose, tema
 * Nunca faz fetch — recebe `option` com dados já processados
 */
import { useEffect, useRef, useCallback } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, ScatterChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { postoinsightTheme, postoinsightThemeDark } from '@/lib/echarts-theme';
import { cn } from '@/lib/utils';

echarts.use([
  BarChart, LineChart, PieChart, ScatterChart,
  GridComponent, TooltipComponent, LegendComponent, MarkLineComponent,
  CanvasRenderer,
]);

echarts.registerTheme('postoinsight', postoinsightTheme);
echarts.registerTheme('postoinsight-dark', postoinsightThemeDark);

interface EChartProps {
  option: EChartsOption;
  height?: number | string;
  loading?: boolean;
  className?: string;
  onChartClick?: (params: echarts.ECElementEvent) => void;
}

export function EChart({ option, height = 300, loading = false, className, onChartClick }: EChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const isDark = document.documentElement.classList.contains('dark');
  const theme = isDark ? 'postoinsight-dark' : 'postoinsight';

  const initChart = useCallback(() => {
    if (!containerRef.current) return;
    chartRef.current?.dispose();
    chartRef.current = echarts.init(containerRef.current, theme);
  }, [theme]);

  useEffect(() => {
    initChart();
    return () => { chartRef.current?.dispose(); chartRef.current = null; };
  }, [initChart]);

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option]);

  useEffect(() => {
    if (!chartRef.current) return;
    loading
      ? chartRef.current.showLoading({ text: '', maskColor: 'transparent' })
      : chartRef.current.hideLoading();
  }, [loading]);

  useEffect(() => {
    if (!chartRef.current || !onChartClick) return;
    chartRef.current.on('click', onChartClick);
    return () => { chartRef.current?.off('click', onChartClick); };
  }, [onChartClick]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => chartRef.current?.resize());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return <div ref={containerRef} className={cn('w-full', className)} style={{ height }} />;
}
