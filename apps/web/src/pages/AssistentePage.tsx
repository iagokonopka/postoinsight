import { Sparkles } from 'lucide-react'
import { Page, Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

export default function AssistentePage() {
  return (
    <Page>
      <PageHeader eyebrow="Assistente" title="Pergunte sobre sua rede" />
      <Card>
        <div style={{ padding: '40px var(--pad-card)' }}>
          <EmptyState
            icon={<Sparkles size={22} />}
            title="Disponível em breve"
            description="O assistente vai traduzir suas perguntas nas consultas reais da rede — sem inventar número. Em construção."
          />
        </div>
      </Card>
    </Page>
  )
}
