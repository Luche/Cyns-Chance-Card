// Select elements for feedback and input
const readButton = document.getElementById('readButton');
const deductButton = document.getElementById('deductButton');
const addButton = document.getElementById('addButton');
const pointsInput = document.getElementById('pointsInput');
const infoDiv = document.getElementById('info');
const errorDiv = document.getElementById('error');
const balDiv = document.getElementById('balanceDisplay');
const trDiv = document.getElementById('transactionHistory');

// Select elements for feedback and input
const balanceDisplay = document.getElementById('currentBalance');
const transactionList = document.getElementById('transactionList');

// Automatically update the year dynamically
const year = new Date().getFullYear();
document.getElementById('currentYear').textContent = year;

balDiv.classList.add('d-none');
trDiv.classList.add('d-none');

// Clear messages
const clearMessages = () => {
    infoDiv.textContent = '';
    errorDiv.textContent = '';
    infoDiv.classList.add('d-none');
    errorDiv.classList.add('d-none');
    // balanceDisplay.textContent = '-';  // Clear balance display
};

// Update information to the user
const showMessage = (message, isError = false) => {
    if (isError) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none'); // Remove 'd-none' to show alert
        errorDiv.classList.add('show'); // Bootstrap's show class for visibility
    } else {
        infoDiv.textContent = message;
        infoDiv.classList.remove('d-none'); // Remove 'd-none' to show alert
        infoDiv.classList.add('show'); // Bootstrap's show class for visibility
    }
};

// Function to read NFC card balance and transaction history
const readBalance = async () => {
    clearMessages();
    balDiv.classList.add('d-none');
    trDiv.classList.add('d-none');
    transactionList.innerHTML = '';  // Clear transaction list

    try {
        if ('NDEFReader' in window) {
            console.log('NDEFReader is supported.');
            const ndef = new NDEFReader();
            showMessage('Scanning NFC tag...');

            // Remove existing event listeners to avoid unwanted behavior
            ndef.onreading = null;
            ndef.onreadingerror = null;

            // Create an AbortController to manage the abort signal
            const controller = new AbortController();
            const signal = controller.signal;
            const timeoutDuration = 8000; // 8 seconds

            // Set a timeout to abort the scan after 8 seconds
            const timeoutId = setTimeout(() => {
                console.log('Timeout reached, aborting NFC scan.');
                controller.abort(); // Abort the scan
                clearMessages();
                showMessage('Scanning timed out. Please try again.', true);
            }, timeoutDuration);

            // Start scanning with abort signal
            await ndef.scan({ signal });

            ndef.onreading = (event) => {
                clearTimeout(timeoutId); // Clear timeout if reading is successful
                showMessage('Reading NFC tag...');
                clearMessages();
                const message = event.message;
                let balance = -1;
                let transactionHistory = [];
                transactionList.innerHTML = '';
                for (const record of message.records) {
                    const textDecoder = new TextDecoder(record.encoding);
                    const cardData = textDecoder.decode(record.data);

                    if (record.id === "balance") {
                        balance = parseInt(cardData);  // Get balance
                    } else if (record.id.startsWith("transaction")) {
                        transactionHistory.push(cardData);  // Collect transaction records
                    }
                }
                balDiv.classList.remove('d-none'); // Remove 'd-none' to show alert
                balDiv.classList.add('show'); // Bootstrap's show class for visibility
                trDiv.classList.remove('d-none'); // Remove 'd-none' to show alert
                trDiv.classList.add('show'); // Bootstrap's show class for visibility

                // Display balance
                if(balance > 1)
                    balanceDisplay.textContent = `${balance} chances`;
                else 
                    balanceDisplay.textContent = `${balance} chance`;

                // Display transaction history if available
                if (transactionHistory.length > 0) {
                    transactionHistory.forEach((entry, index) => {
                        const listItem = document.createElement('li');
                        listItem.textContent = entry;
                        listItem.classList.add('list-group-item');
                        transactionList.appendChild(listItem);
                    });
                } else {
                    const emptyMessage = document.createElement('li');
                    emptyMessage.textContent = 'No transaction history available.';
                    emptyMessage.classList.add('list-group-item');
                    transactionList.appendChild(emptyMessage);
                }
                ndef.onreading = null;
                clearMessages();
            };

        } else {
            showMessage('Web NFC is not supported on this device.', true);
        }

    } catch (error) {
        console.error('Error during NFC scan:', error);
        showMessage(`Error: ${error.message}`, true);
    }
};

const deductOnePoint = async () => {
    clearMessages();
    balDiv.classList.add('d-none');
    trDiv.classList.add('d-none');

    transactionList.innerHTML = '';
    try {
        if ('NDEFReader' in window) {
            const ndef = new NDEFReader();
            showMessage('Scanning NFC tag...');

            // Create an AbortController to manage the abort signal
            const controller = new AbortController();
            const signal = controller.signal;
            const timeoutDuration = 8000; // 8 seconds

            // Set a timeout to abort the scan after 8 seconds
            const timeoutId = setTimeout(() => {
                console.log('Timeout reached, aborting NFC scan.');
                controller.abort(); // Abort the scan
                clearMessages();
                showMessage('Scanning timed out. Please try again.', true);
            }, timeoutDuration);

            // Start scanning with abort signal
            await ndef.scan({ signal });

            ndef.onreading = async (event) => {
                clearTimeout(timeoutId); // Clear timeout if reading is successful
                const message = event.message;
                let balance = -1;
                let transactionRecords = [];
                transactionList.innerHTML = '';

                showMessage('Reading NFC tag...');
                for (const record of message.records) {
                    const textDecoder = new TextDecoder(record.encoding);
                    const cardData = textDecoder.decode(record.data);

                    if (record.id === "balance") {
                        balance = parseInt(cardData);
                    } else if (record.id.startsWith("transaction")) {
                        transactionRecords.push(cardData);  // Collect existing transaction history
                    }
                }

                if (balance > 0) {
                    // Deduct the balance by 1
                    balance -= 1;

                    // Create a new transaction record
                    const now = new Date();

                    const year = now.getFullYear();     // Extract the year
                    const monthIndex = now.getMonth();   // Extract the month (Note: Months are 0-indexed, so add 1)
                    const day = now.getDate();          // Extract the day of the month

                    // Array of month names
                    const monthNames = [
                        "January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"
                    ];
                    
                    // Get the month name from the array
                    const month = monthNames[monthIndex];
                    const transaction = `-1 chance on ${day} ${month} ${year}`;

                    // Add the new transaction record to the NFC tag
                    transactionRecords.unshift(transaction);

                    // Write updated balance and all transaction records back to the NFC card
                    const balanceRecord = {
                        recordType: "text",
                        id: "balance", // Balance record
                        data: new TextEncoder().encode(balance.toString())
                    };

                    // transactionRecords.reverse();
                    transactionRecords = transactionRecords.slice(0, 10);

                    // Create individual records for each transaction
                    const transactionRecordsToWrite = transactionRecords.map((entry, index) => ({
                        recordType: "text",
                        id: `transaction-${Date.now()}`, // Unique ID for each transaction
                        data: new TextEncoder().encode(entry)
                    }));

                    await ndef.write({
                        records: [balanceRecord, ...transactionRecordsToWrite]  // Write all records
                    });

                    showMessage(`1 point deducted. New balance: ${balance}`);

                    balDiv.classList.remove('d-none'); // Remove 'd-none' to show alert
                    balDiv.classList.add('show'); // Bootstrap's show class for visibility
                    trDiv.classList.remove('d-none'); // Remove 'd-none' to show alert
                    trDiv.classList.add('show'); // Bootstrap's show class for visibility

                    // Display balance
                    if(balance > 1)
                        balanceDisplay.textContent = `${balance} chances`;
                    else 
                        balanceDisplay.textContent = `${balance} chance`;

                    // Display transaction history if available
                    if (transactionRecords.length > 0) {
                        transactionRecords.forEach((entry, index) => {
                            const listItem = document.createElement('li');
                            listItem.textContent = entry;
                            listItem.classList.add('list-group-item');
                            transactionList.appendChild(listItem);
                        });
                    } else {
                        const emptyMessage = document.createElement('li');
                        emptyMessage.textContent = 'No transaction history available.';
                        emptyMessage.classList.add('list-group-item');
                        transactionList.appendChild(emptyMessage);
                    }
                } else {
                    showMessage('Insufficient balance to deduct', true);
                }
                ndef.onreading = null;
                // clearMessages();
            };

        } else {
            showMessage('Web NFC is not supported on this device.', true);
        }

    } catch (error) {
        showMessage(`Error: ${error.message}`, true);
    }
};


// Function to add custom points to an NFC card (can also initialize a new card)
const addCustomPoints = async () => {
    clearMessages();

    // Get the number of points to add
    const pointsToAdd = parseInt(pointsInput.value);
    if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
        showMessage('Please enter a valid number of points.', true);
        return;
    }

    try {
        if ('NDEFReader' in window) {
            const ndef = new NDEFReader();
            showMessage('Scanning NFC tag...');

            // Create an AbortController to manage the abort signal
            const controller = new AbortController();
            const signal = controller.signal;
            const timeoutDuration = 8000; // 8 seconds

            // Set a timeout to abort the scan after 8 seconds
            const timeoutId = setTimeout(() => {
                console.log('Timeout reached, aborting NFC scan.');
                controller.abort(); // Abort the scan
                clearMessages();
                showMessage('Scanning timed out. Please try again.', true);
            }, timeoutDuration);

            // Start scanning with abort signal
            await ndef.scan({ signal });

            ndef.onreading = async (event) => {
                clearTimeout(timeoutId); // Clear timeout if reading is successful
                // showMessage('Reading NFC tag...');
                const message = event.message;
                let balance = pointsToAdd; // Default initial balance
                
                // let balanceFound = false;

                // // Loop through existing records on the card
                // for (const record of message.records) {
                //     if (record.recordType === "text" && record.id === "balance") {
                //         const textDecoder = new TextDecoder(record.encoding);
                //         const cardData = textDecoder.decode(record.data);
                //         balance = parseInt(cardData); // Existing balance found
                //         balanceFound = true;
                //         break;
                //     }
                // }

                // // If no balance found, we initialize it with the custom points input
                // if (!balanceFound) {
                //     showMessage('No previous balance found, initializing new balance...');
                //     balance = pointsToAdd;
                // } else {
                //     // Add custom points to the existing balance
                //     balance += pointsToAdd;
                // }

                // Create a new transaction record
                const now = new Date();

                const year = now.getFullYear();     // Extract the year
                const monthIndex = now.getMonth();   // Extract the month (Note: Months are 0-indexed, so add 1)
                const day = now.getDate();          // Extract the day of the month

                // Array of month names
                const monthNames = [
                    "January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"
                ];
                
                // Get the month name from the array
                const month = monthNames[monthIndex];
                const transaction = `+${balance} chances on ${day} ${month} ${year}`;

                // Create individual records for each transaction
                const transactionRecordsToWrite = {
                    recordType: "text",
                    id: `transaction-${Date.now()}`, // Unique ID for each transaction
                    data: new TextEncoder().encode(transaction)
                };

                // Prepare the new balance record
                const newBalanceRecord = {
                    recordType: "text",
                    id: "balance",
                    data: new TextEncoder().encode(balance.toString())
                };

                // Write updated balance back to the NFC card
                await ndef.write({ records: [newBalanceRecord, transactionRecordsToWrite] });
                showMessage(`Successfully update balance: ${balance}`);

                // Reset the event listener after operation is done
                ndef.onreading = null;
            };

        } else {
            showMessage('Web NFC is not supported on this device.', true);
        }

    } catch (error) {
        showMessage(`Error: ${error.message}`, true);
    }
};

// Attach event listeners to buttons
readButton.onclick = readBalance;
deductButton.onclick = deductOnePoint;
addButton.onclick = addCustomPoints;
