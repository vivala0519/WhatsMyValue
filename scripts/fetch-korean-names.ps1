$ErrorActionPreference = 'Stop'
$data = Get-Content -LiteralPath 'src/captured-data.json' -Raw -Encoding UTF8 | ConvertFrom-Json
$ids = @($data.world + $data.premier + $data.championship + $data.laliga + $data.bundesliga + $data.seriea + $data.ligue1 + $data.legends | ForEach-Object { $_.id } | Select-Object -Unique)
$output = @{}
for ($i = 0; $i -lt $ids.Count; $i += 120) {
  $end = [Math]::Min($i + 119, $ids.Count - 1)
  $values = ($ids[$i..$end] | ForEach-Object { '"' + $_ + '"' }) -join ' '
  $query = 'SELECT ?id ?label WHERE { VALUES ?id { ' + $values + ' } ?s wdt:P2446 ?id; rdfs:label ?label. FILTER(LANG(?label)="ko") }'
  try {
    $result = Invoke-RestMethod -Uri 'https://query.wikidata.org/sparql' -Method Post -Body @{query=$query; format='json'} -UserAgent 'PersonalFootballQuiz/1.0' -TimeoutSec 35
    foreach ($row in $result.results.bindings) { $output[$row.id.value] = $row.label.value }
  } catch { Write-Output "Batch $i failed: $($_.Exception.Message)" }
  $output | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath 'src/wikidata-ko.json' -Encoding UTF8
  Write-Output "Processed $($end + 1)/$($ids.Count); names $($output.Count)"
}
