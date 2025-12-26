#!/usr/bin/osascript
-- Windsurf Log in 按钮自动点击脚本
-- 使用 macOS 原生 UI 自动化

on run
    try
        -- 方法1: 检查应用程序是否在运行（使用应用程序名称）
        set windsurfRunning to false
        try
            tell application "System Events"
                set appList to name of every application process
                repeat with appName in appList
                    if appName is "Windsurf" then
                        set windsurfRunning to true
                        exit repeat
                    end if
                end repeat
            end tell
        end try
        
        -- 方法2: 如果方法1失败，尝试通过进程路径检测
        if not windsurfRunning then
            try
                tell application "System Events"
                    set procList to every process whose bundle identifier is "com.exafunction.windsurf"
                    if (count of procList) > 0 then
                        set windsurfRunning to true
                    end if
                end tell
            end try
        end if
        
        -- 方法3: 尝试通过 Electron 进程检测（检查所有 Electron 进程）
        if not windsurfRunning then
            try
                tell application "System Events"
                    set electronProcs to every process whose name is "Electron"
                    repeat with proc in electronProcs
                        try
                            set procPath to POSIX path of (application file of proc)
                            if procPath contains "Windsurf.app" then
                                set windsurfRunning to true
                                exit repeat
                            end if
                        end try
                    end repeat
                end tell
            end try
        end if
        
        if not windsurfRunning then
            log "❌ Windsurf 未运行"
            return false
        end if
        
        -- 找到正确的进程名
        set windsurfProcess to "Electron"
        try
            tell application "System Events"
                set appList to name of every application process
                repeat with appName in appList
                    if appName is "Windsurf" then
                        set windsurfProcess to "Windsurf"
                        exit repeat
                    end if
                end repeat
            end tell
        end try
        
        -- 如果没找到 Windsurf 进程名，尝试通过 Electron 进程路径确认
        if windsurfProcess is "Electron" then
            try
                tell application "System Events"
                    set electronProcs to every process whose name is "Electron"
                    repeat with proc in electronProcs
                        try
                            set procPath to POSIX path of (application file of proc)
                            if procPath contains "Windsurf.app" then
                                set windsurfProcess to "Electron"
                                exit repeat
                            end if
                        end try
                    end repeat
                end tell
            end try
        end if
        
        -- 激活 Windsurf 应用（尝试多种方式）
        try
            tell application "Windsurf" to activate
        on error
            try
                tell application "System Events"
                    set frontmost of process windsurfProcess to true
                end tell
            on error
                -- 如果都失败，继续尝试
            end try
        end try
        
        delay 0.5
        
        -- 方法1: 使用键盘快捷键（最可靠）
        tell application "System Events"
            tell process windsurfProcess
                try
                    -- 按 Tab 键移动焦点到按钮（通常焦点已经在按钮上）
                    repeat 3 times
                        key code 48 -- Tab 键
                        delay 0.15
                    end repeat
                    
                    -- 按 Enter 或 Space 键点击
                    key code 36 -- Enter 键
                    delay 0.2
                    
                    log "✓ 使用键盘快捷键点击"
                    return true
                on error errMsg
                    log "⚠️ 键盘快捷键失败: " & errMsg
                end try
            end tell
        end tell
        
        -- 方法2: 尝试通过 UI 元素查找并点击按钮
        tell application "System Events"
            tell process windsurfProcess
                try
                    -- 获取所有窗口
                    set winList to windows
                    if (count of winList) > 0 then
                        set mainWin to window 1
                        
                        -- 查找按钮
                        tell mainWin
                            set allButtons to buttons
                            repeat with btn in allButtons
                                try
                                    set btnName to name of btn
                                    if btnName contains "Log" or btnName contains "log" or btnName contains "登录" then
                                        click btn
                                        log "✓ 成功点击按钮: " & btnName
                                        return true
                                    end if
                                end try
                            end repeat
                        end tell
                    end if
                on error errMsg2
                    log "⚠️ UI元素方法失败: " & errMsg2
                end try
            end tell
        end tell
        
        log "❌ 所有方法都失败了"
        return false
        
    on error errMsg
        log "❌ 脚本执行失败: " & errMsg
        return false
    end try
end run
