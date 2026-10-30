import { test } from 'node:test'
import assert from 'node:assert/strict'
import { advance, answer, formatValue, isCorrect, newMatch, shuffle, scoreValue } from '../src/game.ts'
import { editions, getPool, players } from '../src/data.ts'

test('higher, lower, and hard equality compare the challenger against the reference', () => {
  for (const difficulty of ['easy','hard'] as const) {
    assert.equal(isCorrect(30, 50, 'higher', difficulty), true)
    assert.equal(isCorrect(30, 50, 'lower', difficulty), false)
    assert.equal(isCorrect(50, 30, 'lower', difficulty), true)
    assert.equal(isCorrect(50, 30, 'higher', difficulty), false)
  }
  assert.equal(isCorrect(30, 30, 'higher', 'easy'), false)
  assert.equal(isCorrect(30, 30, 'lower', 'easy'), false)
  assert.equal(isCorrect(30, 30, 'higher', 'hard'), false)
  assert.equal(isCorrect(30, 30, 'lower', 'hard'), false)
  assert.equal(isCorrect(30, 30, 'equal', 'hard'), true)
  assert.equal(isCorrect(30, 50, 'equal', 'hard'), false)
})

test('correct answer scores once, carries the player forward, and refills without a self matchup', () => {
  const pool = players.slice(0, 3).map((p,i)=>({...p,value:100-i*30}))
  let match = newMatch(pool, () => .5)
  const seen = new Set([match.left.id, match.right.id])
  for (let round = 0; round < 60; round++) {
    const guess = match.right.value >= match.left.value ? 'higher' : 'lower'
    const current = match.right
    const oldScore = match.score
    const revealed = answer(match, guess, 'easy')
    assert.equal(revealed.score, oldScore + 1)
    assert.equal(revealed.totalValue, scoreValue(oldScore + 1, 'easy'))
    assert.deepEqual(answer(revealed, guess, 'easy'), revealed)
    match = advance(revealed, pool, () => .5)
    assert.equal(match.left.id, current.id)
    assert.notEqual(match.left.id, match.right.id)
    assert.equal(match.phase, 'guessing')
    seen.add(match.right.id)
  }
  assert.equal(seen.size, pool.length)
})

test('wrong answers finish the game and cannot award additional points', () => {
  const match = newMatch(players.slice(0, 2).map((p,i)=>({...p,value:100-i*30})), () => .5)
  const wrong = match.right.value > match.left.value ? 'lower' : 'higher'
  const revealed = answer(match, wrong, 'hard')
  assert.equal(revealed.correct, false)
  assert.equal(revealed.score, 0)
  const finished = advance(revealed, players)
  assert.equal(finished.phase, 'finished')
  assert.deepEqual(answer(finished, 'higher', 'easy'), finished)
  assert.deepEqual(advance(finished, players), finished)
})

test('every edition has enough distinct players and valid values', () => {
  assert.equal(new Set(players.map(p => p.id)).size, players.length)
  for (const edition of editions) {
    const pool = getPool(edition.id)
    assert.ok(pool.length >= 2, edition.id)
    assert.ok(pool.every(p => Number.isFinite(p.value) && p.value > 0))
    assert.notEqual(newMatch(pool).left.id, undefined)
  }
})

test('shuffle preserves inputs; invalid pools and easy equality are rejected', () => {
  const input = [1, 2, 3, 4]
  assert.deepEqual([...shuffle(input)].sort(), input)
  assert.deepEqual(input, [1, 2, 3, 4])
  assert.throws(() => newMatch([]))
  assert.throws(() => newMatch([players[0], players[0]]))
  const match = newMatch(players.slice(0, 2).map((p,i)=>({...p,value:100-i*30})))
  assert.deepEqual(answer(match, 'equal', 'easy'), match)
})

test('rounded won amounts determine answers and easy mode pairings', () => {
  assert.equal(formatValue(1), formatValue(1.001))
  assert.equal(isCorrect(1, 1.001, 'equal', 'hard'), true)
  assert.equal(isCorrect(1, 1.001, 'higher', 'hard'), false)
  assert.equal(isCorrect(1.001, 1, 'lower', 'hard'), false)
  const pool = players.slice(0, 3).map((p, i) => ({...p, value: [1, 1.001, 2][i]}))
  const match = newMatch(pool, () => .99, 'easy')
  assert.notEqual(formatValue(match.left.value), formatValue(match.right.value))
  const revealed = answer(match, match.right.value > match.left.value ? 'higher' : 'lower', 'easy')
  const next = advance(revealed, pool, () => .99, 'easy')
  assert.notEqual(formatValue(next.left.value), formatValue(next.right.value))
})

test('market values use the fixed euro-won rate', () => {
  assert.equal(formatValue(220), '3,276억 원')
  assert.equal(formatValue(.000001), '0억 원')
  assert.equal(formatValue(0), '0억 원')
})
