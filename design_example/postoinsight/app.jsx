// app.jsx — Root App v3
function App() {
  var theme = React.useState(localStorage.getItem('pi_theme') || 'light');
  var setThemeRaw = theme[1]; theme = theme[0];
  function setTheme(t) {
    setThemeRaw(t);
    localStorage.setItem('pi_theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }
  React.useEffect(function() {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  var authed = React.useState(false); var setAuthed = authed[1]; authed = authed[0];
  var page = React.useState('dashboard'); var setPage = page[1]; page = page[0];
  var periodo = React.useState('mes'); var setPeriodo = periodo[1]; periodo = periodo[0];
  var location = React.useState('all'); var setLocation = location[1]; location = location[0];
  var sidebarCollapsed = React.useState(false); var setSidebarCollapsed = sidebarCollapsed[1]; sidebarCollapsed = sidebarCollapsed[0];
  var tweaksVisible = React.useState(false); var setTweaksVisible = tweaksVisible[1]; tweaksVisible = tweaksVisible[0];
  var syncNotif = React.useState(null); var setSyncNotif = syncNotif[1]; syncNotif = syncNotif[0];

  var TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "theme": "light",
    "density": "regular"
  }/*EDITMODE-END*/;
  var tweaksState = useTweaks(TWEAK_DEFAULTS);
  var tweaks = tweaksState[0]; var setTweak = tweaksState[1];

  var PAGE_META = {
    dashboard:    { title: 'Visão Geral de Vendas',    subtitle: 'Rede JAM · Abril 2026' },
    combustivel:  { title: 'Dashboard de Combustível', subtitle: 'Volume, receita e margem por produto' },
    conveniencia: { title: 'Dashboard de Conveniência',subtitle: 'Loja: conveniência, lubrificantes e serviços' },
    dre:          { title: 'DRE Mensal',               subtitle: 'Demonstrativo de Resultado — Margem Bruta' },
    sync:         { title: 'Sincronização',            subtitle: 'Status dos conectores e histórico de syncs' },
    settings:     { title: 'Configurações',            subtitle: 'Perfil, unidades, usuários e integrações' },
  };
  var meta = PAGE_META[page] || PAGE_META.dashboard;

  function handleSyncNow() {
    setSyncNotif('Sincronização iniciada…');
    setTimeout(function() { setSyncNotif('Sync concluído — 4 unidades atualizadas.'); }, 2000);
    setTimeout(function() { setSyncNotif(null); }, 5000);
  }

  var sidebarW = sidebarCollapsed ? 0 : 'var(--sidebar-width)';

  if (!authed) {
    return React.createElement(React.Fragment, null,
      React.createElement(PageLogin, { onLogin: function() { setAuthed(true); } })
    );
  }

  return React.createElement(React.Fragment, null,
    React.createElement('style', null,
      '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'
    ),

    // Topbar (fixed, full width)
    React.createElement(Topbar, {
      periodo: periodo, onPeriodo: setPeriodo,
      location: location, onLocation: setLocation,
      onSyncNow: handleSyncNow,
      sidebarCollapsed: sidebarCollapsed,
      onToggleSidebar: function() { setSidebarCollapsed(!sidebarCollapsed); },
    }),

    // Body below topbar
    React.createElement('div', { style: { display: 'flex', paddingTop: 'var(--topbar-height)', minHeight: '100vh' } },

      // Sidebar
      React.createElement(Sidebar, {
        page: page, onNavigate: setPage,
        theme: theme, onThemeToggle: function() { setTheme(theme === 'dark' ? 'light' : 'dark'); },
        collapsed: sidebarCollapsed,
      }),

      // Main content
      React.createElement('div', {
        style: {
          marginLeft: sidebarCollapsed ? 0 : 'var(--sidebar-width)',
          flex: 1, display: 'flex', flexDirection: 'column',
          minHeight: 'calc(100vh - var(--topbar-height))',
          background: 'var(--color-bg-subtle)',
          transition: 'margin-left .2s',
        }
      },
        // Sync notification banner
        syncNotif && React.createElement('div', {
          style: {
            background: 'var(--color-info-subtle)',
            borderBottom: '1px solid var(--color-border)',
            padding: '8px var(--space-8)', fontSize: 12,
            color: 'var(--color-info)',
            display: 'flex', alignItems: 'center', gap: 8,
          }
        },
          React.createElement('svg', { width: 12, height: 12, fill: 'none', stroke: 'currentColor', strokeWidth: 2, viewBox: '0 0 24 24' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' })
          ),
          syncNotif
        ),

        // Page header
        React.createElement(Header, { title: meta.title, subtitle: meta.subtitle }),

        // Page content
        React.createElement('main', { style: { flex: 1 } },
          page === 'dashboard'    && React.createElement(PageVendas),
          page === 'combustivel'  && React.createElement(PageCombustivel),
          page === 'conveniencia' && React.createElement(PageConveniencia),
          page === 'dre'          && React.createElement(PageDRE),
          page === 'sync'         && React.createElement(PageSync),
          page === 'settings'     && React.createElement(PageSettings)
        )
      )
    ),

    // Tweaks panel
    React.createElement(TweaksPanel, { visible: tweaksVisible, onClose: function() { setTweaksVisible(false); } },
      React.createElement(TweakSection, { title: 'Aparência' },
        React.createElement(TweakRadio, {
          label: 'Tema', value: tweaks.theme,
          options: [{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }],
          onChange: function(v) { setTweak('theme', v); setTheme(v); }
        }),
        React.createElement(TweakRadio, {
          label: 'Densidade', value: tweaks.density,
          options: [{ value: 'regular', label: 'Regular' }, { value: 'compact', label: 'Compacto' }],
          onChange: function(v) { setTweak('density', v); }
        })
      ),
      React.createElement(TweakSection, { title: 'Navegação rápida' },
        Object.keys(PAGE_META).map(function(p) {
          return React.createElement(TweakButton, { key: p, label: PAGE_META[p].title, onClick: function() { setPage(p); } });
        })
      )
    )
  );
}

var root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
