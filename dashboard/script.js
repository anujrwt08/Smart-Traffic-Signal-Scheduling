const names = ["North", "South", "East", "West"];
const inputIds = ["northInput", "southInput", "eastInput", "westInput"];
const carColors = ["#38bdf8", "#34d399", "#fbbf24", "#f43f5e"];
const DEFAULTS = [30, 20, 10, 5];

let queues = [...DEFAULTS];
let waiting = [0, 0, 0, 0];
let servedByLane = [0, 0, 0, 0];
let servedTotal = 0;
let rounds = 0;
let busy = false;
let runningAll = false;
let maxQueue = 30;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const $ = id => document.getElementById(id);
const totalWaiting = () => queues.reduce((sum, n) => sum + n, 0);

function setMessage(message) {
    const el = $("decisionMessage");
    if (el) el.textContent = message;
}

function setBusy(value) {
    busy = value;
    ["nextBtn", "applyBtn", "resetBtn"].forEach(id => {
        const el = $(id);
        if (el) el.disabled = value;
    });

    const runBtn = $("runBtn");
    if (runBtn) {
        if (runningAll) {
            runBtn.disabled = false;
            runBtn.textContent = "Pause simulation";
        } else {
            runBtn.disabled = value;
            runBtn.textContent = "Run full simulation";
        }
    }

    const stateEl = $("simulationState");
    if (stateEl) {
        stateEl.textContent = value
            ? (runningAll ? "Running" : "Processing")
            : (totalWaiting() === 0 && rounds > 0 ? "Complete" : "Ready");
    }
}

function setStatus(text, state) {
    const statusEl = $("systemStatus");
    if (statusEl) statusEl.textContent = text;
    const dot = document.querySelector(".status-dot");
    if (dot) {
        dot.classList.remove("online", "offline");
        if (state) dot.classList.add(state);
    }
}

function render() {
    const waitingCount = totalWaiting();
    $("totalVehicles").textContent = waitingCount;
    $("servedVehicles").textContent = servedTotal;
    $("roundCount").textContent = rounds;

    if (waitingCount === 0 && rounds > 0) {
        $("activeDirection").textContent = "Complete";
    } else if (rounds === 0) {
        $("activeDirection").textContent = "None";
    }

    queues.forEach((count, index) => {
        const qEl = $(`queue${index}`);
        const mEl = $(`mapCount${index}`);
        const barEl = $(`bar${index}`);

        if (qEl) qEl.textContent = count;
        if (mEl) mEl.textContent = count;
        if (barEl) {
            const percent = maxQueue > 0 ? (count / maxQueue) * 100 : 0;
            barEl.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
    });
}

function updateSignals(activeIndex = -1) {
    names.forEach((_, index) => {
        ["red", "yellow", "green"].forEach(color => {
            $(`${color}${index}`)?.classList.remove("active");
        });
        const color = index === activeIndex ? "green" : "red";
        $(`${color}${index}`)?.classList.add("active");
    });
}

function clearDecision() {
    $("historyList").innerHTML = '<div class="empty-history">No scheduling rounds yet.</div>';
    $("decisionDirection").textContent = "Waiting for first round";
    $("priorityScore").textContent = "—";
    $("greenDuration").textContent = "—";
    $("roundServed").textContent = "—";
    $("activeDirection").textContent = "None";
    $("vehicleLayer").innerHTML = "";
}

function addHistory(direction, priority, greenTime, count) {
    const list = $("historyList");
    list.querySelector(".empty-history")?.remove();

    const entry = document.createElement("div");
    entry.className = "history-entry";

    const number = document.createElement("div");
    number.className = "history-number";
    number.textContent = `#${rounds}`;

    const detail = document.createElement("div");
    detail.className = "history-detail";
    const title = document.createElement("strong");
    title.textContent = `${direction} road`;
    const description = document.createElement("small");
    description.textContent = `Priority ${priority}, green for ${greenTime}s`;
    detail.append(title, description);

    const served = document.createElement("em");
    served.textContent = `${count} cleared`;

    entry.append(number, detail, served);
    list.prepend(entry);
}

function readInputs() {
    return inputIds.map(id => {
        const input = $(id);
        const value = Number(input.value);
        if (input.value.trim() === "" || !Number.isInteger(value) || value < 0 || value > 10000) {
            throw new Error("Enter a whole number between 0 and 10000 for every direction.");
        }
        return value;
    });
}

async function checkApi() {
    try {
        const response = await fetch("/api/health");
        if (!response.ok) throw new Error("API unavailable");
        setStatus("C engine connected", "online");
        return true;
    } catch (error) {
        setStatus("API connection failed", "offline");
        setMessage("The Python API could not be reached. Start the server with: py api\\app.py");
        return false;
    }
}

async function applyInputs() {
    if (busy) return;

    try {
        const values = readInputs();
        queues = [...values];
        waiting = [0, 0, 0, 0];
        servedByLane = [0, 0, 0, 0];
        servedTotal = 0;
        rounds = 0;
        maxQueue = Math.max(...queues, 1);

        clearDecision();
        updateSignals(-1);
        render();
        setMessage("Counts applied. Select Next scheduling round to begin.");
        await checkApi();
    } catch (error) {
        alert(error.message);
    }
}

async function animateVehicles(index, count) {
    const layer = $("vehicleLayer");
    const directionClass = names[index].toLowerCase();
    const animCount = Math.min(count, 10);
    const stepCars = animCount > 0 ? count / animCount : 0;
    const initialLaneQueue = queues[index];

    for (let i = 0; i < animCount; i++) {
        const car = document.createElement("div");
        car.className = `moving-car ${directionClass}`;
        car.style.setProperty("--car-color", carColors[index]);
        layer.appendChild(car);

        // Visual decrement
        queues[index] = Math.max(0, Math.round(initialLaneQueue - (i + 1) * stepCars));
        render();

        car.addEventListener("animationend", () => car.remove(), { once: true });
        await sleep(140);
    }

    await sleep(250);
    layer.innerHTML = "";
}

async function nextRound() {
    if (busy && !runningAll) return false;
    if (totalWaiting() === 0) {
        setMessage("All vehicles have passed through. Reset or apply new counts to start again.");
        $("simulationState").textContent = "Complete";
        return false;
    }

    const wasRunning = runningAll;
    if (!wasRunning) setBusy(true);
    let ok = false;

    try {
        const response = await fetch("/api/step", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ queues, waiting })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Scheduling request failed.");

        const index = Number(data.selectedIndex);
        if (!Number.isInteger(index) || index < 0 || index > 3) {
            throw new Error("The C API returned an invalid direction.");
        }

        const direction = data.direction || names[index];
        const priority = Number(data.priority ?? 0);
        const greenTime = Number(data.greenTime ?? 0);
        const vehiclesServed = Math.min(queues[index], Math.max(0, Number(data.vehiclesServed ?? 0)));

        rounds++;
        $("activeDirection").textContent = direction;
        $("decisionDirection").textContent = `${direction} road selected`;
        $("priorityScore").textContent = priority;
        $("greenDuration").textContent = `${greenTime} sec`;
        $("roundServed").textContent = vehiclesServed;
        $("simulationState").textContent = "Green light";

        updateSignals(index);
        render();
        setMessage(`${direction} was selected by the greedy algorithm. ${vehiclesServed} vehicle(s) will move through.`);

        await animateVehicles(index, vehiclesServed);

        servedByLane[index] += vehiclesServed;
        servedTotal += vehiclesServed;

        // Use exact queue/waiting state calculated by C program
        if (Array.isArray(data.queues) && data.queues.length === 4) {
            queues = data.queues.map(value => Math.max(0, Number(value) || 0));
        }
        if (Array.isArray(data.waiting) && data.waiting.length === 4) {
            waiting = data.waiting.map(value => Math.max(0, Number(value) || 0));
        }

        addHistory(direction, priority, greenTime, vehiclesServed);
        render();

        if (totalWaiting() === 0) {
            updateSignals(-1);
            $("activeDirection").textContent = "Complete";
            $("simulationState").textContent = "Complete";
            setMessage("Simulation complete. All vehicles have been served.");
        }
        ok = true;
    } catch (error) {
        setMessage(`Error: ${error.message}`);
        alert(
            "Could not complete the scheduling round.\n\n" +
            error.message +
            "\n\nCheck that the Flask API is running."
        );
    } finally {
        if (!wasRunning) setBusy(false);
    }
    return ok;
}

async function runAll() {
    if (runningAll) {
        runningAll = false;
        setBusy(false);
        return;
    }

    if (totalWaiting() === 0) {
        setMessage("All vehicles have already passed through.");
        return;
    }

    runningAll = true;
    setBusy(true);

    try {
        let safetyCounter = 0;
        while (runningAll && totalWaiting() > 0 && safetyCounter < 5000) {
            safetyCounter++;
            const ok = await nextRound();
            if (!ok) break;
            await sleep(200);
        }
        if (safetyCounter >= 5000) {
            setMessage("Stopped after the safety limit. Check the C scheduling logic.");
        }
    } finally {
        runningAll = false;
        setBusy(false);
        if (totalWaiting() === 0 && rounds > 0) $("simulationState").textContent = "Complete";
    }
}

function resetSimulation() {
    if (busy) return;

    inputIds.forEach((id, index) => ($(id).value = DEFAULTS[index]));
    queues = [...DEFAULTS];
    waiting = [0, 0, 0, 0];
    servedByLane = [0, 0, 0, 0];
    servedTotal = 0;
    rounds = 0;
    maxQueue = 30;

    clearDecision();
    $("simulationState").textContent = "Ready";
    updateSignals(-1);
    render();
    setMessage("Simulation reset. Defaults restored: North 30, South 20, East 10, West 5.");
}

$("applyBtn").addEventListener("click", applyInputs);
$("nextBtn").addEventListener("click", nextRound);
$("runBtn").addEventListener("click", runAll);
$("resetBtn").addEventListener("click", resetSimulation);

render();
updateSignals(-1);
checkApi();