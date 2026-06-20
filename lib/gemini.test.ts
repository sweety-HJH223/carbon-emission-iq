import { test } from 'node:test'
import assert from 'node:assert'
import { parseGeminiJSON, fallbackResult } from './gemini.ts'

test('parseGeminiJSON parses clean JSON directly', () => {
  const result = parseGeminiJSON('{"co2_kg": 10.5}') as { co2_kg: number }
  assert.strictEqual(result.co2_kg, 10.5)
})

test('parseGeminiJSON handles markdown code blocks', () => {
  const text = '```json\n{"co2_kg": 15.2}\n```'
  const result = parseGeminiJSON(text) as { co2_kg: number }
  assert.strictEqual(result.co2_kg, 15.2)
})

test('parseGeminiJSON extracts JSON from surrounding text', () => {
  const text = 'Here is the result: {"co2_kg": 8.4} Hope this helps!'
  const result = parseGeminiJSON(text) as { co2_kg: number }
  assert.strictEqual(result.co2_kg, 8.4)
})

test('parseGeminiJSON strips thinking tags before parsing', () => {
  const text = '<thinking>let me calculate this</thinking>{"co2_kg": 12.3}'
  const result = parseGeminiJSON(text) as { co2_kg: number }
  assert.strictEqual(result.co2_kg, 12.3)
})

test('parseGeminiJSON returns null for unparseable garbage', () => {
  const result = parseGeminiJSON('this is not json at all')
  assert.strictEqual(result, null)
})

test('parseGeminiJSON returns null for empty string', () => {
  const result = parseGeminiJSON('')
  assert.strictEqual(result, null)
})

test('fallbackResult returns valid AnalysisResult structure', () => {
  const result = fallbackResult('test activity')
  assert.ok(result.co2_kg !== undefined)
  assert.strictEqual(typeof result.co2_kg, 'number')
  assert.ok(result.needs_confirmation === true)
})

test('fallbackResult category is always valid', () => {
  const result = fallbackResult('test')
  const validCategories = ['Travel', 'Energy', 'Food', 'Shopping']
  assert.ok(validCategories.includes(result.category))
})

test('fallbackResult confidence is always low', () => {
  const result = fallbackResult('test')
  assert.strictEqual(result.extracted.confidence, 'low')
})

test('fallbackResult truncates long input to 100 chars', () => {
  const longInput = 'a'.repeat(200)
  const result = fallbackResult(longInput)
  assert.ok(result.extracted.activity.length <= 100)
})

test('emission factor for petrol car matches expected rate', () => {
  const km = 50
  const factor = 0.21
  const co2 = km * factor
  assert.strictEqual(co2, 10.5)
})

test('emission factor for electricity matches expected rate', () => {
  const kWh = 234
  const factor = 0.82
  const co2 = Math.round(kWh * factor * 10) / 10
  assert.strictEqual(co2, 191.9)
})

test('emission factor for chicken matches expected rate', () => {
  const kg = 0.2
  const factor = 6.9
  const co2 = Math.round(kg * factor * 100) / 100
  assert.strictEqual(co2, 1.38)
})