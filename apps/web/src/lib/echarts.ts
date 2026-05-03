// Imports seletivos do ECharts para tree-shaking (ADR-011)
// Nunca importar 'echarts' diretamente nas páginas — usar os componentes em
// src/components/charts/ que encapsulam a config.

import * as echarts from 'echarts/core';
import {
  LineChart,
  BarChart,
} from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Registra os componentes necessários
echarts.use([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

// Tema global — paleta alinhada aos tokens de design
export const ECHARTS_THEME = {
  color: [
    '#0073BB', // combustivel / primary
    '#EC7211', // cta / conveniencia
    '#1D8102', // servicos / success
    '#6B40C4', // lubrificantes
    '#D13212', // danger
    '#8D6708', // warning
  ],
};

export { echarts };