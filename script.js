// Mobile optimization variables
let isMobile = false;
let isLandscape = false;
let touchStartY = 0;
let touchStartX = 0;

// Detect mobile device
function detectMobile() {
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
    
    // Update mobile state on resize
    window.addEventListener('resize', () => {
        isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                   window.innerWidth <= 768;
        isLandscape = window.innerWidth > window.innerHeight;
        updateMobileLayout();
    });
    
    // Initial detection
    isLandscape = window.innerWidth > window.innerHeight;
    updateMobileLayout();
}

// Update mobile layout
function updateMobileLayout() {
    if (isMobile) {
        document.body.classList.add('mobile');
        if (isLandscape) {
            document.body.classList.add('landscape');
        } else {
            document.body.classList.remove('landscape');
        }
    } else {
        document.body.classList.remove('mobile', 'landscape');
    }
}

// Touch event handling for mobile
function initTouchHandling() {
    if (!isMobile) return;
    
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Handle touch gestures for panels
    const panels = document.querySelectorAll('.panel');
    panels.forEach(panel => {
        let startY = 0;
        let currentY = 0;
        
        panel.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        
        panel.addEventListener('touchmove', (e) => {
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            // Prevent default scrolling if panel is being dragged
            if (Math.abs(deltaY) > 10) {
                e.preventDefault();
            }
        });
    });
    
    // Optimize button touch events
    const buttons = document.querySelectorAll('.btn-primary, .toggle-button, .tab-button');
    buttons.forEach(button => {
        button.addEventListener('touchstart', (e) => {
            button.style.transform = 'scale(0.95)';
            button.style.opacity = '0.8';
        });
        
        button.addEventListener('touchend', (e) => {
            button.style.transform = '';
            button.style.opacity = '';
        });
    });
}

// Mobile performance optimizations
function initMobilePerformance() {
    if (!isMobile) return;
    
    // Reduce animation frame rate on mobile for better performance
    let animationFrameId;
    let lastTime = 0;
    const targetFPS = 30; // Reduce FPS on mobile
    
    function animate(currentTime) {
        if (currentTime - lastTime >= (1000 / targetFPS)) {
            // Update game logic here if needed
            lastTime = currentTime;
        }
        animationFrameId = requestAnimationFrame(animate);
    }
    
    // Start animation loop
    animationFrameId = requestAnimationFrame(animate);
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    });
}

// Initialize mobile optimizations
document.addEventListener('DOMContentLoaded', () => {
    detectMobile();
    initTouchHandling();
    initMobilePerformance();
});

// ...existing code...
let isGachaAnimating = false;
function showConfirmationModal(text, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    modal.querySelector('#confirmation-text').textContent = text;
    modal.classList.add('show');

    const confirmBtn = modal.querySelector('#confirm-yes-btn');
    const cancelBtn = modal.querySelector('#confirm-no-btn');

    const confirmHandler = () => {
        onConfirm();
        hideConfirmationModal();
        removeListeners();
    };

    const cancelHandler = () => {
        hideConfirmationModal();
        removeListeners();
    };
    
    const removeListeners = () => {
        confirmBtn.removeEventListener('click', confirmHandler);
        cancelBtn.removeEventListener('click', cancelHandler);
    };

    confirmBtn.addEventListener('click', confirmHandler);

    cancelBtn.addEventListener('click', cancelHandler);
}
// ...existing code...

function showNotification(message, type = 'info') {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    notificationContainer.appendChild(notif);

    setTimeout(() => notif.remove(), 3000);
}
// ...existing code...

function summonHero(count = 1, bannerId, options = {}) {
    if (isGachaAnimating) return; 
    if (!bannerId) { 
        showNotification("Vui lòng chọn một banner!", "error"); 
        if (options.onComplete) options.onComplete();
        return; 
    }
    const banner = GACHA_BANNERS[bannerId];
    if (!banner) return;
    const cost = banner.cost * count;
    
    // Check money
    if (state.resources.money < cost) { 
        showNotification("Không đủ tiền!", "error");
        if (options.onComplete) options.onComplete();
        return; 
    }

    isGachaAnimating = true;
    state.resources.money -= cost; 
    state.stats.moneySpent += cost;
    state.stats.gachaPulls += count;
    
    // Auto gacha logic removed
    
    let results = [], totalRefund = 0;
    for(let i = 0; i < count; i++) {
        let chosenRarity;
        if (state.stats.pityCounters[bannerId] <= 1) {
            chosenRarity = 'Mythic'; 
            state.stats.pityCounters[bannerId] = 80;
        } else {
            const rand = Math.random(); 
            let cumulativeRate = 0;
            for (const rarity in banner.rates) {
                cumulativeRate += banner.rates[rarity];
                if (rand < cumulativeRate) { 
                    chosenRarity = rarity; 
                    break; 
                }
            }
            state.stats.pityCounters[bannerId]--;
        }
        const pool = banner.pool[chosenRarity];
        const heroId = pool[Math.floor(Math.random() * pool.length)];
        if (state.heroes.collection.includes(heroId)) {
            totalRefund += Math.floor(banner.cost * banner.refundRate);
        } else {
            state.heroes.collection.push(heroId);
        }
        results.push(HERO_DATA[heroId]);
    }
    state.resources.money += totalRefund;
    showGachaResult(results, totalRefund, bannerId, options.onComplete);
    updateUI({ fullRender: true });
}

// --- Auto Gacha Logic (Continuous) ---
// This entire section has been removed.

function showGachaResult(results, totalRefund, bannerId, onCompleteCallback) {
    const modal = document.getElementById('gacha-modal');
    const container = document.getElementById('gacha-result-container');
    container.innerHTML = `<div class="gacha-reels-container"></div><div id="gacha-final-result"></div><p class="text-sm text-slate-500 mt-4 opacity-0" id="gacha-close-message">(Nhấp vào nút Đóng hoặc Quay tiếp)</p>`;
    modal.classList.add('show');
    const reelsContainer = container.querySelector('.gacha-reels-container');
    const banner = GACHA_BANNERS[bannerId];
    const animationHeroes = Object.values(banner.pool).flat().map(heroId => HERO_DATA[heroId]).filter(hero => hero.rarity !== 'Secret');
    const reelHeight = 140, spinItemsCount = 30;
    let longestDuration = 0;
    
    results.forEach((result, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'gacha-reel-wrapper';
        wrapper.dataset.heroId = result.id;
        const reel = document.createElement('div');
        reel.className = 'gacha-reel';
        for(let i = 0; i < spinItemsCount; i++) {
            const randomHero = animationHeroes[Math.floor(Math.random() * animationHeroes.length)];
            reel.innerHTML += `<img src="${randomHero.image}" alt="${randomHero.name}" onerror="this.onerror=null;this.src='https://placehold.co/140x140/1e293b/94a3b8?text=Error';">`;
        }
        reel.innerHTML += `<img src="${result.image}" alt="${result.name}" onerror="this.onerror=null;this.src='https://placehold.co/140x140/1e293b/94a3b8?text=Error';">`;
        wrapper.appendChild(reel);
        reelsContainer.appendChild(wrapper);
        const duration = 2.5 + index * 0.4;
        if (duration > longestDuration) longestDuration = duration;
        requestAnimationFrame(() => {
            reel.style.transition = `transform ${duration}s cubic-bezier(0.25, 1, 0.5, 1)`;
            reel.style.transform = `translateY(-${spinItemsCount * reelHeight}px)`;
        });
    });

    setTimeout(() => {
        if (totalRefund > 0) showNotification(`Được hoàn ${formatMoney(totalRefund)}$ từ nhân vật trùng lặp!`, 'info');
        const finalResultContainer = document.getElementById('gacha-final-result');
        const bestHero = [...results].sort((a, b) => ({ Secret: 5, Mythic: 4, Legend: 3, Epic: 2, Rare: 1, Common: 0 })[b.rarity] - ({ Secret: 5, Mythic: 4, Legend: 3, Epic: 2, Rare: 1, Common: 0 })[a.rarity])[0];
        reelsContainer.querySelectorAll('.gacha-reel-wrapper').forEach(reel => {
            if (reel.dataset.heroId === bestHero.id) reel.classList.add(`highlight-${bestHero.rarity}`);
        });
        finalResultContainer.innerHTML = `
            <div class="final-hero-display">
                <img src="${bestHero.image}" alt="${bestHero.name}" class="hero-image object-cover" onerror="this.onerror=null;this.src='https://placehold.co/120x120/1e293b/94a3b8?text=Error';">
                <div>
                    <p class="text-sm text-slate-400">Bạn đã nhận được</p>
                    <h2 class="text-4xl font-bold rarity-${bestHero.rarity}">${bestHero.name}</h2>
                    <p class="font-semibold text-lg rarity-${bestHero.rarity}">(${bestHero.rarity})</p>
                </div>
                <div class="mt-4 flex flex-col sm:flex-row gap-2 w-full">
                    <button id="gacha-again-1" class="btn-primary text-base flex-1">Quay x1</button>
                    <button id="gacha-again-3" class="btn-primary text-base flex-1">Quay x3</button>
                    <button id="gacha-again-5" class="btn-primary text-base flex-1">Quay x5</button>
                </div>
                 <button id="gacha-close" class="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg mt-2 w-full">Đóng</button>
            </div>`;
        finalResultContainer.classList.add('visible');
        document.getElementById('gacha-close-message').style.opacity = '1';
        isGachaAnimating = false;
        
        // Disable Gacha-again buttons if in auto mode
        // Logic for auto-gacha has been removed
        
        if (onCompleteCallback) {
            onCompleteCallback();
        }
    }, (longestDuration + 0.2) * 1000);
}

// Hàm này được dùng cho các nút quay bình thường (x1, x3, x5)
function summonHeroManual(count) {
    if (!state.activeBanner) {
        showNotification("Vui lòng chọn một banner!", "error");
        return;
    }
    const banner = GACHA_BANNERS[state.activeBanner];
    const cost = banner.cost * count;
    if (state.resources.money < cost) {
        showNotification("Không đủ tiền!", "error");
        return;
    }
    summonHero(count, state.activeBanner);
}

// --- DOM Elements ---
let moneyEl, panelContainer, canvas, notificationContainer, shardsEl;
let toggleButtons = {
    upgrades: null,
    stats: null,
    gacha: null,
    equipment: null,
    dungeon: null,
    music: null,
    passive: null
};

// --- Global Variables ---
let audioPlayer = null;

// --- Game State ---
let defaultState = {
    resources: { 
        money: 200000,
        shards: 0
    },
    stats: { 
        timePlayed: 0,
        blocksMined: 0,
        moneyEarned: 0,
        moneySpent: 0,
        minedBlockCounts: {},
        gachaPulls: 0,
        pityCounters: {
            hyper: 80,
            allstars: 80,
            ultimate: 80,
            titanEra: 80,
            detective: 80,
            newGeneration: 80,
        },
    },
    upgrades: { 
        clickPower: 1, 
        mineMultiLevel: 0,
        autoMineLevel: 0,
        minerCount: 0,
        minerPowerLevel: 1,
        superMinerLevel: 0,
        minerStaminaLevel: 0,
    },
    agents: {
        tung: { owned: false, cooldown: 0, isTargeting: false }
    },
    heroes: {
        collection: [],
        equipped: [],
        passives: {},
    },
    dungeon: {
        highestFloor: 0,
        currentRun: null,
        cooldown: 0,
    },
    artifacts: {
        collection: [],
        equipped: [],
    },
    music: {
        currentTrack: 0,
        isPlaying: false,
        volume: 0.16,
        loopSingleTrack: false,
        tracks: [
            { name: 'Track 1', file: 'music/track-1.mp3' },
            { name: 'Track 2', file: 'music/track-2.mp3' },
            { name: 'Track 3', file: 'music/track-3.mp3' },
            { name: 'Track 4', file: 'music/track-4.mp3' },
            { name: 'Track 5', file: 'music/track-5.mp3' },
            { name: 'Track 6', file: 'music/track-6.mp3' }
        ]
    },
    settings: {
        backgroundImage: '',
        backgroundBlur: 0,
        backgroundOpacity: 1
    },
    depth: 0,
    usedCodes: [],
    activeBanner: null,
};
let state = JSON.parse(JSON.stringify(defaultState)); // Deep copy default state

let activePanel = null;
let dungeonTimerInterval = null;
let saveInterval = null;

// --- Game Config ---
const SAVE_KEY = 'idleMiner3DSave';
const MINE_COLS = 8;
const MINE_ROWS = 8;
const MINE_HEIGHT = 10;
const BLOCK_SIZE = 1;
const BLOCK_TYPES = {
    grass: { name: 'Cỏ', health: 54, color: 0x6a994e, sellValue: 7.2 },
    dirt: { name: 'Đất', health: 36, color: 0x966919, sellValue: 7.2 },
    stone: { name: 'Đá', health: 50, color: 0x718096, sellValue: 14.4, deepGradient: ['#333333', '#111111'] },
    copper: { name: 'Đồng', health: 180, sellValue: 25.2, gradient: ['#16a34a', '#ca8a04'] },
    coal: { name: 'Than', health: 288, color: 0x2d3748, sellValue: 43.2 },
    lapis: { name: 'Lapis', health: 432, sellValue: 108, color: 0x1e40af, deepGradient: ['#000000', '#1e40af'] },
    gold: { name: 'Vàng', health: 720, color: 0xf6e05e, sellValue: 216 },
    ruby: { id: 'ruby', name: 'Ruby', health: 1080, color: 0xe0115f, sellValue: 432 },
    emerald: { id: 'emerald', name: 'Ngọc Lục Bảo', health: 1440, sellValue: 756, color: 0x10b981, deepGradient: ['#064e3b', '#065f46'] },
    rossara: { id: 'rossara', name: 'Rossara', health: 2160, sellValue: 1296, gradient: ['#db2777', '#9333ea'] },
    diamond: { id: 'diamond', name: 'Kim Cương', health: 2880, color: 0x00ffff, sellValue: 2160 },
    obsidian: { id: 'obsidian', name: 'Obsidian', health: 7200, sellValue: 1500, color: 0x281c3b, deepGradient: ['#000000', '#4c1d95'] },
    crystal: { id: 'crystal', name: 'Crystal', health: 7000, sellValue: 12000, gradient: ['#4c1d95', '#a855f7'] },
    uranious: { id: 'uranious', name: 'Uranious', health: 8000, sellValue: 14000, gradient: ['#000000', '#166534'] },
    bonreus: { id: 'bonreus', name: 'Bonreus', health: 9000, sellValue: 15000, gradient: ['#ffffff', '#1e293b'] },
    darkium: { id: 'darkium', name: 'Darkium', health: 11000, sellValue: 17500, gradient: ['#ef4444', '#000000'] },
    kotso: { id: 'kotso', name: 'Đá Kotso', health: 15000, sellValue: 25000 } // Will set color dynamically
};

const KOTSO_COLORS = ['#EEDC82', '#FFF8DC', '#F0E68C'];

const HERO_DATA = {
    naruto: { id: 'naruto', name: 'Naruto', rarity: 'Common', image: 'https://photo-resize-zmp3.zadn.vn/w600_r1x1_jpeg/cover/1/9/5/7/19571506525e47f5b79977c1fc20cec1.jpg', bonusType: 'flat', bonusValue: 2, bonusText: '+2$ mỗi khối' },
    nobara: { id: 'nobara', name: 'Nobara', rarity: 'Common', image: 'https://cdn.rafled.com/anime-icons/images/15b724c33ed746795f3700cd90b7c4951cafd54d05abc08fe14e3dc0b1a3fa93.jpg', bonusType: 'flat', bonusValue: 2, bonusText: '+2$ mỗi khối' },
    sukuna: { id: 'sukuna', name: 'Sukuna', rarity: 'Rare', image: 'https://i.pinimg.com/736x/04/f8/fd/04f8fdc99be9bf05db546d77f09e2509.jpg', bonusType: 'flat', bonusValue: 5, bonusText: '+5$ mỗi khối' },
    kakashi: { id: 'kakashi', name: 'Kakashi', rarity: 'Rare', image: 'https://i.pinimg.com/736x/46/c4/70/46c47013059023669fd998ec3d8ac269.jpg', bonusType: 'flat', bonusValue: 5, bonusText: '+5$ mỗi khối' },
    itadori: { id: 'itadori', name: 'Itadori', rarity: 'Epic', image: 'https://i.scdn.co/image/ab67616d0000b273e5525e7a8334a094ea129aa1', bonusType: 'flat', bonusValue: 10, bonusText: '+10$ mỗi khối' },
    yuta: { id: 'yuta', name: 'Yuta', rarity: 'Legend', image: 'https://i1.sndcdn.com/artworks-ZSy6Igf6byo3ZRgS-G7Lx1Q-t500x500.jpg', bonusType: 'flat', bonusValue: 20, bonusText: '+20$ mỗi khối' },
    gojo: { id: 'gojo', name: 'Gojo', rarity: 'Mythic', image: 'https://i.scdn.co/image/ab67616d00001e02be8d8aa9fcd65c5f40351a96', bonusType: 'multiplier', bonusValue: 1.5, bonusText: 'x1.5 tổng tiền' },
    megumi: { id: 'megumi', name: 'Megumi', rarity: 'Secret', image: 'https://i.pinimg.com/736x/d8/62/be/d862bec8ab6702ebb71024d07a323af1.jpg', bonusType: 'flat', bonusValue: 50, bonusText: '+50$ mỗi khối' },
    itachi: { id: 'itachi', name: 'Itachi', rarity: 'Common', image: 'https://4kwallpapers.com/images/wallpapers/itachi-uchiha-2048x2048-19971.jpg', bonusType: 'flat', bonusValue: 15, bonusText: '+15$ mỗi khối' },
    nanami: { id: 'nanami', name: 'Nanami', rarity: 'Common', image: 'https://i.pinimg.com/736x/d2/b2/90/d2b290e8cf7898eefdd64b68ae477849.jpg', bonusType: 'flat', bonusValue: 17, bonusText: '+17$ mỗi khối' },
    zoro: { id: 'zoro', name: 'Zoro', rarity: 'Rare', image: 'https://i.pinimg.com/736x/f0/71/dc/f071dc841f593eb7af5b9aed7dd2aaac.jpg', bonusType: 'flat', bonusValue: 25, bonusText: '+25$ mỗi khối' },
    bakugo: { id: 'bakugo', name: 'Bakugo', rarity: 'Rare', image: 'https://i.pinimg.com/736x/03/4a/a7/034aa76d0892d3f421f25ed8116d186f.jpg', bonusType: 'flat', bonusValue: 28, bonusText: '+28$ mỗi khối' },
    'jinwoo': { id: 'jinwoo', name: 'Jin Woo', rarity: 'Epic', image: 'https://img.asmedia.epimg.net/resizer/v2/CQQFFTMTVFAWRGOUSQWHFR4CLY.png?auth=ceff9904f42b7a9c324f2b49ed90b343dfcf411d9688e66ad081acb3192af62a&width=1200&height=1200&smart=true', bonusType: 'flat', bonusValue: 40, bonusText: '+40$ mỗi khối' },
    levi: { id: 'levi', name: 'Levi', rarity: 'Legend', image: 'https://static.wikia.nocookie.net/shingekinokyojin/images/0/0a/Levi_Ackermann_%28Anime%29_character_image_%28854%29.png/revision/latest?cb=20231106070611', bonusType: 'flat', bonusValue: 60, bonusText: '+60$ mỗi khối' },
    luffy: { id: 'luffy', name: 'Luffy', rarity: 'Mythic', image: 'https://i.redd.it/shigaraki-vs-luffy-who-wins-v0-pct4a10f4yve1.jpg?width=1920&format=pjpg&auto=webp&s=731df8ebfb170581b1c7a6c31d3e662406f8bd5a', bonusType: 'multiplier', bonusValue: 2, bonusText: 'x2 tổng tiền' },
    goku: { id: 'goku', name: 'Goku', rarity: 'Secret', image: 'https://bleedingcool.com/wp-content/uploads/2020/01/ultra-instinct-goku-900x900.jpg', bonusType: 'flat', bonusValue: 500, bonusText: '+500$ mỗi khối' },
    inosuke: { id: 'inosuke', name: 'Inosuke', rarity: 'Common', image: 'https://i.redd.it/inosuke-hashibira-demon-slayer-vs-arataki-itto-genshin-v0-t4q1wave4kue1.jpg?width=1200&format=pjpg&auto=webp&s=c9b66a28dd74b075b79b9fded15d18d169ded4b5', bonusType: 'flat', bonusValue: 60, bonusText: '+60$ mỗi khối' },
    vegeta: { id: 'vegeta', name: 'Vegeta', rarity: 'Common', image: 'https://i1.sndcdn.com/artworks-000118701077-tvmk00-t1080x1080.jpg', bonusType: 'flat', bonusValue: 62, bonusText: '+62$ mỗi khối' },
    sanji: { id: 'sanji', name: 'Sanji', rarity: 'Rare', image: 'https://i.pinimg.com/736x/e6/e5/c5/e6e5c5eddc5cb3ea5e75ad568b1b54bb.jpg', bonusType: 'flat', bonusValue: 84, bonusText: '+84$ mỗi khối' },
    ichigo: { id: 'ichigo', name: 'Ichigo', rarity: 'Epic', image: 'https://www.animedep.com/wp-content/uploads/2025/05/anh-kurosaki-ichigo-2.webp', bonusType: 'flat', bonusValue: 120, bonusText: '+120$ mỗi khối' },
    saitama: { id: 'saitama', name: 'Saitama', rarity: 'Legend', image: 'https://res09.bignox.com/moniqi-blog/vn-bignox-blog/2024/02/420018521_323264464024661_7705485423494122913_n.jpg', bonusType: 'flat', bonusValue: 240, bonusText: '+240$ mỗi khối' },
    rimuru: { id: 'rimuru', name: 'Rimuru', rarity: 'Legend', image: 'https://images.steamusercontent.com/ugc/2055374656768151949/38C6ADE1BF2310E881082AD8ACD1557E4196EBF2/?imw=512&&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=false', bonusType: 'flat', bonusValue: 240, bonusText: '+240$ mỗi khối' },
    rengoku: { id: 'rengoku', name: 'Rengoku', rarity: 'Mythic', image: 'https://www.animedep.com/wp-content/uploads/2025/07/anh-rengoku-6.webp', bonusType: 'multiplier', bonusValue: 2.5, bonusText: 'x2.5 tổng tiền' },
    zenitsu: { id: 'zenitsu', name: 'Zenitsu', rarity: 'Secret', image: 'https://cdn-images.dzcdn.net/images/cover/3829e706717d2cbaf2da7ca8ca445133/0x1900-000000-80-0-0.jpg', bonusType: 'flat', bonusValue: 1000, bonusText: '+1000$ mỗi khối' },
    // Banner 4 Heroes - Updated Images
    jean: { id: 'jean', name: 'Jean', rarity: 'Common', image: 'https://drive.google.com/uc?export=view&id=14u_MbWc03vsYUofkHwkp54nae_82DNbP', bonusType: 'flat', bonusValue: 70, bonusText: '+70$ mỗi khối' },
    marlo: { id: 'marlo', name: 'Marlo', rarity: 'Common', image: 'https://drive.google.com/uc?export=view&id=18gek3Y8Ju6RlWbTbTajxL0Sa_rHE-BOm', bonusType: 'flat', bonusValue: 75, bonusText: '+75$ mỗi khối' },
    hange: { id: 'hange', name: 'Hange', rarity: 'Rare', image: 'https://drive.google.com/uc?export=view&id=1kfl2DmJQq_Kc_XZz1EFy83FVOLA7U6tH', bonusType: 'flat', bonusValue: 90, bonusText: '+90$ mỗi khối' },
    kenny: { id: 'kenny', name: 'Kenny', rarity: 'Rare', image: 'https://drive.google.com/uc?export=view&id=1I_J75fPhIFz5Ei574hY3OzC7RifajoYr', bonusType: 'flat', bonusValue: 95, bonusText: '+95$ mỗi khối' },
    bertholt: { id: 'bertholt', name: 'Bertholt', rarity: 'Rare', image: 'https://drive.google.com/uc?export=view&id=19YcRlzjnQqV5F3TBETw8vk2kU-MIU2eH', bonusType: 'flat', bonusValue: 100, bonusText: '+100$ mỗi khối' },
    reiner: { id: 'reiner', name: 'Reiner', rarity: 'Epic', image: 'https://drive.google.com/uc?export=view&id=1cFULj8gHlq4D6RwNxUzd-SleOB-0pb3T', bonusType: 'flat', bonusValue: 150, bonusText: '+150$ mỗi khối' },
    annie: { id: 'annie', name: 'Annie', rarity: 'Legend', image: 'https://drive.google.com/uc?export=view&id=1zFyMOL8sOqTXNgSp9OFmjGAISRdxk2H3', bonusType: 'flat', bonusValue: 320, bonusText: '+320$ mỗi khối' },
    armin: { id: 'armin', name: 'Armin', rarity: 'Legend', image: 'https://drive.google.com/uc?export=view&id=16yN3z1WjQqHTjt0GXJD2bkpjzrdtKEz2', bonusType: 'flat', bonusValue: 300, bonusText: '+300$ mỗi khối' },
    mikasa: { id: 'mikasa', name: 'Mikasa', rarity: 'Mythic', image: 'https://drive.google.com/uc?export=view&id=1h5G_x-p8S0xQY_4w2V8Z-8x9Y_8Z_9Q_', bonusType: 'multiplier', bonusValue: 3.0, bonusText: 'x3 tổng tiền' },
    eren: { id: 'eren', name: 'Eren', rarity: 'Secret', image: 'https://drive.google.com/uc?export=view&id=1B-g4gV6_w6y8F_4w_4w_4w_4w_4w_4w_', bonusType: 'flat', bonusValue: 1500, bonusText: '+1500$ mỗi khối' },
    erwin: { id: 'erwin', name: 'Erwin', rarity: 'Secret', image: 'https://drive.google.com/uc?export=view&id=1Q_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_', bonusType: 'flat', bonusValue: 1200, bonusText: '+1200$ mỗi khối' },
    // New Detective Conan heroes
    genta: { id: 'genta', name: 'Genta', rarity: 'Common', image: 'https://i.pinimg.com/736x/69/ef/94/69ef94f9de48af1fb1c4c2893ee1fd98.jpg', bonusType: 'flat', bonusValue: 2, bonusText: '+2$ mỗi khối' },
    ayumi: { id: 'ayumi', name: 'Ayumi', rarity: 'Common', image: 'https://i.pinimg.com/736x/b4/66/1b/b4661b550d00633d7f17ea230ced6c38.jpg', bonusType: 'flat', bonusValue: 2, bonusText: '+2$ mỗi khối' },
    sonoko: { id: 'sonoko', name: 'Sonoko', rarity: 'Rare', image: 'https://i.pinimg.com/736x/54/17/86/5417868511cdfa546aa2968f588ffdc4.jpg', bonusType: 'flat', bonusValue: 5, bonusText: '+5$ mỗi khối' },
    yukiko_kudo: { id: 'yukiko_kudo', name: 'Yukiko Kudo', rarity: 'Rare', image: 'https://i.pinimg.com/222x/1e/51/5d/1e515d46581ade05599aebadc4e87fe5.jpg', bonusType: 'flat', bonusValue: 5, bonusText: '+5$ mỗi khối' },
    heiji: { id: 'heiji', name: 'Heiji', rarity: 'Epic', image: 'https://i.pinimg.com/736x/fc/a8/c6/fca8c61455fd19c46f480eb4d3f2c941.jpg', bonusType: 'flat', bonusValue: 10, bonusText: '+10$ mỗi khối' },
    shuichi_akai: { id: 'shuichi_akai', name: 'Shuichi Akai', rarity: 'Legend', image: 'https://i.pinimg.com/280x280_RS/49/92/8e/49928ead0942ad84d4a31dc7efaaaee7.jpg', bonusType: 'flat', bonusValue: 20, bonusText: '+20$ mỗi khối' },
    kid: { id: 'kid', name: 'Kid', rarity: 'Legend', image: 'https://i.pinimg.com/736x/21/57/5a/21575a2d6728c70f80d720b080b06b9b.jpg', bonusType: 'flat', bonusValue: 20, bonusText: '+20$ mỗi khối' },
    conan: { id: 'conan', name: 'Conan', rarity: 'Mythic', image: 'https://i.pinimg.com/736x/29/77/81/29778112117562f7902d29486c8f9467.jpg', bonusType: 'multiplier', bonusValue: 1.5, bonusText: 'x1.5 tổng tiền' },
    ai_haibara: { id: 'ai_haibara', name: 'Ai Haibara', rarity: 'Secret', image: 'https://i.pinimg.com/736x/80/7e/6b/807e6ba3f5a049f5c22502c3d0b2f5d9.jpg', bonusType: 'flat', bonusValue: 50, bonusText: '+50$ mỗi khối' },
    shinichi_kudo: { id: 'shinichi_kudo', name: 'Shinichi Kudo', rarity: 'Secret', image: 'https://i.pinimg.com/736x/2b/38/20/2b38202d5d283626786c5f778c4a1613.jpg', bonusType: 'flat', bonusValue: 50, bonusText: '+50$ mỗi khối' },
    ran_mouri: { id: 'ran_mouri', name: 'Ran Mouri', rarity: 'Secret', image: 'https://i.pinimg.com/736x/9f/95/96/9f9596395b77c5e53381a1d63e9c5f61.jpg', bonusType: 'flat', bonusValue: 50, bonusText: '+50$ mỗi khối' },
    jodie_starling: { id: 'jodie_starling', name: 'Jodie Starling', rarity: 'Secret', image: 'https://i.pinimg.com/736x/e2/2e/81/e22e811c7590807e6c31d0b2f5d9.jpg', bonusType: 'flat', bonusValue: 50, bonusText: '+50$ mỗi khối' },
    gin: { id: 'gin', name: 'Gin', rarity: 'Secret', image: 'https://i.pinimg.com/736x/7e/2a/a4/7e2aa4f5a049f5c22502c3d0b2f5d9.jpg', bonusType: 'flat', bonusValue: 50, bonusText: '+50$ mỗi khối' },
    vodka: { id: 'vodka', name: 'Vodka', rarity: 'Secret', image: 'https://i.pinimg.com/736x/8f/3e/2a/8f3e2a4f5a049f5c22502c3d0b2f5d9.jpg', bonusType: 'flat', bonusValue: 50, bonusText: '+50$ mỗi khối' },
    vermout: { id: 'vermout', name: 'Vermouth', rarity: 'Secret', image: 'https://i.pinimg.com/736x/9d/95/96/9d9596395b77c5e53381a1d63e9c5f61.jpg', bonusType: 'flat', bonusValue: 50, bonusText: '+50$ mỗi khối' },
    bourbon: { id: 'bourbon', name: 'Bourbon', rarity: 'Secret', image: 'https://i.pinimg.com/736x/a0/a5/10/a0a510f5a049f5c22502c3d0b2f5d9.jpg', bonusType: 'flat', bonusValue: 50, bonusText: '+50$ mỗi khối' },
    kir: { id: 'kir', name: 'Kir', rarity: 'Secret', image: 'https://i.pinimg.com/736x/b0/b5/10/b0b510f5a049f5c22502c3d0b2f5d9.jpg', bonusType: 'flat', bonusValue: 50, bonusText: '+50$ mỗi khối' },
    chianti: { id: 'chianti', name: 'Chianti', rarity: 'Secret', image: 'https://i.pinimg.com/736x/c0/c5/10/c0c510f5a049f5c22502c3d0b2f5d9.jpg', bonusType: 'flat', bonusValue: 50, bonusText: '+50$ mỗi khối' },
    korn: { id: 'korn', name: 'Korn', rarity: 'Secret', image: 'https://i.pinimg.com/736x/d0/d5/10/d0d510f5a049f5c22502c3d0b2f5d9.jpg', bonusType: 'flat', bonusValue: 50, bonusText: '+50$ mỗi khối' },
    rum: { id: 'rum', name: 'Rum', rarity: 'Secret', image: 'https://i.pinimg.com/736x/e0/e5/10/e0e510f5a049f5c22502c3d0b2f5d9.jpg', bonusType: 'flat', bonusValue: 50, bonusText: '+50$ mỗi khối' },
    // New heroes from CSV
    jiro: { id: 'jiro', name: 'Jiro', rarity: 'Common', image: 'https://i.pinimg.com/736x/14/e1/a1/14e1a129e2181c92b916f5219fa39563.jpg', bonusType: 'flat', bonusValue: 50, bonusText: '+50$ mỗi khối' },
    tokoyami: { id: 'tokoyami', name: 'Tokoyami', rarity: 'Common', image: 'https://i.pinimg.com/736x/4c/23/e3/4c23e328b06cc2d4bbf0225e3f0d18cb.jpg', bonusType: 'flat', bonusValue: 50, bonusText: '+50$ mỗi khối' },
    tenya: { id: 'tenya', name: 'Tenya', rarity: 'Common', image: 'https://i.pinimg.com/736x/a6/7b/f9/a67bf970a9bcb70c5ed8c5ab58d9d2cd.jpg', bonusType: 'flat', bonusValue: 50, bonusText: '+50$ mỗi khối' },
    momo: { id: 'momo', name: 'Momo', rarity: 'Rare', image: 'https://i.pinimg.com/736x/0c/7c/6f/0c7c6f5accccda4f4d696a79d5c1cc50.jpg', bonusType: 'flat', bonusValue: 100, bonusText: '+100$ mỗi khối' },
    shoto: { id: 'shoto', name: 'Shoto', rarity: 'Epic', image: 'https://i.pinimg.com/736x/e8/ed/73/e8ed73b596d060dbdd3f987f901482b7.jpg', bonusType: 'flat', bonusValue: 200, bonusText: '+200$ mỗi khối' },
    all_might: { id: 'all_might', name: 'All Might', rarity: 'Legend', image: 'https://i.pinimg.com/1200x/df/a3/aa/dfa3aa36d1338b591a194de72855d938.jpg', bonusType: 'flat', bonusValue: 500, bonusText: '+500$ mỗi khối' },
    aizawa: { id: 'aizawa', name: 'Aizawa', rarity: 'Legend', image: 'https://i.pinimg.com/736x/7d/5e/5b/7d5e5b0e8c751c3d0b2f5d9.jpg', bonusType: 'flat', bonusValue: 500, bonusText: '+500$ mỗi khối' },
    // New heroes for Banner 6
    deku: { id: 'deku', name: 'Deku', rarity: 'Mythic', image: 'https://i.pinimg.com/736x/4e/91/2d/4e912dde5dc00e240ab0560d381d460b.jpg', bonusType: 'multiplier', bonusValue: 3.5, bonusText: 'x3.5 tổng tiền' },
    super_bakugo: { id: 'super_bakugo', name: 'Super Bakugo', rarity: 'Secret', image: 'https://i.pinimg.com/474x/ff/57/f7/ff57f7daee451b65cb5ac5e2d6d19947.jpg', bonusType: 'flat', bonusValue: 2000, bonusText: '+2000$ mỗi khối' },
};

const GACHA_BANNERS = {
    hyper: {
        id: 1, name: "Banner 1: Hyper - Dành cho newbie", cost: 1000, refundRate: 0.2,
        rates: { Common: 0.90, Rare: 0.095, Epic: 0.004, Legend: 0.0009, Mythic: 0.00009, Secret: 0.00001 },
        pool: { Common: ['naruto', 'nobara'], Rare: ['sukuna', 'kakashi'], Epic: ['itadori'], Legend: ['yuta'], Mythic: ['gojo'], Secret: ['megumi'] }
    },
    allstars: {
        id: 2, name: "Banner 2: All Stars", cost: 50000, refundRate: 0.2,
        rates: { Common: 0.90, Rare: 0.095, Epic: 0.004, Legend: 0.0009, Mythic: 0.00009, Secret: 0.00001 },
        pool: { Common: ['itachi', 'nanami'], Rare: ['zoro', 'bakugo'], Epic: ['jinwoo'], Legend: ['levi'], Mythic: ['luffy'], Secret: ['goku'] }
    },
    ultimate: {
        id: 3, name: "Banner 3: Ultimate Saga", cost: 250000, refundRate: 0.2,
        rates: { Common: 0.90, Rare: 0.095, Epic: 0.004, Legend: 0.0009, Mythic: 0.00009, Secret: 0.00001 },
        pool: { Common: ['inosuke', 'vegeta'], Rare: ['sanji'], Epic: ['ichigo'], Legend: ['saitama', 'rimuru'], Mythic: ['rengoku'], Secret: ['zenitsu'] }
    },
    titanEra: {
        id: 4, name: "Banner 4: Thời đại Titan", cost: 1500000, refundRate: 0.2, // Updated cost to 1,500,000
        rates: { Common: 0.90, Rare: 0.095, Epic: 0.004, Legend: 0.0009, Mythic: 0.00009, Secret: 0.00001 },
        pool: { 
            Common: ['jean', 'marlo'], 
            Rare: ['hange', 'kenny', 'bertholt'], 
            Epic: ['reiner'], 
            Legend: ['armin', 'annie'], 
            Mythic: ['mikasa'], 
            Secret: ['eren', 'erwin'] 
        }
    },
    detective: { // New banner: Detective Conan
        id: 5, name: "Banner 5: Thám tử lừng danh", cost: 10000000, refundRate: 0.2, // Cost 10,000,000
        rates: { Common: 0.90, Rare: 0.095, Epic: 0.004, Legend: 0.0009, Mythic: 0.00009, Secret: 0.00001 },
        pool: {
            Common: ['genta', 'ayumi'],
            Rare: ['sonoko', 'yukiko_kudo'],
            Epic: ['heiji'],
            Legend: ['shuichi_akai', 'kid'],
            Mythic: ['conan'],
            Secret: ['ran_mouri']
        }
    },
    newGeneration: { // Banner 6: New Generation of Heroes
        id: 6, name: "Banner 6: Thế hệ anh hùng mới", cost: 250000000, refundRate: 0.2,
        rates: { Common: 0.90, Rare: 0.095, Epic: 0.004, Legend: 0.0009, Mythic: 0.00009, Secret: 0.00001 },
        pool: {
            Common: ['jiro', 'tokoyami', 'tenya'],
            Rare: ['momo'],
            Epic: ['shoto'],
            Legend: ['all_might', 'aizawa'],
            Mythic: ['deku'], // Added Deku to Mythic pool
            Secret: ['super_bakugo'] // Added Super Bakugo to Secret pool
        }
    }
};

const ARTIFACT_DATA = {
    sword: { id: 'sword', name: 'Kiếm Gỉ', rarity: 'Common', image: 'https://cdn-icons-png.flaticon.com/512/1086/1086942.png', bonusType: 'damage', bonusValue: 2, bonusText: '+2 Sát thương' },
    shield: { id: 'shield', name: 'Khiên Gỗ', rarity: 'Common', image: 'https://cdn-icons-png.flaticon.com/512/1086/1086953.png', bonusType: 'damage', bonusValue: 1, bonusText: '+1 Sát thương' },
    iron_sword: { id: 'iron_sword', name: 'Kiếm Sắt', rarity: 'Rare', image: 'https://cdn-icons-png.flaticon.com/512/2927/2927977.png', bonusType: 'damage', bonusValue: 5, bonusText: '+5 Sát thương' },
    magic_ring: { id: 'magic_ring', name: 'Nhẫn Phép', rarity: 'Epic', image: 'https://cdn-icons-png.flaticon.com/512/189/189712.png', bonusType: 'damage', bonusValue: 10, bonusText: '+10 Sát thương' },
    dragon_scale: { id: 'dragon_scale', name: 'Vảy Rồng', rarity: 'Legend', image: 'https://cdn-icons-png.flaticon.com/512/868/868648.png', bonusType: 'damage', bonusValue: 25, bonusText: '+25 Sát thương' },
};

const DUNGEON_MINIONS = [
    'https://cdn-icons-png.flaticon.com/512/3050/3050734.png', // Slime
    'https://cdn-icons-png.flaticon.com/512/167/167243.png',   // Goblin
    'https://cdn-icons-png.flaticon.com/512/3503/3503849.png', // Skeleton
    'https://cdn-icons-png.flaticon.com/512/993/993539.png',   // Orc
];

const PASSIVE_DATA = {
    rates: { '1': 60, '2': 39, '3': 0.9, 'rainbow': 0.1 },
    types: {
        '1': [
            { id: 'flatDamage', name: 'Thêm Sát Thương', value: 50, desc: 'Tăng 50 sát thương' },
            { id: 'gachaSpeed', name: 'Tốc Độ Gacha', value: 5, desc: 'Tăng 5% tốc độ quay gacha' },
            { id: 'flatMoney', name: 'Tiền Mỗi Khối', value: 50, desc: 'Thêm 50$ mỗi khối' },
            { id: 'upgradeCost', name: 'Giảm Giá Nâng Cấp', value: 5, desc: 'Giảm 5% giá nâng cấp' }
        ],
        '2': [
            { id: 'heroDamage', name: 'Sát Thương Hero', value: 20, desc: 'Tăng 20% sát thương của hero' },
            { id: 'gachaSpeed', name: 'Tốc Độ Gacha', value: 10, desc: 'Tăng 10% tốc độ quay gacha' },
            { id: 'flatMoney', name: 'Tiền Mỗi Khối', value: 100, desc: 'Thêm 100$ mỗi khối' },
            { id: 'moneyMultiplier', name: 'Hệ Số Tiền', value: 0.5, desc: 'Thêm x0.5 hệ số nhân tiền' },
            { id: 'upgradeCost', name: 'Giảm Giá Nâng Cấp', value: 10, desc: 'Giảm 10% giá nâng cấp' }
        ],
        '3': [
            { id: 'heroDamage', name: 'Sát Thương Hero', value: 30, desc: 'Tăng 30% sát thương của hero' },
            { id: 'gachaSpeed', name: 'Tốc Độ Gacha', value: 15, desc: 'Tăng 15% tốc độ quay gacha' },
            { id: 'upgradeCost', name: 'Giảm Giá Nâng Cấp', value: 15, desc: 'Giảm 15% giá nâng cấp' },
            { id: 'moneyMultiplier', name: 'Hệ Số Tiền', value: 1, desc: 'Thêm x1.0 hệ số nhân tiền' }
        ],
        'rainbow': [
            { 
                id: 'rainbow',
                name: 'Rainbow Passive',
                effects: {
                    heroDamage: 50,
                    totalDamage: 10,
                    gachaSpeed: 20,
                    sellBonus: 1000,
                    moneyMultiplier: 1.5,
                    upgradeCost: 20
                },
                desc: 'Tăng 50% sát thương hero, 10% tổng damage, 20% tốc độ gacha, +1000$ mỗi lần bán, x1.5 tiền, -20% giá nâng cấp'
            }
        ]
    }
};

const DUNGEON_BOSSES = [
    { name: 'Jogo', image: 'https://static.wikia.nocookie.net/discordscaling/images/c/c7/Jogo.webp/revision/latest?cb=20240905031146' },
    { name: 'Mahito', image: 'https://www.anime-colors.com/wp-content/uploads/mahito.png' },
    { name: 'Geto', image: 'https://wibu.com.vn/wp-content/uploads/2025/02/Geto-Suguru.png' },
    { name: 'Akainu', image: 'https://opbr-en.bn-ent.net/assets/data/webp/character/0032_2d.png.webp' },
    { name: 'Katakuri', image: 'https://opbr-en.bn-ent.net/assets/data/webp/character/0031_2d.png.webp' },
    { name: 'Onochimaru', image: 'https://wibu.com.vn/wp-content/uploads/2024/04/Orochimaru-Naruto.png' },
    { name: 'Obito', image: 'https://wibu.com.vn/wp-content/uploads/2024/04/obito.png' },
    { name: 'Akaza', image: 'https://pngdownload.io/wp-content/uploads/2024/01/Akaza-Upper-Moon-Three-from-Demon-Slayer-anime-transparent-PNG-image-jpg.webp' },
    { name: 'Douma', image: 'https://wibu.com.vn/wp-content/uploads/2024/04/Douma.png' },
    { name: 'Hilichurl', image: 'https://genshinimpact.wiki.fextralife.com/file/Genshin-Impact/hilichurl_icon.png' },
    { name: 'Slime', image: 'https://genshinimpact.wiki.fextralife.com/file/Genshin-Impact/anemo_slime_icon.png' },
    'https://genshinimpact.wiki.fextralife.com/file/Genshin-Impact/ruin_guard_icon.png',   // Ruin Guard
    'https://genshinimpact.wiki.fextralife.com/file/Genshin-Impact/fatui_pyro_agent_icon.png',    // Fatui
    'https://genshinimpact.wiki.fextralife.com/file/Genshin-Impact/rockfond_rifthound_icon.png',  // Rifthound
    'https://genshinimpact.wiki.fextralife.com/file/Genshin-Impact/maguu_kenki_icon.png'          // Maguu Kenki
];


// --- 3D Scene Variables ---
let scene, camera, renderer, raycaster, mouse;
let mineGrid = [];
let mineMeshes = [];
let particles = [];
let shrinkingBlocks = [];
let visualMiners = [];
let autoMineTimer = 0;
let autoMineTargetIndex = 0;

// --- Utility Functions ---
function formatMoney(n) {
    if (n < 1e3) return n.toFixed(0);
    if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
    if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
    if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
    return n.toExponential(2);
}

function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = null;
    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = MINE_COLS * 2.0;
    const halfViewSize = viewSize / 2;
    camera = new THREE.OrthographicCamera(-halfViewSize * aspect, halfViewSize * aspect, halfViewSize, -halfViewSize, -100, 100);
    camera.position.set(12, 12, 12);
    const centerX = (MINE_COLS-1) * BLOCK_SIZE / 2;
    const centerZ = (MINE_ROWS-1) * BLOCK_SIZE / 2;
    camera.lookAt(centerX, -MINE_HEIGHT/2, centerZ);
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 15);
    scene.add(directionalLight);
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    window.addEventListener('resize', onWindowResize, false);
    canvas.addEventListener('click', onCanvasClick, false);
}

// --- Game Logic ---
function getBlockType(isTopLayer, currentDepth) {
    if (isTopLayer) return 'grass';

    // Check for Kotso realm (after floor 250)
    if (currentDepth > 250) {
        // Return Kotso stone instead of regular stone
        if (Math.random() > 0.01) return 'kotso';
    }

    if (currentDepth >= 100) {
        const DEEP_ORE_SPAWN_RANGES = { darkium: { min: 125, max: 150 }, bonreus: { min: 125, max: 150 }, uranious: { min: 100, max: 125 }, crystal: { min: 100, max: 125 } };
        const DEEP_ORE_CHANCE = 0.01;
        for (const ore in DEEP_ORE_SPAWN_RANGES) {
            const config = DEEP_ORE_SPAWN_RANGES[ore];
            if (currentDepth >= config.min && currentDepth <= config.max && Math.random() < DEEP_ORE_CHANCE) return ore;
        }
    }

    const ORE_SPAWN_RANGES = { diamond:  { min: 80, max: 100 }, ruby: { min: 80, max: 100 }, rossara: { min: 50, max: 75 }, emerald: { min: 50, max: 75 }, lapis: { min: 20, max: 40 }, copper: { min: 20, max: 40 }, gold: { min: 40, max: 100 }, coal: { min: 30, max: 80 }, obsidian: { min: 40, max: 120 } };
    const IN_RANGE_CHANCE = 0.01, OUT_OF_RANGE_CHANCE = 0.00006;
    const oreCheckOrder = ['diamond', 'ruby', 'rossara', 'emerald', 'obsidian', 'gold', 'lapis', 'copper', 'coal'];
    for (const ore of oreCheckOrder) {
        const config = ORE_SPAWN_RANGES[ore];
        let chance = (config && currentDepth >= config.min && currentDepth <= config.max) ? IN_RANGE_CHANCE : OUT_OF_RANGE_CHANCE;
        if (Math.random() < chance) return ore;
    }

    if (currentDepth > 100) return 'stone';
    if (currentDepth > 5 || (currentDepth > 2 && Math.random() < 0.6)) return 'stone';
    return 'dirt';
}

function createBlockData(isTopLayer, currentDepth) {
    const blockTypeName = getBlockType(isTopLayer, currentDepth);
    const blockType = BLOCK_TYPES[blockTypeName];
    let health = blockType.health;
    if (currentDepth >= 100) health += 5000;
    return { type: blockTypeName, health: health, maxHealth: health };
}

function createGradientMaterial(color1, color2) {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0, color1); gradient.addColorStop(1, color2);
    context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.MeshStandardMaterial({ map: texture });
}

function createBlockMesh(x, y, z, blockData, currentDepth) {
    const geometry = new THREE.BoxGeometry(BLOCK_SIZE * 0.95, BLOCK_SIZE * 0.95, BLOCK_SIZE * 0.95);
    const blockTypeInfo = BLOCK_TYPES[blockData.type];
    let material;
    const isDeep = currentDepth >= 100;

    // Special handling for Kotso stones
    if (blockData.type === 'kotso') {
        const randomKotsoColor = KOTSO_COLORS[Math.floor(Math.random() * KOTSO_COLORS.length)];
        material = new THREE.MeshStandardMaterial({ color: new THREE.Color(randomKotsoColor) });
    }
    else if (isDeep && blockTypeInfo.deepGradient) material = createGradientMaterial(...blockTypeInfo.deepGradient);
    else if (blockTypeInfo.gradient) material = createGradientMaterial(...blockTypeInfo.gradient);
    else {
        const baseColor = new THREE.Color(blockTypeInfo.color);
        const hsl = {}; baseColor.getHSL(hsl); hsl.l += (Math.random() - 0.5) * 0.1;
        baseColor.setHSL(hsl.h, hsl.s, hsl.l);
        material = new THREE.MeshStandardMaterial({ color: baseColor });
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x * BLOCK_SIZE, -y * BLOCK_SIZE, z * BLOCK_SIZE);
    mesh.userData = { gridX: x, gridY: y, gridZ: z, targetYScale: 1.0, targetYPosition: -y * BLOCK_SIZE, isFlashing: false, flashTime: 0 };
    return mesh;
}

function initializeMine() {
    // Clear existing mine meshes from the scene
    mineMeshes.flat().forEach(mesh => {
        if (mesh) scene.remove(mesh);
    });
    mineGrid = [];
    mineMeshes = [];

    for (let y = 0; y < MINE_HEIGHT; y++) {
        const layerData = [], layerMeshes = [];
        const currentDepth = state.depth + y;
        for (let z = 0; z < MINE_ROWS; z++) {
            for (let x = 0; x < MINE_COLS; x++) {
                const blockData = createBlockData(y === 0, currentDepth);
                const mesh = createBlockMesh(x, y, z, blockData, currentDepth);
                layerData.push(blockData); layerMeshes.push(mesh); scene.add(mesh);
            }
        }
        mineGrid.push(layerData); mineMeshes.push(layerMeshes);
    }
}


function digBlock(x, y, z, power, isPlayerAction = false, isSuperMiner = false) {
    if (y < 0 || y >= MINE_HEIGHT) return;
    const index = z * MINE_COLS + x;
    if (!mineGrid[y] || !mineGrid[y][index]) return;
    const blockData = mineGrid[y][index];
    const mesh = mineMeshes[y][index];
    if (!mesh || blockData.health <= 0) return;
    blockData.health -= power;
    mesh.userData.isFlashing = true; mesh.userData.flashTime = 0.15;
    if (mesh.material.emissive) mesh.material.emissive.setHex(0xffffff);
    createHitParticles(mesh.position, mesh.material.color || 0xffffff);
    if (blockData.health <= 0) {
        const blockTypeInfo = BLOCK_TYPES[blockData.type];
        let moneyGained = blockTypeInfo.sellValue;
        const currentBlockDepth = state.depth + y; 
        if (currentBlockDepth < 100) moneyGained += ['grass', 'dirt', 'stone'].includes(blockData.type) ? 50 : 300;
        else moneyGained += 400;
        const depthBonus = 1 + (Math.floor(state.depth / 10) * 0.01);
        moneyGained *= depthBonus;
        let flatBonus = 0, multiplier = 1;
        state.heroes.equipped.forEach(heroId => {
            const hero = HERO_DATA[heroId];
            if (hero.bonusType === 'flat') flatBonus += hero.bonusValue;
            else if (hero.bonusType === 'multiplier') multiplier *= hero.bonusValue;
        });
        moneyGained = Math.round((moneyGained + flatBonus) * multiplier);
        state.stats.blocksMined++;
        state.stats.minedBlockCounts[blockData.type] = (state.stats.minedBlockCounts[blockData.type] || 0) + 1;
        state.resources.money += moneyGained;
        state.stats.moneyEarned += moneyGained;
        moneyEl.classList.add('money-flash');
        setTimeout(() => moneyEl.classList.remove('money-flash'), 200);
        shrinkingBlocks.push(mesh);
        mineMeshes[y][index] = null;
        checkRowsCleared();
    } else {
        mesh.userData.targetYScale = blockData.health / blockData.maxHealth;
    }
    const multiLevel = isPlayerAction ? state.upgrades.mineMultiLevel : (isSuperMiner ? state.upgrades.superMinerLevel : 0);
    if (multiLevel > 0 && y === 0) {
        const splashDamage = power * 0.25 * multiLevel;
        for (let dz = -1; dz <= 1; dz++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dz === 0) continue;
                const nx = x + dx, nz = z + dz;
                if (nx >= 0 && nx < MINE_COLS && nz >= 0 && nz < MINE_ROWS) digBlock(nx, y, nz, splashDamage, false, false);
            }
        }
    }
    updateUI({ fullRender: false });
}

function checkRowsCleared() {
    if (mineMeshes[0].every(mesh => mesh === null)) {
        state.depth++;
        mineGrid.shift(); mineMeshes.shift();
        const newY = state.depth + MINE_HEIGHT - 1;
        const newLayerData = [], newLayerMeshes = [];
        for (let z = 0; z < MINE_ROWS; z++) {
            for (let x = 0; x < MINE_COLS; x++) {
                const blockData = createBlockData(false, newY);
                const mesh = createBlockMesh(x, y, z, blockData, newY);
                newLayerData.push(blockData); newLayerMeshes.push(mesh); scene.add(mesh);
            }
        }
        mineGrid.push(newLayerData); mineMeshes.push(newLayerMeshes);
        for(let y = 0; y < MINE_HEIGHT; y++) {
            for(let i = 0; i < mineMeshes[y].length; i++) {
                const mesh = mineMeshes[y][i];
                if(mesh) { mesh.userData.gridY = y; mesh.userData.targetYPosition = -y * BLOCK_SIZE; }
            }
        }
        autoMineTargetIndex = 0;
    }
}

function createHitParticles(position, color) {
    const particleCount = 5;
    const particleGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const particleMaterial = new THREE.MeshBasicMaterial({ color: color });
    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);
        particle.velocity = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
        particle.lifetime = Math.random() * 0.5 + 0.3;
        particles.push(particle); scene.add(particle);
    }
}

function addMiner() {
    const minerGroup = new THREE.Group();
    minerGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.6, 8), new THREE.MeshStandardMaterial({ color: 0x475569 })));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    head.position.y = 0.5; minerGroup.add(head);
    const light = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 8), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
    light.position.set(0, 0.6, 0.2); light.rotation.x = Math.PI / 2; minerGroup.add(light);
    const startX = Math.floor(Math.random() * MINE_COLS), startZ = Math.floor(Math.random() * MINE_ROWS);
    minerGroup.position.set(startX, 0.5, startZ);
    scene.add(minerGroup);
    visualMiners.push({ mesh: minerGroup, state: 'IDLE', target: null, digTimer: 0, restTimer: 0 });
}

// --- UI & Rendering ---
function showNotification(message, type = 'info') {
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    notificationContainer.appendChild(notif);

    setTimeout(() => notif.remove(), 3000);
}

function updateUI(options = {}) {
    const fullRender = options.fullRender === undefined ? true : options.fullRender;
    moneyEl.textContent = `${formatMoney(state.resources.money)} $`;
    document.getElementById('shards').textContent = state.resources.shards || 0;
    const currentPanel = document.querySelector('#panel-container .panel');
    if (!currentPanel) return;

    if (fullRender && activePanel) {
        switch(activePanel) {
            case 'template-gacha': renderGachaPanel(); break;
            case 'template-equipment': renderEquipmentPanel(); break;
            case 'template-dungeon': renderDungeonPanel(); break;
            case 'template-stats': renderStatsPanel(); break;
            case 'template-music': renderMusicPanel(); break;
            case 'template-settings': renderSettingsPanel(); break;
        }
    }
    
    if (activePanel === 'template-upgrades') {
        const agentContainer = currentPanel.querySelector('#agentTungContainer');
        if (agentContainer) {
            if (!state.agents.tung.owned) {
                if (!agentContainer.querySelector('#buyAgentTung')) {
                    agentContainer.innerHTML = `<button id="buyAgentTung" class="btn-primary">${formatMoney(50000)} $</button>`;
                }
            } else {
                if (!agentContainer.querySelector('#agentTungAction')) {
                    agentContainer.innerHTML = `
                        <button id="agentTungAction" class="btn-primary relative">
                            Kích hoạt
                            <div class="cooldown-overlay" style="opacity: 0; pointer-events: none;">
                                <span></span>
                            </div>
                        </button>`;
                }
                
                const agentButton = agentContainer.querySelector('#agentTungAction');
                const cooldownOverlay = agentButton.querySelector('.cooldown-overlay');
                const cooldownSpan = cooldownOverlay.querySelector('span');
                const buttonTextNode = Array.from(agentButton.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '');

                const isOnCooldown = state.agents.tung.cooldown > 0;
                const isTargeting = state.agents.tung.isTargeting;

                agentButton.disabled = isOnCooldown;
                
                if (buttonTextNode) {
                    buttonTextNode.textContent = isTargeting ? 'Hủy' : 'Kích hoạt';
                }

                if (isTargeting) {
                    agentButton.classList.add('!bg-red-600');
                } else {
                    agentButton.classList.remove('!bg-red-600');
                }

                cooldownOverlay.style.opacity = isOnCooldown ? '1' : '0';
                if (isOnCooldown) {
                    cooldownSpan.textContent = Math.ceil(state.agents.tung.cooldown);
                }
            }
        }

        currentPanel.querySelector('#clickPowerStat').textContent = state.upgrades.clickPower;
        const clickCost = Math.ceil(15 * Math.pow(1.22, state.upgrades.clickPower - 1));
        currentPanel.querySelector('#upgradeClickCost').textContent = `${formatMoney(clickCost)} $`;
        currentPanel.querySelector('#upgradeClick').disabled = state.resources.money < clickCost;
        currentPanel.querySelector('#mineMultiLevelStat').textContent = state.upgrades.mineMultiLevel;
        const mineMultiCost = Math.ceil(450 * Math.pow(2.8, state.upgrades.mineMultiLevel));
        currentPanel.querySelector('#upgradeMineMultiCost').textContent = `${formatMoney(mineMultiCost)} $`;
        currentPanel.querySelector('#upgradeMineMulti').disabled = state.resources.money < mineMultiCost;
        currentPanel.querySelector('#autoMineLevelStat').textContent = state.upgrades.autoMineLevel;
        const autoMineCost = Math.ceil(80 * Math.pow(2.4, state.upgrades.autoMineLevel));
        currentPanel.querySelector('#upgradeAutoMineCost').textContent = `${formatMoney(autoMineCost)} $`;
        currentPanel.querySelector('#upgradeAutoMine').disabled = state.resources.money < autoMineCost;

        currentPanel.querySelector('#minerCountStat').textContent = `${state.upgrades.minerCount}/5`;
        const hireCost = Math.ceil(40 * Math.pow(1.55, state.upgrades.minerCount));
        const hireCostEl = currentPanel.querySelector('#hireMinerCost');
        if (state.upgrades.minerCount >= 5) {
            hireCostEl.textContent = "Max"; currentPanel.querySelector('#hireMiner').disabled = true;
        } else {
            hireCostEl.textContent = `${formatMoney(hireCost)} $`; currentPanel.querySelector('#hireMiner').disabled = state.resources.money < hireCost;
        }
        currentPanel.querySelector('#minerPowerLevelStat').textContent = state.upgrades.minerPowerLevel;
        const minerPowerCost = Math.ceil(150 * Math.pow(1.65, state.upgrades.minerPowerLevel - 1));
        currentPanel.querySelector('#upgradeMinerPowerCost').textContent = `${formatMoney(minerPowerCost)} $`;
        currentPanel.querySelector('#upgradeMinerPower').disabled = state.resources.money < minerPowerCost;

        currentPanel.querySelector('#superMinerLevelStat').textContent = `${state.upgrades.superMinerLevel}/5`;
        const superMinerCost = Math.ceil(1800 * Math.pow(3.8, state.upgrades.superMinerLevel));
        const upgradeSuperMinerBtn = currentPanel.querySelector('#upgradeSuperMiner');
        const superMinerCostEl = currentPanel.querySelector('#upgradeSuperMinerCost');
         if (state.upgrades.superMinerLevel >= 5) {
            superMinerCostEl.textContent = "Max"; upgradeSuperMinerBtn.disabled = true;
        } else {
            superMinerCostEl.textContent = `${formatMoney(superMinerCost)} $`; upgradeSuperMinerBtn.disabled = state.resources.money < superMinerCost;
        }
        currentPanel.querySelector('#minerStaminaLevelStat').textContent = state.upgrades.minerStaminaLevel;
        const minerStaminaCost = Math.ceil(250 * Math.pow(1.9, state.upgrades.minerStaminaLevel));
        currentPanel.querySelector('#upgradeMinerStaminaCost').textContent = `${formatMoney(minerStaminaCost)} $`;
        currentPanel.querySelector('#upgradeMinerStamina').disabled = state.resources.money < minerStaminaCost;
    }
}

function renderGachaPanel() {
    const panel = panelContainer.querySelector('.panel');
    if (!panel) return;
    const bannerListEl = panel.querySelector('#gacha-banner-list');
    bannerListEl.innerHTML = '';
    for (const bannerId in GACHA_BANNERS) {
        const banner = GACHA_BANNERS[bannerId];
        const button = document.createElement('button');
        button.className = `banner-list-item ${bannerId === state.activeBanner ? 'active' : ''}`;
        button.dataset.banner = bannerId;
        button.textContent = banner.name;
        bannerListEl.appendChild(button);
    }
    if (state.activeBanner) renderGachaBannerDetails(state.activeBanner);
    else panel.querySelector('#gacha-banner-content').innerHTML = `<p class="text-slate-400 text-center">Chọn một banner để xem chi tiết.</p>`;
}

function renderGachaBannerDetails(bannerId) {
    const banner = GACHA_BANNERS[bannerId];
    const panel = panelContainer.querySelector('.panel');
    if (!panel || !banner) return;
    const contentEl = panel.querySelector('#gacha-banner-content');
    
    let tooltipContent = '<h3>Nhân vật trong Banner</h3>';
    ['Secret', 'Mythic', 'Legend', 'Epic', 'Rare', 'Common'].forEach(rarity => {
        if (banner.pool[rarity] && banner.pool[rarity].length > 0) {
            const heroNames = banner.pool[rarity].map(id => HERO_DATA[id].name).join(', ');
            tooltipContent += `<p><strong class="rarity-${rarity}">${rarity}:</strong> ${heroNames}</p>`;
        }
    });

    contentEl.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-600 pb-1 mb-2">
            <h2 class="font-bold text-lg">${banner.name}</h2>
            <div class="info-icon" title="Thông tin nhân vật">i<div class="banner-tooltip">${tooltipContent}</div></div>
        </div>
        <p class="text-sm text-slate-400 mb-2">Pity Mythical sau: <span class="font-bold text-amber-400">${state.stats.pityCounters[bannerId]}</span> lượt.</p>
        <div class="flex gap-2 mb-4">
            <button id="summon-1" class="btn-primary text-lg">x1 (${formatMoney(banner.cost)}$)</button>
            <button id="summon-3" class="btn-primary text-lg">x3 (${formatMoney(banner.cost * 3)}$)</button>
            <button id="summon-5" class="btn-primary text-lg">x5 (${formatMoney(banner.cost * 5)}$)</button>
        </div>
        <div class="border-t border-slate-600 pt-4">
            <div class="flex flex-col gap-2">
                <!-- Auto gacha button removed from here -->
            </div>
        </div>`;
    // Removed auto gacha button update logic
}

function renderArtifactsPanel() {
    const panel = panelContainer.querySelector('.panel');
    if (!panel) return;
    const artifactCollectionEl = panel.querySelector('#artifact-collection');
    if (!artifactCollectionEl) return;

    if (state.artifacts.collection.length === 0) {
        artifactCollectionEl.innerHTML = `<p class="text-slate-400 text-center">Chưa có di vật nào. Hãy chinh phục Dungeon!</p>`;
    } else {
        artifactCollectionEl.innerHTML = '';
        state.artifacts.collection.forEach(artifactId => {
            const artifact = ARTIFACT_DATA[artifactId];
            if (!artifact) return;
            const isEquipped = state.artifacts.equipped.includes(artifactId);
            const card = document.createElement('div');
            card.className = `artifact-card ${isEquipped ? 'equipped' : ''}`;
            card.dataset.artifactId = artifactId; // Add dataset for event handling
            card.innerHTML = `
                <img src="${artifact.image}" class="w-12 h-12 object-contain bg-slate-900/50 p-1 rounded" onerror="this.onerror=null;this.src='https://placehold.co/48x48/1e293b/94a3b8?text=Err';">
                <div class="flex-1">
                    <p class="font-bold">${artifact.name} <span class="text-sm font-normal rarity-${artifact.rarity}">(${artifact.rarity})</span></p>
                    <p class="text-sm text-slate-400">${artifact.bonusText}</p>
                </div>
                <button class="btn-primary !w-auto px-3">${isEquipped ? 'Gỡ' : 'Trang bị'}</button>`;
            artifactCollectionEl.appendChild(card);
        });
    }
}

function renderDungeonPanel() {
    const panel = panelContainer.querySelector('.panel');
    if (!panel) return;
    panel.querySelector('#dungeon-highest-floor').textContent = state.dungeon.highestFloor;
    
    // Update start button based on cooldown
    const startBtn = panel.querySelector('#start-dungeon-btn');
    if (state.dungeon.cooldown > 0) {
        startBtn.disabled = true;
        startBtn.innerHTML = `Chờ ${Math.ceil(state.dungeon.cooldown)}s`;
    } else {
        startBtn.disabled = false;
        startBtn.innerHTML = 'Bắt đầu';
    }
}

function renderStatsPanel() {
    const panel = panelContainer.querySelector('.panel');
    if (!panel) return;
    panel.querySelector('#depthStat').textContent = state.depth;
    
    // Convert timePlayed from seconds to HH:MM:SS
    const totalSeconds = Math.floor(state.stats.timePlayed);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    panel.querySelector('#timePlayed').textContent = `${hours}:${minutes}:${seconds}`;

    panel.querySelector('#blocksMined').textContent = state.stats.blocksMined;
    panel.querySelector('#moneyEarned').textContent = `${formatMoney(state.stats.moneyEarned)} $`;
    panel.querySelector('#moneySpent').textContent = `${formatMoney(state.stats.moneySpent)} $`;
    
    // New stats
    panel.querySelector('#gachaPullsStat').textContent = state.stats.gachaPulls;
    panel.querySelector('#ownedHeroesStat').textContent = state.heroes.collection.length;
    panel.querySelector('#ownedArtifactsStat').textContent = state.artifacts.collection.length;

    let totalFlatBonus = 0, totalMultiplier = 1;
    state.heroes.equipped.forEach(heroId => {
        const hero = HERO_DATA[heroId];
        if (hero) {
            if (hero.bonusType === 'flat') totalFlatBonus += hero.bonusValue;
            else if (hero.bonusType === 'multiplier') totalMultiplier *= hero.bonusValue;
        }
    });
    panel.querySelector('#heroFlatBonusStat').textContent = `+${totalFlatBonus} $`;
    panel.querySelector('#heroMultiplierStat').textContent = `x${totalMultiplier.toFixed(2)}`;
    panel.querySelector('#playerDamageStat').textContent = calculatePlayerDamage();
    const minedBlocksContainer = panel.querySelector('#mined-blocks-stats');
    const minedEntries = Object.entries(state.stats.minedBlockCounts);
    if (minedEntries.length === 0) minedBlocksContainer.innerHTML = `<p class="text-slate-400 text-center">Chưa có dữ liệu.</p>`;
    else {
        minedBlocksContainer.innerHTML = '';
        minedEntries.forEach(([blockId, count]) => {
            const blockInfo = BLOCK_TYPES[blockId];
            if (blockInfo) {
                const statEl = document.createElement('div');
                statEl.className = 'stat-item text-sm';
                statEl.innerHTML = `<span>${blockInfo.name}:</span> <span class="font-bold">${count}</span>`;
                minedBlocksContainer.appendChild(statEl);
            }
        });
    }
}

function renderMusicPanel() {
    const panel = panelContainer.querySelector('.panel');
    if (!panel) return;
    
    const currentTrackName = panel.querySelector('#current-track-name');
    if (currentTrackName) {
        currentTrackName.textContent = state.music.tracks[state.music.currentTrack].name;
    }
    
    const playIcon = panel.querySelector('#play-icon');
    const pauseIcon = panel.querySelector('#pause-icon');
    if (playIcon && pauseIcon) {
        if (state.music.isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }
    
    const volumeDisplay = panel.querySelector('#volume-display');
    if (volumeDisplay) {
        volumeDisplay.textContent = `${Math.round(state.music.volume * 100)}%`;
    }
    
    const volumeSlider = panel.querySelector('#volume-slider');
    if (volumeSlider) {
        volumeSlider.value = state.music.volume * 100;
    }

    // Update loop single track button state
    const loopOnIcon = panel.querySelector('#loop-on-icon');
    const loopOffIcon = panel.querySelector('#loop-off-icon');
    const loopButton = panel.querySelector('#music-loop-single');

    if (loopOnIcon && loopOffIcon && loopButton) {
        if (state.music.loopSingleTrack) {
            loopOnIcon.style.display = 'block';
            loopOffIcon.style.display = 'none';
            loopButton.classList.add('active'); // Highlight if active
        } else {
            loopOnIcon.style.display = 'none';
            loopOffIcon.style.display = 'block';
            loopButton.classList.remove('active'); // Remove highlight if inactive
        }
    }
    
    const trackList = panel.querySelector('#track-list');
    if (trackList) {
        trackList.innerHTML = '';
        state.music.tracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = `track-item ${index === state.music.currentTrack ? 'active' : ''}`;
            trackItem.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-sm">${track.name}</span>
                    ${index === state.music.currentTrack ? '<span class="text-amber-400 text-xs">▶</span>' : ''}
                </div>
            `;
            trackItem.addEventListener('click', () => {
                playTrack(index);
            });
            trackList.appendChild(trackItem);
        });
    }
}

function renderSettingsPanel() {
    const panel = panelContainer.querySelector('.panel');
    if (!panel) return;
    
    // Update music controls
    const currentTrackName = panel.querySelector('#settings-current-track-name');
    if (currentTrackName) {
        currentTrackName.textContent = state.music.tracks[state.music.currentTrack].name;
    }
    
    const playIcon = panel.querySelector('#settings-play-icon');
    const pauseIcon = panel.querySelector('#settings-pause-icon');
    if (playIcon && pauseIcon) {
        if (state.music.isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }
    
    const volumeDisplay = panel.querySelector('#settings-volume-display');
    if (volumeDisplay) {
        volumeDisplay.textContent = `${Math.round(state.music.volume * 100)}%`;
    }
    
    const volumeSlider = panel.querySelector('#settings-volume-slider');
    if (volumeSlider) {
        volumeSlider.value = state.music.volume * 100;
    }

    // Update loop single track button state
    const loopOnIcon = panel.querySelector('#settings-loop-on-icon');
    const loopOffIcon = panel.querySelector('#settings-loop-off-icon');
    const loopButton = panel.querySelector('#settings-music-loop-single');

    if (loopOnIcon && loopOffIcon && loopButton) {
        if (state.music.loopSingleTrack) {
            loopOnIcon.style.display = 'block';
            loopOffIcon.style.display = 'none';
            loopButton.classList.add('active');
        } else {
            loopOnIcon.style.display = 'none';
            loopOffIcon.style.display = 'block';
            loopButton.classList.remove('active');
        }
    }
    
    const trackList = panel.querySelector('#settings-track-list');
    if (trackList) {
        trackList.innerHTML = '';
        state.music.tracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = `track-item ${index === state.music.currentTrack ? 'active' : ''}`;
            trackItem.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-sm">${track.name}</span>
                    ${index === state.music.currentTrack ? '<span class="text-amber-400 text-xs">▶</span>' : ''}
                </div>
            `;
            trackItem.addEventListener('click', () => {
                playTrack(index);
            });
            trackList.appendChild(trackItem);
        });
    }

    // Update background settings
    const backgroundUrl = panel.querySelector('#background-url');
    if (backgroundUrl) {
        backgroundUrl.value = state.settings.backgroundImage;
    }
    
    const blurSlider = panel.querySelector('#blur-slider');
    const blurDisplay = panel.querySelector('#blur-display');
    if (blurSlider && blurDisplay) {
        blurSlider.value = state.settings.backgroundBlur;
        blurDisplay.textContent = `${state.settings.backgroundBlur}px`;
    }
    
    const opacitySlider = panel.querySelector('#opacity-slider');
    const opacityDisplay = panel.querySelector('#opacity-display');
    if (opacitySlider && opacityDisplay) {
        opacitySlider.value = Math.round(state.settings.backgroundOpacity * 100);
        opacityDisplay.textContent = `${Math.round(state.settings.backgroundOpacity * 100)}%`;
    }
}

function renderEquipmentPanel() {
    const panel = panelContainer.querySelector('.panel');
    if (!panel) return;
    
    const heroCountEl = panel.querySelector('#equipped-hero-count');
    if (heroCountEl) heroCountEl.textContent = state.heroes.equipped.length;
    
    const artifactCountEl = panel.querySelector('#equipped-artifact-count');
    if (artifactCountEl) artifactCountEl.textContent = state.artifacts.equipped.length;
    
    // Render Heroes with new layout
    const heroCollectionEl = panel.querySelector('#hero-collection');
    if (heroCollectionEl) {
        const activeHeroId = heroCollectionEl.querySelector('.equipment-item-new.active')?.dataset.heroId;
        
        heroCollectionEl.innerHTML = '';
        if (state.heroes.collection.length === 0) {
            heroCollectionEl.innerHTML = '<div class="col-span-full text-center text-slate-400 text-sm py-4">Chưa có hero nào. Hãy quay gacha!</div>';
        } else {
            const sortedHeroIds = sortHeroes(state.heroes.collection);
            sortedHeroIds.forEach(heroId => {
                const hero = HERO_DATA[heroId];
                if (hero) {
                    const isEquipped = state.heroes.equipped.includes(heroId);
                    const itemEl = document.createElement('div');
                    itemEl.className = `equipment-item-new ${isEquipped ? 'equipped' : ''} ${heroId === activeHeroId ? 'active' : ''}`;
                    itemEl.dataset.heroId = heroId;
                    itemEl.innerHTML = `<img src="${hero.image}" alt="${hero.name}" title="${hero.name}" onerror="this.onerror=null;this.src='https://placehold.co/64x64/1e293b/94a3b8?text=?';">`;
                    heroCollectionEl.appendChild(itemEl);
                }
            });
             if (activeHeroId) {
                const activeItem = heroCollectionEl.querySelector(`[data-hero-id="${activeHeroId}"]`);
                if (activeItem) {
                    handleEquipmentItemClick(activeItem, true); // Re-open details if it was open
                }
            }
        }
    }
    
    // Render Artifacts
    renderArtifactsPanel();
}


function updateEquipmentPopup() {
    const equippedHeroesContainer = document.getElementById('equipped-heroes');
    const equippedArtifactsContainer = document.getElementById('equipped-artifacts');
    
    if (!equippedHeroesContainer || !equippedArtifactsContainer) return;
    
    if (state.heroes.equipped.length === 0) {
        equippedHeroesContainer.innerHTML = '<div class="text-xs text-slate-500 italic">Chưa có</div>';
    } else {
        equippedHeroesContainer.innerHTML = '';
        state.heroes.equipped.forEach(heroId => {
            const hero = HERO_DATA[heroId];
            if (hero) {
                const heroItem = document.createElement('div');
                heroItem.className = 'equipment-item';
                heroItem.title = `${hero.name} (${hero.rarity})`;
                heroItem.innerHTML = `
                    <img src="${hero.image}" alt="${hero.name}" onerror="this.onerror=null;this.src='https://placehold.co/16x16/1e293b/94a3b8?text=?'">
                    <span>${hero.name}</span>
                `;
                equippedHeroesContainer.appendChild(heroItem);
            }
        });
    }
    
    if (state.artifacts.equipped.length === 0) {
        equippedArtifactsContainer.innerHTML = '<div class="text-xs text-slate-500 italic">Chưa có</div>';
    } else {
        equippedArtifactsContainer.innerHTML = '';
        state.artifacts.equipped.forEach(artifactId => {
            const artifact = ARTIFACT_DATA[artifactId];
            if (artifact) {
                const artifactItem = document.createElement('div');
                artifactId.className = 'equipment-item';
                artifactId.title = `${artifact.name} - ${artifact.bonusText}`;
                artifactId.innerHTML = `
                    <img src="${artifact.image}" alt="${artifact.name}" onerror="this.onerror=null;this.src='https://placehold.co/16x16/1e293b/94a3b8?text=?'">
                    <span>${artifact.name}</span>
                `;
                equippedArtifactsContainer.appendChild(artifactId);
            }
        });
    }
}

// --- Event Handlers ---
function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = MINE_COLS * 2.0;
    const halfViewSize = viewSize / 2;
    camera.left = -halfViewSize * aspect; camera.right = halfViewSize * aspect;
    camera.top = halfViewSize; camera.bottom = -halfViewSize;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(mineMeshes.flat().filter(m => m));
    if (intersects.length > 0) {
        const first = intersects[0].object;
        if (state.agents.tung.isTargeting) {
             if (first.userData && first.userData.gridX !== undefined) {
                const { gridX, gridY, gridZ } = first.userData;
                digBlock(gridX, gridY, gridZ, Infinity, false, false);
                state.agents.tung.cooldown = 60;
                cancelAgentTungTargeting();
            }
        } else if (first.userData && first.userData.gridX !== undefined) {
            const { gridX, gridY, gridZ } = first.userData;
            digBlock(gridX, gridY, gridZ, state.upgrades.clickPower, true, false);
        }
    }
}

function renderPassivePanel() {
    const heroList = document.getElementById('passive-hero-list');
    if (!heroList) return;

    heroList.innerHTML = '';
    state.heroes.collection.forEach(heroId => {
        const hero = HERO_DATA[heroId];
        const passive = state.heroes.passives[heroId];
        const heroEl = document.createElement('div');
        heroEl.className = 'passive-item flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-all';
        heroEl.dataset.heroId = heroId;
        if (passive) {
            heroEl.dataset.hasPassive = 'true';
        }
        
        let passiveIcon = '';
        let passiveText = '';
        
        if (passive) {
            const tierClass = `passive-tier-${passive.tier}`;
            const tierSymbol = passive.tier === 'rainbow' ? '🌈' : '⭐';
            passiveIcon = `<div class="passive-tier-icon ${tierClass}">${tierSymbol}</div>`;
            passiveText = `<span class="text-sm ${passive.tier === 'rainbow' ? 'text-amber-400' : `text-slate-400`}">
                ${passive.tier === 'rainbow' ? 'Rainbow' : `${passive.tier} sao`}: ${passive.passive.name}
            </span>`;
        } else {
            passiveIcon = '<div class="passive-tier-icon passive-tier-1" style="opacity: 0.3;">?</div>';
            passiveText = '<span class="text-sm text-slate-500">Chưa có passive</span>';
        }

        heroEl.innerHTML = `
            <img src="${hero.image}" alt="${hero.name}" class="w-10 h-10 object-cover rounded relative">
            ${passiveIcon}
            <div class="flex-1">
                <div class="font-semibold">${hero.name}</div>
                ${passiveText}
            </div>
            ${passive ? '<div class="passive-status-indicator"></div>' : ''}
        `;
        heroEl.addEventListener('click', () => showPassiveDetails(heroId));
        heroList.appendChild(heroEl);
    });
}

function showPassiveDetails(heroId) {
    const detailsEl = document.getElementById('passive-details');
    const rollSection = document.getElementById('passive-roll-section');
    if (!detailsEl || !rollSection) return;

    const hero = HERO_DATA[heroId];
    const passive = state.heroes.passives[heroId];

    let passiveHtml = '';
    if (passive) {
        const tierText = passive.tier === 'rainbow' ? 'Rainbow' : `${passive.tier} sao`;
        const tierClass = `passive-tier-${passive.tier}`;
        const tierSymbol = passive.tier === 'rainbow' ? '🌈' : '⭐';
        
        passiveHtml = `
            <div class="passive-details-container text-center mb-4">
                <div class="flex items-center justify-center gap-3 mb-3">
                    <div class="passive-tier-icon ${tierClass} text-lg">${tierSymbol}</div>
                    <h3 class="font-bold text-lg">${hero.name}</h3>
                </div>
                <p class="text-${passive.tier === 'rainbow' ? 'amber' : 'slate'}-400 font-semibold mb-2">${tierText}</p>
                <p class="mt-2 text-slate-300">${passive.passive.desc}</p>
            </div>
        `;
    } else {
        passiveHtml = `
            <div class="passive-details-container text-center mb-4">
                <div class="flex items-center justify-center gap-3 mb-3">
                    <div class="passive-tier-icon passive-tier-1" style="opacity: 0.3;">?</div>
                    <h3 class="font-bold text-lg">${hero.name}</h3>
                </div>
                <p class="text-slate-400">Chưa có passive</p>
            </div>
        `;
    }

    detailsEl.innerHTML = passiveHtml;
    detailsEl.dataset.heroId = heroId;
    rollSection.style.display = 'block';
    
    // Add entrance animation for passive details
    const detailsContainer = detailsEl.querySelector('.passive-details-container');
    if (detailsContainer) {
        detailsContainer.style.opacity = '0';
        detailsContainer.style.transform = 'scale(0.9)';
        setTimeout(() => {
            detailsContainer.style.transition = 'all 0.3s ease';
            detailsContainer.style.opacity = '1';
            detailsContainer.style.transform = 'scale(1)';
        }, 50);
    }
}

function rollPassive(heroId) {
    if (state.resources.shards < 10) {
        showNotification('Không đủ Shard! (Cần 10 Shard)', 'error');
        return;
    }

    state.resources.shards -= 10;

    // Add rotation animation to the roll button
    const rollButton = document.getElementById('roll-passive');
    if (rollButton) {
        rollButton.classList.add('rotating');
        setTimeout(() => rollButton.classList.remove('rotating'), 800);
        
        // Add success animation after rotation
        setTimeout(() => {
            rollButton.classList.add('passive-roll-success');
            setTimeout(() => rollButton.classList.remove('passive-roll-success'), 600);
        }, 800);
    }

    const rand = Math.random() * 100;
    let tier;
    let cumulative = 0;

    for (const [currentTier, rate] of Object.entries(PASSIVE_DATA.rates)) {
        cumulative += rate;
        if (rand <= cumulative) {
            tier = currentTier;
            break;
        }
    }

    let passivePool = PASSIVE_DATA.types[tier];
    let newPassive;
    
    if (tier === 'rainbow') {
        newPassive = passivePool[0]; // Only one rainbow passive
    } else {
        newPassive = passivePool[Math.floor(Math.random() * passivePool.length)];
    }

    state.heroes.passives[heroId] = {
        tier: tier,
        passive: newPassive
    };

    // Add rotation animation to the passive item in the list
    setTimeout(() => {
        const passiveItems = document.querySelectorAll('.passive-item');
        passiveItems.forEach(item => {
            if (item.dataset.heroId === heroId) {
                item.classList.add('rotating');
                setTimeout(() => item.classList.remove('rotating'), 800);
            }
        });
    }, 100);

    // Show enhanced notification with tier-specific styling
    const tierText = tier === 'rainbow' ? '🌈 Rainbow' : `${tier}⭐ ${tier} sao`;
    const tierColor = tier === 'rainbow' ? 'amber' : 
                     tier === '3' ? 'yellow' : 
                     tier === '2' ? 'blue' : 'gray';
    
    showNotification(`🎉 Nhận được passive ${tierText}!`, 'success');
    
    // Add visual feedback to the UI
    setTimeout(() => {
        renderPassivePanel();
        showPassiveDetails(heroId);
        updateUI({ fullRender: true });
    }, 300);
}

function setupPanelToggle(buttonId, templateId) {
    const button = document.getElementById(buttonId);
    button.addEventListener('click', () => {
        if (activePanel === templateId) {
            panelContainer.innerHTML = ''; activePanel = null;
            Object.values(toggleButtons).forEach(b => b.classList.remove('active'));
            cancelAgentTungTargeting();
        } else {
            const template = document.getElementById(templateId);
            panelContainer.innerHTML = '';
            panelContainer.appendChild(template.content.cloneNode(true));
            activePanel = templateId;
            Object.values(toggleButtons).forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            if (templateId === 'template-passive') {
                renderPassivePanel();
            }
            updateUI({ fullRender: true });
        }
    });
}

// --- Music Functions ---
function initMusicPlayer() {
    audioPlayer = new Audio();
    // Loop property is now controlled by state.music.loopSingleTrack
    audioPlayer.loop = state.music.loopSingleTrack; 
    audioPlayer.volume = state.music.volume;
    
    audioPlayer.addEventListener('ended', () => {
        // If single track loop is off, advance to next track in playlist
        if (!state.music.loopSingleTrack) {
            nextTrack();
        }
        // If loopSingleTrack is true, audioPlayer.loop property handles repetition
    });
    
    loadTrack(state.music.currentTrack);
}

function loadTrack(trackIndex) {
    if (trackIndex < 0 || trackIndex >= state.music.tracks.length) return;
    
    const track = state.music.tracks[trackIndex];
    audioPlayer.src = track.file;
    state.music.currentTrack = trackIndex;
    
    if (activePanel === 'template-music') {
        renderMusicPanel();
    }
}

function playTrack(trackIndex) {
    if (trackIndex !== undefined) {
        loadTrack(trackIndex);
    }
    
    if (audioPlayer) {
        audioPlayer.play().then(() => {
            state.music.isPlaying = true;
            if (activePanel === 'template-music') {
                renderMusicPanel();
            }
        }).catch(error => {
            console.log('Audio play failed:', error);
        });
    }
}

function pauseTrack() {
    if (audioPlayer) {
        audioPlayer.pause();
        state.music.isPlaying = false;
        if (activePanel === 'template-music') {
            renderMusicPanel();
        }
    }
}

function nextTrack() {
    // Only advance if not in single track loop mode
    if (state.music.loopSingleTrack) {
        return; 
    }
    const nextIndex = (state.music.currentTrack + 1) % state.music.tracks.length;
    loadTrack(nextIndex);
    if (state.music.isPlaying) {
        playTrack();
    }
}

function prevTrack() {
    // Only go back if not in single track loop mode
    if (state.music.loopSingleTrack) {
        return;
    }
    const prevIndex = state.music.currentTrack === 0 ? state.music.tracks.length - 1 : state.music.tracks.length - 1;
    loadTrack(prevIndex);
    if (state.music.isPlaying) {
        playTrack();
    }
}

function setVolume(volume) {
    state.music.volume = volume;
    if (audioPlayer) {
        audioPlayer.volume = volume;
    }
    if (activePanel === 'template-music') {
        renderMusicPanel();
    }
}

function toggleSingleTrackLoop() {
    state.music.loopSingleTrack = !state.music.loopSingleTrack;
    if (audioPlayer) {
        audioPlayer.loop = state.music.loopSingleTrack;
    }
    if (activePanel === 'template-music') {
        renderMusicPanel();
    }
}


function setupEventListeners() {
    panelContainer.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        const newHeroItem = e.target.closest('.equipment-item-new');
        const artifactCard = e.target.closest('.artifact-card');

        // Handle passive roll button
        if (button && button.id === 'roll-passive') {
            const detailsEl = document.getElementById('passive-details');
            if (detailsEl && detailsEl.dataset.heroId) {
                rollPassive(detailsEl.dataset.heroId);
            }
            return;
        }

        // The auto gacha button logic was removed from here.
        
        if (button && !button.closest('.equipment-details')) { // Prevent clicks on equip button from re-triggering details
            const { id, dataset } = button;
            if (dataset.banner) { 
                state.activeBanner = dataset.banner; 
                renderGachaBannerDetails(state.activeBanner); 
                return; 
            }
            if (dataset.tab) {
                panelContainer.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
                panelContainer.querySelector(`#${dataset.tab}`).classList.remove('hidden');
                panelContainer.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
                button.classList.add('active');
                return;
            }
            
            switch(id) {
                case 'quick-equip-heroes': quickEquipHeroes(); break;
                case 'buyAgentTung': {
                    const cost = 50000;
                    if (state.resources.money >= cost) { state.resources.money -= cost; state.stats.moneySpent += cost; state.agents.tung.owned = true; updateUI({ fullRender: true }); }
                    break;
                }
                case 'agentTungAction': state.agents.tung.isTargeting ? cancelAgentTungTargeting() : activateAgentTungTargeting(); break;
                case 'upgradeClick': {
                    const cost = Math.ceil(15 * Math.pow(1.22, state.upgrades.clickPower - 1));
                    if (state.resources.money >= cost) { state.resources.money -= cost; state.stats.moneySpent += cost; state.upgrades.clickPower++; updateUI({ fullRender: true }); }
                    break;
                }
                case 'upgradeMineMulti': {
                    const cost = Math.ceil(450 * Math.pow(2.8, state.upgrades.mineMultiLevel));
                    if(state.resources.money >= cost) { state.resources.money -= cost; state.stats.moneySpent += cost; state.upgrades.mineMultiLevel++; updateUI({ fullRender: true }); }
                    break;
                }
                case 'upgradeAutoMine': {
                    const cost = Math.ceil(80 * Math.pow(2.4, state.upgrades.autoMineLevel));
                    if(state.resources.money >= cost) { state.resources.money -= cost; state.stats.moneySpent += cost; state.upgrades.autoMineLevel++; updateUI({ fullRender: true }); }
                    break;
                }
                case 'hireMiner': {
                    if (state.upgrades.minerCount < 5) {
                        const cost = Math.ceil(40 * Math.pow(1.55, state.upgrades.minerCount));
                        if (state.resources.money >= cost) { state.resources.money -= cost; state.stats.moneySpent += cost; state.upgrades.minerCount++; addMiner(); updateUI({ fullRender: true }); }
                    }
                    break;
                }
                case 'upgradeMinerPower': {
                    const cost = Math.ceil(150 * Math.pow(1.65, state.upgrades.minerPowerLevel - 1));
                    if (state.resources.money >= cost) { state.resources.money -= cost; state.stats.moneySpent += cost; state.upgrades.minerPowerLevel++; updateUI({ fullRender: true }); }
                    break;
                }
                case 'upgradeSuperMiner': {
                     if (state.upgrades.superMinerLevel < 5) {
                        const cost = Math.ceil(1800 * Math.pow(3.8, state.upgrades.superMinerLevel));
                        if (state.resources.money >= cost) { state.resources.money -= cost; state.stats.moneySpent += cost; state.upgrades.superMinerLevel++; updateUI({ fullRender: true }); }
                    }
                    break;
                }
                case 'upgradeMinerStamina': {
                    const cost = Math.ceil(250 * Math.pow(1.9, state.upgrades.minerStaminaLevel));
                    if (state.resources.money >= cost) { state.resources.money -= cost; state.stats.moneySpent += cost; state.upgrades.minerStaminaLevel++; updateUI({ fullRender: true }); }
                    break;
                }
                case 'giftcode-submit': redeemGiftcode(); break;
                case 'summon-1': summonHeroManual(1); break;
                case 'summon-3': summonHeroManual(3); break;
                case 'summon-5': summonHeroManual(5); break;
                case 'start-dungeon-btn': startDungeonRun(); break;
                case 'music-play-pause': 
                    if (state.music.isPlaying) pauseTrack(); else playTrack();
                    break;
                case 'music-next': nextTrack(); break;
                case 'music-prev': prevTrack(); break;
                case 'music-loop-single': toggleSingleTrackLoop(); break; // New: loop single track button
                case 'save-game-btn': saveState(true); break; // true for manual save notification
                case 'reset-game-btn': 
                    showConfirmationModal("Bạn có chắc chắn muốn reset game? Mọi tiến trình sẽ bị mất vĩnh viễn.", resetState);
                    break;
                // Settings panel event listeners
                case 'settings-music-play-pause': 
                    if (state.music.isPlaying) pauseTrack(); else playTrack();
                    break;
                case 'settings-music-next': nextTrack(); break;
                case 'settings-music-prev': prevTrack(); break;
                case 'settings-music-loop-single': toggleSingleTrackLoop(); break;
                case 'apply-background': applyBackgroundImage(); break;
                case 'reset-background': resetBackgroundImage(); break;
            }
        } else if (newHeroItem) {
            handleEquipmentItemClick(newHeroItem);
        } else if (artifactCard) {
            toggleEquipArtifact(artifactCard.dataset.artifactId);
        }
    });
    
    panelContainer.addEventListener('input', (e) => {
        if (e.target.id === 'volume-slider') {
            const volume = parseFloat(e.target.value) / 100;
            setVolume(volume);
        } else if (e.target.id === 'settings-volume-slider') {
            const volume = parseFloat(e.target.value) / 100;
            setVolume(volume);
        } else if (e.target.id === 'blur-slider') {
            const blur = parseInt(e.target.value);
            state.settings.backgroundBlur = blur;
            updateBackgroundImage();
        } else if (e.target.id === 'opacity-slider') {
            const opacity = parseFloat(e.target.value) / 100;
            state.settings.backgroundOpacity = opacity;
            updateBackgroundImage();
        }
    });
}

function activateAgentTungTargeting() {
    if (state.agents.tung.cooldown > 0) return;
    state.agents.tung.isTargeting = true;
    canvas.style.cursor = 'crosshair';
    showNotification("Chọn một khối để phá hủy");
    updateUI({ fullRender: true });
}

function cancelAgentTungTargeting() {
    if (!state.agents.tung.isTargeting) return;
    state.agents.tung.isTargeting = false;
    canvas.style.cursor = 'pointer';
    updateUI({ fullRender: true });
}

function redeemGiftcode() {
    const input = panelContainer.querySelector('#giftcode-input');
    const messageEl = panelContainer.querySelector('#giftcode-message');
    if(!input || !messageEl) return;
    const code = input.value.toLowerCase().trim();
    const rewardAmount = 2500000; // 2.5 triệu
    
    if (code === 'phophuc' || code === 'kidcat') { // Money codes
        if (state.usedCodes.includes(code)) {
            messageEl.textContent = "Code đã được sử dụng!";
        } else {
            state.resources.money += rewardAmount;
            state.stats.moneyEarned += rewardAmount;
            state.usedCodes.push(code);
            messageEl.textContent = `Bạn nhận được ${formatMoney(rewardAmount)}$!`;
            updateUI({ fullRender: true });
        }
    } else if (code === 'passive') { // Shard code
        if (state.usedCodes.includes(code)) {
            messageEl.textContent = "Code đã được sử dụng!";
        } else {
            const shardReward = 50;
            state.resources.shards = (state.resources.shards || 0) + shardReward;
            state.usedCodes.push(code);
            messageEl.textContent = `Bạn nhận được ${shardReward} Shard!`;
            updateUI({ fullRender: true });
        }
    } else {
        messageEl.textContent = "Code không hợp lệ!";
    }
    input.value = '';
    setTimeout(() => { if(messageEl) messageEl.textContent = ''; }, 3000);
}

// --- Gacha, Hero & Artifact Logic ---

function getHeroPower(hero) {
    if (!hero) return 0;
    if (hero.bonusType === 'multiplier') {
        // Give a huge score to multipliers to prioritize them
        return 10000 + (hero.bonusValue * 100);
    }
    return hero.bonusValue; // For 'flat' bonus
}

function sortHeroes(heroIds) {
    return [...heroIds].sort((aId, bId) => {
        const heroA = HERO_DATA[aId];
        const heroB = HERO_DATA[bId];
        const powerA = getHeroPower(heroA);
        const powerB = getHeroPower(heroB);
        return powerB - powerA; // Sort descending
    });
}


function quickEquipHeroes() {
    const ownedHeroes = state.heroes.collection.map(id => HERO_DATA[id]);
    if (ownedHeroes.length === 0) {
        showNotification("Bạn không có hero nào để trang bị!", "info");
        return;
    }

    let bestCombination = [];
    let maxDamage = 0;

    const calculateComboDamage = (combo) => {
        let flatBonus = 0;
        let multiplier = 1;
        combo.forEach(hero => {
            if (hero.bonusType === 'flat') {
                flatBonus += hero.bonusValue;
            } else if (hero.bonusType === 'multiplier') {
                multiplier *= hero.bonusValue;
            }
        });
        return flatBonus * multiplier;
    };

    const getCombinations = (arr, k) => {
        const result = [];
        const f = (prefix, arr) => {
            if (prefix.length === k) {
                result.push(prefix);
                return;
            }
            for (let i = 0; i < arr.length; i++) {
                f(prefix.concat(arr[i]), arr.slice(i + 1));
            }
        }
        f([], arr);
        return result;
    };

    for (let k = 1; k <= Math.min(3, ownedHeroes.length); k++) {
        const combinations = getCombinations(ownedHeroes, k);
        combinations.forEach(combo => {
            const damage = calculateComboDamage(combo);
            if (damage > maxDamage) {
                maxDamage = damage;
                bestCombination = combo.map(hero => hero.id);
            }
        });
    }
    
    if (0 > maxDamage) {
         maxDamage = 0;
         bestCombination = [];
    }

    state.heroes.equipped = bestCombination;
    showNotification(`Đã trang bị đội hình mạnh nhất!`, 'success');
    updateUI({ fullRender: true });
    updateEquipmentPopup();
}
// ... rest of the code is unchanged

function handleEquipmentItemClick(item, forceOpen = false) {
    const heroId = item.dataset.heroId;
    if (!heroId) return;

    const hero = HERO_DATA[heroId];
    const heroCollectionEl = item.parentElement;

    const existingDetails = heroCollectionEl.querySelector('.equipment-details');
    if (existingDetails) {
        existingDetails.remove();
    }

    if (item.classList.contains('active') && !forceOpen) {
        item.classList.remove('active');
        return;
    }

    heroCollectionEl.querySelectorAll('.equipment-item-new').forEach(el => el.classList.remove('active'));
    item.classList.add('active');

    const isEquipped = state.heroes.equipped.includes(heroId);
    const detailsEl = document.createElement('div');
    detailsEl.className = 'equipment-details';
    detailsEl.innerHTML = `
        <p class="font-bold text-lg">${hero.name} <span class="text-sm font-normal rarity-${hero.rarity}">(${hero.rarity})</span></p>
        <p class="text-sm text-amber-300 my-1">${hero.bonusText}</p>
        <button class="btn-primary !w-auto px-4 mt-2 text-sm" onclick="toggleEquipHero('${heroId}')">${isEquipped ? 'Gỡ' : 'Trang bị'}</button>
    `;

    const itemsPerRow = 8;
    const itemIndex = Array.from(heroCollectionEl.children).filter(child => child.matches('.equipment-item-new')).indexOf(item);
    const endOfRowIndex = Math.floor(itemIndex / itemsPerRow) * itemsPerRow + itemsPerRow;
    const insertBeforeEl = Array.from(heroCollectionEl.children).filter(child => child.matches('.equipment-item-new'))[endOfRowIndex];

    if (insertBeforeEl) {
        heroCollectionEl.insertBefore(detailsEl, insertBeforeEl);
    } else {
        heroCollectionEl.appendChild(detailsEl);
    }
}


function toggleEquipHero(heroId) {
    const index = state.heroes.equipped.indexOf(heroId);
    if (index > -1) {
        state.heroes.equipped.splice(index, 1);
    } else {
        if (state.heroes.equipped.length < 3) {
            state.heroes.equipped.push(heroId);
        } else {
            showNotification("Bạn chỉ có thể trang bị tối đa 3 hero!", "error");
        }
    }
    if (activePanel === 'template-equipment') {
        renderEquipmentPanel();
    }
    updateEquipmentPopup();
}

function toggleEquipArtifact(artifactId) {
    const index = state.artifacts.equipped.indexOf(artifactId);
    if (index > -1) {
        state.artifacts.equipped.splice(index, 1);
    } else {
        if (state.artifacts.equipped.length < 2) {
            state.artifacts.equipped.push(artifactId);
        } else {
            showNotification("Bạn chỉ có thể trang bị tối đa 2 di vật!", "error");
        }
    }
    if (activePanel === 'template-equipment') {
        renderEquipmentPanel();
    }
    updateEquipmentPopup();
}

// --- Dungeon Logic ---
function calculatePlayerDamage() {
    let totalFlatBonus = 0;
    let totalMultiplier = 1;
    let totalDamageBonus = 0;

    state.heroes.equipped.forEach(heroId => {
        const hero = HERO_DATA[heroId];
        if (hero) {
            // Apply base hero bonus
            if (hero.bonusType === 'flat') {
                totalFlatBonus += hero.bonusValue;
            } else if (hero.bonusType === 'multiplier') {
                totalMultiplier *= hero.bonusValue;
            }

            // Apply passive bonuses
            const passive = state.heroes.passives[heroId];
            if (passive) {
                if (passive.tier === 'rainbow') {
                    totalDamageBonus += passive.passive.effects.totalDamage / 100;
                    const heroDamageBonus = 1 + (passive.passive.effects.heroDamage / 100);
                    if (hero.bonusType === 'flat') {
                        totalFlatBonus = totalFlatBonus * heroDamageBonus;
                    } else {
                        totalMultiplier = totalMultiplier * heroDamageBonus;
                    }
                } else {
                    if (passive.passive.id === 'flatDamage') {
                        totalFlatBonus += passive.passive.value;
                    } else if (passive.passive.id === 'heroDamage') {
                        const heroDamageBonus = 1 + (passive.passive.value / 100);
                        if (hero.bonusType === 'flat') {
                            totalFlatBonus = totalFlatBonus * heroDamageBonus;
                        } else {
                            totalMultiplier = totalMultiplier * heroDamageBonus;
                        }
                    }
                }
            }
        }
    });

    let heroDamage = totalFlatBonus * totalMultiplier;
    
    let artifactDamage = 0;
    state.artifacts.equipped.forEach(artifactId => {
        const artifact = ARTIFACT_DATA[artifactId];
        if (artifact && artifact.bonusType === 'damage') {
            artifactDamage += artifact.bonusValue;
        }
    });

    return 1 + heroDamage + artifactDamage;
}

function startDungeonRun() {
    if (state.dungeon.cooldown > 0) {
        showNotification(`Còn ${Math.ceil(state.dungeon.cooldown)}s mới có thể vào Dungeon tiếp!`, 'error');
        return;
    }
    
    if (dungeonTimerInterval) clearInterval(dungeonTimerInterval);
    
    state.dungeon.currentRun = {
        floor: 1,
        playerDamage: calculatePlayerDamage(),
        enemyHp: 300,
        maxEnemyHp: 300,
        timer: 10,
        lastCompletedPhase: 0,
        rewardsFromLastCompletedPhase: { money: 0, artifacts: [], shards: 0 },
        totalAccumulatedRewards: { money: 0, artifacts: [], shards: 0 }
    };

    renderDungeonCombatUI();
    document.getElementById('dungeon-combat-modal').classList.add('show');
    dungeonTimerInterval = setInterval(updateDungeonTimer, 1000);
}

function updateDungeonTimer() {
    const run = state.dungeon.currentRun;
    if (!run) {
        clearInterval(dungeonTimerInterval);
        return;
    }
    run.timer--;
    const timerEl = document.getElementById('dungeon-timer');
    if (timerEl) {
        timerEl.textContent = run.timer;
    }
    if (run.timer <= 0) {
        dungeonLose('Hết giờ!');
    }
}

function handleDungeonAttack() {
    const run = state.dungeon.currentRun;
    if (!run) return;
    
    run.enemyHp -= run.playerDamage;
    
    if (run.enemyHp <= 0) {
        dungeonWinFloor();
    } else {
        renderDungeonCombatUI();
    }
}

function dungeonWinFloor() {
    if (dungeonTimerInterval) clearInterval(dungeonTimerInterval);
    
    const run = state.dungeon.currentRun;
    if (!run) return;

    if (run.floor > state.dungeon.highestFloor) {
        state.dungeon.highestFloor = run.floor;
    }

    const isBossFloor = run.floor % 5 === 0;

    if (isBossFloor) {
        const currentPhase = run.floor / 5;
        
        let phaseMoneyReward = 100000;
        let phaseArtifactChance = 0.05;
        const shardChance = 0.05; // 5% chance for shard

        if (currentPhase > 1) {
            let prevMoney = 100000;
            let prevChance = 0.05;
            for (let i = 2; i <= currentPhase; i++) {
                prevMoney *= 1.20;
                prevChance += 0.01;
            }
            phaseMoneyReward = Math.floor(prevMoney);
            phaseArtifactChance = prevChance;
        }
        
        run.totalAccumulatedRewards.money += phaseMoneyReward;
        
        // Check for artifact reward
        if (Math.random() < phaseArtifactChance) {
             const artifactPool = Object.keys(ARTIFACT_DATA);
             const wonArtifactId = artifactPool[Math.floor(Math.random() * artifactPool.length)];
             run.totalAccumulatedRewards.artifacts.push(wonArtifactId);
             showNotification(`Bạn tìm thấy [${ARTIFACT_DATA[wonArtifactId].name}]!`, 'success');
        }

        // Check for shard reward
        if (currentPhase % 5 === 0) { // Guaranteed shard every 5 phases
            run.totalAccumulatedRewards.shards = (run.totalAccumulatedRewards.shards || 0) + 1;
            showNotification('Bạn nhận được 1 Shard! (Đảm bảo)', 'success');
        } else if (Math.random() < shardChance) { // 5% chance for additional shard
            run.totalAccumulatedRewards.shards = (run.totalAccumulatedRewards.shards || 0) + 1;
            showNotification('Bạn nhận được 1 Shard!', 'success');
        }

        run.rewardsFromLastCompletedPhase = { ...run.totalAccumulatedRewards, artifacts: [...run.totalAccumulatedRewards.artifacts] };
        run.lastCompletedPhase = currentPhase;

        if (currentPhase > 0 && currentPhase % 25 === 0) {
            showNotification(`Đạt mốc ${currentPhase} phase! Tự động nhận thưởng và tiếp tục.`, 'success');
            claimDungeonRewards(true); // true = continue run
        } else {
            renderPhaseClearUI();
        }

    } else {
        goToNextFloor();
    }
}

function goToNextFloor() {
    const run = state.dungeon.currentRun;
    if (!run) return;

    run.floor++;
    const isBoss = run.floor % 5 === 0;

    let newMaxHp = 300;
    for (let i = 2; i <= run.floor; i++) {
        if (i % 5 === 0) {
            newMaxHp *= 1.30;
        } else {
            newMaxHp *= 1.07;
        }
    }
    run.maxEnemyHp = Math.floor(newMaxHp);
    run.enemyHp = run.maxEnemyHp;
    
    run.timer = isBoss ? 15 : 10;

    renderDungeonCombatUI();
    if (dungeonTimerInterval) clearInterval(dungeonTimerInterval);
    dungeonTimerInterval = setInterval(updateDungeonTimer, 1000);
}

function dungeonLose(reason) {
    if (dungeonTimerInterval) clearInterval(dungeonTimerInterval);
    dungeonTimerInterval = null;
    
    const run = state.dungeon.currentRun;
    if (!run) return;

    const rewards = run.rewardsFromLastCompletedPhase;
    let rewardMessage = `Bạn đã thua ở tầng ${run.floor}. (${reason})`;

    if (rewards.money > 0 || rewards.artifacts.length > 0) {
        state.resources.money += rewards.money;
        state.stats.moneyEarned += rewards.money;
        
        let newArtifactsCount = 0;
        rewards.artifacts.forEach(artifactId => {
            if (!state.artifacts.collection.includes(artifactId)) {
                state.artifacts.collection.push(artifactId);
                newArtifactsCount++;
            }
        });
        rewardMessage += `\nBạn nhận được phần thưởng từ phase ${run.lastCompletedPhase}: ${formatMoney(rewards.money)}$ và ${newArtifactsCount > 0 ? `${rewards.artifacts.length} di vật` : '0 di vật'}.`;
        showNotification(rewardMessage, 'info');
    } else {
        showNotification(rewardMessage + "\nKhông nhận được phần thưởng.", 'error');
    }
    
    endDungeonRun();
}

function claimDungeonRewards(continueRun = false) {
    if (dungeonTimerInterval) clearInterval(dungeonTimerInterval);
    dungeonTimerInterval = null;

    const run = state.dungeon.currentRun;
    if (!run || !run.totalAccumulatedRewards) return;

    const rewards = run.totalAccumulatedRewards;
    
    if (rewards.money > 0 || rewards.artifacts.length > 0 || rewards.shards > 0) {
        state.resources.money += rewards.money;
        state.stats.moneyEarned += rewards.money;
        
        let newArtifactsCount = 0;
        rewards.artifacts.forEach(artifactId => {
            if (!state.artifacts.collection.includes(artifactId)) {
                state.artifacts.collection.push(artifactId);
                newArtifactsCount++;
            }
        });

        // Add shards to player's resources
        if (rewards.shards > 0) {
            state.resources.shards = (state.resources.shards || 0) + rewards.shards;
        }

        let rewardMessage = `Bạn nhận được ${formatMoney(rewards.money)}$${newArtifactsCount > 0 ? `, ${rewards.artifacts.length} di vật` : ''}${rewards.shards > 0 ? `, ${rewards.shards} Shard` : ''}.`;
        showNotification(rewardMessage, 'success');
    } else {
        showNotification("Không có phần thưởng nào để nhận.", 'info');
    }
    
    if (continueRun) {
        run.totalAccumulatedRewards = { money: 0, artifacts: [] };
        run.rewardsFromLastCompletedPhase = { money: 0, artifacts: [] };
        goToNextFloor();
    }
    else {
        endDungeonRun();
    }
}

function endDungeonRun() {
    if (dungeonTimerInterval) clearInterval(dungeonTimerInterval);
    dungeonTimerInterval = null;
    
    state.dungeon.cooldown = 60; // 60-second cooldown
    state.dungeon.currentRun = null;
    document.getElementById('dungeon-combat-modal').classList.remove('show');
    
    if (activePanel === 'template-dungeon') renderDungeonPanel();
    if (activePanel === 'template-stats') renderStatsPanel();
    if (activePanel === 'template-equipment') renderEquipmentPanel();
    if (activePanel === 'template-settings') renderSettingsPanel();
    
    updateEquipmentPopup();
}

function renderDungeonCombatUI() {
    const container = document.getElementById('dungeon-combat-container');
    const run = state.dungeon.currentRun;
    if (!run) return;

    const isBoss = run.floor % 5 === 0;
    const hpPercent = (run.enemyHp / run.maxEnemyHp) * 100;

    let enemyName, enemyImgSrc;

    if (isBoss) {
        const phase = run.floor / 5;
        const bossIndex = (phase - 1) % DUNGEON_BOSSES.length;
        const boss = DUNGEON_BOSSES[bossIndex];
        enemyName = `BOSS: ${boss.name}`;
        enemyImgSrc = boss.image;
    } else {
        enemyName = `Quái Vật Tầng ${run.floor}`;
        enemyImgSrc = DUNGEON_MINIONS[(run.floor - 1) % DUNGEON_MINIONS.length];
    }

    container.innerHTML = `
        <div class="flex justify-between items-center mb-2">
            <h2 class="text-3xl font-bold text-red-500">Dungeon - Tầng ${run.floor}</h2>
            <div class="text-4xl font-bold text-yellow-400">
                <span id="dungeon-timer">${run.timer}</span>s
            </div>
        </div>
        <img id="dungeon-enemy-img" src="${enemyImgSrc}" alt="Dungeon Enemy" onerror="this.onerror=null;this.src='https://placehold.co/200x200/0f172a/e2e8f0?text=Error';">
        <p class="font-bold text-xl mb-2">${enemyName}</p>
        <div class="hp-bar mb-1">
            <div id="dungeon-hp-bar-inner" class="hp-bar-inner" style="width: ${hpPercent}%;"></div>
        </div>
        <p id="dungeon-hp-text" class="font-mono text-lg">${formatMoney(run.enemyHp)} / ${formatMoney(run.maxEnemyHp)} HP</p>
        <div class="flex gap-4 mt-6">
            <button id="dungeon-attack-btn" class="btn-primary !w-auto flex-grow">Tấn Công</button>
            <button id="dungeon-leave-btn" class="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg !w-auto">Rời đi</button>
        </div>
    `;
}

function renderPhaseClearUI() {
    const container = document.getElementById('dungeon-combat-container');
    const run = state.dungeon.currentRun;
    if (!run) return;

    container.innerHTML = `
        <h2 class="text-3xl font-bold text-amber-400 mb-4">Hoàn thành Phase ${run.lastCompletedPhase}!</h2>
        <p class="text-lg mb-2">Phần thưởng tích lũy hiện tại:</p>
        <p class="text-2xl font-bold text-green-400 mb-1">${formatMoney(run.totalAccumulatedRewards.money)}$</p>
        <p class="text-xl font-bold text-cyan-400 mb-6">${run.totalAccumulatedRewards.artifacts.length} Di vật</p>
        
        <p class="mb-4">Bạn muốn tiếp tục khám phá hay dừng lại và nhận thưởng?</p>

        <div class="flex gap-4 mt-6">
            <button id="dungeon-continue-btn" class="btn-primary !w-auto flex-grow">Tiếp tục</button>
            <button id="dungeon-claim-btn" class="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg !w-auto">Dừng lại & Nhận thưởng</button>
        </div>
    `;
}

// --- Game Loops ---
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    state.stats.timePlayed += delta; // Increment timePlayed by delta for accuracy
    
    // Update dungeon cooldown
    if (state.dungeon.cooldown > 0) {
        state.dungeon.cooldown -= delta;
        if (state.dungeon.cooldown < 0) state.dungeon.cooldown = 0;
        if (activePanel === 'template-dungeon') renderDungeonPanel();
    }

    if (state.upgrades.autoMineLevel > 0) {
        autoMineTimer -= delta;
        if (autoMineTimer <= 0) {
            autoMineTimer = 1 / (1.3 * state.upgrades.autoMineLevel);
            const maxIndex = MINE_ROWS * MINE_COLS;
            let attempts = 0;
            while(attempts < maxIndex) {
                const x = autoMineTargetIndex % MINE_COLS, z = Math.floor(autoMineTargetIndex / MINE_COLS);
                autoMineTargetIndex = (autoMineTargetIndex + 1) % maxIndex;
                if (mineMeshes[0][z * MINE_COLS + x]) { digBlock(x, 0, z, state.upgrades.clickPower, true, false); break; }
                attempts++;
            }
        }
    }
    if (state.agents.tung.cooldown > 0) {
        state.agents.tung.cooldown -= delta;
        if (state.agents.tung.owned && activePanel === 'template-upgrades') updateUI({ fullRender: false });
    }
    visualMiners.forEach(miner => {
        const minerState = miner.state;
        if (minerState === 'IDLE') {
            const availableBlocks = mineMeshes[0].filter(Boolean);
            if (availableBlocks.length > 0) { miner.target = availableBlocks[Math.floor(Math.random() * availableBlocks.length)]; miner.state = 'MOVING'; }
        } else if (minerState === 'MOVING') {
            if (!miner.target || !scene.children.includes(miner.target)) { miner.state = 'IDLE'; return; }
            const targetPos = new THREE.Vector3(miner.target.position.x, 0.5, miner.target.position.z);
            miner.mesh.position.lerp(targetPos, delta * (3 + state.upgrades.minerStaminaLevel * 0.5));
            if (miner.mesh.position.distanceTo(targetPos) < 0.1) { miner.state = 'DIGGING'; miner.digTimer = 1 / (1.3 + state.upgrades.minerStaminaLevel * 0.3); }
        } else if (minerState === 'DIGGING') {
            if (!miner.target || !scene.children.includes(miner.target)) { miner.state = 'IDLE'; return; }
            miner.digTimer -= delta;
            miner.mesh.position.y = 0.5 + Math.sin(clock.getElapsedTime() * 20) * 0.1;
            if (miner.digTimer <= 0) {
                const { gridX, gridY, gridZ } = miner.target.userData;
                digBlock(gridX, gridY, gridZ, state.upgrades.minerPowerLevel, false, state.upgrades.superMinerLevel > 0);
                miner.digTimer = 1 / (1.3 + state.upgrades.minerStaminaLevel * 0.3);
                if (Math.random() < 1 / Math.max(1, 5 - state.upgrades.minerStaminaLevel * 0.5)) { miner.state = 'RESTING'; miner.restTimer = Math.max(0.5, 3 - state.upgrades.minerStaminaLevel * 0.5); }
            }
        } else if (minerState === 'RESTING') {
            miner.restTimer -= delta; miner.mesh.position.y = 0.5;
            if (miner.restTimer <= 0) miner.state = 'IDLE';
        }
    });
    for (let i = shrinkingBlocks.length - 1; i >= 0; i--) {
        const block = shrinkingBlocks[i]; block.scale.multiplyScalar(0.9);
        if (block.scale.x < 0.01) { scene.remove(block); shrinkingBlocks.splice(i, 1); }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]; p.position.addScaledVector(p.velocity, delta); p.lifetime -= delta;
        if (p.lifetime <= 0) { scene.remove(p); particles.splice(i, 1); }
    }
    scene.children.forEach(child => {
        if (child.isMesh && child.userData.gridX !== undefined) {
            if (child.userData.targetYScale !== undefined && child.scale.y !== child.userData.targetYScale) {
                child.scale.y = THREE.MathUtils.lerp(child.scale.y, child.userData.targetYScale, delta * 15);
                child.position.y = -child.userData.gridY * BLOCK_SIZE - (BLOCK_SIZE * (1 - child.scale.y)) / 2;
            }
            if (child.userData.targetYPosition !== undefined && Math.abs(child.position.y - child.userData.targetYPosition) > 0.01) {
                child.position.y = THREE.MathUtils.lerp(child.position.y, child.userData.targetYPosition, delta * 8);
            } else if (child.userData.targetYPosition !== undefined) child.position.y = child.userData.targetYPosition;
            if(child.userData.isFlashing) {
                child.userData.flashTime -= delta;
                if(child.userData.flashTime <= 0) {
                    if (child.material.emissive) child.material.emissive.setHex(0x000000);
                    child.userData.isFlashing = false;
                }
            }
        }
    });
    renderer.render(scene, camera);
}

function setupModalListeners() {
    const gachaModal = document.getElementById('gacha-modal');
    gachaModal.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const targetId = button.id;
        if (targetId === 'gacha-close') { 
            if (!isGachaAnimating) {
               gachaModal.classList.remove('show');
            }
        } 
        else if (targetId.startsWith('gacha-again-')) {
            if (isGachaAnimating) return;
            const count = parseInt(targetId.split('-')[2]);
            const bannerId = state.activeBanner;
            const banner = GACHA_BANNERS[bannerId];
            if (!banner) return;
            if (state.resources.money >= banner.cost * count) summonHeroManual(count);
            else showNotification("Không đủ tiền!", "error");
        }
    });

    document.getElementById('dungeon-combat-modal').addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        switch (button.id) {
            case 'dungeon-attack-btn': handleDungeonAttack(); break;
            case 'dungeon-leave-btn': dungeonLose('Rời đi'); break;
            case 'dungeon-continue-btn': goToNextFloor(); break;
            case 'dungeon-claim-btn': claimDungeonRewards(false); break;
        }
    });
}

// --- Save/Load Logic ---
function saveState(isManual = false) {
    try {
        const stateToSave = { ...state, dungeon: { ...state.dungeon, currentRun: null } };
        localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
        if (isManual) {
            showNotification("Đã lưu tiến trình!", "success");
        }
    } catch (e) {
        console.error("Could not save game state:", e);
        showNotification("Lỗi: Không thể lưu game!", "error");
    }
}

function loadState() {
    try {
        const savedStateJSON = localStorage.getItem(SAVE_KEY);
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            // A simple way to merge and avoid breaking on new properties
            Object.keys(defaultState).forEach(key => {
                if (savedState[key] !== undefined) {
                    if (typeof state[key] === 'object' && state[key] !== null && !Array.isArray(state[key])) {
                        Object.assign(state[key], savedState[key]);
                    } else {
                        state[key] = savedState[key];
                    }
                }
            });
            showNotification("Đã tải tiến trình!", "info");
        }
    } catch (e) {
        console.error("Could not load game state:", e);
        showNotification("Lỗi: Dữ liệu lưu bị hỏng!", "error");
    }
}

function resetState() {
    localStorage.removeItem(SAVE_KEY);
    window.location.reload();
}

function showConfirmationModal(text, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    modal.querySelector('#confirmation-text').textContent = text;
    modal.classList.add('show');

    const confirmBtn = modal.querySelector('#confirm-yes-btn');
    const cancelBtn = modal.querySelector('#confirm-no-btn');

    const confirmHandler = () => {
        onConfirm();
        hideConfirmationModal();
        removeListeners();
    };

    const cancelHandler = () => {
        hideConfirmationModal();
        removeListeners();
    };
    
    const removeListeners = () => {
        confirmBtn.removeEventListener('click', confirmHandler);
        cancelBtn.removeEventListener('click', cancelHandler);
    };

    confirmBtn.addEventListener('click', confirmHandler);
    cancelBtn.addEventListener('click', cancelHandler);
}

function hideConfirmationModal() {
    document.getElementById('confirmation-modal').classList.remove('show');
}

// --- Background Image Functions ---
function applyBackgroundImage() {
    const urlInput = document.getElementById('background-url');
    const url = urlInput.value.trim();
    
    if (url) {
        state.settings.backgroundImage = url;
        updateBackgroundImage();
        showNotification('Hình nền đã được cập nhật!', 'success');
    } else {
        showNotification('Vui lòng nhập URL hình nền!', 'error');
    }
}

function resetBackgroundImage() {
    state.settings.backgroundImage = '';
    state.settings.backgroundBlur = 0;
    state.settings.backgroundOpacity = 1;
    
    const urlInput = document.getElementById('background-url');
    const blurSlider = document.getElementById('blur-slider');
    const opacitySlider = document.getElementById('opacity-slider');
    
    if (urlInput) urlInput.value = '';
    if (blurSlider) blurSlider.value = 0;
    if (opacitySlider) opacitySlider.value = 100;
    
    updateBackgroundImage();
    showNotification('Hình nền đã được đặt lại!', 'success');
}

function updateBackgroundImage() {
    const container = document.getElementById('background-image-container');
    if (!container) return;
    
    if (state.settings.backgroundImage) {
        container.style.backgroundImage = `url(${state.settings.backgroundImage})`;
        container.style.filter = `blur(${state.settings.backgroundBlur}px)`;
        container.style.opacity = state.settings.backgroundOpacity;
    } else {
        container.style.backgroundImage = 'none';
        container.style.filter = 'none';
        container.style.opacity = '1';
    }
}

// --- Initialization ---
window.onload = function() {
    moneyEl = document.getElementById('money');
    canvas = document.getElementById('game-canvas');
    panelContainer = document.getElementById('panel-container');
    notificationContainer = document.getElementById('notification-container');
    shardsEl = document.getElementById('shards');
    toggleButtons = {
        upgrades: document.getElementById('toggle-upgrades'), stats: document.getElementById('toggle-stats'),
        gacha: document.getElementById('toggle-gacha'), equipment: document.getElementById('toggle-equipment'),
        dungeon: document.getElementById('toggle-dungeon'), passive: document.getElementById('toggle-passive'),
        settings: document.getElementById('toggle-settings'),
    };

    loadState();

    initThreeJS();
    initializeMine();
    
    // Apply background image settings
    updateBackgroundImage();
    
    // Recreate visual miners from loaded state
    for (let i = 0; i < state.upgrades.minerCount; i++) {
        addMiner();
    }

    setupPanelToggle('toggle-upgrades', 'template-upgrades');
    setupPanelToggle('toggle-stats', 'template-stats');
    setupPanelToggle('toggle-gacha', 'template-gacha');
    setupPanelToggle('toggle-equipment', 'template-equipment');
    setupPanelToggle('toggle-dungeon', 'template-dungeon');
    setupPanelToggle('toggle-passive', 'template-passive');
    setupPanelToggle('toggle-settings', 'template-settings');
    setupEventListeners();
    setupModalListeners();
    initMusicPlayer();
    
    const startMusicOnInteraction = () => {
        if (!state.music.isPlaying) {
            playTrack();
        }
        document.removeEventListener('click', startMusicOnInteraction);
        document.removeEventListener('keydown', startMusicOnInteraction);
    };
    document.addEventListener('click', startMusicOnInteraction);
    document.addEventListener('keydown', startMusicOnInteraction);
    
    updateUI({ fullRender: true });
    updateEquipmentPopup();
    onWindowResize();
    animate();

    // Main game loop for stats and saving
    if (saveInterval) clearInterval(saveInterval);
    saveInterval = setInterval(() => {
        if(activePanel === 'template-stats') renderStatsPanel();
        if(activePanel === 'template-settings') renderSettingsPanel();
        saveState(); // Auto-save
    }, 30000); // Save every 30 seconds
}

