// BoxdBuddy Tauri backend entrypoint
// Minimal, modular, and conflict-free
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod models;
mod net;
mod scrape;
mod tmdb;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|_app| {
            // Ensure app data dir exists on startup (ignore errors)
            let _ = db::get_app_data_dir();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // preferences and window commands
            commands::save_window_position,
            commands::get_saved_window_position,
            commands::set_always_on_top,
            commands::set_window_focus,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
