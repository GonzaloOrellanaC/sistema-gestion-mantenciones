Param()
Set-StrictMode -Version Latest

$Tag = 'v0.1.2'
$Message = "Release $Tag - trial & upload improvements"

Write-Host "Creating tag $Tag..."
git tag -a $Tag -m $Message
git push origin $Tag

Write-Host "Done. Create a GitHub release from the tag if needed."
