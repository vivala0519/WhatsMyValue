import { test } from 'node:test'
import assert from 'node:assert/strict'
import { editions, getPool } from '../src/data.ts'
import captured from '../src/captured-data.json' with { type: 'json' }
import { scoreValue, newMatch, advance, answer } from '../src/game.ts'

test('all published pools preserve captured player IDs and euro values', () => {
  for (const edition of editions) {
    const source = captured[edition.id as keyof typeof captured]
    const actual = getPool(edition.id)
    assert.equal(actual.length, source.length)
    for (let i=0;i<source.length;i++) {
      assert.equal(actual[i].sourceId, source[i].id)
      assert.equal(actual[i].value, source[i].value / 1_000_000)
      assert.equal(actual[i].latin, source[i].name)
    }
  }
})
test('original score valuation table and normal-mode multiplier', () => {
  assert.equal(scoreValue(0,'easy'),0)
  assert.equal(scoreValue(1,'hard'),.000001)
  assert.equal(scoreValue(2,'easy'),.00001)
  assert.equal(scoreValue(2,'hard'),.000015)
  assert.equal(scoreValue(59,'easy'),100)
  assert.equal(scoreValue(60,'hard'),157.5)
})
test('easy mode never compares equal values across successive rounds', () => {
  const pool = getPool('world')
  let m = newMatch(pool, () => .999, 'easy')
  for(let i=0;i<300;i++) {
    assert.notEqual(m.left.value,m.right.value)
    m = advance(answer(m,m.right.value > m.left.value ? 'higher':'lower','easy'),pool,()=>.999,'easy')
  }
})

test('every available player has a Korean name and excluded leagues are hidden', () => {
  assert.ok(!editions.some(e => e.id === 'ligue1' || e.id === 'superlig' || e.id === 'championship'))
  for (const edition of editions) {
    for (const player of getPool(edition.id)) {
      assert.match(player.name, /[가-힣]/, `${edition.id}: ${player.latin} (${player.sourceId})`)
    }
  }
})
