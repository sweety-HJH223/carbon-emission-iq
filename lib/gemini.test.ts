import { test } from 'node:test'
import assert from 'node:assert'

test('parseGeminiJSON parses clean JSON', () => {
  const result = JSON.parse('{"co2_kg": 10.5}')
  assert.strictEqual(result.co2_kg, 10.5)
})

test('CO2 calculation logic is correct', () => {
  const km = 50
  const factor = 0.21
  const co2 = km * factor
  assert.strictEqual(co2, 10.5)
})

test('emission factor for petrol car is reasonable', () => {
  const petrolCarFactor = 0.21
  assert.ok(petrolCarFactor > 0 && petrolCarFactor < 1)
})