// Constants
const API_CONFIG = {
    chatflowid: "3c63eb07-0c84-4aa7-8b1a-50f5dd13139b",
    apiHost: "https://johntan777-flowwise.hf.space"
};

// DOM Elements
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const chatContainer = document.getElementById('chat-container');
const submitButton = chatForm.querySelector('.submit-btn');

// Event Listeners
chatForm.addEventListener('submit', handleSubmit);

async function handleSubmit(event) {
    event.preventDefault();
    const message = userInput.value.trim();

    if (!message) return;

    // Display user message
    addMessage('user', message);

    // Clear input and disable
    userInput.value = '';
    userInput.disabled = true;
    submitButton.disabled = true;
    loadingElement.classList.remove('hidden');

    try {
        const response = await fetch(`${API_CONFIG.apiHost}/api/v1/prediction/${API_CONFIG.chatflowid}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: message
            })
        });

        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        addMessage('ai', data.text || data.answer || 'No response from AI');
        
    } catch (error) {
        console.error('Error:', error);
        errorElement.textContent = 'Failed to get response. Please try again.';
        errorElement.classList.remove('hidden');
        setTimeout(() => errorElement.classList.add('hidden'), 5000);
    } finally {
        userInput.disabled = false;
        submitButton.disabled = false;
        loadingElement.classList.add('hidden');
        userInput.focus();
    }
}

async function fetchRecipes(ingredients) {
    const response = await fetch(`${API_CONFIG.apiHost}/api/v1/prediction/${API_CONFIG.chatflowid}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            question: `Generate 3 recipe suggestions using these ingredients: ${ingredients}. 
                      Format the response as JSON with title, ingredients list, and numbered steps.`,
            history: []
        })
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return parseAIResponse(data);
}

function parseAIResponse(aiResponse) {
    try {
        // The actual parsing logic will depend on the AI's response format
        // This is a simplified example assuming the AI returns properly formatted JSON
        const responseText = aiResponse.text || aiResponse.answer || '';
        
        // Try to parse if it's already JSON
        try {
            return JSON.parse(responseText);
        } catch {
            // If not JSON, try to parse the text response
            return parseTextResponse(responseText);
        }
    } catch (error) {
        console.error('Error parsing AI response:', error);
        return [];
    }
}

function parseTextResponse(text) {
    const recipes = [];
    const recipeBlocks = text.split(/Recipe \d+:|(?=Title:)/);

    recipeBlocks.forEach(block => {
        if (!block.trim()) return;

        const titleMatch = block.match(/Title:\s*([^\n]+)/);
        const ingredientsMatch = block.match(/Ingredients:\s*([\s\S]*?)(?=Steps:|Instructions:|$)/);
        const stepsMatch = block.match(/(?:Steps|Instructions):\s*([\s\S]*?)(?=(?:Recipe \d+:|$))/);

        if (titleMatch) {
            const recipe = {
                title: titleMatch[1].trim(),
                ingredients: [],
                steps: []
            };

            if (ingredientsMatch) {
                recipe.ingredients = ingredientsMatch[1]
                    .split('\n')
                    .map(i => i.trim())
                    .filter(Boolean);
            }

            if (stepsMatch) {
                recipe.steps = stepsMatch[1]
                    .split(/\d+\.\s*/)
                    .map(s => s.trim())
                    .filter(Boolean);
            }

            recipes.push(recipe);
        }
    });

    return recipes;
}

function addMessage(type, content) {
    const messageElement = document.createElement('article');
    messageElement.className = `chat-message ${type}-message`;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
        <div class="chat-avatar ${type}-avatar">${type === 'user' ? 'You' : 'AI'}</div>
        <div class="message-content">
            <p>${escapeHtml(content)}</p>
            <div class="message-time">${timeString}</div>
        </div>
    `;
    
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function createRecipeCard(recipe, timeString) {
    return `
        <div class="chat-avatar ai-avatar">AI</div>
        <div class="message-content">
            <h3>${escapeHtml(recipe.title)}</h3>
            <div class="recipe-content">
                <div class="ingredients">
                    <h4>Here's what you'll need:</h4>
                    <ul>
                        ${recipe.ingredients.map(ingredient => 
                            `<li>${escapeHtml(ingredient)}</li>`
                        ).join('')}
                    </ul>
                </div>
                <div class="steps">
                    <h4>Follow these steps:</h4>
                    <ol>
                        ${recipe.steps.map(step => 
                            `<li>${escapeHtml(step)}</li>`
                        ).join('')}
                    </ol>
                </div>
            </div>
            <div class="message-time">${timeString}</div>
        </div>
    `;
    return card;
}

// Utility Functions
function showLoading(isLoading) {
    loadingElement.classList.toggle('hidden', !isLoading);
    submitButton.disabled = isLoading;
    buttonText.textContent = isLoading ? 'Finding Recipes...' : 'Get Recipes';
    loadingSpinner.classList.toggle('hidden', !isLoading);
}

function showError(message) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 5000);
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function clearResults() {
    while (chatContainer.firstChild) {
        chatContainer.removeChild(chatContainer.firstChild);
    }
    errorElement.classList.add('hidden');
}

function escapeHtml(unsafe) {
    const div = document.createElement('div');
    div.textContent = unsafe;
    return div.innerHTML;
}
