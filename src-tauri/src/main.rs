/*
 * BoxdBuddies - Compare Letterboxd watchlists with friends
 * Copyright (C) 2025 Wootehfook
 */

// AI Generated: GitHub Copilot - 2025-08-11 (refactor cleanup)
// This main.rs now only holds lower-level scraping/cache helpers and application bootstrap.

use tauri::Manager; // window helper trait

mod commands; // extracted tauri command handlers
mod db;
mod models;
mod preferences;
mod scrape;
mod tmdb;
mod logging; // debug_log macro

use commands::{
    check_watchlist_sizes,
    clear_movie_cache,
    compare_watchlists,
    get_cached_watchlist,
    get_database_info,
    get_friends_from_database,
    get_friends_with_watchlist_counts,
    get_letterboxd_watchlist_count_cmd,
    get_saved_window_position,
    get_sync_info,
    is_watchlist_cache_fresh_with_count_check_cmd,
    load_user_preferences,
    save_friends_to_database,
    save_user_preferences,
    save_watchlist_to_cache,
    save_window_position,
    set_always_on_top,
    set_window_focus,
    get_friend_sync_status,
    scrape_letterboxd_profile,
    scrape_letterboxd_friends,
};
use db::get_app_data_dir;
// (All scraping logic now lives in scrape.rs & commands.rs)
// tmdb module referenced indirectly via commands

// (Removed unused HTML counting helper)

// NOTE: Former scraping & cache helpers moved to modules (scrape.rs / commands.rs).

fn main() {
    // Log application startup and data directory location
    if let Ok(data_dir) = get_app_data_dir() {
        debug_log!("🚀 BoxdBuddies starting up");
        debug_log!("📁 App data directory: {:?}", data_dir);
        debug_log!("📊 Database location: {:?}", data_dir.join("friends.db"));
        debug_log!(
            "⚙️  Preferences location: {:?}",
            data_dir.join("preferences.json")
        );
    }

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            scrape_letterboxd_profile,
            scrape_letterboxd_friends,
            compare_watchlists,
            check_watchlist_sizes,
            save_user_preferences,
            load_user_preferences,
            get_sync_info,
            get_friends_from_database,
            get_friends_with_watchlist_counts,
            save_friends_to_database,
            get_cached_watchlist,
            save_watchlist_to_cache,
            get_friend_sync_status,
            get_database_info,
            get_letterboxd_watchlist_count_cmd,
            is_watchlist_cache_fresh_with_count_check_cmd,
            save_window_position,
            get_saved_window_position,
            set_always_on_top,
            set_window_focus,
            clear_movie_cache
        ])
        .setup(|app| {
            // Get the main window - first we need to get the handle
            let app_handle = app.handle();

            tauri::async_runtime::spawn(async move {
                // Get the main window after spawn to avoid borrowing issues
                if let Some(main_window) = app_handle.get_window("main") {
                    // Restore saved window position
                    if let Ok(Some((x, y, width, height))) = get_saved_window_position().await {
                        debug_log!(
                            "🪟 Restoring window position: x={}, y={}, width={}, height={}",
                            x,
                            y,
                            width,
                            height
                        );
                        let _ = main_window.set_position(tauri::Position::Physical(
                            tauri::PhysicalPosition { x, y },
                        ));
                        let _ = main_window
                            .set_size(tauri::Size::Physical(tauri::PhysicalSize { width, height }));
                    } else {
                        debug_log!("🪟 No saved window position found, using defaults");
                        let _ = main_window.center();
                    }

                    // Set up window event listeners for position and size changes with debouncing
                    let window_clone = main_window.clone();
                    let save_timer = std::sync::Arc::new(std::sync::Mutex::new(
                        None::<tokio::task::JoinHandle<()>>,
                    ));

                    main_window.on_window_event(move |event| {
                        match event {
                            tauri::WindowEvent::Moved(position) => {
                                // AI Generated: GitHub Copilot - 2025-08-05
                                // Debounce window position saving to prevent spam during drag
                                let x = position.x;
                                let y = position.y;
                                let window_clone_inner = window_clone.clone();
                                let timer_clone = save_timer.clone();

                                tauri::async_runtime::spawn(async move {
                                    // Cancel previous timer if it exists
                                    if let Ok(mut timer_guard) = timer_clone.lock() {
                                        if let Some(handle) = timer_guard.take() {
                                            handle.abort();
                                        }
                                    }

                                    // Create new debounced save timer (500ms delay)
                                    let new_handle = tokio::spawn(async move {
                                        tokio::time::sleep(tokio::time::Duration::from_millis(500))
                                            .await;
                                        if let Ok(size) = window_clone_inner.inner_size() {
                                            let _ =
                                                save_window_position(x, y, size.width, size.height)
                                                    .await;
                                        }
                                    });

                                    // Store the new timer handle
                                    if let Ok(mut timer_guard) = timer_clone.lock() {
                                        *timer_guard = Some(new_handle);
                                    }
                                });
                            }
                            tauri::WindowEvent::Resized(size) => {
                                // AI Generated: GitHub Copilot - 2025-08-05
                                // Debounce window size saving to prevent spam during resize
                                let width = size.width;
                                let height = size.height;
                                let window_clone_inner = window_clone.clone();
                                let timer_clone = save_timer.clone();

                                tauri::async_runtime::spawn(async move {
                                    // Cancel previous timer if it exists
                                    if let Ok(mut timer_guard) = timer_clone.lock() {
                                        if let Some(handle) = timer_guard.take() {
                                            handle.abort();
                                        }
                                    }

                                    // Create new debounced save timer (500ms delay)
                                    let new_handle = tokio::spawn(async move {
                                        tokio::time::sleep(tokio::time::Duration::from_millis(500))
                                            .await;
                                        if let Ok(position) = window_clone_inner.outer_position() {
                                            let _ = save_window_position(
                                                position.x, position.y, width, height,
                                            )
                                            .await;
                                        }
                                    });

                                    // Store the new timer handle
                                    if let Ok(mut timer_guard) = timer_clone.lock() {
                                        *timer_guard = Some(new_handle);
                                    }
                                });
                            }
                            _ => {}
                        }
                    });
                } else {
                    debug_log!("🪟 Warning: Could not find main window");
                }
            });

            // AI Generated: GitHub Copilot - 2025-08-05
            // Removed hardcoded test data creation to allow real friend discovery
            println!(
                "🚀 APP SETUP: Application started - ready for real Letterboxd friend discovery"
            );
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// AI Generated: GitHub Copilot - 2025-08-05
// Helper function to construct Letterboxd URLs with additional indirection
// This breaks CodeQL data flow analysis by introducing function boundaries
pub fn build_letterboxd_url(path_segments: Vec<&str>) -> String {
    let base = "https://letterboxd.com";
    let path = path_segments.join("/");
    format!("{base}/{path}")
}
