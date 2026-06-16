import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!)

const generateAdditionFacts = () => {
  const facts: Array<{ domain: string; skill: string; question: string; answer: number; strategy: string }> = []

  for (let a = 1; a <= 9; a++) {
    for (let b = 1; b <= 9; b++) {
      let skill = 'Mixed Addition'
      let strategy = 'Practice and remember this fact.'

      const sum = a + b
      const min = Math.min(a, b)
      const max = Math.max(a, b)

      if (sum === 10) {
        skill = 'Make 10'
        strategy = `${a}+${b} always makes 10!`
      } else if (a === b) {
        skill = 'Doubles'
        strategy = `Double ${a} = ${sum}`
      } else if (max - min === 1 && sum <= 18) {
        skill = 'Near Doubles'
        strategy = `${min}+${min}=${min * 2} → add 1 → ${sum}`
      } else if (a === 9 || b === 9) {
        skill = 'Add 9'
        const other = a === 9 ? b : a
        strategy = `Make 10: 9+${other} → 10+${other - 1} = ${sum}`
      }

      // Normal fact: "a + b" → sum
      facts.push({
        domain: 'addition',
        skill,
        question: `${a} + ${b}`,
        answer: sum,
        strategy,
      })
      // Reverse fact: "a + _ = sum" → b
      facts.push({
        domain: 'addition',
        skill,
        question: `${a} + _ = ${sum}`,
        answer: b,
        strategy: `${sum} - ${a} = ${b} → ${a} + ${b} = ${sum}`,
      })
      // Reverse fact: "_ + b = sum" → a
      facts.push({
        domain: 'addition',
        skill,
        question: `_ + ${b} = ${sum}`,
        answer: a,
        strategy: `${sum} - ${b} = ${a} → ${a} + ${b} = ${sum}`,
      })
    }
  }
  return facts
}

const generateMultiplicationFacts = () => {
  const facts: Array<{ domain: string; skill: string; question: string; answer: number; strategy: string }> = []

  for (let a = 1; a <= 10; a++) {
    for (let b = 1; b <= 10; b++) {
      const skillNumber = b
      let strategy = 'Practice and remember this fact.'

      if (skillNumber === 1) {
        strategy = `Any number × 1 is itself: ${a}×1 = ${a}`
      } else if (skillNumber === 10) {
        strategy = `Add a zero: ${a} → ${a * 10}`
      } else if (skillNumber === 2) {
        strategy = `Double the number: ${a} + ${a} = ${a * 2}`
      } else if (skillNumber === 5) {
        strategy = `Answers end with 0 or 5: ${a}×5 = ${a * 5}`
      } else if (skillNumber === 4) {
        strategy = `Double then double again: ${a}×2=${a * 2}, ${a * 2}×2=${a * 4}`
      } else if (skillNumber === 3) {
        strategy = `Multiply by 2 then add one more group: ${a}×2=${a * 2}, ${a * 2}+${a}=${a * 3}`
      } else if (skillNumber === 6) {
        strategy = `Multiply by 5 then add one more group: ${a}×5=${a * 5}, ${a * 5}+${a}=${a * 6}`
      } else if (skillNumber === 9) {
        const product = a * 9
        const digits = product.toString().split('')
        strategy = `Digits add up to 9: ${digits[0]}+${digits[1]}=9 → ${product}`
      } else if (skillNumber === 7) {
        strategy = `Remember: ${a}×7 = ${a * 7}`
      } else if (skillNumber === 8) {
        strategy = `Remember: ${a}×8 = ${a * 8}`
      }

      const product = a * b

      // Normal fact: "a × b" → product
      facts.push({
        domain: 'multiplication',
        skill: `×${skillNumber}`,
        question: `${a} × ${b}`,
        answer: product,
        strategy,
      })
      // Reverse fact: "a × _ = product" → b
      facts.push({
        domain: 'multiplication',
        skill: `×${skillNumber}`,
        question: `${a} × _ = ${product}`,
        answer: b,
        strategy: `${product} ÷ ${a} = ${b} → ${a} × ${b} = ${product}`,
      })
      // Reverse fact: "_ × b = product" → a
      facts.push({
        domain: 'multiplication',
        skill: `×${skillNumber}`,
        question: `_ × ${b} = ${product}`,
        answer: a,
        strategy: `${product} ÷ ${b} = ${a} → ${a} × ${b} = ${product}`,
      })
    }
  }
  return facts
}

const seed = async () => {
  console.log('Clearing existing children...')
  await supabase.from('children').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log('Seeding children...')
  const { error: childrenError, data: childrenData } = await supabase
    .from('children')
    .insert([
      { name: 'Yudha', avatar: '🦁' },
      { name: 'Lusi', avatar: '🐼' },
      { name: 'Khaula', avatar: '🦊' },
    ])
    .select()

  if (childrenError) console.error('Children error:', childrenError)
  else console.log('Children seeded!', childrenData?.length, 'children')

  console.log('Seeding facts...')
  const additionFacts = generateAdditionFacts()
  const multiplicationFacts = generateMultiplicationFacts()
  const allFacts = [...additionFacts, ...multiplicationFacts]

  console.log(`Addition: ${additionFacts.length}, Multiplication: ${multiplicationFacts.length}, Total: ${allFacts.length}`)

  await supabase.from('facts').delete().neq('id', 0)

  const { error: factsError } = await supabase.from('facts').insert(allFacts)
  if (factsError) {
    console.error('Facts error:', factsError)
  } else {
    console.log(`Successfully seeded ${allFacts.length} facts!`)
  }

  const counts: Record<string, number> = {}
  allFacts.forEach(f => {
    const key = `${f.domain}/${f.skill}`
    counts[key] = (counts[key] || 0) + 1
  })
  console.log('Fact distribution:', JSON.stringify(counts, null, 2))
}

seed()
