use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

use crate::db::get_app_data_dir;

fn prefs_path() -> Result<PathBuf, String> {
    let dir = get_app_data_dir()?;
    Ok(dir.join("preferences.json"))
}

fn load_prefs_value() -> Result<Value, String> {
    let path = prefs_path()?;
    if !path.exists() {
        return Ok(json!({}));
    }
    let data = fs::read_to_string(&path).map_err(|e| format!("Failed to read preferences: {e}"))?;
    let val: Value =
        serde_json::from_str(&data).map_err(|e| format!("Invalid preferences JSON: {e}"))?;
    Ok(val)
}

fn save_prefs_value(val: &Value) -> Result<(), String> {
    let path = prefs_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create preferences directory: {e}"))?;
    }
    let data = serde_json::to_string_pretty(val)
        .map_err(|e| format!("Failed to serialize preferences: {e}"))?;
    fs::write(&path, data).map_err(|e| format!("Failed to write preferences: {e}"))?;
    Ok(())
}

#[tauri::command]
pub async fn save_window_position(x: i32, y: i32, width: u32, height: u32) -> Result<(), String> {
    let mut val = load_prefs_value()?;
    if !val.is_object() {
        val = json!({});
    }
    let obj = val.as_object_mut().unwrap();
    obj.insert("window_x".into(), json!(x));
    obj.insert("window_y".into(), json!(y));
    obj.insert("window_width".into(), json!(width));
    obj.insert("window_height".into(), json!(height));
    save_prefs_value(&val)
}

#[tauri::command]
pub async fn get_saved_window_position() -> Result<Option<(i32, i32, u32, u32)>, String> {
    let val = load_prefs_value()?;
    let x = val
        .get("window_x")
        .and_then(|v| v.as_i64())
        .map(|n| n as i32);
    let y = val
        .get("window_y")
        .and_then(|v| v.as_i64())
        .map(|n| n as i32);
    let w = val
        .get("window_width")
        .and_then(|v| v.as_u64())
        .map(|n| n as u32);
    let h = val
        .get("window_height")
        .and_then(|v| v.as_u64())
        .map(|n| n as u32);
    if let (Some(x), Some(y), Some(w), Some(h)) = (x, y, w, h) {
        Ok(Some((x, y, w, h)))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn set_always_on_top(
    app_handle: tauri::AppHandle,
    always_on_top: bool,
) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        match window.set_always_on_top(always_on_top) {
            Ok(_) => Ok(()),
            Err(e) => {
                eprintln!(
                    "⚠️ Could not set always on top (this may not be supported on some systems): {e}"
                );
                Ok(())
            }
        }
    } else {
        Err("Main window not found".to_string())
    }
}

#[tauri::command]
pub async fn set_window_focus(app_handle: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window
            .set_focus()
            .map_err(|e| format!("Failed to set focus: {e}"))?;
        window
            .request_user_attention(Some(tauri::UserAttentionType::Critical))
            .map_err(|e| format!("Failed to request attention: {e}"))?;
        Ok(())
    } else {
        Err("Main window not found".to_string())
    }
}
