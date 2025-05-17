const queue = [];

const processQueue = async () => {
    if (queue.length === 0) return;

    const job = queue.shift();
    try {
        await job();
    } catch (error) {
        console.error('Error processing user activity job:', error);
    }

    // Continue processing next
    setTimeout(processQueue, 10);
};

const addJob = (job) => {
    queue.push(job);
    if (queue.length === 1) {
        processQueue();
    }
};

module.exports = { addJob };
