import fs from 'node:fs'
import ts from 'typescript'

// Parse literals only. Captured application code is never executed.
function literal(n) {
  if (ts.isStringLiteral(n) || ts.isNumericLiteral(n)) return ts.isNumericLiteral(n) ? Number(n.text) : n.text
  if (n.kind === ts.SyntaxKind.TrueKeyword) return true
  if (n.kind === ts.SyntaxKind.FalseKeyword) return false
  if (ts.isPrefixUnaryExpression(n) && n.operator === ts.SyntaxKind.ExclamationToken) return !literal(n.operand)
  if (ts.isArrayLiteralExpression(n)) return n.elements.map(literal)
  if (ts.isObjectLiteralExpression(n)) return Object.fromEntries(n.properties.map(p => {
    if (!ts.isPropertyAssignment(p)) throw Error('Non-literal property')
    return [p.name.text, literal(p.initializer)]
  }))
  throw Error('Unsupported captured expression: ' + n.kind)
}
function variables(source, names) {
  const result = {}
  function visit(n) {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && names.includes(n.name.text)) result[n.name.text] = literal(n.initializer)
    ts.forEachChild(n, visit)
  }
  visit(ts.createSourceFile('capture.js', source, ts.ScriptTarget.Latest, true))
  return result
}
const bundle = fs.readFileSync('artifacts/original-bundle.js','utf8')
const { Su, Tu } = variables(bundle, ['Su','Tu'])
if (!Su?.length || !Tu?.length) throw Error('Missing captured rules')
fs.writeFileSync('docs/evidence/source-IK.json',JSON.stringify(Su,null,2))
const pools = { world: JSON.parse(fs.readFileSync('docs/evidence/transfermarkt-source.json','utf8')), legends: Su }
for (const [edition,id] of Object.entries({premier:'GB1',laliga:'ES1',bundesliga:'L1',seriea:'IT1',ligue1:'FR1',superlig:'TR1',championship:'GB2',worldcup:'FIWC'})) pools[edition] = JSON.parse(fs.readFileSync(`docs/evidence/source-${id}.json`,'utf8'))
for (const [edition,pool] of Object.entries(pools)) {
  if (pool.length < 2 || new Set(pool.map(p=>p.id)).size !== pool.length || pool.some(p=>typeof p.name!=='string'||!Number.isFinite(p.value)||p.value<0)) throw Error(`Invalid pool ${edition}`)
}
fs.writeFileSync('src/captured-data.json',JSON.stringify(pools))
fs.writeFileSync('src/captured-score.json',JSON.stringify(Tu))
console.log(JSON.stringify({pools:Object.fromEntries(Object.entries(pools).map(([k,v])=>[k,v.length])), unique:new Set(Object.values(pools).flat().map(p=>p.id)).size,scoreSteps:Tu.length}))
