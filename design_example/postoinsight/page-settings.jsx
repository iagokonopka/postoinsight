// page-settings.jsx
function PageSettings() {
  var tab = React.useState('profile'); var setTab = tab[1]; tab = tab[0];
  var TABS = [
    { id: 'profile', label: 'Perfil', access: 'all' },
    { id: 'locations', label: 'Unidades', access: 'owner' },
    { id: 'users', label: 'Usuários', access: 'owner' },
    { id: 'integrations', label: 'Integrações', access: 'owner' },
  ];

  return React.createElement('div', { style: { display: 'flex', gap: 0, minHeight: 'calc(100vh - 61px)' } },
    // Sub-nav
    React.createElement('div', { style: { width: 200, borderRight: '1px solid var(--color-border)', padding: '20px 10px', background: 'var(--color-bg-subtle)', flexShrink: 0 } },
      TABS.map(function(t) {
        var active = tab === t.id;
        return React.createElement('button', { key: t.id, onClick: function() { setTab(t.id); },
          style: {
            width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
            borderRadius: 'var(--radius-md)', border: 'none', textAlign: 'left', fontFamily: 'inherit',
            fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', marginBottom: 2,
            background: active ? 'var(--color-primary-subtle)' : 'transparent',
            color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }
        }, t.label, t.access === 'owner' && React.createElement('span', { style: { marginLeft: 'auto', fontSize: 9, color: 'var(--color-text-subtle)', fontWeight: 400 } }, 'owner'));
      })
    ),
    // Content
    React.createElement('div', { style: { flex: 1, padding: 'var(--space-6) var(--space-8)' } },
      tab === 'profile' && React.createElement('div', { style: { maxWidth: 480 } },
        React.createElement('h2', { style: { fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 20 } }, 'Perfil'),
        React.createElement(SectionCard, null,
          React.createElement('div', { style: { padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 16 } },
            [['Nome completo','Iago Konopka'],['E-mail','admin@redejam.com.br (somente leitura)'],['Cargo','Proprietário']].map(function(f) {
              return React.createElement('div', { key: f[0] },
                React.createElement('label', { style: { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 6 } }, f[0]),
                React.createElement('input', { defaultValue: f[1], readOnly: f[0] === 'E-mail',
                  style: { width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: f[0] === 'E-mail' ? 'var(--color-bg-muted)' : 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'inherit', fontSize: 13, outline: 'none' }
                })
              );
            }),
            React.createElement('button', { style: { alignSelf: 'flex-start', padding: '8px 18px', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--color-primary)', color: 'white', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' } }, 'Salvar alterações')
          )
        )
      ),
      tab === 'locations' && React.createElement('div', null,
        React.createElement('h2', { style: { fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 20 } }, 'Unidades'),
        React.createElement(SectionCard, null,
          window.MOCK.LOCATIONS.map(function(loc, idx) {
            return React.createElement('div', { key: loc.id, style: { display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px', alignItems: 'center', gap: 16, padding: '0 var(--space-5)', height: 'var(--table-row-height)', borderBottom: idx < window.MOCK.LOCATIONS.length-1 ? '1px solid var(--color-border)' : 'none' } },
              React.createElement('div', { style: { fontSize: 13, fontWeight: 500, color: 'var(--color-text)' } }, loc.nome),
              React.createElement('div', { style: { fontSize: 12, color: 'var(--color-text-muted)' } }, loc.erp),
              React.createElement(StatusBadge, { status: loc.status === 'online' ? 'online' : 'offline' }),
              React.createElement('div', { style: { textAlign: 'right', fontSize: 11, color: 'var(--color-text-subtle)' } }, 'Somente leitura')
            );
          })
        )
      ),
      tab === 'users' && React.createElement('div', null,
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 } },
          React.createElement('h2', { style: { fontSize: 16, fontWeight: 600, color: 'var(--color-text)', margin: 0 } }, 'Usuários'),
          React.createElement('button', { disabled: true, style: { padding: '7px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-muted)', color: 'var(--color-text-subtle)', fontFamily: 'inherit', fontSize: 12, cursor: 'not-allowed' }, title: 'Em breve' }, '+ Convidar usuário')
        ),
        React.createElement(SectionCard, null,
          [['Iago Konopka','admin@redejam.com.br','owner','Todas'],['Carlos Mendes','carlos@redejam.com.br','manager','JAM Centro'],['Ana Lima','ana@consultoria.com','viewer','Todas']].map(function(u, idx) {
            return React.createElement('div', { key: idx, style: { display: 'grid', gridTemplateColumns: '1fr 200px 90px 120px', alignItems: 'center', gap: 16, padding: '0 var(--space-5)', height: 'var(--table-row-height)', borderBottom: idx < 2 ? '1px solid var(--color-border)' : 'none' } },
              React.createElement('div', null,
                React.createElement('div', { style: { fontSize: 13, fontWeight: 500, color: 'var(--color-text)' } }, u[0]),
                React.createElement('div', { style: { fontSize: 11, color: 'var(--color-text-muted)' } }, u[1])
              ),
              React.createElement('div', { style: { fontSize: 11, color: 'var(--color-text-muted)' } }, u[1]),
              React.createElement('span', { style: { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: 'var(--color-primary-subtle)', color: 'var(--color-primary)' } }, u[2]),
              React.createElement('div', { style: { fontSize: 11, color: 'var(--color-text-muted)' } }, u[3])
            );
          })
        )
      ),
      tab === 'integrations' && React.createElement('div', null,
        React.createElement('h2', { style: { fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 20 } }, 'Integrações'),
        React.createElement(SectionCard, null,
          window.MOCK.LOCATIONS.map(function(loc, idx) {
            return React.createElement('div', { key: loc.id, style: { display: 'grid', gridTemplateColumns: '1fr 100px 100px 140px', alignItems: 'center', gap: 16, padding: '0 var(--space-5)', height: 'var(--table-row-height)', borderBottom: idx < window.MOCK.LOCATIONS.length-1 ? '1px solid var(--color-border)' : 'none' } },
              React.createElement('div', { style: { fontSize: 13, fontWeight: 500, color: 'var(--color-text)' } }, loc.nome),
              React.createElement('div', { style: { fontSize: 12, color: 'var(--color-text-muted)' } }, loc.erp + ' ERP'),
              React.createElement(StatusBadge, { status: loc.status }),
              React.createElement('div', { style: { textAlign: 'right', fontSize: 11, color: 'var(--color-text-subtle)' } }, 'Somente leitura no MVP')
            );
          })
        )
      )
    )
  );
}
Object.assign(window, { PageSettings });
