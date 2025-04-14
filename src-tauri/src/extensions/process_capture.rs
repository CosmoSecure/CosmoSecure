use once_cell::sync::Lazy;
use serde_json::json;
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use sysinfo::{RefreshKind, System};
// use sysinfo::ProcessExt;

// Initialize system with all information and set higher refresh rate
static SYS: Lazy<Mutex<System>> = Lazy::new(|| {
    let mut sys = System::new_with_specifics(RefreshKind::everything());
    sys.refresh_all();
    Mutex::new(sys)
});

#[tauri::command]
pub fn get_system_and_process_usage() -> Result<serde_json::Value, String> {
    let pid = std::process::id() as usize;

    // Get first measurement
    let mut sys = SYS.lock().map_err(|_| "Failed to acquire system lock")?;
    sys.refresh_all();
    let initial_cpu = sys
        .process(pid.into())
        .ok_or_else(|| "Process not found")?
        .cpu_usage();

    thread::sleep(Duration::from_millis(100));

    sys.refresh_all();
    let process = sys.process(pid.into()).ok_or_else(|| "Process not found")?;

    // Get memory information
    let total_memory = sys.total_memory();
    let mut used_memory = process.memory();
    let memory_percentage = if total_memory > 0 {
        (used_memory as f64 / total_memory as f64) * 100.0
    } else {
        0.0
    };

    let uptime = process.run_time();

    used_memory = used_memory / 1024; // Convert to MB

    Ok(json!({
        "cpu": initial_cpu.max(0.0),
        "memory_kb": used_memory,
        "memory_percentage": memory_percentage,
        "pid": pid,
        "uptime_sec": uptime,
        "status": process.status().to_string(),
    }))
}
