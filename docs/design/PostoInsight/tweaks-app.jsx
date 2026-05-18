// tweaks-app.jsx — PostoInsight tweaks panel
const { useEffect } = React;

function applyTweaks(t) {
  document.documentElement.classList.toggle('dark', t.theme === 'dark');
  document.documentElement.classList.toggle('compact', t.density === 'compact');
  document.documentElement.classList.toggle('no-spark', !t.sparklines);
  const accents = {
    blue:    { primary: '204 100% 37%', subtle: '204 100% 95%' },
    indigo:  { primary: '243 75% 58%',  subtle: '243 80% 96%' },
    emerald: { primary: '160 84% 32%',  subtle: '152 81% 96%' },
    rose:    { primary: '350 89% 55%',  subtle: '356 100% 97%' },
  };
  const a = accents[t.accent] || accents.blue;
  document.documentElement.style.setProperty('--primary', a.primary);
  document.documentElement.style.setProperty('--primary-subtle', a.subtle);
  document.documentElement.style.setProperty('--ring', a.primary);
  document.documentElement.style.setProperty('--sidebar-active', a.primary);
}

const ACCENT_HEX = { blue:'#0073BB', indigo:'#4f46e5', emerald:'#059669', rose:'#e11d48' };
const HEX_TO_ACCENT = { '#0073BB':'blue', '#4f46e5':'indigo', '#059669':'emerald', '#e11d48':'rose' };

function TweaksAppRoot() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);

  useEffect(() => {
    applyTweaks(t);
    if (window.PIApp) {
      window.PIApp.getState().chartStyle = t.chartStyle;
      requestAnimationFrame(() => window.PIApp.rerenderCurrent());
    }
  }, [t.theme, t.density, t.sparklines, t.chartStyle, t.accent]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Aparência" />
      <TweakRadio
        label="Tema"
        value={t.theme}
        options={[{ value:'light', label:'Claro' }, { value:'dark', label:'Escuro' }]}
        onChange={(v) => setTweak('theme', v)}
      />
      <TweakRadio
        label="Densidade"
        value={t.density}
        options={[{ value:'comfortable', label:'Confortável' }, { value:'compact', label:'Compacta' }]}
        onChange={(v) => setTweak('density', v)}
      />
      <TweakColor
        label="Cor de marca"
        value={ACCENT_HEX[t.accent] || ACCENT_HEX.blue}
        options={['#0073BB', '#4f46e5', '#059669', '#e11d48']}
        onChange={(hex) => setTweak('accent', HEX_TO_ACCENT[hex] || 'blue')}
      />

      <TweakSection label="Visualizações" />
      <TweakToggle
        label="Sparklines nos KPIs"
        value={t.sparklines}
        onChange={(v) => setTweak('sparklines', v)}
      />
      <TweakRadio
        label="Estilo dos gráficos"
        value={t.chartStyle}
        options={[
          { value:'soft',   label:'Suave' },
          { value:'flat',   label:'Plano' },
          { value:'dashed', label:'Tracejado' },
        ]}
        onChange={(v) => setTweak('chartStyle', v)}
      />

      <TweakSection label="Atalhos" />
      <TweakButton label="Ir para DRE" onClick={() => window.PIApp && window.PIApp.setPage('dre')} />
      <TweakButton label="Simular sincronização" onClick={() => window.PIApp && window.PIApp.runSync(document.getElementById('btn-sync'))} />
    </TweaksPanel>
  );
}

// Apply initial tweaks immediately so first paint is correct
applyTweaks(window.TWEAK_DEFAULTS);

const __mountRoot = document.createElement('div');
__mountRoot.id = '__tweaks-root';
document.body.appendChild(__mountRoot);
ReactDOM.createRoot(__mountRoot).render(<TweaksAppRoot />);
