param([string]$ImagePath)

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]

$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' 
}

function Await-Op($op, [Type]$targetType) {
    $m = $asTaskGeneric.MakeGenericMethod($targetType)
    $t = $m.Invoke($null, @($op))
    $t.Wait(10000) | Out-Null
    return $t.Result
}

try {
    $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $ImagePath))
    $memStream = [Windows.Storage.Streams.InMemoryRandomAccessStream]::new()
    $writer = [Windows.Storage.Streams.DataWriter]::new($memStream)
    $writer.WriteBytes($bytes)
    $storeOp = $writer.StoreAsync()
    $storeTask = [System.WindowsRuntimeSystemExtensions]::AsTask($storeOp)
    $storeTask.Wait(5000) | Out-Null
    $memStream.Seek(0)

    $decoderOp = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($memStream)
    $decoder = Await-Op $decoderOp ([Windows.Graphics.Imaging.BitmapDecoder])

    $bmpOp = $decoder.GetSoftwareBitmapAsync()
    $bitmap = Await-Op $bmpOp ([Windows.Graphics.Imaging.SoftwareBitmap])

    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    if (-not $engine) {
        $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('en-US'))
    }

    $ocrOp = $engine.RecognizeAsync($bitmap)
    $result = Await-Op $ocrOp ([Windows.Media.Ocr.OcrResult])

    $lines = @()
    foreach ($line in $result.Lines) {
        $lines += $line.Text
    }
    $fullText = ($lines -join "`n").Trim()

    @{
        success = $true
        text = $fullText
        lines_count = $lines.Count
        words_count = ($result.Lines | ForEach-Object { $_.Words.Count } | Measure-Object -Sum).Sum
    } | ConvertTo-Json -Compress
} catch {
    @{
        success = $false
        error = $_.Exception.ToString()
    } | ConvertTo-Json -Compress
}
