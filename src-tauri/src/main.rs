#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::time::Duration;
use base64::engine::Engine as _;
use std::os::windows::ffi::OsStrExt;
use winapi::um::shellapi::ShellExecuteW;
use winapi::um::winuser::SW_SHOWNORMAL;
use winapi::um::winbase::CREATE_NO_WINDOW;
use std::os::windows::process::CommandExt;

use aes::cipher::{block_padding::Pkcs7, BlockDecryptMut, BlockEncryptMut, KeyIvInit};
use rand::RngCore;

type Aes256CbcEnc = cbc::Encryptor<aes::Aes256>;
type Aes256CbcDec = cbc::Decryptor<aes::Aes256>;

#[derive(Serialize, Deserialize, Clone)]
struct AppConfig {
    architecture: String,
    #[serde(alias = "serverIp")]
    server_ip: String,
    #[serde(default = "default_language")]
    language: String,
}

fn default_language() -> String { "ru".to_string() }

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            architecture: "x32".to_string(),
            server_ip: "127.0.0.1".to_string(),
            language: "ru".to_string(),
        }
    }
}

fn get_data_dir() -> PathBuf {
    std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| PathBuf::from("."))
        .join("data")
}

fn get_config_path() -> PathBuf { get_data_dir().join("config.json") }
fn get_auth_path() -> PathBuf { get_data_dir().join("data.json") }

fn get_bin_dir(arch: &str) -> PathBuf {
    let dir = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| PathBuf::from("."));
    match arch {
        "x64" => dir.join("BIN64"),
        _ => dir.join("BIN"),
    }
}

fn derive_key() -> [u8; 32] {
    let params = scrypt::Params::new(14, 8, 1, 32).expect("Invalid scrypt params");
    let mut key = [0u8; 32];
    scrypt::scrypt(b"my_secret_key", b"salt", &params, &mut key).expect("scrypt failed");
    key
}

fn encrypt(text: &str) -> Result<String, String> {
    let key = derive_key();
    let mut iv = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut iv);
    let cipher = Aes256CbcEnc::new(&key.into(), &iv.into());
    let ct = cipher.encrypt_padded_vec_mut::<Pkcs7>(text.as_bytes());
    Ok(format!("{}:{}", hex::encode(iv), hex::encode(ct)))
}

fn decrypt(text: &str) -> Result<String, String> {
    let parts: Vec<&str> = text.splitn(2, ':').collect();
    if parts.len() != 2 { return Err("Invalid format".into()); }
    let iv: [u8; 16] = hex::decode(parts[0])
        .map_err(|e| e.to_string())?
        .try_into()
        .map_err(|_| "IV length")?;
    let ct = hex::decode(parts[1]).map_err(|e| e.to_string())?;
    let key = derive_key();
    let cipher = Aes256CbcDec::new(&key.into(), &iv.into());
    let pt = cipher
        .decrypt_padded_vec_mut::<Pkcs7>(&ct)
        .map_err(|e| format!("{:?}", e))?;
    String::from_utf8(pt).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_config() -> Result<AppConfig, String> {
    let path = get_config_path();
    if path.exists() {
        let data = tokio::fs::read_to_string(&path).await.map_err(|e| e.to_string())?;
        serde_json::from_str(&data).map_err(|e| e.to_string())
    } else {
        tokio::fs::create_dir_all(get_data_dir()).await.map_err(|e| e.to_string())?;
        let cfg = AppConfig::default();
        tokio::fs::write(&path, serde_json::to_string_pretty(&cfg).unwrap())
            .await.map_err(|e| e.to_string())?;
        Ok(cfg)
    }
}

#[tauri::command]
async fn save_config(architecture: String, server_ip: String, language: String) -> Result<(), String> {
    let cfg = AppConfig { architecture, server_ip, language };
    tokio::fs::create_dir_all(get_data_dir()).await.map_err(|e| e.to_string())?;
    tokio::fs::write(
        get_config_path(),
        serde_json::to_string_pretty(&cfg).map_err(|e| e.to_string())?,
    ).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_auth_data() -> Result<Option<String>, String> {
    let path = get_auth_path();
    if !path.exists() { return Ok(None); }
    let enc = tokio::fs::read_to_string(&path).await.map_err(|e| e.to_string())?;
    let dec = decrypt(&enc)?;
    let val: serde_json::Value = serde_json::from_str(&dec).map_err(|e| e.to_string())?;
    Ok(val.get("nickname").and_then(|v| v.as_str()).map(String::from))
}

#[tauri::command]
async fn save_auth_data(nickname: String) -> Result<(), String> {
    tokio::fs::create_dir_all(get_data_dir()).await.map_err(|e| e.to_string())?;
    let obj = serde_json::json!({ "nickname": nickname });
    let enc = encrypt(&serde_json::to_string(&obj).map_err(|e| e.to_string())?)?;
    tokio::fs::write(get_auth_path(), enc).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_game_version(architecture: String) -> Result<String, String> {
    let ini = get_bin_dir(&architecture).join("Version.ini");
    if !ini.exists() {
        return Ok("NOT_FOUND".to_string());
    }
    let content = tokio::fs::read_to_string(&ini).await.map_err(|e| e.to_string())?;
    for line in content.lines() {
        if line.trim().starts_with("ProductVersion") {
            if let Some(v) = line.split('=').nth(1) {
                return Ok(v.trim().to_string());
            }
        }
    }
    Ok("UNKNOWN".to_string())
}

// ПРОВЕРКА IP: ICMP-пинг через системную команду (как в Electron)
// CREATE_NO_WINDOW скрывает консоль Windows
#[tauri::command]
async fn check_connection(server_ip: String) -> Result<bool, String> {
    use std::process::Command;
    
    let output = Command::new("ping")
        .args(&["-n", "1", "-w", "1000", &server_ip])
        .creation_flags(CREATE_NO_WINDOW)
        .output();
    
    match output {
        Ok(out) => Ok(out.status.success()),
        Err(e) => Err(format!("Ping failed: {}", e))
    }
}

#[tauri::command]
async fn fetch_image(url: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let mime = resp.headers().get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("image/jpeg")
        .to_string();
    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;
    Ok(format!("data:{};base64,{}", mime, base64::engine::general_purpose::STANDARD.encode(&bytes)))
}

#[tauri::command]
fn launch_game(architecture: String, server_ip: String) -> Result<(), String> {
    let bin_dir = get_bin_dir(&architecture);
    let exe = bin_dir.join("Client.EXE");
    if !exe.exists() {
        return Err(format!("Client.EXE not found in {:?}", bin_dir));
    }
    let args = format!(
        "/SessKey /LaunchByLauncher /LoginMode 2 /ProxyIP:{} -UnAttended",
        server_ip
    );

    let ew: Vec<u16> = std::ffi::OsString::from(exe.to_string_lossy().to_string())
        .encode_wide().chain(std::iter::once(0)).collect();
    let aw: Vec<u16> = std::ffi::OsString::from(args)
        .encode_wide().chain(std::iter::once(0)).collect();
    let dw: Vec<u16> = std::ffi::OsString::from(bin_dir.to_string_lossy().to_string())
        .encode_wide().chain(std::iter::once(0)).collect();
    let vw: Vec<u16> = "open\0".encode_utf16().collect();

    let res = unsafe {
        ShellExecuteW(
            std::ptr::null_mut(), vw.as_ptr(), ew.as_ptr(),
            aw.as_ptr(), dw.as_ptr(), SW_SHOWNORMAL,
        )
    };
    if res as isize <= 32 { Err(format!("Launch error (code: {})", res as isize)) } else { Ok(()) }
}

// РЕГИСТРАЦИЯ — использует API на порту 3000
#[tauri::command]
async fn signup(
    server_ip: String, account_name: String, email: String, password: String,
) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client.post(&format!("http://{}:3000/signup", server_ip))
        .json(&serde_json::json!({
            "account_name": account_name,
            "email": email,
            "account_password": password,
        }))
        .send().await.map_err(|e| e.to_string())?;
    if resp.status().is_success() { Ok(()) } else { Err(format!("HTTP {}", resp.status())) }
}

// ВХОД — использует API на порту 3000
#[tauri::command]
async fn signin(server_ip: String, email: String, password: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client.post(&format!("http://{}:3000/signin", server_ip))
        .json(&serde_json::json!({
            "signin_email": email,
            "signin_password": password,
        }))
        .send().await.map_err(|e| e.to_string())?;
    if resp.status() == 200 { resp.text().await.map_err(|e| e.to_string()) }
    else { Err(format!("Login error: {}", resp.status())) }
}

#[tauri::command]
async fn shell_open(url: String) -> Result<(), String> {
    use std::process::Command;
    Command::new("cmd")
        .args(&["/C", "start", "", &url])
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_config, save_config,
            get_auth_data, save_auth_data,
            get_game_version, check_connection,
            fetch_image, launch_game,
            signup, signin, shell_open,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}