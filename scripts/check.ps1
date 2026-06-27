$ErrorActionPreference = "Stop"

Write-Host "== Click Git loop harness check =="

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Invoke-Gate {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Command,
    [string[]] $Arguments = @()
  )

  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Gate failed: $Command $($Arguments -join ' ')"
  }
}

Write-Host "== Harness file checks =="
$required = @(
  "AGENTS.md",
  "docs/PRD.md",
  "docs/harness/quality-gates.md",
  "docs/harness/agent-topology.md",
  "docs/harness/gotchas.md",
  "docs/harness/playbooks.md",
  "docs/harness/learnings.md",
  "docs/harness/task-contract.md"
)

foreach ($path in $required) {
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Missing required harness file: $path"
  }
}

Write-Host "== Git availability =="
Invoke-Gate git @("--version")

if (Test-Path -LiteralPath "package.json") {
  Write-Host "== Package checks =="
  Invoke-Gate npm @("run", "lint", "--if-present")
  Invoke-Gate npm @("run", "compile", "--if-present")
  Invoke-Gate npm @("run", "typecheck", "--if-present")
  Invoke-Gate npm @("test", "--if-present")
  Invoke-Gate npm @("run", "test:unit", "--if-present")
  Invoke-Gate npm @("run", "test:git-fixtures", "--if-present")
  Invoke-Gate npm @("run", "test:integration", "--if-present")
  Invoke-Gate npm @("run", "test:vscode", "--if-present")
  Invoke-Gate npm @("run", "test:e2e", "--if-present")
  Invoke-Gate npm @("run", "package", "--if-present")
} else {
  Write-Host "No package.json found; implementation gates are not available yet."
  Write-Host "Required before deliverable implementation: lint/typecheck/unit tests/temp-repo integration tests/VS Code extension tests."
}

Write-Host "== Harness content sanity =="
$quality = Get-Content -LiteralPath "docs/harness/quality-gates.md" -Raw
foreach ($needle in @("Temp-repo", "VS Code", "Computer-use", "TDD", "SDD", "Workspace trust", "Packaging")) {
  if ($quality -notmatch [regex]::Escape($needle)) {
    throw "quality-gates.md missing required term: $needle"
  }
}

$agents = Get-Content -LiteralPath "docs/harness/agent-topology.md" -Raw
foreach ($needle in @("Control-Plane Agent", "Test Agent", "Implementation Agent", "Verification Agent", "Retry Strategy", "Fallback Strategy", "Exit Strategy")) {
  if ($agents -notmatch [regex]::Escape($needle)) {
    throw "agent-topology.md missing required section: $needle"
  }
}

Write-Host "Loop harness check complete."
