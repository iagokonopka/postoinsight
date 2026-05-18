/**
 * AppLayout — shell principal das páginas autenticadas
 * Referência visual: design_example/postoinsight/PostoInsight.html
 *
 * Estrutura:
 *   [Sidebar (esquerda, fixa)] + [coluna direita]
 *     [Topbar (light, h-[54px], com filtros globais)]
 *     [main: overflow-y-auto, padding 24px]
 *       [PageHeader da página — dentro do main, gerenciado por cada página]
 *       [conteúdo da página]
 */
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — fixa à esquerda */}
      <Sidebar />

      {/* Coluna direita — Topbar + conteúdo */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar />

        {/* Área de conteúdo — scroll independente, padding padrão 24px */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}