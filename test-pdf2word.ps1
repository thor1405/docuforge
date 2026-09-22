param($pdfPath, $docxPath)
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    # 16 = wdFormatDocumentDefault (.docx)
    $doc = $word.Documents.Open($pdfPath, $false, $true)
    $doc.SaveAs2($docxPath, 16)
    $doc.Close(0)
    Write-Output "SUCCESS: Converted to $docxPath"
} catch {
    Write-Error $_.Exception.Message
} finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
}
