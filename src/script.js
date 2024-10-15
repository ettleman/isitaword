// src/script.js

const wordInput = document.getElementById('word-input');
const resultDiv = document.getElementById('result');
const definitionDiv = document.getElementById('definition');
const exploreButton = document.getElementById('explore-button');
const checkUdButton = document.getElementById('check-ud-button'); // New button for UD

let wordFoundInStandardDictionary = false;
let wordFoundInUrbanDictionary = false;

// Function to get the word from the URL
function getWordFromURL() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(segment => segment.length > 0);
    return segments[0] ? decodeURIComponent(segments[0]) : '';
}

// Function to update the URL without reloading the page
function updateURL(word) {
    const newURL = word ? `${window.location.origin}/${encodeURIComponent(word)}` : `${window.location.origin}/`;
    window.history.pushState({ path: newURL }, '', newURL);
}

// Function to initialize the page based on URL
function initializePage() {
    const wordFromURL = getWordFromURL();
    if (wordFromURL) {
        wordInput.value = wordFromURL;
        fetchDefinitions(wordFromURL);
    }
}

// Event listener for input changes
wordInput.addEventListener('input', () => {
    const word = wordInput.value.trim().toLowerCase();

    // Update the URL as the user types
    updateURL(word);

    // Hide UD definitions immediately when user types
    hideUrbanDictionary(); // Hide UD definitions

    if (word.length === 0) {
        clearResults();
        return;
    }

    // Fetch all definitions from Dictionary.com
    fetchDefinitions(word);
});

// Function to fetch definitions from the standard dictionary
function fetchDefinitions(word) {
    wordFoundInStandardDictionary = false;
    wordFoundInUrbanDictionary = false;
    definitionDiv.innerHTML = ''; // Clear previous definitions
    checkUdButton.style.display = 'none'; // Hide UD check button initially
    showLoading(); // Show loading indicator

    // Fetch from the standard dictionary
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        .then(response => {
            if (response.ok) {
                wordFoundInStandardDictionary = true;
                document.body.style.backgroundColor = '#d4edda'; // Light Green
                resultDiv.textContent = 'Yep!';
                exploreButton.style.display = 'inline-block';
                exploreButton.onclick = () => {
                    window.open(`https://www.dictionary.com/browse/${word}`, '_blank');
                };
                return response.json();
            } else {
                throw new Error('Word not found in standard dictionary');
            }
        })
        .then(data => {
            displayStandardDefinitions(data);
            checkUdButton.style.display = 'block'; // Show the button to check UD
        })
        .catch(error => {
            console.log(error.message);
            if (!wordFoundInStandardDictionary) {
                document.body.style.backgroundColor = '#f8d7da'; // Light Red
                resultDiv.textContent = 'No.';
                exploreButton.style.display = 'none';
                hideUrbanDictionary(); // Hide UD definitions
            }
            checkUdButton.style.display = 'block'; // Show the button even if the result is 'No'
        })
        .finally(() => {
            hideLoading(); // Hide loading after fetching
        });
}

// Event listener for the Urban Dictionary button
checkUdButton.addEventListener('click', () => {
    const word = wordInput.value.trim().toLowerCase();
    if (word.length === 0) {
        return; // No word to update
    }

    // Load and display Urban Dictionary definitions
    fetchUrbanDictionary(word);
});

// Function to fetch Urban Dictionary definitions
function fetchUrbanDictionary(word) {
    return fetch(`https://api.urbandictionary.com/v0/define?term=${word}`)
        .then(response => response.json())
        .then(data => {
            const udDefinitionDiv = document.getElementById('ud-definition');
            if (data.list && data.list.length > 0) {
                wordFoundInUrbanDictionary = true;
                displayUrbanDefinitions(data);
            } else {
                wordFoundInUrbanDictionary = false; // No UD definitions found
                udDefinitionDiv.innerHTML = '<p>Nothing found on Urban Dictionary.</p>'; // Display message
                udDefinitionDiv.style.display = 'block'; // Ensure the div is visible
            }
        })
        .catch(error => {
            console.error('Error fetching Urban Dictionary definition:', error);
            const udDefinitionDiv = document.getElementById('ud-definition');
            udDefinitionDiv.innerHTML = '<p>Unable to fetch Urban Dictionary results.</p>'; // Display error message
            udDefinitionDiv.style.display = 'block'; // Ensure the div is visible
        });
}

// Function to clear results
function clearResults() {
    document.body.style.backgroundColor = '';
    resultDiv.textContent = 'Is It A Word?';
    definitionDiv.innerHTML = ''; // Clear previous definitions
    exploreButton.style.display = 'none';
    checkUdButton.style.display = 'none'; // Hide UD check button
}

// Function to hide Urban Dictionary definitions
function hideUrbanDictionary() {
    const urbanHeader = definitionDiv.querySelector('h3:nth-of-type(2)');
    const urbanCards = Array.from(definitionDiv.children).filter(child =>
        child.classList.contains('definition-card') && child.querySelector('h4').textContent.includes('Slang')
    );

    if (urbanHeader) {
        urbanHeader.style.display = 'none'; // Hide the header
        urbanCards.forEach(card => card.style.display = 'none'); // Hide all Urban Dictionary cards
    }

    // Also hide the UD definitions div if you are using it
    document.getElementById('ud-definition').style.display = 'none'; // Ensure UD div is hidden
}

// Function to display standard dictionary definitions
function displayStandardDefinitions(data) {
    const meanings = data[0].meanings;
    let definitionsHTML = ``;

    meanings.forEach(meaning => {
        const partOfSpeech = capitalizeFirstLetter(meaning.partOfSpeech);
        const definitionText = sanitizeDefinition(meaning.definitions[0].definition);
        definitionsHTML += `
            <div class="definition-card">
                <h4>${partOfSpeech}</h4>
                <p>${definitionText}</p>
            </div>
        `;
    });

    definitionDiv.innerHTML += definitionsHTML;
}

// Function to display Urban Dictionary definitions
function displayUrbanDefinitions(data) {
    let definitionsHTML = ``; // Initially visible

    // Limit to first 3 definitions to avoid clutter
    data.list.slice(0, 3).forEach(item => {
        const sanitizedDefinition = sanitizeDefinition(item.definition);
        definitionsHTML += `
            <div class="definition-card" style="background-colour: black; color: white; margin: 15px 0 15px 0;">  <!-- Initially visible -->
                <h4 style="color:red;">Slang</h4>
                <p>${sanitizedDefinition}</p>
            </div>
        `;
    });

    // Show UD definitions
    document.getElementById('ud-definition').innerHTML = definitionsHTML; // Append the definitions
    document.getElementById('ud-definition').style.display = 'block'; // Show the UD definitions div
}

// Function to show loading indicator
function showLoading() {
    // Create loading element if it doesn't exist
    if (!document.getElementById('loading')) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading';
        loadingDiv.textContent = 'Thinking...';
        loadingDiv.style.fontSize = '1.2em';
        loadingDiv.style.color = '#555';
        loadingDiv.style.textAlign = 'center';
        loadingDiv.style.marginTop = '20px';
        definitionDiv.appendChild(loadingDiv);
    } else {
        document.getElementById('loading').style.display = 'block';
    }

    // Change the background to grey while loading
    document.body.style.backgroundColor = '#d3d3d3'; // Grey
    resultDiv.textContent = 'Thinking...';
    exploreButton.style.display = 'none';
}

// Function to hide loading indicator
function hideLoading() {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
    // Restore background color based on word existence
    if (wordFoundInStandardDictionary || wordFoundInUrbanDictionary) {
        document.body.style.backgroundColor = '#d4edda'; // Light Green
    } else {
        document.body.style.backgroundColor = '#f8d7da'; // Light Red
    }
}

// Function to sanitize definitions by removing square brackets
function sanitizeDefinition(definition) {
    // Remove square brackets
    return definition.replace(/\[/g, '').replace(/\]/g, '');
}

// Function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Initialize the page on load
window.addEventListener('DOMContentLoaded', initializePage);

// Handle browser's back and forward navigation
window.addEventListener('popstate', () => {
    initializePage();
});