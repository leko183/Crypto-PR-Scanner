# Automatic GitHub Push Script for PR Scan Tool
$repoUrl = Read-Host "Enter your GitHub repository URL (e.g., https://github.com/user/repo.git)"

if (-not $repoUrl) {
    Write-Host "Error: No URL entered!" -ForegroundColor Red
    exit
}

Write-Host "--- Starting GitHub Push Process ---" -ForegroundColor Cyan

# Check for .git folder
if (-not (Test-Path ".git")) {
    Write-Host "> Initializing Git..."
    git init
}

# Add all files
Write-Host "> Adding files..."
git add .

# Commit
Write-Host "> Committing changes..."
git commit -m "Deploy PR Scan Tool: Automated commit"

# Set branch to main
Write-Host "> Setting branch to main..."
git branch -M main

# Check remote origin
$remoteCheck = git remote get-url origin 2>$null
if ($remoteCheck) {
    Write-Host "> Updating remote origin..."
    git remote set-url origin $repoUrl
} else {
    Write-Host "> Adding remote origin..."
    git remote add origin $repoUrl
}

# Push
Write-Host "> Pushing to GitHub... (Login may be required)" -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n--- SUCCESS! ---" -ForegroundColor Green
    Write-Host "Your code is now on GitHub."
    Write-Host "You can now go to Railway.app and deploy this repository."
} else {
    Write-Host "`n--- FAILED! ---" -ForegroundColor Red
    Write-Host "An error occurred during push. Please check your URL and permissions."
}

Pause
