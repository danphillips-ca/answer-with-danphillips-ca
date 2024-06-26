// Helper Functions
function sanitizeCategoryName(category) {
    return category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function generateMediaHTML(media) {
    if (!media || media.trim() === '') return '';

    const mediaLower = media.toLowerCase();
    const isAudio = mediaLower.endsWith('.mp3') || mediaLower.endsWith('.wav');
    const isVideo = mediaLower.endsWith('.mp4') || mediaLower.endsWith('.webm');
    const isYouTube = mediaLower.includes('youtu.be') || mediaLower.includes('youtube.com') || mediaLower.includes('youtube.com/embed');

    if (isAudio) {
        return `<audio controls class="img-fluid" style="max-height: 500px;">
                    <source src="${media}" type="audio/${mediaLower.endsWith('.mp3') ? 'mpeg' : 'wav'}">
                    Your browser does not support the audio element.
                </audio>`;
    } else if (isVideo) {
        return `<video controls class="img-fluid" style="max-height: 500px;">
                    <source src="${media}" type="video/${mediaLower.endsWith('.mp4') ? 'mp4' : 'webm'}">
                    Your browser does not support the video tag.
                </video>`;
    } else if (isYouTube) {
        let videoId = null;
        if (media.includes('v=')) {
            videoId = media.split('v=')[1];
        } else if (media.includes('youtu.be/')) {
            videoId = media.split('youtu.be/')[1];
        } else if (media.includes('youtube.com/embed/')) {
            videoId = media.split('youtube.com/embed/')[1];
        }

        if (videoId) {
            const ampersandPosition = videoId.indexOf('&');
            const cleanVideoId = ampersandPosition !== -1 ? videoId.substring(0, ampersandPosition) : videoId;
            return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${cleanVideoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="img-fluid" style="max-height: 500px;"></iframe>`;
        }
    } else {
        return `<img src="${media}" alt="Media" class="img-fluid" style="max-height: 500px;" onerror="this.onerror=null;this.style.display='none';">`;
    }

    return '';
}

function showToast(title, message, type) {
    const toastContainer = document.getElementById('toast-container');
    const toastId = `toast-${Date.now()}`;
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <strong>${title}:</strong> ${message}
                </div>
                <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

function parseCSVData(data) {
    const headers = data[0];
    const questionsAndAnswers = data.slice(1);
    const triviaData = [];

    questionsAndAnswers.forEach(row => {
        const id = row[0]; // First column in each row
        const value = parseInt(id.split('-')[0]);
        const isQuestion = id.endsWith('Q');
        const isQuestionMedia = id.endsWith('QM');
        const isAnswer = id.endsWith('A');
        const isAnswerMedia = id.endsWith('AM');

        headers.slice(1).forEach((category, index) => {
            if (isQuestion || isQuestionMedia || isAnswer || isAnswerMedia) {
                let existingEntry = triviaData.find(item => item.category === category && item.value === value);

                if (!existingEntry) {
                    existingEntry = { category: category, value: value };
                    triviaData.push(existingEntry);
                }

                if (isQuestion) {
                    existingEntry.question = row[index + 1];
                } else if (isQuestionMedia) {
                    existingEntry.questionMedia = row[index + 1];
                } else if (isAnswer) {
                    existingEntry.answer = row[index + 1];
                } else if (isAnswerMedia) {
                    existingEntry.answerMedia = row[index + 1];
                }
            }
        });
    });

    return triviaData.filter(item => item.question || item.answer || item.questionMedia || item.answerMedia);
}

function createGameBoard(triviaData, headers, fileName) {
    const gameBoardContainer = document.getElementById('game-board-container');

    // Clear existing content
    gameBoardContainer.innerHTML = '';

    // Create file name header
    const fileNameHeader = document.createElement('h1');
    fileNameHeader.classList.add('file-name', 'm-2', 'text-center');
    fileNameHeader.textContent = fileName;

    // Append file name header to the game board container
    gameBoardContainer.appendChild(fileNameHeader);

    // Create game board div
    const gameBoard = document.createElement('div');
    gameBoard.classList.add('game-board', 'p-4', 'rounded');

    // Create category container
    const categoryContainer = document.createElement('div');
    categoryContainer.classList.add('row', 'mb-1', 'category-label');
    categoryContainer.id = 'category-container';
    createCategoryLabels(categoryContainer, headers);

    // Create grid container
    const gridContainer = document.createElement('div');
    gridContainer.id = 'grid-container';
    createGrid(triviaData, gridContainer);

    // Append category and grid containers to game board
    gameBoard.appendChild(categoryContainer);
    gameBoard.appendChild(gridContainer);

    // Append game board to the main container
    gameBoardContainer.appendChild(gameBoard);
}

function createCategoryLabels(categoryContainer, headers) {
    headers.slice(1).forEach((category, index) => {
        const categoryCard = `
            <div class="col-3 p-2">
                <div class="card">
                    <div class="card-body card-category" id="category${index + 1}">${category}</div>
                </div>
            </div>
        `;
        categoryContainer.innerHTML += categoryCard;
    });
}

function createGrid(triviaData, gridContainer) {
    const uniqueValues = [...new Set(triviaData.map(item => item.value))].sort((a, b) => a - b);
    const uniqueCategories = [...new Set(triviaData.map(item => item.category))];

    uniqueValues.forEach(value => {
        const row = document.createElement('div');
        row.classList.add('row', 'mt-md-2');
        
        uniqueCategories.forEach((category) => {
            const sanitizedCategory = sanitizeCategoryName(category);
            const card = `
                <div class="col-3 p-2">
                    <a href="#" data-bs-toggle="modal" data-bs-target="#${sanitizedCategory}-${value}" onclick="changeColor(this)">
                        <div class="card">
                            <div class="card-body card-value">${value}</div>
                        </div>
                    </a>
                </div>
            `;
            row.innerHTML += card;
        });

        gridContainer.appendChild(row);
    });
}

function createModals(triviaData) {
    const container = document.getElementById('modals-container');
    container.innerHTML = ''; // Clear existing modals

    triviaData.forEach(item => {
        const sanitizedCategory = sanitizeCategoryName(item.category);

        if (item.question) {
            const questionMediaHTML = item.questionMedia ? generateMediaHTML(item.questionMedia) : '';
            const questionModal = `
                <div class="modal fade" id="${sanitizedCategory}-${item.value}" tabindex="-1" aria-labelledby="trivia-question" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3 class="modal-title">Question</h3>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p>${item.question}</p>
                                ${questionMediaHTML}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#${sanitizedCategory}-${item.value}A">Reveal Answer</button>
                            </div>
                        </div>
                    </div>
                </div>`;
            container.innerHTML += questionModal;
        }

        if (item.answer) {
            const answerMediaHTML = item.answerMedia ? generateMediaHTML(item.answerMedia) : '';
            const answerModal = `
                <div class="modal fade" id="${sanitizedCategory}-${item.value}A" tabindex="-1" aria-labelledby="trivia-answer" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3 class="modal-title">Answer</h3>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <p>${item.answer}</p>
                                ${answerMediaHTML}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                </div>`;
            container.innerHTML += answerModal;
        }
    });

    document.querySelectorAll('.modal').forEach(modal => {
        new bootstrap.Modal(modal);
    });
}

function closeAlertBox() {
    const alert = document.querySelector('.alert');
    const image = document.querySelector('.peek-image');
    if (alert) {
        alert.style.display = 'none';
    }
    if (image) {
        image.style.display = 'none';
    }
}

function changeColor(element) {
    element.querySelector('.card-body').style.color = '#807A55';
}

function resetColor(element) {
    let cardBodies = element.querySelectorAll('.card-body');
    cardBodies.forEach(cardBody => {
        cardBody.style.color = '';  // Removing the inline style to reset to default color
    });
}


function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.type === "text/csv" || file.name.endsWith('.csv')) {
            window.selectedFile = file;
            showToast("Ready to load your game", file.name.replace('.csv', ''), "info");
        } else {
            showToast("Error", "Please select a CSV file.", "danger");
        }
    } else {
        showToast("Error", "No file selected.", "danger");
    }
}


function handleFile() {
    const file = window.selectedFile;
    if (file) {
        loadCSV(file);
    } else {
        showToast("Error", "Please select a CSV file.", "danger");
    }
}

function loadSample(filePath) {
    console.log(`Attempting to load sample file from: ${filePath}`);
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(csvText => {
            console.log("Fetched CSV Text:", csvText);
            const fileName = filePath.split('/').pop().replace('.csv', '');
            const parsedData = Papa.parse(csvText, { header: false }).data;
            parseAndLoadCSV(parsedData, fileName);
        })
        .catch(error => {
            console.error("Error fetching sample CSV file:", error);
            showToast("Error", "An error occurred while fetching the sample CSV file.", "danger");
        });
}


function loadCSV(file) {
    Papa.parse(file, {
        header: false,
        complete: function(results) {
            parseAndLoadCSV(results.data, file.name.replace('.csv', ''));
        },
        error: function(error) {
            showToast("Error", "An error occurred while parsing the CSV file.", "danger");
        }
    });
}

function parseAndLoadCSV(data, fileName) {
    const triviaData = parseCSVData(data);
    if (triviaData.length) {
        createGameBoard(triviaData, data[0], fileName);
        createModals(triviaData);
        showToast("File Loaded", "The file has been successfully loaded.", "success");
        closeAlertBox();
    } else {
        showToast("Error", "Parsed data is empty or malformed.", "danger");
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.alert .close').forEach(button => {
        button.addEventListener('click', function() {
            const alert = this.closest('.alert');
            const image = document.querySelector('.peek-image');
            alert.classList.add('fade');
            setTimeout(() => {
                alert.style.display = 'none';
                if (image) {
                    image.style.display = 'none';
                }
                alert.classList.remove('fade'); // Remove fade class after hiding
            }, 500); // Fade out duration
        });
    });

    document.getElementById('csvFileInput').addEventListener('change', handleFileSelect, false);
});

function toggleFullscreen() {
    var navbarCollapse = document.getElementById('navbarNav');
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
    if (navbarCollapse.classList.contains('show')) {
        var bsCollapse = new bootstrap.Collapse(navbarCollapse, {
            toggle: false
        });
        bsCollapse.hide();
    }
}