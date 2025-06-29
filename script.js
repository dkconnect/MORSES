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

const copyMessage = document.createElement('span');
copyMessage.id = 'copy-message';
copyMessage.className = 'absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 transition-opacity duration-300 pointer-events-none';
copyMessage.textContent = 'Copied!';
copyBtn.parentNode.insertBefore(copyMessage, copyBtn.nextSibling); 

let currentMode = 'morse'; 
let audioContext = null;
let audioPlaying = false;
let currentMorseAudioQueue = []; 
let audioQueueIndex = 0;
let audioHighlightTimeout = null; 
let currentAudioNode = null; 

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
    inputTextArea.value = '';
    outputTextArea.innerHTML = ''; 
    outputTextArea.value = ''; 
    errorMessage.classList.add('hidden');
    charCount.textContent = '0';
    stopMorseAudio(); 
}

function englishToMorse(text) {
    if (!text) return { morseString: '', morseHtml: '', rawMorse: [] };
    let resultString = []; 
    let resultHtml = []; 
    let rawMorseElements = []; 
    let unsupportedChars = new Set();

    text.toUpperCase().split('').forEach(char => {
        if (char === ' ') {
            resultString.push('/'); 
            resultHtml.push('<span class="morse-word-space">/</span>');
            rawMorseElements.push({ type: 'wordSpace', value: '/' });
        } else if (morseCodeMap[char]) {
            const morseChar = morseCodeMap[char];
            resultString.push(morseChar);
            resultHtml.push(`<span class="morse-char">${morseChar.split('').map(bit => `<span class="morse-bit">${bit}</span>`).join('')}</span>`);
            rawMorseElements.push({ type: 'char', value: morseChar });
        } else {
            unsupportedChars.add(char);
        }
    });

    if (unsupportedChars.size > 0) {
        errorMessage.textContent = `Note: Some characters could not be converted: ${Array.from(unsupportedChars).join(', ')}`;
        errorMessage.classList.remove('hidden');
    } else {
        errorMessage.classList.add('hidden');
    }

    return {
        morseString: resultString.join(' ').trim(),
        morseHtml: resultHtml.join(' ').trim(),
        rawMorse: rawMorseElements
    };
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

function stopMorseAudio() {
    if (audioContext && audioPlaying) {
        if (currentAudioNode) {
            currentAudioNode.stop();
            currentAudioNode.disconnect();
            currentAudioNode = null;
        }
        audioContext.close(); 
        audioContext = null;
        audioPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play text-lg"></i>';
        clearAudioHighlights();
    }
    if (audioHighlightTimeout) {
        clearTimeout(audioHighlightTimeout);
        audioHighlightTimeout = null;
    }
}

function clearAudioHighlights() {
    const highlightedElements = outputTextArea.querySelectorAll('.morse-highlight');
    highlightedElements.forEach(el => el.classList.remove('morse-highlight'));
}

function playNextAudioElement() {
    if (!audioPlaying || audioQueueIndex >= currentMorseAudioQueue.length || !audioContext) {
        stopMorseAudio();
        return;
    }

    clearAudioHighlights(); 

    const currentElement = currentMorseAudioQueue[audioQueueIndex];
    const dotDuration = 100; 
    const dashDuration = dotDuration * 3;
    const interElementGap = dotDuration; 
    const interCharacterGap = dotDuration * 3; 
    const wordGap = dotDuration * 7;

    let timeToScheduleNext = audioContext.currentTime;
    const outputSpans = outputTextArea.querySelectorAll('.morse-char, .morse-word-space');
    if (outputSpans[audioQueueIndex]) {
        outputSpans[audioQueueIndex].classList.add('morse-highlight');
    }

    if (currentElement.type === 'char') {
        const morseBits = currentElement.value.split('');
        morseBits.forEach((bit, bitIndex) => {
            currentAudioNode = audioContext.createOscillator();
            currentAudioNode.type = 'sine';
            currentAudioNode.frequency.setValueAtTime(600, timeToScheduleNext);
            currentAudioNode.connect(audioContext.destination);

            if (bit === '.') {
                currentAudioNode.start(timeToScheduleNext);
                currentAudioNode.stop(timeToScheduleNext + dotDuration / 1000);
                timeToScheduleNext += dotDuration / 1000;
            } else if (bit === '-') {
                currentAudioNode.start(timeToScheduleNext);
                currentAudioNode.stop(timeToScheduleNext + dashDuration / 1000);
                timeToScheduleNext += dashDuration / 1000;
            }
            if (bitIndex < morseBits.length - 1) { 
                timeToScheduleNext += interElementGap / 1000;
            }
        });
        timeToScheduleNext += (interCharacterGap - interElementGap) / 1000; 
    } else if (currentElement.type === 'wordSpace') {
        timeToScheduleNext += wordGap / 1000;
    }

    audioQueueIndex++;
    audioHighlightTimeout = setTimeout(playNextAudioElement, (timeToScheduleNext - audioContext.currentTime) * 1000);
}

function startMorseAudio(rawMorseElements) {
    stopMorseAudio(); 

    if (!rawMorseElements || rawMorseElements.length === 0) {
        return;
    }

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioPlaying = true;
    currentMorseAudioQueue = rawMorseElements;
    audioQueueIndex = 0;
    playBtn.innerHTML = '<i class="fas fa-pause text-lg"></i>'; 
    playNextAudioElement(); 
}

let debounceTimeout;
function handleDebouncedInput() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        const inputText = inputTextArea.value.trim();
        charCount.textContent = inputText.length;
        stopMorseAudio(); 
        clearAudioHighlights(); 
        if (currentMode === 'english') {
            const { morseString, morseHtml, rawMorse } = englishToMorse(inputText);
            outputTextArea.value = morseString; 
            outputTextArea.innerHTML = morseHtml;
            currentMorseAudioQueue = rawMorse; 
        } else {
            const convertedText = morseToEnglish(inputText);
            outputTextArea.value = convertedText;
            outputTextArea.innerHTML = convertedText; 
            currentMorseAudioQueue = inputText.split(' ').filter(e => e !== '').map(e => ({
                type: e === '/' ? 'wordSpace' : 'char',
                value: e
            }));
            if(inputText === '') currentMorseAudioQueue = []; 
        }

        outputTextArea.classList.add('animate-pulse');
        setTimeout(() => outputTextArea.classList.remove('animate-pulse'), 300);
    }, 300);
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

copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(outputTextArea.value);
        copyBtn.innerHTML = '<i class="fas fa-check text-green-500"></i>';
        copyBtn.classList.add('animate-bounce');

        copyMessage.classList.add('opacity-100');
        copyMessage.classList.remove('opacity-0');

    } catch (err) {
        console.error('Failed to copy text: ', err);
    } finally {
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy text-lg"></i>';
            copyBtn.classList.remove('animate-bounce');
            copyMessage.classList.remove('opacity-100');
            copyMessage.classList.add('opacity-0');
        }, 1500);
    }
});

playBtn.addEventListener('click', () => {
    if (audioPlaying) {
        stopMorseAudio(); 
    } else {
        startMorseAudio(currentMorseAudioQueue);
    }
});

clearBtn.addEventListener('click', () => {
    inputTextArea.value = '';
    outputTextArea.innerHTML = ''; 
    outputTextArea.value = ''; 
    charCount.textContent = '0';
    errorMessage.classList.add('hidden');
    stopMorseAudio(); 
    clearAudioHighlights(); 
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
