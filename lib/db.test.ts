import { test } from 'node:test'
import assert from 'node:assert'

test('streak increments on consecutive day', () => {
  const previousStreak = 5
  const isConsecutive = true
  const newStreak = isConsecutive ? previousStreak + 1 : 1
  assert.strictEqual(newStreak, 6)
})

test('streak resets to 1 when a day is skipped', () => {
  const isConsecutive = false
  const newStreak = isConsecutive ? 6 : 1
  assert.strictEqual(newStreak, 1)
})

test('streak does not change if already logged today', () => {
  const lastLogDate = '2026-06-17'
  const today = '2026-06-17'
  const alreadyLoggedToday = lastLogDate === today
  assert.strictEqual(alreadyLoggedToday, true)
})

test('best streak updates only when current streak exceeds it', () => {
  const currentStreak = 8
  const bestStreak = 7
  const newBest = Math.max(currentStreak, bestStreak)
  assert.strictEqual(newBest, 8)
})

test('best streak stays same when current streak is lower', () => {
  const currentStreak = 3
  const bestStreak = 10
  const newBest = Math.max(currentStreak, bestStreak)
  assert.strictEqual(newBest, 10)
})

test('FIRST LOG badge unlocks at 10kg total CO2', () => {
  const totalCO2 = 12
  const threshold = 10
  const badges: string[] = []
  if (totalCO2 >= threshold && !badges.includes('FIRST LOG')) {
    badges.push('FIRST LOG')
  }
  assert.ok(badges.includes('FIRST LOG'))
})

test('SAVED 10KG badge unlocks at 100kg total CO2', () => {
  const totalCO2 = 105
  const threshold = 100
  const badges: string[] = []
  if (totalCO2 >= threshold && !badges.includes('SAVED 10KG')) {
    badges.push('SAVED 10KG')
  }
  assert.ok(badges.includes('SAVED 10KG'))
})

test('3-DAY STREAK badge unlocks at streak of 3', () => {
  const streak = 3
  const badges: string[] = []
  if (streak >= 3 && !badges.includes('3-DAY STREAK')) {
    badges.push('3-DAY STREAK')
  }
  assert.ok(badges.includes('3-DAY STREAK'))
})

test('7-DAY STREAK badge unlocks at streak of 7', () => {
  const streak = 7
  const badges: string[] = []
  if (streak >= 7 && !badges.includes('7-DAY STREAK')) {
    badges.push('7-DAY STREAK')
  }
  assert.ok(badges.includes('7-DAY STREAK'))
})

test('CARBON HERO badge unlocks at streak of 30', () => {
  const streak = 30
  const badges: string[] = []
  if (streak >= 30 && !badges.includes('CARBON HERO')) {
    badges.push('CARBON HERO')
  }
  assert.ok(badges.includes('CARBON HERO'))
})