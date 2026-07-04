/**
 * VORTEX ARENA - INTERACTIVE TERMINAL ENGINE & PLAYABLE GAME MATRIX
 * Core controller for:
 * 1. Web Audio API synthesizer sounds
 * 2. Custom fluid cursor lerp tracking
 * 3. Game library category filtering
 * 4. Real-time tournament leaderboard score updates & ranks sorting
 * 5. Player Stats/XP progress rings and Diagnostics HUD
 * 6. Interactive Modal controllers & view swaps
 * 7. Three playable browser mini-games: Grid Hacker (Lights Out RPG), Reflex Trainer (Canvas FPS), Space Evader (Canvas MOBA)
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let soundEnabled = true;
    let audioCtx = null;
    let playerXP = 0;
    const maxXP = 2500;
    let playerLevel = 1;
    const levelRanks = [
        "CADET",
        "ELITE CADET",
        "SYSTEM SPECIALIST",
        "VIRTUAL INFILTRATOR",
        "GRID MASTER",
        "VORTEX LEGEND"
    ];

    // --- DOM Elements ---
    const customCursor = document.getElementById('custom-cursor');
    const customCursorGlow = document.getElementById('custom-cursor-glow');
    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    const soundIcon = document.getElementById('sound-icon');
    const soundBtnText = document.getElementById('sound-btn-text');
    const header = document.getElementById('header');
    
    // HUD Telemetry
    const hudLatency = document.getElementById('hud-latency');
    const hudPlayers = document.getElementById('hud-players');
    const visBars = document.querySelectorAll('.vis-bar');
    const hudTimestamp = document.getElementById('hud-timestamp');

    // Filtering
    const filterButtons = document.querySelectorAll('.filter-btn');
    const gameCards = document.querySelectorAll('.game-card');

    // Stats & Level Up
    const xpRing = document.getElementById('xp-progress-ring');
    const xpPercentText = document.getElementById('xp-percent-text');
    const xpNumbers = document.getElementById('xp-numbers');
    const injectXpBtn = document.getElementById('trigger-training-btn');
    const pilotName = document.getElementById('pilot-name');
    const pilotRankBadge = document.querySelector('.pilot-rank-badge');
    const reflexVal = document.getElementById('stat-reflex-val');
    const reflexBar = document.getElementById('stat-reflex-bar');
    const syncVal = document.getElementById('stat-sync-val');
    const syncBar = document.getElementById('stat-sync-bar');
    const combatVal = document.getElementById('stat-combat-val');
    const combatBar = document.getElementById('stat-combat-bar');

    // Achievements
    const badgeReflex = document.getElementById('badge-reflex');
    const badgeMaster = document.getElementById('badge-master');
    const badgeAlpha = document.getElementById('badge-alpha');

    // Leaderboard
    const leaderboardBody = document.getElementById('leaderboard-body');

    // Newsletter Form
    const newsletterForm = document.getElementById('newsletter-form');
    const subscriberEmail = document.getElementById('subscriber-email');
    const formFeedback = document.getElementById('form-feedback');

    // Mobile Navigation & Login
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    const mobileConnectBtn = document.getElementById('mobile-connect-btn');
    const loginBtn = document.getElementById('login-btn');

    // Modals
    const modalButtons = document.querySelectorAll('[data-modal]');
    const modals = document.querySelectorAll('.modal-overlay');
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    const navLinks = document.querySelectorAll('.nav-link');

    // --- Web Audio API Synth ---
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playSynth(freqStart, freqEnd, type, duration, gainStart) {
        if (!soundEnabled) return;
        try {
            initAudio();
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freqStart, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freqEnd, audioCtx.currentTime + duration);

            gainNode.gain.setValueAtTime(gainStart, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.warn("AudioContext initialization error: ", e);
        }
    }

    const playHoverSound = () => playSynth(600, 1200, 'sine', 0.08, 0.05);
    const playClickSound = () => playSynth(200, 800, 'sawtooth', 0.15, 0.08);
    const playLevelUpSound = () => {
        if (!soundEnabled) return;
        initAudio();
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C major triad arpeggio
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                playSynth(freq, freq * 1.5, 'triangle', 0.3, 0.06);
            }, idx * 100);
        });
    };
    const playSuccessSound = () => {
        if (!soundEnabled) return;
        initAudio();
        playSynth(440, 880, 'sine', 0.25, 0.08);
        setTimeout(() => playSynth(554.37, 1108.73, 'sine', 0.25, 0.08), 80);
    };
    const playFailSound = () => {
        playSynth(180, 80, 'sawtooth', 0.4, 0.1);
    };

    // Toggle Audio setting
    soundToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        soundEnabled = !soundEnabled;
        if (soundEnabled) {
            soundBtnText.textContent = "Audio: ON";
            soundIcon.innerHTML = `<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>`;
            initAudio();
            playClickSound();
        } else {
            soundBtnText.textContent = "Audio: OFF";
            soundIcon.innerHTML = `<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>`;
        }
    });

    // Sound Hooks for Interactive Items
    const addSoundHooks = () => {
        const interactiveElements = document.querySelectorAll('a, button, .game-card, .filter-btn, .badge-item:not(.locked), .hacker-node');
        interactiveElements.forEach(el => {
            if (el.dataset.soundHooked) return;
            el.dataset.soundHooked = "true";

            el.addEventListener('mouseenter', () => {
                playHoverSound();
                customCursor.style.width = '14px';
                customCursor.style.height = '14px';
                customCursor.style.backgroundColor = 'var(--accent-magenta)';
                customCursorGlow.style.width = '50px';
                customCursorGlow.style.height = '50px';
                customCursorGlow.style.borderColor = 'var(--accent-magenta)';
            });

            el.addEventListener('mouseleave', () => {
                customCursor.style.width = '8px';
                customCursor.style.height = '8px';
                customCursor.style.backgroundColor = 'var(--accent-cyan)';
                customCursorGlow.style.width = '36px';
                customCursorGlow.style.height = '36px';
                customCursorGlow.style.borderColor = 'rgba(0, 243, 255, 0.3)';
            });

            el.addEventListener('click', () => {
                playClickSound();
            });
        });
    };
    
    addSoundHooks();

    // --- Interactive Custom Cursor ---
    let cursorX = 0, cursorY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
        customCursor.style.left = `${cursorX}px`;
        customCursor.style.top = `${cursorY}px`;
    });

    function updateGlowPosition() {
        const dx = cursorX - glowX;
        const dy = cursorY - glowY;
        glowX += dx * 0.15;
        glowY += dy * 0.15;
        customCursorGlow.style.left = `${glowX}px`;
        customCursorGlow.style.top = `${glowY}px`;
        requestAnimationFrame(updateGlowPosition);
    }
    updateGlowPosition();

    document.addEventListener('mouseenter', () => {
        customCursor.style.opacity = '1';
        customCursorGlow.style.opacity = '1';
    });
    document.addEventListener('mouseleave', () => {
        customCursor.style.opacity = '0';
        customCursorGlow.style.opacity = '0';
    });

    // --- Header Scrolled Shadow ---
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Mobile Menu Toggle ---
    mobileToggle.addEventListener('click', () => {
        const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
        mobileToggle.setAttribute('aria-expanded', !isExpanded);
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = !isExpanded ? 'hidden' : '';
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileToggle.setAttribute('aria-expanded', 'false');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    mobileConnectBtn.addEventListener('click', () => {
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
        connectWalletMock();
    });

    loginBtn.addEventListener('click', () => {
        connectWalletMock();
    });

    function connectWalletMock() {
        const walletText = loginBtn.querySelector('.btn-text');
        if (walletText.textContent === "CONNECT WALLET") {
            walletText.textContent = "CONNECTED: VX_8A2";
            loginBtn.style.boxShadow = 'var(--glow-green)';
            loginBtn.style.backgroundColor = 'var(--accent-green)';
            playSuccessSound();
            pilotName.textContent = "PILOT_VX_8A2";
        } else {
            walletText.textContent = "CONNECT WALLET";
            loginBtn.style.boxShadow = '0 0 10px rgba(0, 243, 255, 0.3)';
            loginBtn.style.backgroundColor = 'var(--accent-cyan)';
            playClickSound();
            pilotName.textContent = "RECRUIT_PILOT_77";
        }
    }

    // --- Hero HUD Real-time Telemetry Simulation ---
    setInterval(() => {
        const latency = Math.floor(Math.random() * 10) + 9;
        if (hudLatency) {
            hudLatency.textContent = `${latency}ms`;
            hudLatency.className = latency > 15 ? 'tel-val text-yellow' : 'tel-val green-text';
        }

        const basePlayers = 142800 + Math.floor(Math.random() * 300);
        if (hudPlayers) hudPlayers.textContent = basePlayers.toLocaleString();

        visBars.forEach(bar => {
            const h = Math.floor(Math.random() * 90) + 10;
            bar.style.height = `${h}%`;
        });

        const now = new Date();
        if (hudTimestamp) {
            hudTimestamp.textContent = `SYSTEM CLOCK // ${now.toISOString().substring(11, 19)} // SECURE PROTOCOL SECURED`;
        }
    }, 2000);

    // --- Game Library Filter logic ---
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            gameCards.forEach(card => {
                const category = card.getAttribute('data-category');
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

                if (filterValue === 'all' || category === filterValue) {
                    card.style.display = 'flex';
                    card.offsetHeight;
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        if (btn.getAttribute('data-filter') === filterValue) {
                            card.style.display = 'none';
                        }
                    }, 300);
                }
            });
        });
    });

    // --- Live Leaderboard Dynamic Scoring ---
    const leaderboardPlayers = [
        { id: 'row-0', scoreId: 'score-0', baseScore: 84930, name: "XenonForce_99" },
        { id: 'row-1', scoreId: 'score-1', baseScore: 82145, name: "Nighthawk_X" },
        { id: 'row-2', scoreId: 'score-2', baseScore: 79905, name: "CyberGhost" },
        { id: 'row-3', scoreId: 'score-3', baseScore: 71450, name: "ReaperPrime" },
        { id: 'row-4', scoreId: 'score-4', baseScore: 68220, name: "PhantomViper" }
    ];

    setInterval(() => {
        if (!leaderboardBody) return;
        const randIdx = Math.floor(Math.random() * leaderboardPlayers.length);
        const player = leaderboardPlayers[randIdx];
        const gain = Math.floor(Math.random() * 80) + 20;
        player.baseScore += gain;

        const scoreEl = document.getElementById(player.scoreId);
        if (scoreEl) {
            scoreEl.textContent = player.baseScore.toLocaleString();
            scoreEl.style.color = 'var(--accent-magenta)';
            setTimeout(() => { scoreEl.style.color = ''; }, 800);
        }

        const sorted = [...leaderboardPlayers].sort((a, b) => b.baseScore - a.baseScore);
        sorted.forEach((p, index) => {
            const rowNode = document.getElementById(p.id);
            if (rowNode) {
                const rankNumEl = rowNode.querySelector('.rank-number');
                if (rankNumEl) rankNumEl.textContent = index + 1;

                const rankMedal = rowNode.querySelector('.rank-medal');
                if (rankMedal) {
                    if (index === 0) rankMedal.textContent = "🥇";
                    else if (index === 1) rankMedal.textContent = "🥈";
                    else if (index === 2) rankMedal.textContent = "🥉";
                    else rankMedal.textContent = "";
                }

                rowNode.classList.remove('top-three', 'rank-1', 'rank-2', 'rank-3');
                if (index < 3) {
                    rowNode.classList.add('top-three', `rank-${index + 1}`);
                }
                leaderboardBody.appendChild(rowNode);
            }
        });
    }, 4000);

    // --- Interactive Player Telemetry Stats Dashboard ---
    function setProgress(percent) {
        if (!xpRing) return;
        const radius = xpRing.r.baseVal.value;
        const circumference = 2 * Math.PI * radius; // ~314.16
        const offset = circumference - (percent / 100) * circumference;
        xpRing.style.strokeDashoffset = offset;
    }

    setProgress(0);

    // Generic XP Awarder
    function awardPlayerXP(amount) {
        playerXP += amount;
        if (playerXP >= maxXP) {
            playerXP = playerXP - maxXP;
            playerLevel++;
            playLevelUpSound();
            
            const profileCard = document.getElementById('pilot-profile-card');
            if (profileCard) {
                profileCard.style.borderColor = 'var(--accent-green)';
                profileCard.style.boxShadow = 'var(--glow-green)';
                setTimeout(() => {
                    profileCard.style.borderColor = '';
                    profileCard.style.boxShadow = '';
                }, 1500);
            }

            const currentRankTitle = levelRanks[Math.min(playerLevel - 1, levelRanks.length - 1)];
            if (pilotRankBadge) {
                pilotRankBadge.textContent = `RANK: ${currentRankTitle} (LEVEL ${playerLevel})`;
            }

            adjustDiagnostics();
        } else {
            playSuccessSound();
        }

        const progressPercentage = Math.floor((playerXP / maxXP) * 100);
        if (xpPercentText) xpPercentText.textContent = `${progressPercentage}%`;
        if (xpNumbers) xpNumbers.textContent = `${playerXP.toLocaleString()} / ${maxXP.toLocaleString()} XP`;
        setProgress(progressPercentage);

        if (playerLevel >= 5 && badgeMaster.classList.contains('locked')) {
            badgeMaster.classList.remove('locked');
            badgeMaster.classList.add('unlocked');
            badgeMaster.title = "Tactical Mastery unlocked at Pilot level 5";
        }
    }

    injectXpBtn.addEventListener('click', () => {
        awardPlayerXP(500);
    });

    function adjustDiagnostics() {
        const reflex = Math.min(42 + (playerLevel - 1) * 8, 100);
        if (reflexVal) reflexVal.textContent = `${reflex}%`;
        if (reflexBar) reflexBar.style.width = `${reflex}%`;

        if (reflex >= 80 && badgeReflex.classList.contains('locked')) {
            badgeReflex.classList.remove('locked');
            badgeReflex.classList.add('unlocked');
            badgeReflex.title = "Grid reflex synchronization complete";
        }

        const sync = Math.min(65 + (playerLevel - 1) * 5, 100);
        if (syncVal) syncVal.textContent = `${sync}%`;
        if (syncBar) syncBar.style.width = `${sync}%`;

        const combat = Math.min(28 + (playerLevel - 1) * 12, 100);
        if (combatVal) combatVal.textContent = `${combat}%`;
        if (combatBar) combatBar.style.width = `${combat}%`;
    }

    // --- Newsletter Form Submission Handling ---
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailVal = subscriberEmail.value.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailVal)) {
            playFailSound();
            formFeedback.textContent = ">> STATUS: INVALID CODE DEPLOYMENT. CHECK CODES.";
            formFeedback.className = "form-feedback feedback-error";
            subscriberEmail.style.borderColor = 'var(--accent-magenta)';
            setTimeout(() => { subscriberEmail.style.borderColor = ''; }, 2000);
            return;
        }

        playSuccessSound();
        formFeedback.textContent = ">> CYBER SYNC ESTABLISHED. WELCOME TO ALPHA DEPLOYMENT.";
        formFeedback.className = "form-feedback feedback-success";
        
        subscriberEmail.disabled = true;
        newsletterForm.querySelector('button[type="submit"]').disabled = true;

        if (badgeAlpha.classList.contains('locked')) {
            badgeAlpha.classList.remove('locked');
            badgeAlpha.classList.add('unlocked');
            badgeAlpha.title = "Tactical network dispatch synced successfully";
            addSoundHooks();
        }
    });

    // --- Modals System ---
    modalButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            const targetModal = document.getElementById(modalId);
            if (targetModal) {
                targetModal.classList.add('active');
                targetModal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    const closeModal = (modal) => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        if (!mobileMenu.classList.contains('active')) {
            document.body.style.overflow = '';
        }
        stopAllGames();
    };

    modalCloseButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-overlay');
            if (modal) closeModal(modal);
        });
    });

    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal-overlay.active');
            if (activeModal) closeModal(activeModal);
        }
    });

    // Modals swapper back to details view
    const backButtons = document.querySelectorAll('.game-back-btn');
    backButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-overlay');
            if (modal) {
                stopAllGames();
                const infoView = modal.querySelector('.modal-body-layout');
                const gameView = modal.querySelector('.game-view-layout');
                if (infoView && gameView) {
                    gameView.style.display = 'none';
                    infoView.style.display = 'grid';
                }
            }
        });
    });

    // Deploy Buttons click (opens game views inside modals)
    const launchRpgBtn = document.getElementById('launch-rpg-btn');
    if (launchRpgBtn) {
        launchRpgBtn.addEventListener('click', () => {
            document.getElementById('rpg-info-view').style.display = 'none';
            document.getElementById('rpg-game-view').style.display = 'flex';
            startRpgGame();
        });
    }

    const launchFpsBtn = document.getElementById('launch-fps-btn');
    if (launchFpsBtn) {
        launchFpsBtn.addEventListener('click', () => {
            document.getElementById('fps-info-view').style.display = 'none';
            document.getElementById('fps-game-view').style.display = 'flex';
            initFpsGame();
        });
    }

    const launchMobaBtn = document.getElementById('launch-moba-btn');
    if (launchMobaBtn) {
        launchMobaBtn.addEventListener('click', () => {
            document.getElementById('moba-info-view').style.display = 'none';
            document.getElementById('moba-game-view').style.display = 'flex';
            initMobaGame();
        });
    }

    // --- GAME ENGINE 1: GRID HACKER (RPG Lights Out Puzzle) ---
    let rpgMovesCount = 0;
    let rpgGridData = Array(16).fill(true);
    let rpgGameOver = false;

    function startRpgGame() {
        rpgMovesCount = 0;
        rpgGameOver = false;
        document.getElementById('rpg-moves').textContent = "0";
        const statusEl = document.getElementById('rpg-status');
        statusEl.textContent = "DECRYPTING...";
        statusEl.className = "text-yellow";
        
        generateSolvableRpgGrid();
        renderRpgGrid();
    }

    function generateSolvableRpgGrid() {
        rpgGridData.fill(true);
        const toggleCount = Math.floor(Math.random() * 4) + 5;
        for (let i = 0; i < toggleCount; i++) {
            const randIdx = Math.floor(Math.random() * 16);
            toggleNodeAndNeighbors(randIdx, false);
        }
        if (checkRpgWinState()) {
            toggleNodeAndNeighbors(0, false);
        }
    }

    function toggleNodeAndNeighbors(index, trackMove = true) {
        const row = Math.floor(index / 4);
        const col = index % 4;
        
        const toggleIndex = (r, c) => {
            const idx = r * 4 + c;
            rpgGridData[idx] = !rpgGridData[idx];
        };
        
        toggleIndex(row, col);
        if (row > 0) toggleIndex(row - 1, col);
        if (row < 3) toggleIndex(row + 1, col);
        if (col > 0) toggleIndex(row, col - 1);
        if (col < 3) toggleIndex(row, col + 1);
        
        if (trackMove) {
            rpgMovesCount++;
            document.getElementById('rpg-moves').textContent = rpgMovesCount;
            playClickSound();
        }
    }

    function renderRpgGrid() {
        const gridContainer = document.getElementById('hacker-grid');
        if (!gridContainer) return;
        gridContainer.innerHTML = '';
        
        rpgGridData.forEach((state, idx) => {
            const node = document.createElement('button');
            node.className = `hacker-node ${state ? 'active' : ''}`;
            node.dataset.index = idx;
            node.ariaLabel = `Grid Node ${idx + 1}`;
            
            node.addEventListener('click', () => {
                if (rpgGameOver) return;
                toggleNodeAndNeighbors(idx, true);
                renderRpgGrid();
                
                if (checkRpgWinState()) {
                    triggerRpgWin();
                }
            });
            gridContainer.appendChild(node);
        });
        addSoundHooks();
    }

    function checkRpgWinState() {
        return rpgGridData.every(state => state === true);
    }

    function triggerRpgWin() {
        rpgGameOver = true;
        const statusEl = document.getElementById('rpg-status');
        statusEl.textContent = "DECRYPTED!";
        statusEl.className = "text-green";
        awardPlayerXP(1000);
        
        if (badgeMaster.classList.contains('locked')) {
            badgeMaster.classList.remove('locked');
            badgeMaster.classList.add('unlocked');
            badgeMaster.title = "Tactical decryption sequence complete";
        }
    }

    document.getElementById('rpg-reset-btn').addEventListener('click', () => {
        startRpgGame();
    });


    // --- GAME ENGINE 2: NEON STRIKE (Canvas Target Clicker FPS) ---
    const fpsCanvas = document.getElementById('fps-canvas');
    const fpsCtx = fpsCanvas ? fpsCanvas.getContext('2d') : null;
    const fpsTimerEl = document.getElementById('fps-timer');
    const fpsScoreEl = document.getElementById('fps-score');
    const fpsStartOverlay = document.getElementById('fps-start-overlay');
    const fpsStartBtn = document.getElementById('fps-start-btn');
    
    let fpsRunning = false;
    let fpsScore = 0;
    let fpsTimeRemaining = 15;
    let fpsTargets = [];
    let fpsIntervalId = null;
    let fpsTimerId = null;
    let fpsAnimationId = null;

    class FpsTarget {
        constructor(width, height) {
            this.x = Math.random() * (width - 60) + 30;
            this.y = Math.random() * (height - 60) + 30;
            this.radius = 0;
            this.maxRadius = Math.random() * 10 + 20;
            this.growing = true;
            this.speed = Math.random() * 0.5 + 0.5;
            this.color = Math.random() > 0.5 ? '#00f3ff' : '#ff007f';
        }

        update() {
            if (this.growing) {
                this.radius += this.speed;
                if (this.radius >= this.maxRadius) {
                    this.growing = false;
                }
            } else {
                this.radius -= this.speed * 0.7;
                if (this.radius <= 0) {
                    return false;
                }
            }
            return true;
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 0;
            ctx.fill();
        }

        isClicked(mx, my) {
            const dist = Math.hypot(mx - this.x, my - this.y);
            return dist <= this.radius + 8;
        }
    }

    function initFpsGame() {
        fpsRunning = false;
        fpsScore = 0;
        fpsTimeRemaining = 15;
        fpsTargets = [];
        if (fpsScoreEl) fpsScoreEl.textContent = "0";
        if (fpsTimerEl) fpsTimerEl.textContent = "15.0s";
        if (fpsStartOverlay) {
            fpsStartOverlay.style.opacity = '1';
            fpsStartOverlay.style.pointerEvents = 'all';
        }
        if (fpsStartBtn) fpsStartBtn.textContent = "INITIALIZE CORE LINK";
        drawFpsBackground();
    }

    function drawFpsBackground() {
        if (!fpsCtx) return;
        fpsCtx.clearRect(0, 0, fpsCanvas.width, fpsCanvas.height);
        fpsCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        fpsCtx.lineWidth = 1;
        for (let x = 50; x < fpsCanvas.width; x += 50) {
            fpsCtx.beginPath();
            fpsCtx.moveTo(x, 0);
            fpsCtx.lineTo(x, fpsCanvas.height);
            fpsCtx.stroke();
        }
        for (let y = 50; y < fpsCanvas.height; y += 50) {
            fpsCtx.beginPath();
            fpsCtx.moveTo(0, y);
            fpsCtx.lineTo(fpsCanvas.width, y);
            fpsCtx.stroke();
        }
    }

    if (fpsStartBtn) {
        fpsStartBtn.addEventListener('click', () => {
            if (fpsRunning) return;
            fpsRunning = true;
            fpsStartOverlay.style.opacity = '0';
            fpsStartOverlay.style.pointerEvents = 'none';
            fpsScore = 0;
            fpsTimeRemaining = 15.0;
            fpsTargets = [];
            
            fpsIntervalId = setInterval(() => {
                if (fpsTargets.length < 5) {
                    fpsTargets.push(new FpsTarget(fpsCanvas.width, fpsCanvas.height));
                }
            }, 600);

            fpsTimerId = setInterval(() => {
                fpsTimeRemaining -= 0.1;
                if (fpsTimeRemaining <= 0) {
                    fpsTimeRemaining = 0;
                    stopFpsGame(true);
                }
                fpsTimerEl.textContent = `${fpsTimeRemaining.toFixed(1)}s`;
            }, 100);

            fpsLoop();
        });
    }

    function fpsLoop() {
        if (!fpsRunning) return;
        drawFpsBackground();
        fpsTargets = fpsTargets.filter(t => {
            const alive = t.update();
            if (alive) {
                t.draw(fpsCtx);
            }
            return alive;
        });
        fpsAnimationId = requestAnimationFrame(fpsLoop);
    }

    if (fpsCanvas) {
        fpsCanvas.addEventListener('mousedown', (e) => {
            if (!fpsRunning) return;
            const rect = fpsCanvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (fpsCanvas.width / rect.width);
            const my = (e.clientY - rect.top) * (fpsCanvas.height / rect.height);
            
            let hit = false;
            fpsTargets = fpsTargets.filter(target => {
                if (target.isClicked(mx, my)) {
                    hit = true;
                    fpsScore++;
                    fpsScoreEl.textContent = fpsScore;
                    playSynth(900, 1600, 'triangle', 0.05, 0.06);
                    return false;
                }
                return true;
            });
            if (!hit) {
                playSynth(200, 100, 'sawtooth', 0.1, 0.05);
            }
        });
    }

    function stopFpsGame(finished = false) {
        fpsRunning = false;
        clearInterval(fpsIntervalId);
        clearInterval(fpsTimerId);
        cancelAnimationFrame(fpsAnimationId);
        
        if (finished) {
            if (fpsScore >= 10) {
                fpsStartBtn.textContent = `WINNER! SCORE: ${fpsScore} // RETRY`;
                awardPlayerXP(1000);
                
                const reflexMultiplier = Math.min(42 + (playerLevel - 1) * 8 + fpsScore, 100);
                if (reflexVal) reflexVal.textContent = `${reflexMultiplier}%`;
                if (reflexBar) reflexBar.style.width = `${reflexMultiplier}%`;
                
                if (reflexMultiplier >= 80 && badgeReflex.classList.contains('locked')) {
                    badgeReflex.classList.remove('locked');
                    badgeReflex.classList.add('unlocked');
                    badgeReflex.title = "Reflex synchronization verified at 80%+";
                }
            } else {
                playFailSound();
                fpsStartBtn.textContent = `FAILED (REQ: 10) SCORE: ${fpsScore} // RETRY`;
            }
            if (fpsStartOverlay) {
                fpsStartOverlay.style.opacity = '1';
                fpsStartOverlay.style.pointerEvents = 'all';
            }
        }
    }


    // --- GAME ENGINE 3: COSMIC CLASH (Canvas Space Evader Shooter) ---
    const mobaCanvas = document.getElementById('moba-canvas');
    const mobaCtx = mobaCanvas ? mobaCanvas.getContext('2d') : null;
    const mobaScoreEl = document.getElementById('moba-score');
    const mobaHpEl = document.getElementById('moba-hp');
    const mobaStartOverlay = document.getElementById('moba-start-overlay');
    const mobaStartBtn = document.getElementById('moba-start-btn');

    let mobaRunning = false;
    let mobaScore = 0;
    let mobaHp = 100;
    let mobaShipX = 350;
    let mobaShipY = 270;
    let mobaLasers = [];
    let mobaAsteroids = [];
    let mobaParticles = [];
    let mobaAnimationId = null;
    let mobaSpawnInterval = null;
    let mobaShootInterval = null;

    class MobaAsteroid {
        constructor(width) {
            this.x = Math.random() * (width - 40) + 20;
            this.y = -30;
            this.size = Math.random() * 20 + 15;
            this.speed = Math.random() * 2.5 + 2;
            this.angle = 0;
            this.rotationSpeed = Math.random() * 0.05 - 0.025;
            this.hp = Math.ceil(this.size / 10);
            this.maxHp = this.hp;
        }

        update() {
            this.y += this.speed;
            this.angle += this.rotationSpeed;
            return this.y < 350;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.strokeStyle = '#ff007f';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ff007f';
            
            ctx.beginPath();
            const sides = 8;
            for (let i = 0; i < sides; i++) {
                const angle = (i * 2 * Math.PI) / sides;
                const r = this.size + (Math.sin(i * 3 + this.x) * 3);
                const px = Math.cos(angle) * r;
                const py = Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
            
            if (this.hp < this.maxHp) {
                ctx.fillStyle = '#ffe600';
                ctx.fillRect(-this.size, -this.size - 8, (this.size * 2) * (this.hp / this.maxHp), 3);
            }
            ctx.restore();
            ctx.shadowBlur = 0;
        }
    }

    class MobaParticle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 6;
            this.vy = (Math.random() - 0.5) * 6;
            this.size = Math.random() * 3 + 1;
            this.life = 1.0;
            this.decay = Math.random() * 0.04 + 0.02;
            this.color = color;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= this.decay;
            return this.life > 0;
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `${this.color}${Math.floor(this.life * 255).toString(16).padStart(2, '0')}`;
            ctx.fill();
        }
    }

    function initMobaGame() {
        mobaRunning = false;
        mobaScore = 0;
        mobaHp = 100;
        mobaShipX = 350;
        mobaShipY = 270;
        mobaLasers = [];
        mobaAsteroids = [];
        mobaParticles = [];
        
        if (mobaScoreEl) mobaScoreEl.textContent = "0";
        if (mobaHpEl) {
            mobaHpEl.textContent = "100%";
            mobaHpEl.className = "text-green";
        }
        if (mobaStartOverlay) {
            mobaStartOverlay.style.opacity = '1';
            mobaStartOverlay.style.pointerEvents = 'all';
        }
        if (mobaStartBtn) mobaStartBtn.textContent = "ENGAGE THRUSTERS";
        drawMobaBackground();
    }

    function drawMobaBackground() {
        if (!mobaCtx) return;
        mobaCtx.clearRect(0, 0, mobaCanvas.width, mobaCanvas.height);
        mobaCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let i = 0; i < 30; i++) {
            const sx = (Math.sin(i * 45) * 0.5 + 0.5) * mobaCanvas.width;
            const sy = ((i * 15) % mobaCanvas.height);
            mobaCtx.fillRect(sx, sy, 2, 2);
        }
        drawMobaShip(mobaShipX, mobaShipY);
    }

    function drawMobaShip(x, y) {
        if (!mobaCtx) return;
        mobaCtx.save();
        mobaCtx.translate(x, y);
        if (mobaRunning) {
            const fireH = Math.random() * 15 + 10;
            mobaCtx.beginPath();
            mobaCtx.moveTo(-6, 12);
            mobaCtx.lineTo(0, 12 + fireH);
            mobaCtx.lineTo(6, 12);
            mobaCtx.fillStyle = '#ff007f';
            mobaCtx.shadowBlur = 10;
            mobaCtx.shadowColor = '#ff007f';
            mobaCtx.fill();
        }
        mobaCtx.beginPath();
        mobaCtx.moveTo(0, -18);
        mobaCtx.lineTo(15, 12);
        mobaCtx.lineTo(0, 5);
        mobaCtx.lineTo(-15, 12);
        mobaCtx.closePath();
        mobaCtx.strokeStyle = '#00f3ff';
        mobaCtx.lineWidth = 2.5;
        mobaCtx.fillStyle = '#06070d';
        mobaCtx.shadowBlur = 12;
        mobaCtx.shadowColor = '#00f3ff';
        mobaCtx.fill();
        mobaCtx.stroke();
        mobaCtx.restore();
        mobaCtx.shadowBlur = 0;
    }

    if (mobaCanvas) {
        mobaCanvas.addEventListener('mousemove', (e) => {
            if (!mobaRunning) return;
            const rect = mobaCanvas.getBoundingClientRect();
            mobaShipX = (e.clientX - rect.left) * (mobaCanvas.width / rect.width);
            mobaShipX = Math.max(20, Math.min(mobaCanvas.width - 20, mobaShipX));
        });
    }

    if (mobaStartBtn) {
        mobaStartBtn.addEventListener('click', () => {
            if (mobaRunning) return;
            mobaRunning = true;
            mobaStartOverlay.style.opacity = '0';
            mobaStartOverlay.style.pointerEvents = 'none';
            mobaScore = 0;
            mobaHp = 100;
            mobaLasers = [];
            mobaAsteroids = [];
            mobaParticles = [];
            
            mobaScoreEl.textContent = "0";
            mobaHpEl.textContent = "100%";
            mobaHpEl.className = "text-green";

            mobaSpawnInterval = setInterval(() => {
                if (mobaAsteroids.length < 6) {
                    mobaAsteroids.push(new MobaAsteroid(mobaCanvas.width));
                }
            }, 900);

            mobaShootInterval = setInterval(() => {
                mobaLasers.push({ x: mobaShipX, y: mobaShipY - 20, speed: 7 });
                playSynth(800, 400, 'sine', 0.05, 0.03);
            }, 250);

            mobaLoop();
        });
    }

    function mobaLoop() {
        if (!mobaRunning) return;
        mobaCtx.clearRect(0, 0, mobaCanvas.width, mobaCanvas.height);
        
        mobaCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 40; i++) {
            const sx = (Math.sin(i * 30) * 0.5 + 0.5) * mobaCanvas.width;
            const sy = ((i * 20 + (Date.now() / 30)) % mobaCanvas.height);
            mobaCtx.fillRect(sx, sy, 2, 2);
        }

        drawMobaShip(mobaShipX, mobaShipY);

        mobaLasers = mobaLasers.filter(laser => {
            laser.y -= laser.speed;
            mobaCtx.beginPath();
            mobaCtx.moveTo(laser.x, laser.y);
            mobaCtx.lineTo(laser.x, laser.y - 12);
            mobaCtx.strokeStyle = '#ffe600';
            mobaCtx.lineWidth = 3;
            mobaCtx.shadowBlur = 8;
            mobaCtx.shadowColor = '#ffe600';
            mobaCtx.stroke();
            mobaCtx.shadowBlur = 0;
            return laser.y > 0;
        });

        mobaParticles = mobaParticles.filter(p => {
            const alive = p.update();
            if (alive) {
                p.draw(mobaCtx);
            }
            return alive;
        });

        mobaAsteroids = mobaAsteroids.filter(asteroid => {
            const inside = asteroid.update();
            if (inside) {
                asteroid.draw(mobaCtx);
                
                const distShip = Math.hypot(asteroid.x - mobaShipX, asteroid.y - mobaShipY);
                if (distShip < asteroid.size + 12) {
                    mobaHp -= 20;
                    if (mobaHp < 0) mobaHp = 0;
                    mobaHpEl.textContent = `${mobaHp}%`;
                    
                    if (mobaHp <= 40) mobaHpEl.className = "text-magenta";
                    else if (mobaHp <= 75) mobaHpEl.className = "text-yellow";

                    mobaCtx.fillStyle = 'rgba(255, 0, 127, 0.2)';
                    mobaCtx.fillRect(0, 0, mobaCanvas.width, mobaCanvas.height);
                    playSynth(150, 100, 'sawtooth', 0.25, 0.08);
                    createMobaExplosion(asteroid.x, asteroid.y, '#ff007f', 8);

                    if (mobaHp <= 0) {
                        stopMobaGame(true, false);
                        return false;
                    }
                    return false;
                }

                let asteroidDestroyed = false;
                mobaLasers = mobaLasers.filter(laser => {
                    const distLaser = Math.hypot(asteroid.x - laser.x, asteroid.y - laser.y);
                    if (distLaser < asteroid.size + 6) {
                        asteroid.hp--;
                        if (asteroid.hp <= 0) {
                            asteroidDestroyed = true;
                            mobaScore += 10;
                            mobaScoreEl.textContent = mobaScore;
                            playSynth(300, 60, 'sawtooth', 0.2, 0.05);
                            createMobaExplosion(asteroid.x, asteroid.y, '#ffe600', 12);
                            
                            if (mobaScore >= 150) {
                                stopMobaGame(true, true);
                            }
                        } else {
                            createMobaExplosion(laser.x, laser.y, '#ffffff', 3);
                            playSynth(600, 500, 'triangle', 0.04, 0.03);
                        }
                        return false;
                    }
                    return true;
                });
                if (asteroidDestroyed) return false;
            }
            return inside;
        });

        mobaAnimationId = requestAnimationFrame(mobaLoop);
    }

    function createMobaExplosion(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            mobaParticles.push(new MobaParticle(x, y, color));
        }
    }

    function stopMobaGame(finished = false, won = false) {
        mobaRunning = false;
        clearInterval(mobaSpawnInterval);
        clearInterval(mobaShootInterval);
        cancelAnimationFrame(mobaAnimationId);

        if (finished) {
            if (won) {
                mobaStartBtn.textContent = `MISSION COMPLETE! SCORE: ${mobaScore} // RETRY`;
                awardPlayerXP(1000);

                const combatMultiplier = Math.min(28 + (playerLevel - 1) * 12 + Math.floor(mobaScore / 10), 100);
                if (combatVal) {
                    combatVal.textContent = `${combatMultiplier}%`;
                    combatBar.style.width = `${combatMultiplier}%`;
                }
            } else {
                playFailSound();
                mobaStartBtn.textContent = `SHIELD BROKEN! DESTROYED: ${mobaScore / 10} // RETRY`;
            }
            if (mobaStartOverlay) {
                mobaStartOverlay.style.opacity = '1';
                mobaStartOverlay.style.pointerEvents = 'all';
            }
        }
    }

    function stopAllGames() {
        stopFpsGame(false);
        stopMobaGame(false);
        rpgGameOver = true;
    }

    // --- Navigation Links Spy & Active Highlight on Scroll ---
    const spySections = document.querySelectorAll('section');

    const updateActiveNav = () => {
        let current = "";
        spySections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= sectionTop - 120) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-target') === current) {
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', updateActiveNav);
});
