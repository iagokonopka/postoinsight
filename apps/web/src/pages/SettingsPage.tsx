/**
 * SettingsPage — /settings
 * Configurações do tenant: perfil, integração, locations e usuários.
 *
 * Layout: grid 2-col em desktop, 1-col em mobile.
 *  Coluna 1: TenantCard, ERPCard, ChangePasswordCard
 *  Coluna 2: LocationsCard (com toggle multi-location p/ owner), UsersCard
 *
 * Acesso ao toggle multi-location: apenas owner (FRONTEND_SPEC §4.1).
 */
import { useState, type FormEvent } from 'react';
import {
  Building2, Database, MapPin, Users, KeyRound, Loader2, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/api';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/kpi/SectionCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

/* ─── Card: Perfil do Tenant ──────────────────────────────── */

function TenantCard() {
  const { user } = useAuth();
  const { locations } = useTenant();

  const tenantName = locations[0]?.name?.split(' ')[0] ?? 'PostoInsight';

  return (
    <SectionCard
      title="Conta"
      description="Dados do tenant e do usuário atual."
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white"
            style={{ background: 'linear-gradient(135deg, #0073BB, #6B40C4)' }}
          >
            <Building2 size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-foreground">{tenantName}</p>
            <p className="text-[12px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[12px]">
          <div>
            <p className="text-muted-foreground">Função</p>
            <p className="font-medium text-foreground mt-0.5">
              {user?.role === 'owner'   ? 'Proprietário' :
               user?.role === 'manager' ? 'Gerente'      :
               user?.role === 'viewer'  ? 'Visualizador' :
               '—'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Unidades conectadas</p>
            <p className="font-medium text-foreground mt-0.5 tabular-nums">{locations.length}</p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

/* ─── Card: Integração ERP ────────────────────────────────── */

function ERPCard() {
  return (
    <SectionCard
      title="Integração ERP"
      description="Status do agente que coleta dados do seu ERP."
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[hsl(var(--primary))]"
          style={{ background: 'hsl(var(--primary) / 0.1)' }}
        >
          <Database size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold text-foreground">Conector ativo</p>
            <Badge className="text-[10px]">Status ERP</Badge>
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">
            Os agentes são instalados nos servidores RDP dos clientes e enviam dados via WebSocket.
            A configuração inicial é feita pela equipe PostoInsight no onboarding.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-border bg-muted/30 p-3 text-[12px] text-muted-foreground">
        Para reconfigurar credenciais ou trocar o servidor de origem, entre em contato com o suporte.
      </div>
    </SectionCard>
  );
}

/* ─── Card: Locations ─────────────────────────────────────── */

function LocationsCard() {
  const { locations, multiLocationEnabled, setMultiLocationEnabled, locationCount } = useTenant();
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  return (
    <SectionCard
      title="Unidades"
      description="Locations conectadas ao tenant."
    >
      {locations.length === 0 ? (
        <EmptyState
          icon={<MapPin size={18} />}
          title="Nenhuma unidade conectada"
          description="Conecte a primeira unidade no processo de onboarding."
          compact
        />
      ) : (
        <div className="flex flex-col gap-2">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground"
                  style={{ background: 'hsl(var(--muted) / 0.6)' }}
                >
                  <MapPin size={14} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-foreground">{loc.name}</p>
                  {loc.source_location_id && (
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      CD_ESTAB · {loc.source_location_id}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px]">Ativa</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Toggle multi-location — apenas owner com 2+ locations */}
      {isOwner && locationCount > 1 && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-md border border-border bg-muted/30 p-3">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground">Visão multi-unidade</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Habilita comparativos entre unidades nas telas analíticas.
            </p>
          </div>
          <Switch
            checked={multiLocationEnabled}
            onCheckedChange={setMultiLocationEnabled}
            className="mt-0.5"
          />
        </div>
      )}
    </SectionCard>
  );
}

/* ─── Card: Usuários ──────────────────────────────────────── */

function UsersCard() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  if (!isOwner) {
    return (
      <SectionCard
        title="Usuários"
        description="Acesso restrito ao proprietário."
      >
        <EmptyState
          icon={<ShieldCheck size={18} />}
          title="Apenas para proprietários"
          description="A gestão de usuários do tenant é exclusiva do dono da rede."
          compact
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Usuários"
      description="Convide colegas para acessar os dashboards."
    >
      <div className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #0073BB, #6B40C4)' }}
        >
          {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-foreground">
            {user?.name ?? user?.email}
          </p>
          <p className="text-[11px] text-muted-foreground">Proprietário · Você</p>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-dashed border-border p-4 text-center">
        <Users size={18} className="mx-auto mb-2 text-muted-foreground" />
        <p className="text-[13px] font-medium text-foreground">Convites em breve</p>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          A gestão de gerentes e visualizadores estará disponível em breve.
        </p>
      </div>
    </SectionCard>
  );
}

/* ─── Card: Trocar senha ──────────────────────────────────── */

function ChangePasswordCard() {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (next.length < 8) {
      toast.error('Senha muito curta', 'Use pelo menos 8 caracteres.');
      return;
    }
    if (next !== confirm) {
      toast.error('Senhas não conferem', 'A confirmação precisa ser igual à nova senha.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: current,
        new_password:     next,
      });
      toast.success('Senha atualizada', 'Use a nova senha no próximo login.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao trocar a senha.';
      toast.error('Não foi possível trocar a senha', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard
      title="Segurança"
      description="Troque sua senha periodicamente."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="current-password">Senha atual</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password">Nova senha</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            disabled={loading}
            required
            minLength={8}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-password">Confirmar nova senha</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading}
            required
            minLength={8}
          />
        </div>
        <Button type="submit" disabled={loading} className="mt-1 self-start">
          {loading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <KeyRound size={14} className="mr-1.5" />}
          Atualizar senha
        </Button>
      </form>
    </SectionCard>
  );
}

/* ─── Page ────────────────────────────────────────────────── */

export function SettingsPage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        title="Configurações"
        subtitle="Perfil, integração e usuários do tenant."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <TenantCard />
          <ERPCard />
          <ChangePasswordCard />
        </div>
        <div className="flex flex-col gap-6">
          <LocationsCard />
          <UsersCard />
        </div>
      </div>
    </div>
  );
}
