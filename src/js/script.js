// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let serverAvailable = false;
let serverCheckInProgress = false;
let usingLocalData = true;
let serverIpCached = '127.0.0.1';
let currentLang = localStorage.getItem('launcher_language') || 'ru';

// ========== СИСТЕМА ПЕРЕВОДОВ ==========
const translations = {
    ru: {
        ui: {
            play: 'Играть',
            signInSignUp: 'Вход/Регистрация',
            settings: 'Настройки',
            accountName: 'Имя аккаунта',
            email: 'Электронная почта',
            password: 'Пароль',
            registration: 'Регистрация',
            login: 'Вход',
            alreadyHaveAccount: 'Уже есть аккаунт?',
            noAccount: 'Нет аккаунта?',
            serverIpLabel: 'IP сервера:',
            checkConnection: 'Проверить соединение',
            architecture: 'Архитектура',
            architectureDesc: 'Запуск с x32 или x64',
            saveConfiguration: 'Сохранить настройки',
            language: 'Язык',
            loadingVersion: 'Загрузка версии...',
            clientVersion: 'Версия клиента',
            welcome: 'Добро пожаловать,',
            minimize: 'Свернуть',
            close: 'Закрыть',
            versionNotFound: 'Не найден',
            versionUnknown: 'Неизвестно'
        },
        placeholders: {
            accountName: 'Введите имя аккаунта',
            email: 'Введите email',
            password: 'Введите пароль',
            serverIp: 'Например: 127.0.0.1'
        },
        toastr: {
            configLoaded: 'Конфигурация успешно загружена!',
            configSaved: 'Конфигурация сохранена. Пожалуйста, перезапустите лаунчер для применения настроек.',
            configSaveError: 'Не удалось сохранить конфигурацию',
            configLoadError: 'Ошибка загрузки конфигурации',
            authDataSaved: 'Данные регистрации сохранены',
            authDataSaveError: 'Не удалось сохранить данные регистрации',
            authDataLoadError: 'Не удалось загрузить никнейм.',
            ipAvailable: 'IP адрес {ip} доступен',
            ipUnavailable: 'IP адрес {ip} недоступен',
            checkError: 'Ошибка проверки подключения',
            gameLaunched: 'Игра успешно запущена.',
            launchError: 'Ошибка запуска игры',
            serverUnavailable: 'Сервер недоступен. Используются локальные данные.',
            registrationSuccess: 'Регистрация прошла успешно!',
            registrationError: 'Ошибка регистрации',
            loginSuccess: 'Вход выполнен успешно! Приятной игры!',
            loginError: 'Ошибка входа',
            allFieldsRequired: 'Все поля должны быть заполнены!',
            fieldsRequired: 'Все поля обязательны для заполнения!',
            languageChanged: 'Язык изменён',
            registrationErrorRestart: 'Произошла ошибка при регистрации. Пожалуйста, перезапустите лаунчер.',
            loginErrorRestart: 'Произошла ошибка при входе. После первоначальной настройки перезапустите лаунчер.'
        }
    },
    en: {
        ui: {
            play: 'Play',
            signInSignUp: 'SignIn/SignUp',
            settings: 'Settings',
            accountName: 'Account Name',
            email: 'Email',
            password: 'Password',
            registration: 'Registration',
            login: 'Login',
            alreadyHaveAccount: 'Already have an account?',
            noAccount: "Don't have an account?",
            serverIpLabel: 'Enter server address to check:',
            checkConnection: 'Check Connection',
            architecture: 'Architecture',
            architectureDesc: 'Launch with x32 or x64',
            saveConfiguration: 'Save Configuration',
            language: 'Language',
            loadingVersion: 'Loading version...',
            clientVersion: 'Client version',
            welcome: 'Welcome,',
            minimize: 'Minimize',
            close: 'Close',
            versionNotFound: 'Not found',
            versionUnknown: 'Unknown'
        },
        placeholders: {
            accountName: 'Enter your account name',
            email: 'Enter your email',
            password: 'Enter your password',
            serverIp: 'e.g. 127.0.0.1'
        },
        toastr: {
            configLoaded: 'Configuration loaded successfully!',
            configSaved: 'Configuration saved. Please restart the launcher to apply the settings.',
            configSaveError: 'Failed to save configuration',
            configLoadError: 'Error loading configuration',
            authDataSaved: 'Registration data saved',
            authDataSaveError: 'Failed to save registration data',
            authDataLoadError: 'Failed to load nickname.',
            ipAvailable: 'IP address {ip} available',
            ipUnavailable: 'IP address {ip} unavailable',
            checkError: 'Error checking connection',
            gameLaunched: 'Game successfully launched..',
            launchError: 'Game launch error',
            serverUnavailable: 'Server unavailable. Using local data.',
            registrationSuccess: 'Registration was successful!',
            registrationError: 'Registration error',
            loginSuccess: 'Login successful! Enjoy the game!',
            loginError: 'Login error',
            allFieldsRequired: 'All fields are required to be filled out!',
            fieldsRequired: 'All fields are required!',
            languageChanged: 'Language changed',
            registrationErrorRestart: 'There was an error signing in. Please restart the launcher.',
            loginErrorRestart: 'An error occurred during login. After the initial setup, restart the launcher.'
        }
    }
};

function t(key, params = {}) {
    const parts = key.split('.');
    let value = translations[currentLang];
    for (const part of parts) {
        if (value && value[part] !== undefined) value = value[part];
        else {
            value = translations.ru;
            for (const p of parts) {
                if (value && value[p] !== undefined) value = value[p];
                else return key;
            }
            break;
        }
    }
    if (typeof value !== 'string') return key;
    return value.replace(/\{(\w+)\}/g, (_, param) => params[param] || `{${param}}`);
}

function translateVersionStatus(version) {
    if (version === 'NOT_FOUND') return t('ui.versionNotFound');
    if (version === 'UNKNOWN') return t('ui.versionUnknown');
    return version;
}

function applyLanguage(lang) {
    if (!translations[lang]) lang = 'ru';
    currentLang = lang;
    localStorage.setItem('launcher_language', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.getAttribute('data-i18n-title'));
    });
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    const regBtn = document.getElementById('registrationButton');
    if (regBtn && regBtn.classList.contains('nickname')) {
        const nicknameSpan = regBtn.querySelector('.nickname-text');
        const nickname = nicknameSpan ? nicknameSpan.textContent : '';
        if (nickname) updateRegistrationButton(nickname);
    }

    const versionEl = document.getElementById('client-version');
    if (versionEl && versionEl.style.display !== 'none') {
        loadGameVersion();
    }
}

// ========== ЗВУКИ ==========
const soundCache = new Map();
function getAudio(name) {
    if (!soundCache.has(name)) {
        const audio = new Audio(`./assets/sounds/${name}.mp3`);
        audio.preload = 'auto';
        audio.volume = 0.7;
        soundCache.set(name, audio);
    }
    return soundCache.get(name);
}

function playSound(name) {
    try {
        const src = getAudio(name);
        const clone = src.cloneNode();
        clone.volume = src.volume;
        clone.play().catch(() => {});
    } catch (e) { console.warn('[SOUND]', e); }
}

try { getAudio('error'); } catch (e) {}

// ========== TAURI API ==========
function getTauriInvoke() {
    return window.__TAURI_INVOKE__ || window.TAURI_INVOKE || window.__TAURI__?.invoke;
}

function waitForTauri() {
    return new Promise((resolve) => {
        if (getTauriInvoke()) return resolve();
        const check = setInterval(() => {
            if (getTauriInvoke()) { clearInterval(check); resolve(); }
        }, 50);
        setTimeout(() => { clearInterval(check); resolve(); }, 3000);
    });
}

async function tauriInvoke(cmd, args = {}) {
    const invoke = getTauriInvoke();
    if (!invoke) throw new Error('Tauri API not ready');
    return await invoke(cmd, args);
}

async function tauriWindowCommand(type) {
    try {
        const invoke = getTauriInvoke();
        await invoke('tauri', {
            __tauriModule: 'Window',
            message: { cmd: 'manage', data: { label: null, cmd: { type: type } } }
        });
    } catch (e) {
        console.error(`[WINDOW] ${type} failed:`, e);
        if (type === 'close') window.close();
    }
}

async function openExternalLink(url) {
    try {
        const invoke = getTauriInvoke();
        if (invoke) {
            await invoke('shell_open', { url: url });
            return;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
        console.error('[SHELL] Error opening link:', err);
    }
}

async function startWindowDrag(e) {
    if (e.target.closest('.control-icon, .window-control-icon, .social-icon, input, button, a, select, .lang-btn')) return;
    try {
        if (window.__TAURI__?.window?.appWindow) {
            await window.__TAURI__.window.appWindow.startDragging();
        }
    } catch (err) { console.error('[DRAG]', err); }
}

// ========== TOASTR ==========
function initToastr() {
    if (typeof toastr === 'undefined' || typeof $ === 'undefined') return;
    toastr.options = {
        "closeButton": false, "debug": false, "newestOnTop": false,
        "progressBar": true, "positionClass": "toast-top-left custom-toast-position",
        "preventDuplicates": true, "onclick": null, "showDuration": "300",
        "hideDuration": "1000", "timeOut": "5000", "extendedTimeOut": "1000",
        "showEasing": "swing", "hideEasing": "linear", "showMethod": "fadeIn", "hideMethod": "fadeOut"
    };
}

// ========== УТИЛИТЫ ==========
function getCurrentArchitecture() {
    const arch32 = document.getElementById('architecture32');
    return (arch32 && arch32.checked) ? 'x32' : 'x64';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== КОНФИГУРАЦИЯ ==========
async function loadConfiguration() {
    try {
        const config = await tauriInvoke('get_config');

        const arch32 = document.getElementById('architecture32');
        const arch64 = document.getElementById('architecture64');
        const serverIpInput = document.getElementById('serverIp');

        if (arch32) arch32.checked = config.architecture === 'x32';
        if (arch64) arch64.checked = config.architecture === 'x64';

        const serverIp = config.server_ip || config.serverIp || '127.0.0.1';
        if (serverIpInput) serverIpInput.value = serverIp;
        serverIpCached = serverIp;

        if (config.language) applyLanguage(config.language);

        const bnsLink = document.getElementById('bns-link');
        if (bnsLink) bnsLink.dataset.url = `http://${serverIp}:3000/`;

        toastr.success(t('toastr.configLoaded'));
    } catch (e) {
        console.error('[CONFIG] Error:', e);
        toastr.error(t('toastr.configLoadError') + ': ' + e);
        playSound('error');
    }
}

async function saveConfiguration() {
    const architecture = getCurrentArchitecture();
    const serverIp = document.getElementById('serverIp').value;
    const language = currentLang;

    try {
        await tauriInvoke('save_config', { architecture, serverIp, language });
        toastr.success(t('toastr.configSaved'));

        serverIpCached = serverIp;
        const bnsLink = document.getElementById('bns-link');
        if (bnsLink) bnsLink.dataset.url = `http://${serverIp}:3000/`;

        await loadGameVersion();
    } catch (e) {
        console.error('[SAVE] Error:', e);
        toastr.error(t('toastr.configSaveError'));
        playSound('error');
    }
}

// ========== АВТОРИЗАЦИЯ ==========
async function loadRegistrationData() {
    try {
        const nickname = await tauriInvoke('get_auth_data');
        if (nickname) updateRegistrationButton(nickname);
    } catch (e) {
        console.error('[AUTH] Load error:', e);
    }
}

async function saveRegistrationData(nickname) {
    try {
        await tauriInvoke('save_auth_data', { nickname });
        updateRegistrationButton(nickname);
        toastr.success(t('toastr.authDataSaved'));
    } catch (e) {
        toastr.error(t('toastr.authDataSaveError'));
        playSound('error');
    }
}

function updateRegistrationButton(nickname) {
    const btn = document.getElementById('registrationButton');
    if (btn) {
        btn.innerHTML = `<span class="welcome-text">${t('ui.welcome')}</span> <span class="nickname-text">${escapeHtml(nickname)}</span>`;
        btn.classList.add('nickname');
        btn.removeAttribute('data-i18n-title');
        btn.title = nickname;
    }
}

// ========== ВЕРСИЯ ИГРЫ ==========
async function loadGameVersion() {
    const versionElement = document.getElementById('client-version');
    try {
        const architecture = getCurrentArchitecture();
        const version = await tauriInvoke('get_game_version', { architecture });
        const translatedVersion = translateVersionStatus(version);
        
        if (versionElement) {
            versionElement.textContent = `${t('ui.clientVersion')}: ${translatedVersion} (${architecture})`;
            versionElement.style.display = 'block';
        }
    } catch (e) {
        console.error('[VERSION] Error:', e);
        if (versionElement) versionElement.textContent = t('ui.loadingVersion');
        playSound('error');
    }
}

// ========== ПРОВЕРКА СОЕДИНЕНИЯ ==========
async function checkConnection(serverIp) {
    try {
        const alive = await tauriInvoke('check_connection', { serverIp });
        if (alive) {
            serverAvailable = true;
            toastr.success(t('toastr.ipAvailable', { ip: serverIp }));
        } else {
            serverAvailable = false;
            toastr.error(t('toastr.ipUnavailable', { ip: serverIp }));
            playSound('error');
        }
    } catch (e) {
        console.error('[CHECK] Error:', e);
        serverAvailable = false;
        toastr.error(t('toastr.checkError'));
        playSound('error');
    }
}

// ========== ЗАПУСК ИГРЫ (ИСПРАВЛЕНО: МГНОВЕННОЕ ЗАКРЫТИЕ) ==========
// Игнорируем все toast-уведомления: сначала скрываем окно, потом запускаем игру
async function launchGame() {
    const architecture = getCurrentArchitecture();
    const serverIp = document.getElementById('serverIp').value;

    console.log(`[LAUNCH] Запуск Client.EXE | arch: ${architecture} | IP: ${serverIp}`);

    // 1. Мгновенно очищаем все toast-уведомления (не ждём их анимации)
    if (typeof toastr !== 'undefined') {
        toastr.clear();
    }

    try {
        // 2. СНАЧАЛА скрываем окно лаунчера (мгновенно, без анимации)
        // Пользователь не видит никаких уведомлений и ожидания
        if (window.__TAURI__?.window?.appWindow) {
            try {
                await window.__TAURI__.window.appWindow.hide();
            } catch (hideErr) {
                console.warn('[LAUNCH] hide() failed:', hideErr);
            }
        }

        // 3. Запускаем игру через Rust
        await tauriInvoke('launch_game', { architecture, serverIp });
        
        console.log('[LAUNCH] Игра запущена, закрываем лаунчер...');

        // 4. Небольшая пауза, чтобы Rust успел передать управление Client.EXE
        await new Promise(r => setTimeout(r, 300));

        // 5. Закрываем окно полностью
        if (window.__TAURI__?.window?.appWindow) {
            try {
                await window.__TAURI__.window.appWindow.close();
            } catch (closeErr) {
                console.warn('[LAUNCH] close() failed, fallback to window.close():', closeErr);
                window.close();
            }
        } else {
            window.close();
        }
    } catch (e) {
        console.error('[LAUNCH]', e);
        
        // Если запуск упал — показываем окно обратно и уведомляем пользователя
        if (window.__TAURI__?.window?.appWindow) {
            try {
                await window.__TAURI__.window.appWindow.show();
            } catch (showErr) {
                console.warn('[LAUNCH] show() failed:', showErr);
            }
        }
        
        toastr.error(`${t('toastr.launchError')}: ${e}`);
        playSound('error');
    }
}

// ========== РЕГИСТРАЦИЯ / ВХОД ==========
async function signup() {
    const accountName = document.getElementById('accountName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const serverIp = document.getElementById('serverIp').value;

    if (!accountName || !email || !password) {
        toastr.error(t('toastr.allFieldsRequired'));
        return;
    }

    try {
        await tauriInvoke('signup', { serverIp, accountName, email, password });
        toastr.success(t('toastr.registrationSuccess'));
        document.getElementById('registerPage').classList.remove('open');
        await saveRegistrationData(accountName);
    } catch (e) {
        toastr.error(t('toastr.registrationErrorRestart'));
        console.error('[SIGNUP] Error:', e);
        playSound('error');
    }
}

async function signin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const serverIp = document.getElementById('serverIp').value;

    if (!email || !password) {
        toastr.error(t('toastr.fieldsRequired'));
        return;
    }

    try {
        const nickname = await tauriInvoke('signin', { serverIp, email, password });
        toastr.success(t('toastr.loginSuccess'));
        document.getElementById('registerPage').classList.remove('open');
        await saveRegistrationData(nickname);
    } catch (e) {
        toastr.error(t('toastr.loginErrorRestart'));
        console.error('[SIGNIN] Error:', e);
        playSound('error');
    }
}

// ========== UI УТИЛИТЫ ==========
function hideLoadingBar() {
    const loadingBar = document.getElementById('loadingBar');
    if (loadingBar) {
        loadingBar.classList.add('hidden');
        loadingBar.style.display = 'none';
    }
    const playBtn = document.getElementById('playButton');
    if (playBtn) playBtn.classList.add('loading-complete');
    const versionEl = document.getElementById('client-version');
    if (versionEl) versionEl.style.display = 'block';

    const mainTextImage = document.getElementById('mainTextImage');
    if (mainTextImage) mainTextImage.src = './assets/images/text-black.webp';
}

// ========== СОБЫТИЯ ==========
function bindEvents() {
    document.getElementById('closeButton')?.addEventListener('click', () => tauriWindowCommand('close'));
    document.getElementById('minimizeButton')?.addEventListener('click', () => tauriWindowCommand('minimize'));

    const topBar = document.querySelector('.top-bar');
    if (topBar) topBar.addEventListener('mousedown', startWindowDrag);

    const settingsBtn = document.getElementById('settingsButton');
    const regBtn = document.getElementById('registrationButton');
    const settingsPage = document.getElementById('settingsPage');
    const registerPage = document.getElementById('registerPage');

    settingsBtn?.addEventListener('click', () => {
        settingsPage.classList.toggle('open');
        if (settingsPage.classList.contains('open')) registerPage.classList.remove('open');
    });

    regBtn?.addEventListener('click', () => {
        if (regBtn.classList.contains('nickname')) return;
        registerPage.classList.toggle('open');
        if (registerPage.classList.contains('open')) {
            settingsPage.classList.remove('open');
            ['accountName', 'email', 'password'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            toastr.clear();
        }
    });

    document.getElementById('closeSettingsPage')?.addEventListener('click', () => settingsPage.classList.remove('open'));
    document.getElementById('closeRegisterPage')?.addEventListener('click', () => registerPage.classList.remove('open'));

    document.getElementById('saveConfigButton')?.addEventListener('click', async () => {
        await saveConfiguration();
        settingsPage.classList.remove('open');
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const newLang = btn.dataset.lang;
            if (newLang === currentLang) return;
            applyLanguage(newLang);
            toastr.success(t('toastr.languageChanged'));
            await saveConfiguration();
            await loadGameVersion();
        });
    });

    const arch32 = document.getElementById('architecture32');
    const arch64 = document.getElementById('architecture64');
    arch32?.addEventListener('click', async () => {
        if (arch32.checked) {
            if (arch64) arch64.checked = false;
            await loadGameVersion();
        }
    });
    arch64?.addEventListener('click', async () => {
        if (arch64.checked) {
            if (arch32) arch32.checked = false;
            await loadGameVersion();
        }
    });

    document.getElementById('checkIpButton')?.addEventListener('click', async () => {
        const ip = document.getElementById('serverIp').value;
        await checkConnection(ip);
    });

    document.querySelectorAll('.external-link').forEach(icon => {
        icon.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            const url = icon.dataset.url || icon.getAttribute('data-url');
            if (url && url !== '' && url !== '#') {
                await openExternalLink(url);
            }
            return false;
        });
    });

    // Кнопка "Играть" — мгновенный запуск без ожидания уведомлений
    document.getElementById('playButton')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await launchGame();
    });

    const loadingBar = document.getElementById('loadingBar');
    if (loadingBar) loadingBar.addEventListener('animationend', hideLoadingBar);

    document.getElementById('toggleSignInSignUp')?.addEventListener('click', () => {
        const reg = document.getElementById('registrationForm');
        const log = document.getElementById('loginForm');
        if (reg && log) {
            if (reg.style.display === 'none') { reg.style.display = 'block'; log.style.display = 'none'; }
            else { reg.style.display = 'none'; log.style.display = 'block'; }
        }
    });
    document.getElementById('showLoginForm')?.addEventListener('click', () => {
        document.getElementById('registrationForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
        toastr.clear();
    });
    document.getElementById('showRegistrationForm')?.addEventListener('click', () => {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registrationForm').style.display = 'block';
        toastr.clear();
    });

    document.getElementById('registrationButtonSubmit')?.addEventListener('click', signup);
    document.getElementById('loginButtonSubmit')?.addEventListener('click', signin);
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
async function initializeLauncher() {
    console.log('[START] ========== ИНИЦИАЛИЗАЦИЯ ЛАУНЧЕРА ==========');

    applyLanguage(currentLang);

    await loadConfiguration();
    await loadRegistrationData();
    await loadGameVersion();

    const serverIp = document.getElementById('serverIp').value;
    if (serverIp) {
        checkConnection(serverIp);
    }

    setTimeout(hideLoadingBar, 3000);
}

document.addEventListener('DOMContentLoaded', async () => {
    await waitForTauri();

    if (typeof $ === 'undefined' || typeof toastr === 'undefined') {
        console.error('[INIT] jQuery или toastr не загружены!');
        return;
    }

    initToastr();
    bindEvents();
    await initializeLauncher();
});