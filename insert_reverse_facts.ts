import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.VITE_SUPABASE_ANON_KEY as string
)

async function insertReverseFacts() {
  const { data: existingFacts, error } = await supabase.from('facts').select('*')
  if (error) { console.error('Fetch error:', error); return }
  if (!existingFacts) return

  const existingQuestions = new Set(existingFacts.map((f: any) => f.question))
  const originalFacts = existingFacts.filter((f: any) => !f.question.includes('_'))
  console.log('Original facts:', originalFacts.length)

  const reverseFacts: Array<{
    domain: string
    skill: string
    question: string
    answer: number
    strategy: string
  }> = []

  for (const fact of originalFacts) {
    const { domain, skill, question, answer } = fact

    if (domain === 'addition') {
      const parts = question.split(' ')
      const a = parseInt(parts[0])
      const b = parseInt(parts[2])
      const c = answer

      const reverseQuestions = [a + ' + _ = ' + c, '_ + ' + b + ' = ' + c]
      for (let i = 0; i < reverseQuestions.length; i++) {
        const q = reverseQuestions[i]
        if (existingQuestions.has(q)) continue
        const blankVal = i === 0 ? b : a
        reverseFacts.push({
          domain: 'addition',
          skill,
          question: q,
          answer: blankVal,
          strategy: c + ' - ' + (blankVal === b ? a : b) + ' = ' + blankVal + ' -> ' + a + ' + ' + b + ' = ' + c,
        })
      }
    } else if (domain === 'multiplication') {
      const parts = question.split(' ')
      const a = parseInt(parts[0])
      const b = parseInt(parts[2])
      const c = answer

      const reverseQuestions = [a + ' x _ = ' + c, '_ x ' + b + ' = ' + c]
      for (let i = 0; i < reverseQuestions.length; i++) {
        const q = reverseQuestions[i]
        if (existingQuestions.has(q)) continue
        const blankVal = i === 0 ? b : a
        reverseFacts.push({
          domain: 'multiplication',
          skill,
          question: q,
          answer: blankVal,
          strategy: c + ' / ' + (blankVal === b ? a : b) + ' = ' + blankVal + ' -> ' + a + ' x ' + b + ' = ' + c,
        })
      }
    }
  }

  console.log('Reverse facts to insert:', reverseFacts.length)
  if (reverseFacts.length === 0) {
    console.log('Nothing to insert — all reverse facts already exist')
    return
  }

  const { error: insertError, data: inserted } = await supabase
    .from('facts')
    .insert(reverseFacts)
    .select()

  if (insertError) {
    console.error('Insert error:', insertError)
  } else {
    console.log('Inserted:', inserted.length, 'reverse facts')
  }

  const skillCounts: Record<string, number> = {}
  existingFacts.forEach((f: any) => {
    const key = `${f.domain}/${f.skill}`
    skillCounts[key] = (skillCounts[key] || 0) + 1
  })
  console.log('Total facts per skill (after insert):', JSON.stringify(skillCounts, null, 2))
}

insertReverseFacts()
