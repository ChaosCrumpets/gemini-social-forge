# C.A.L. Enhanced System - Full Rollback Script (PowerShell)
# Reverts all C.A.L. Enhanced commits and restores to legacy system
# Usage: .\scripts\rollback-full.ps1

Write-Host "`n" -NoNewline
Write-Host "====================================================================== " -ForegroundColor Cyan
Write-Host "🚨 C.A.L. Enhanced System - FULL ROLLBACK" -ForegroundColor Red
Write-Host "====================================================================== " -ForegroundColor Cyan
Write-Host ""

# Step 1: Check git status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow

$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "❌ Error: Uncommitted changes detected" -ForegroundColor Red
    Write-Host "   Please commit or stash changes before rollback.`n" -ForegroundColor Red
    git status
    exit 1
}

Write-Host "✅ Working directory clean`n" -ForegroundColor Green

# Step 2: Find C.A.L. Enhanced commits
Write-Host "📋 Finding C.A.L. Enhanced System commits..." -ForegroundColor Yellow

$commits = @(
    git log --oneline --grep="CAL" --grep="Enhanced" --grep="Phase" --all-match -20
)

if ($commits.Count -eq 0) {
    Write-Host "❌ No C.A.L. Enhanced commits found" -ForegroundColor Red
    Write-Host "   Nothing to rollback.`n" -ForegroundColor Red
    exit 0
}

Write-Host "✅ Found $($commits.Count) commit(s) to revert:`n" -ForegroundColor Green
$commits | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }

# Step 3: Show current branch
$currentBranch = git branch --show-current
Write-Host "`n📋 Current branch: $currentBranch" -ForegroundColor Yellow

# Step 4: Confirm with user
Write-Host "`n⚠️  WARNING: This will:" -ForegroundColor Red
Write-Host "   - Revert all C.A.L. Enhanced System changes" -ForegroundColor Yellow
Write-Host "   - Remove enhanced prompt (133KB)" -ForegroundColor Yellow
Write-Host "   - Remove discovery system" -ForegroundColor Yellow
Write-Host "   - Remove enhanced panels" -ForegroundColor Yellow
Write-Host "   - Rebuild the application" -ForegroundColor Yellow
Write-Host "   - Require server restart`n" -ForegroundColor Yellow

$confirmation = Read-Host "Type 'ROLLBACK' to confirm full rollback (or anything else to cancel)"

if ($confirmation -ne "ROLLBACK") {
    Write-Host "`n❌ Rollback cancelled by user.`n" -ForegroundColor Red
    exit 0
}

Write-Host "`n🔄 Executing full rollback...`n" -ForegroundColor Cyan

# Step 5: Create backup branch
$backupBranch = "backup-before-rollback-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "📦 Creating backup branch: $backupBranch" -ForegroundColor Yellow

git branch $backupBranch
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create backup branch" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backup branch created`n" -ForegroundColor Green

# Step 6: Revert commits (in reverse order)
Write-Host "🔄 Reverting commits..." -ForegroundColor Yellow

$commitHashes = $commits | ForEach-Object { $_.Split(' ')[0] }
$commitHashes = $commitHashes[($commitHashes.Count-1)..0]  # Reverse order

foreach ($hash in $commitHashes) {
    Write-Host "   Reverting $hash..." -ForegroundColor Gray
    git revert --no-edit $hash
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ Revert failed at commit $hash" -ForegroundColor Red
        Write-Host "   Resolve conflicts manually or run: git revert --abort`n" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ All commits reverted`n" -ForegroundColor Green

# Step 7: Rebuild application
Write-Host "🔨 Rebuilding application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Build failed" -ForegroundColor Red
    Write-Host "   Please fix build errors manually.`n" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful`n" -ForegroundColor Green

# Step 8: Log rollback
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logEntry = "$timestamp - FULL ROLLBACK - Reverted $($commits.Count) commits`n"
Add-Content -Path "rollback.log" -Value $logEntry
Write-Host "✅ Logged to rollback.log`n" -ForegroundColor Green

# Step 9: Success message
Write-Host "====================================================================== " -ForegroundColor Cyan
Write-Host "✅ FULL ROLLBACK COMPLETE" -ForegroundColor Green
Write-Host "====================================================================== `n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Restart the server:" -ForegroundColor White
Write-Host "     npm run dev (or pm2 restart all)`n" -ForegroundColor Gray
Write-Host "  2. Verify legacy system is active`n" -ForegroundColor White

Write-Host "📋 System Status:" -ForegroundColor Yellow
Write-Host "   Mode: LEGACY (v1.0)" -ForegroundColor White
Write-Host "   Enhanced Features: REMOVED" -ForegroundColor White
Write-Host "   Backup Branch: $backupBranch`n" -ForegroundColor White

Write-Host "🔄 To Restore Enhanced System:" -ForegroundColor Yellow
Write-Host "   git checkout $backupBranch" -ForegroundColor Gray
Write-Host "   npm run build" -ForegroundColor Gray
Write-Host "   npm run dev`n" -ForegroundColor Gray

Write-Host "✅ Rollback completed successfully!`n" -ForegroundColor Green
