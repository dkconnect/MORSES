const morseCode = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....',
    'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.',
    'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', ' ': ' '
};

const reverseMorse = Object.fromEntries(
    Object.entries(morseCode).map(([k, v]) => [v, k])
);

const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const buttons = document.querySelectorAll('.select-button');
const copyButton = document.querySelector('.copy-button');
const toast = document.getElementById('toast');

let currentMode = 'morse';

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

function toggleMode(mode) {
    buttons.forEach(button => {
        button.classList.toggle('active', button.dataset.mode === mode);
    });
    currentMode = mode;
    inputText.placeholder = mode === 'morse' ? 'Enter Morse code (e.g., .... . .-.. .-.. ---)' : 'Enter English text (e.g., HELLO)';
    inputText.value = '';
    outputText.style.opacity = '0';
    outputText.value = '';
    setTimeout(() => {
        outputText.style.opacity = '1';
    }, 300);
}

function convertText() {
    outputText.style.opacity = '0';
    outputText.value = '';
    const input = inputText.value.toUpperCase().trim();
    let output = '';

    if (currentMode === 'english') {
        if (/^[A-Z0-9\s]*$/.test(input) && input !== '') {
            output = input
                .split('')
                .map(char => morseCode[char] || '')
                .join(' ');
        } else if (input !== '') {
            output = 'Invalid input: Use letters, numbers, or spaces only.';
            showToast(output, 'error');
        }
    } else {
        const morseWords = input.split('  ');
        const validMorse = /^[-.\/\s]*$/.test(input);
        if (validMorse && input !== '') {
            output = morseWords
                .map(word => {
                    return word
                        .split(' ')
                        .map(code => reverseMorse[code] || '')
                        .join('');
                })
                .join(' ');
            if (output.includes('')) {
                output = 'Invalid Morse code: Ensure correct dot/dash sequences.';
                showToast(output, 'error');
            }
        } else if (input !== '') {
            output = 'Invalid input: Use dots (.), dashes (-), spaces, or slashes (/) only.';
            showToast(output, 'error');
        }
    }

    outputText.value = output;
    setTimeout(() => {
        outputText.style.opacity = '1';
    }, 300);
}

function copyToClipboard() {
    if (outputText.value && !outputText.value.startsWith('Invalid')) {
        navigator.clipboard.writeText(outputText.value).then(() => {
            copyButton.style.color = '#fff';
            copyButton.style.backgroundColor = '#4CAF50';
            showToast('Copied to clipboard!');
            setTimeout(() => {
                copyButton.style.color = '#ccc';
                copyButton.style.backgroundColor = '#333';
            }, 1000);
        }).catch(() => {
            showToast('Failed to copy text.', 'error');
        });
    } else {
        showToast('Nothing to copy!', 'error');
    }
}

buttons.forEach(button => {
    button.addEventListener('click', () => toggleMode(button.dataset.mode));
});

inputText.addEventListener('input', convertText);
copyButton.addEventListener('click', copyToClipboard);

// Initialize
toggleMode('morse');
