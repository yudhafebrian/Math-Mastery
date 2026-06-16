import { createClient } from '@supabase/supabase-js'

const check = async () => {
  const supabase = createClient(
    'https://mzvvjfexmzuikxlvocjf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16dnZqZmV4bXp1aWt4bHZvY2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0ODM4NzMsImV4cCI6MjA5NzA1OTg3M30.3r0qSfkacNdGA4MvikVNOPtFxvxxaX-rd_e9EypYOrU'
  )

  const { data: facts } = await supabase.from('facts').select('*').order('domain').order('skill').order('id')
  const counts: Record<string, number> = {}
  facts?.forEach((f: any) => {
    const key = `${f.domain}/${f.skill}`
    counts[key] = (counts[key] || 0) + 1
  })
  console.log('Total:', facts?.length)
  console.log(JSON.stringify(counts, null, 2))
}

check()
