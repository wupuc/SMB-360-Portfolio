import { isDemoMode } from '@/lib/demo/data'
import { fetchWorkloadData } from '@/lib/supabase/projecthub-server'
import type { WorkloadUser, WorkloadTask } from '@/lib/supabase/projecthub-server'
import { WorkloadPageClient } from './page-client'

const demoUsers: WorkloadUser[] = [
  { id: 'u1', first_name: 'Anna',   last_name: 'Kowalska',   role: 'admin'    },
  { id: 'u2', first_name: 'Piotr',  last_name: 'Nowak',      role: 'manager'  },
  { id: 'u3', first_name: 'Marta',  last_name: 'Wisniewski',  role: 'employee' },
  { id: 'u4', first_name: 'Tomasz', last_name: 'Kowalczyk',  role: 'employee' },
]

function d(n: number) {
  const dt = new Date('2026-03-28')
  dt.setDate(dt.getDate() + n)
  return dt.toISOString().split('T')[0]
}

const demoTasks: WorkloadTask[] = [
  { id: 'wt-01', title: 'Konfiguracja VPC',            priority: 'high',   status: 'in_progress', due_date: d(0),  estimated_hours: 6, project_name: 'Migracja AWS',         user_id: 'u1' },
  { id: 'wt-02', title: 'Backup przed migracja',       priority: 'urgent', status: 'todo',        due_date: d(0),  estimated_hours: 5, project_name: 'Migracja AWS',         user_id: 'u2' },
  { id: 'wt-03', title: 'Migracja bazy danych',        priority: 'urgent', status: 'todo',        due_date: d(1),  estimated_hours: 8, project_name: 'Migracja AWS',         user_id: 'u2' },
  { id: 'wt-04', title: 'Konfiguracja CI/CD',          priority: 'medium', status: 'review',      due_date: d(1),  estimated_hours: 4, project_name: 'Migracja AWS',         user_id: 'u3' },
  { id: 'wt-05', title: 'Testy bezpieczenstwa',        priority: 'high',   status: 'todo',        due_date: d(2),  estimated_hours: 5, project_name: 'Portal B2B',           user_id: 'u1' },
  { id: 'wt-06', title: 'Dokumentacja API',            priority: 'low',    status: 'todo',        due_date: d(2),  estimated_hours: 3, project_name: 'Portal B2B',           user_id: 'u3' },
  { id: 'wt-07', title: 'Monitoring CloudWatch',       priority: 'medium', status: 'todo',        due_date: d(2),  estimated_hours: 5, project_name: 'Migracja AWS',         user_id: 'u4' },
  { id: 'wt-08', title: 'Deploy na staging',           priority: 'urgent', status: 'todo',        due_date: d(3),  estimated_hours: 4, project_name: 'Portal B2B',           user_id: 'u2' },
  { id: 'wt-09', title: 'Konfiguracja SSO',            priority: 'high',   status: 'todo',        due_date: d(3),  estimated_hours: 5, project_name: 'TechCorp Integration', user_id: 'u4' },
  { id: 'wt-10', title: 'Analiza wymagan CRM',         priority: 'medium', status: 'todo',        due_date: d(3),  estimated_hours: 4, project_name: 'Migracja CRM',         user_id: 'u3' },
  { id: 'wt-11', title: 'UAT z klientem TechCorp',    priority: 'high',   status: 'todo',        due_date: d(4),  estimated_hours: 6, project_name: 'TechCorp Integration', user_id: 'u2' },
  { id: 'wt-12', title: 'Code review sprint 2',       priority: 'medium', status: 'todo',        due_date: d(4),  estimated_hours: 3, project_name: 'Migracja AWS',         user_id: 'u1' },
  { id: 'wt-13', title: 'Prezentacja dla zarzadu',    priority: 'urgent', status: 'todo',        due_date: d(5),  estimated_hours: 4, project_name: 'Portal B2B',           user_id: 'u1' },
  { id: 'wt-14', title: 'Poprawki po UAT',             priority: 'high',   status: 'todo',        due_date: d(5),  estimated_hours: 6, project_name: 'TechCorp Integration', user_id: 'u3' },
  { id: 'wt-15', title: 'Walidacja danych staging',   priority: 'high',   status: 'todo',        due_date: d(5),  estimated_hours: 6, project_name: 'Migracja CRM',         user_id: 'u2' },
  { id: 'wt-16', title: 'Skrypty ETL',                priority: 'high',   status: 'todo',        due_date: d(6),  estimated_hours: 8, project_name: 'Migracja CRM',         user_id: 'u3' },
  { id: 'wt-17', title: 'Release notes',              priority: 'low',    status: 'todo',        due_date: d(6),  estimated_hours: 2, project_name: 'Portal B2B',           user_id: 'u4' },
  { id: 'wt-18', title: 'Onboarding Retail Plus',     priority: 'medium', status: 'in_progress', due_date: d(-1), estimated_hours: 3, project_name: 'Retail Plus',          user_id: 'u1' },
]

export default async function WorkloadPage() {
  if (isDemoMode) {
    return <WorkloadPageClient initialUsers={demoUsers} initialTasks={demoTasks} today="2026-03-28" />
  }
  const { users, tasks } = await fetchWorkloadData()
  const today = new Date().toISOString().split('T')[0]
  return <WorkloadPageClient initialUsers={users} initialTasks={tasks} today={today} />
}
