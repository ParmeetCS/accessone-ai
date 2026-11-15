param([string]$ImagePath)

# Fast Windows Runtime OCR — optimized for speed
# Called with -NoProfile -NonInteractive so startup is minimal

try {
    # Load required WinRT assemblies (single-call batch)
    [void][System.Reflection.Assembly]::LoadWithPartialName('System.Runtime.WindowsRuntime')
    $null = [Windows.Graphics.Imaging.BitmapDecoder,    Windows.Graphics,        ContentType = WindowsRuntime]
    $null = [Windows.Media.Ocr.OcrEngine,               Windows.Foundation,      ContentType = WindowsRuntime]
    $null = [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
    $null = [Windows.Storage.Streams.DataWriter,        Windows.Storage.Streams, ContentType = WindowsRuntime]
} catch {
    @{ success = $false; error = "WinRT assembly load failed: $_" } | ConvertTo-Json -Compress
    exit 1
}

# Generic async-to-sync helper using AsTask
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() |
    Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
                   $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]

function AwaitWinRT($op, [Type]$T) {
    $task = $asTaskGeneric.MakeGenericMethod($T).Invoke($null, @($op))
    # Wait up to 20s per operation (generous but bounded)
    if (-not $task.Wait(20000)) {
        throw "WinRT async operation timed out"
    }
    return $task.Result
}

try {
    # Read image bytes
    $resolvedPath = (Resolve-Path $ImagePath -ErrorAction Stop).Path
    $bytes = [System.IO.File]::ReadAllBytes($resolvedPath)

    # Write bytes into InMemoryRandomAccessStream
    $memStream = [Windows.Storage.Streams.InMemoryRandomAccessStream]::new()
    $writer     = [Windows.Storage.Streams.DataWriter]::new($memStream)
    $writer.WriteBytes($bytes)

    $storeTask = [System.WindowsRuntimeSystemExtensions]::AsTask($writer.StoreAsync())
    if (-not $storeTask.Wait(8000)) { throw "StoreAsync timed out" }
    $memStream.Seek(0)

    # Decode bitmap
    $decoder = AwaitWinRT ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($memStream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap  = AwaitWinRT ($decoder.GetSoftwareBitmapAsync())                                  ([Windows.Graphics.Imaging.SoftwareBitmap])

    # Create OCR engine (prefer user profile languages, fall back to en-US)
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    if (-not $engine) {
        $lang   = [Windows.Globalization.Language]::new('en-US')
        $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
    }
    if (-not $engine) { throw "Could not create OCR engine — no language pack available" }

    # Run OCR
    $result = AwaitWinRT ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])

    # Collect lines
    $lines = @()
    foreach ($line in $result.Lines) { $lines += $line.Text }
    $fullText   = ($lines -join "`n").Trim()
    $wordsCount = ($result.Lines | ForEach-Object { $_.Words.Count } | Measure-Object -Sum).Sum

    # Output single compact JSON line
    @{
        success     = $true
        text        = $fullText
        lines_count = $lines.Count
        words_count = [int]$wordsCount
    } | ConvertTo-Json -Compress -Depth 2

} catch {
    @{
        success = $false
        error   = $_.Exception.Message
    } | ConvertTo-Json -Compress -Depth 2
    exit 1
}
