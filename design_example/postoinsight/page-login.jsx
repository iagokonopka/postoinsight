// page-login.jsx
function PageLogin({ onLogin }) {
  var email = React.useState('admin@redejam.com.br');
  var setEmail = email[1]; email = email[0];
  var pass = React.useState('••••••••');
  var setPass = pass[1]; pass = pass[0];
  var loading = React.useState(false);
  var setLoading = loading[1]; loading = loading[0];

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(function() { setLoading(false); onLogin(); }, 900);
  }

  return React.createElement('div', {
    style: {
      minHeight: '100vh', background: 'var(--color-bg-subtle)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }
  },
    React.createElement('div', { style: { width: 380 } },
      // Logo
      React.createElement('div', { style: { textAlign: 'center', marginBottom: 32 } },
        React.createElement('div', { style: {
          width: 48, height: 48, borderRadius: 14, background: 'var(--color-primary)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
        }},
          React.createElement('svg', { width: 24, height: 24, fill: 'none', stroke: 'white', strokeWidth: 2, viewBox: '0 0 24 24' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', d: 'M13 10V3L4 14h7v7l9-11h-7z' })
          )
        ),
        React.createElement('h1', { style: { fontSize: 22, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 4px', letterSpacing: '-0.03em' } }, window.MOCK.APP_NAME),
        React.createElement('p', { style: { fontSize: 13, color: 'var(--color-text-muted)', margin: 0 } }, window.MOCK.APP_TAGLINE)
      ),
      // Card
      React.createElement('div', { style: {
        background: 'var(--color-bg)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)', boxShadow: 'var(--shadow-md)',
      }},
        React.createElement('h2', { style: { fontSize: 16, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 20px' } }, 'Entrar na sua conta'),
        React.createElement('form', { onSubmit: handleSubmit },
          // Email
          React.createElement('div', { style: { marginBottom: 14 } },
            React.createElement('label', { style: { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 6 } }, 'E-mail'),
            React.createElement('input', {
              type: 'email', value: email, onChange: function(e) { setEmail(e.target.value); },
              style: {
                width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                color: 'var(--color-text)', fontFamily: 'inherit', fontSize: 13, outline: 'none',
                transition: 'border-color 0.12s',
              }
            })
          ),
          // Password
          React.createElement('div', { style: { marginBottom: 20 } },
            React.createElement('label', { style: { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 6 } }, 'Senha'),
            React.createElement('input', {
              type: 'password', value: pass, onChange: function(e) { setPass(e.target.value); },
              style: {
                width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                color: 'var(--color-text)', fontFamily: 'inherit', fontSize: 13, outline: 'none',
              }
            })
          ),
          // Submit
          React.createElement('button', {
            type: 'submit',
            style: {
              width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: 'none',
              background: loading ? 'var(--color-primary-hover)' : 'var(--color-primary)',
              color: 'white', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.12s',
            }
          }, loading ? 'Entrando…' : 'Entrar')
        ),
        React.createElement('p', { style: { textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--color-text-muted)' } },
          React.createElement('a', { href: '#', style: { color: 'var(--color-primary)', textDecoration: 'none' } }, 'Esqueci minha senha'),
          React.createElement('span', { style: { fontSize: 10, color: 'var(--color-text-subtle)', marginLeft: 4 } }, '(pós-MVP)')
        )
      )
    )
  );
}
Object.assign(window, { PageLogin });
