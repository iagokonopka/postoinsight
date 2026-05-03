import { useAuth } from '@/hooks/use-auth';
import { SectionCard } from '@/components/ui/SectionCard';
import { APP_NAME } from '@/lib/config';

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="page-content">
      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: 'var(--text-heading)', fontWeight: 500, color: 'var(--color-text)', margin: '0 0 2px', letterSpacing: '-0.01em' }}>
          Configurações
        </h1>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>
          Preferências da conta e do tenant
        </p>
      </div>

      {/* Perfil */}
      <SectionCard title="Meu Perfil">
        <div style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--color-cta)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {user?.name?.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase() ?? '?'}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{user?.email}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginTop: 2 }}>
                Role: <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>{user?.role}</span>
              </div>
            </div>
          </div>

          <div style={{
            padding: '10px 14px',
            background: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: 12, color: 'var(--color-text-muted)',
          }}>
            Edição de perfil e alteração de senha estão disponíveis no roadmap pós-MVP.
          </div>
        </div>
      </SectionCard>

      {/* Informações do plano */}
      <SectionCard title="Plano e Acesso">
        <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SettingRow label="Plataforma"   value={APP_NAME} />
          <SettingRow label="Tenant ID"    value={user?.tenantId ?? '—'} mono />
          <SettingRow label="Location ID"  value={user?.locationId ?? 'Acesso global'} mono={!!user?.locationId} />
          <SettingRow label="Plataforma"   value={user?.platformRole ?? 'Usuário padrão'} />
        </div>
      </SectionCard>

      {/* Integrações — placeholder pós-MVP */}
      <SectionCard title="Integrações">
        <div style={{ padding: 'var(--space-5)' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {[
              { label: 'ERP Status',   status: 'Conectado via agente' },
              { label: 'ERP WebPosto', status: 'Configuração pendente' },
            ].map((item) => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px',
                background: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}>
                <span style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500 }}>{item.label}</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{item.status}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--color-text-subtle)' }}>
            Gerenciamento completo de integrações disponível no roadmap pós-MVP.
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function SettingRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--color-border-subtle)' }}>
      <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{
        fontSize: 12,
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        color: 'var(--color-text)',
        fontWeight: mono ? 500 : 400,
      }}>
        {value}
      </span>
    </div>
  );
}