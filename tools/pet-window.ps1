param(
  [string]$Title = "Whale Pet",
  [int]$ProcessId = 0,
  [int]$TopMost = 1,
  [int]$Chroma = 1,
  [string]$Color = "FF00FF",
  [int]$DragHeight = 42,
  [int]$Width = 0,
  [int]$Height = 0,
  [string]$StateFile = ""
)

$ErrorActionPreference = "SilentlyContinue"

Add-Type -TypeDefinition @"
using System;
using System.Text;
using System.Runtime.InteropServices;

public static class WhaleWin32 {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
  [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr hWnd, int nIndex);
  [DllImport("user32.dll")] public static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
  [DllImport("user32.dll")] public static extern bool SetLayeredWindowAttributes(IntPtr hwnd, uint crKey, byte bAlpha, uint dwFlags);
  [DllImport("user32.dll")] public static extern bool GetCursorPos(out POINT lpPoint);
  [DllImport("user32.dll")] public static extern short GetAsyncKeyState(int vKey);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("dwmapi.dll")] public static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);

  [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X; public int Y; }
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }

  public static IntPtr FindWindowByTitle(string title, uint pid) {
    IntPtr found = IntPtr.Zero;
    EnumWindows(delegate(IntPtr hWnd, IntPtr lParam) {
      if (!IsWindowVisible(hWnd)) return true;
      int len = GetWindowTextLength(hWnd);
      if (len <= 0) return true;
      StringBuilder sb = new StringBuilder(len + 2);
      GetWindowText(hWnd, sb, sb.Capacity);
      string text = sb.ToString();
      uint winPid;
      GetWindowThreadProcessId(hWnd, out winPid);
      if (!string.IsNullOrEmpty(title) && text.IndexOf(title, StringComparison.OrdinalIgnoreCase) >= 0) {
        found = hWnd; return false;
      }
      if (pid != 0 && winPid == pid && text.Length > 0) {
        found = hWnd; return false;
      }
      return true;
    }, IntPtr.Zero);
    return found;
  }

  public static void MakeOverlay(IntPtr hWnd, bool topMost, bool chroma, uint colorKey, int dragHeight) {
    int style = GetWindowLong(hWnd, -16);
    style &= ~0x00C00000; // WS_CAPTION
    style &= ~0x00040000; // WS_THICKFRAME
    style &= ~0x00080000; // WS_SYSMENU
    style &= ~0x00020000; // WS_MINIMIZEBOX
    style &= ~0x00010000; // WS_MAXIMIZEBOX
    style |= 0x80000000;  // WS_POPUP
    style |= 0x10000000;  // WS_VISIBLE
    SetWindowLong(hWnd, -16, style);

    int ex = GetWindowLong(hWnd, -20);
    ex |= 0x00080000; // WS_EX_LAYERED
    ex |= 0x00000080; // WS_EX_TOOLWINDOW
    SetWindowLong(hWnd, -20, ex);

    if (chroma) SetLayeredWindowAttributes(hWnd, colorKey, 0, 0x00000001);

    int corner = 2;
    DwmSetWindowAttribute(hWnd, 33, ref corner, 4);

    IntPtr after = topMost ? new IntPtr(-1) : new IntPtr(-2);
    SetWindowPos(hWnd, after, 0, 0, 0, 0, 0x0001 | 0x0002 | 0x0020 | 0x0010);
  }
}
"@

function HexToColorRef([string]$hex) {
  $h = $hex.TrimStart('#')
  if ($h.Length -ne 6) { $h = "FF00FF" }
  $r = [Convert]::ToInt32($h.Substring(0,2),16)
  $g = [Convert]::ToInt32($h.Substring(2,2),16)
  $b = [Convert]::ToInt32($h.Substring(4,2),16)
  return [uint32]($r -bor ($g -shl 8) -bor ($b -shl 16))
}

$colorKey = HexToColorRef $Color
$hwnd = [IntPtr]::Zero
for ($i = 0; $i -lt 80; $i++) {
  $hwnd = [WhaleWin32]::FindWindowByTitle($Title, [uint32]$ProcessId)
  if ($hwnd -ne [IntPtr]::Zero) { break }
  Start-Sleep -Milliseconds 250
}
if ($hwnd -eq [IntPtr]::Zero) { exit 0 }

[WhaleWin32]::MakeOverlay($hwnd, ($TopMost -ne 0), ($Chroma -ne 0), $colorKey, $DragHeight)
if ($Width -gt 100 -and $Height -gt 100) {
  [WhaleWin32]::SetWindowPos($hwnd, [IntPtr]::Zero, 0, 0, $Width, $Height, 0x0002 -bor 0x0004 -bor 0x0010) | Out-Null
}

$dragging = $false
$dragOffsetX = 0
$dragOffsetY = 0
$lastRect = [WhaleWin32+RECT]::new()
[WhaleWin32]::GetWindowRect($hwnd, [ref]$lastRect) | Out-Null

while ($true) {
  if (-not [WhaleWin32]::IsWindowVisible($hwnd)) { break }
  $rect = [WhaleWin32+RECT]::new()
  if (-not [WhaleWin32]::GetWindowRect($hwnd, [ref]$rect)) { break }

  if ($DragHeight -gt 0) {
    $pt = [WhaleWin32+POINT]::new()
    [WhaleWin32]::GetCursorPos([ref]$pt) | Out-Null
    $down = ([WhaleWin32]::GetAsyncKeyState(0x01) -band 0x8000) -ne 0
    if ($down -and -not $dragging) {
      $insideX = $pt.X -ge $rect.Left -and $pt.X -le $rect.Right
      $insideY = $pt.Y -ge $rect.Top -and $pt.Y -le ($rect.Top + $DragHeight)
      if ($insideX -and $insideY) {
        $dragging = $true
        $dragOffsetX = $pt.X - $rect.Left
        $dragOffsetY = $pt.Y - $rect.Top
      }
    }
    if ($dragging) {
      if (-not $down) {
        $dragging = $false
        if ($StateFile) {
          $obj = @{ x = $rect.Left; y = $rect.Top; width = ($rect.Right - $rect.Left); height = ($rect.Bottom - $rect.Top) }
          try { $obj | ConvertTo-Json | Set-Content -LiteralPath $StateFile -Encoding UTF8 } catch {}
        }
      } else {
        $nx = $pt.X - $dragOffsetX
        $ny = $pt.Y - $dragOffsetY
        [WhaleWin32]::SetWindowPos($hwnd, [IntPtr]::Zero, $nx, $ny, 0, 0, 0x0001 -bor 0x0004 -bor 0x0010) | Out-Null
      }
    }
  }
  Start-Sleep -Milliseconds 40
}
