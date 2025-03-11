// Import the 'v4' method from the 'uuid' library which generates random UUIDs
const { v4: uuidv4 } = require('uuid');

// Function to generate a random UUID
function generateUUID() {
    return uuidv4();
}


exports.generateUUID = generateUUID;
