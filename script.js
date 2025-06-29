const morseCodeMap = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
    'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
    'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
    'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
    'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
    'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
    '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
    ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
    '"': '.-..-.', '$': '...-..-', '@': '.--.-.'
};

const englishCodeMap = Object.entries(morseCodeMap).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
}, {});

const morseBtn = document.getElementById('morse-btn');
const englishBtn = document.getElementById('english-btn');
const inputTextArea = document.getElementById('input-textarea');
const outputTextArea = document.getElementById('output-textarea');
const copyBtn = document.getElementById('copy-btn');
const playBtn = document.getElementById('play-btn');
const clearBtn = document.getElementById('clear-btn');
const alphabetLink = document.getElementById('alphabet-link');
const alphabetModal = document.getElementById('alphabet-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const charCount = document.getElementById('char-count');
const errorMessage = document.getElementById('error-message');
const themeToggle = document.getElementById('theme-toggle');

let currentMode = 'morse';

themeToggle.addEventListener('click', () => {
    const body = document.body;
    const isDark = body.dataset.theme === 'dark';
    body.dataset.theme = isDark ? 'light' : 'dark';
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

function updateButtonState() {
    if (currentMode === 'morse') {
        morseBtn.classList.add('active');
        morseBtn.classList.remove('opacity-70');
        englishBtn.classList.remove('active');
        englishBtn.classList.add('opacity-70');
        inputTextArea.placeholder = "Enter Morse code (e.g., .- / -... for A B)";
    } else {
        englishBtn.classList.add('active');
        englishBtn.classList.remove('opacity-70');
        morseBtn.classList.remove('active');
        morseBtn.classList.add('opacity-70');
        inputTextArea.placeholder = "Enter English text (e.g., HELLO)";
    }
    outputTextArea.value = '';
    inputTextArea.value = '';
    errorMessage.classList.add('hidden');
    charCount.textContent = '0';
}

function englishToMorse(text) {
    if (!text) return '';
    return text.toUpperCase().split('').map(char => {
        if (char === ' ') return '/';
        return morseCodeMap[char] || '';
    }).join(' ').trim();
}

function morseToEnglish(morse) {
    if (!morse) return '';
    const validMorsePattern = /^[\.\-\s\/]*$/;
    if (!validMorsePattern.test(morse)) {
        errorMessage.textContent = "Invalid Morse code. Use '.', '-', spaces, and '/' only.";
        errorMessage.classList.remove('hidden');
        return '';
    }
    errorMessage.classList.add('hidden');
    const words = morse.split(' / ').map(word => {
        return word.split(' ').map(code => englishCodeMap[code] || '').join('');
    });
    return words.join(' ').trim();
}

let debounceTimeout;
function handleDebouncedInput() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        const inputText = inputTextArea.value.trim();
        charCount.textContent = inputText.length;
        if (currentMode === 'english') {
            outputTextArea.value = englishToMorse(inputText);
        } else {
            outputTextArea.value = morseToEnglish(inputText);
        }
        outputTextArea.classList.add('animate-pulse');
        setTimeout(() => outputTextArea.classList.remove('animate-pulse'), 300);
    }, 300);
}

function playMorseAudio(morse) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const dotDuration = 100; // ms
    const dashDuration = dotDuration * 3;
    const gapDuration = dotDuration;
    let time = ctx.currentTime;

    morse.split('').forEach(char => {
        if (char === '.') {
            const oscillator = ctx.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, time);
            oscillator.connect(ctx.destination);
            oscillator.start(time);
            oscillator.stop(time + dotDuration / 1000);
            time += (dotDuration + gapDuration) / 1000;
        } else if (char === '-') {
            const oscillator = ctx.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, time);
            oscillator.connect(ctx.destination);
            oscillator.start(time);
            oscillator.stop(time + dashDuration / 1000);
            time += (dashDuration + gapDuration) / 1000;
        } else if (char === ' ') {
            time += gapDuration / 1000;
        } else if (char === '/') {
            time += (gapDuration * 3) / 1000;
        }
    });
}

morseBtn.addEventListener('click', () => {
    currentMode = 'morse';
    updateButtonState();
    handleDebouncedInput();
});

englishBtn.addEventListener('click', () => {
    currentMode = 'english';
    updateButtonState();
    handleDebouncedInput();
});

inputTextArea.addEventListener('input', handleDebouncedInput);

copyBtn.addEventListener('click', () => {
    outputTextArea.select();
    document.execCommand('copy');
    copyBtn.innerHTML = '<i class="fas fa-check text-green-500"></i>';
    copyBtn.classList.add('animate-bounce');
    setTimeout(() => {
        copyBtn.innerHTML = '<i class="fas fa-copy text-lg"></i>';
        copyBtn.classList.remove('animate-bounce');
    }, 1500);
});

playBtn.addEventListener('click', () => {
    if (currentMode === 'english' && outputTextArea.value) {
        playMorseAudio(outputTextArea.value);
    } else if (currentMode === 'morse' && inputTextArea.value) {
        playMorseAudio(inputTextArea.value);
    }
});

clearBtn.addEventListener('click', () => {
    inputTextArea.value = '';
    outputTextArea.value = '';
    charCount.textContent = '0';
    errorMessage.classList.add('hidden');
});

alphabetLink.addEventListener('click', (e) => {
    e.preventDefault();
    alphabetModal.classList.remove('hidden');
});

closeModalBtn.addEventListener('click', () => {
    alphabetModal.classList.add('hidden');
});

alphabetModal.addEventListener('click', (e) => {
    if (e.target === alphabetModal) {
        alphabetModal.classList.add('hidden');
    }
});

alphabetModal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        alphabetModal.classList.add('hidden');
    }
});

updateButtonState();
