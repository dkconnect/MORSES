// Morse Code
const morseCodeMap = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
    'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
    'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
    'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
    'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
    'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
    '.': '.-.-.-', ',': '--..--', '?': '..-..', "'": '.----.', '!': '-.-.--',
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
const alphabetLink = document.getElementById('alphabet-link');
const alphabetModal = document.getElementById('alphabet-modal');
const closeModalBtn = document.getElementById('close-modal-btn');

let currentMode = 'morse'; 

function updateButtonState() {
    if (currentMode === 'morse') {
        morseBtn.classList.add('active');
        morseBtn.classList.remove('opacity-70');
        englishBtn.classList.remove('active');
        englishBtn.classList.add('opacity-70');
        inputTextArea.placeholder = "Enter Morse code (use . for dot, - for dash, space for letter separation, / for word separation)...";
    } else {
        englishBtn.classList.add('active');
        englishBtn.classList.remove('opacity-70');
        morseBtn.classList.remove('active');
        morseBtn.classList.add('opacity-70');
        inputTextArea.placeholder = "Enter English text...";
    }
    outputTextArea.value = ''; 
    inputTextArea.value = ''; 
}

function englishToMorse(text) {
    return text.toUpperCase().split('').map(char => {
        if (char === ' ') {
            return '/'; 
        }
        return morseCodeMap[char] || '';
    }).join(' '); 
}

function morseToEnglish(morse) {
    const words = morse.split(' / ').map(word => {
        return word.split(' ').map(code => englishCodeMap[code] || '').join('');
    });
    return words.join(' ');
}

function handleInputChange() {
    const inputText = inputTextArea.value.trim();
    if (currentMode === 'english') {
        outputTextArea.value = englishToMorse(inputText);
    } else {
        outputTextArea.value = morseToEnglish(inputText);
    }
}

morseBtn.addEventListener('click', () => {
    currentMode = 'morse';
    updateButtonState();
    handleInputChange();
});

englishBtn.addEventListener('click', () => {
    currentMode = 'english';
    updateButtonState();
    handleInputChange();
});

inputTextArea.addEventListener('input', handleInputChange);

copyBtn.addEventListener('click', () => {
    outputTextArea.select();
    document.execCommand('copy');
    const originalIcon = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fas fa-check text-green-500"></i> Copied!';
    setTimeout(() => {
        copyBtn.innerHTML = originalIcon;
    }, 1500);
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

updateButtonState();
