/*
 * Preferences persistence helpers
 * AI Generated: GitHub Copilot - 2025-08-11
 */
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;

use tauri::command;

use crate::db::get_app_data_dir;
use crate::models::UserPreferences;

fn prefs_path() -> Result<PathBuf, String> {
    let dir = get_app_data_dir()?;
    Ok(dir.join("preferences.json"))
}

// AI Generated: GitHub Copilot - 2025-08-11
#[command]
pub async fn save_user_preferences(prefs: UserPreferences) -> Result<(), String> {
    let path = prefs_path()?;
    let json = serde_json::to_string_pretty(&prefs)
        .map_err(|e| format!("Failed to serialize preferences: {e}"))?;
    let mut f = OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(&path)
        .map_err(|e| format!("Failed to open preferences file: {e}"))?;
    f.write_all(json.as_bytes())
        .map_err(|e| format!("Failed to write preferences: {e}"))?;
    Ok(())
}

// AI Generated: GitHub Copilot - 2025-08-11
#[command]
pub async fn load_user_preferences() -> Result<UserPreferences, String> {
    let path = prefs_path()?;
    if !path.exists() {
        return Ok(UserPreferences::default());
    }
    let data = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read preferences: {e}"))?;
    let prefs: UserPreferences = serde_json::from_str(&data)
        .map_err(|e| format!("Failed to parse preferences: {e}"))?;
    Ok(prefs)
}

// Window position helpers
// AI Generated: GitHub Copilot - 2025-08-11
#[command]
pub async fn save_window_position(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<(), String> {
    let path = prefs_path()?;
    let mut prefs = if path.exists() {
        fs::read_to_string(&path)
            .ok()
            .and_then(|s| serde_json::from_str::<UserPreferences>(&s).ok())
            .unwrap_or_default()
    } else {
        UserPreferences::default()
    };
    prefs.window_x = Some(x);
    prefs.window_y = Some(y);
    prefs.window_width = Some(width);
    prefs.window_height = Some(height);
    let json = serde_json::to_string_pretty(&prefs)
        .map_err(|e| format!("Failed to serialize: {e}"))?;
    let mut f = OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(&path)
        .map_err(|e| format!("Failed to open preferences file: {e}"))?;
    f.write_all(json.as_bytes())
        .map_err(|e| format!("Failed to write: {e}"))?;
    Ok(())
}

// AI Generated: GitHub Copilot - 2025-08-11
#[command]
pub async fn get_saved_window_position() -> Result<Option<(i32, i32, u32, u32)>, String> {
    let path = prefs_path()?;
    if !path.exists() {
        return Ok(None);
    }
    let data = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read preferences: {e}"))?;
    let prefs: UserPreferences = serde_json::from_str(&data)
        .map_err(|e| format!("Failed to parse preferences: {e}"))?;
    if let (Some(x), Some(y), Some(w), Some(h)) = (
        prefs.window_x,
        prefs.window_y,
        prefs.window_width,
        prefs.window_height,
    ) {
        Ok(Some((x, y, w, h)))
    } else {
        Ok(None)
    }
}

// AI Generated: GitHub Copilot - 2025-08-11
#[command]
pub async fn set_always_on_top(window: tauri::Window, always: bool) -> Result<(), String> {
    window
        .set_always_on_top(always)
        .map_err(|e| format!("Failed to set always on top: {e}"))?;
    // Persist preference
    let path = prefs_path()?;
    let mut prefs = if path.exists() {
        fs::read_to_string(&path)
            .ok()
            .and_then(|s| serde_json::from_str::<UserPreferences>(&s).ok())
            .unwrap_or_default()
    } else {
        UserPreferences::default()
    };
    prefs.always_on_top = Some(always);
    let json = serde_json::to_string_pretty(&prefs)
        .map_err(|e| format!("Failed to serialize: {e}"))?;
    let mut f = OpenOptions::new()
        .create(true)
        .write(true)
        .truncate(true)
        .open(&path)
        .map_err(|e| format!("Failed to open preferences file: {e}"))?;
    f.write_all(json.as_bytes())
        .map_err(|e| format!("Failed to write: {e}"))?;
    Ok(())
}

// AI Generated: GitHub Copilot - 2025-08-11
#[command]
pub async fn set_window_focus(window: tauri::Window) -> Result<(), String> {
    window
        .set_focus()
        .map_err(|e| format!("Failed to focus window: {e}"))?;
    Ok(())
}
