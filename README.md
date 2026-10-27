# 🚦 Smart Traffic Signal Scheduling (DAA Project)

An intelligent, real-time 4-way traffic signal scheduling dashboard powered by a **Greedy Algorithm with Starvation Prevention** implemented in **C**, connected via a **Python Flask** API bridge, and visualized through a modern, interactive web dashboard.

---

## 📋 Table of Contents
- [Project Overview](#-project-overview)
- [How the Algorithm Works](#-how-the-algorithm-works)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide](#-quick-start-guide)
- [OS-Specific Setup (Windows, Mac, Linux)](#-os-specific-setup)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)

---

## 💡 Project Overview
In modern urban traffic management, fixed-timer traffic lights cause long delays and fuel wastage. This project dynamically schedules traffic lights at a 4-way intersection (North, South, East, West) based on real-time vehicle density and waiting time.

- **Frontend**: Clean, responsive web dashboard with live intersection animations, queue meters, and scheduling history (HTML5, Vanilla CSS, JavaScript).
- **Backend**: Python Flask server that handles API requests and automatically compiles/runs the C binary.
- **Core Engine**: High-performance C program implementing a Greedy scheduling strategy with aging/starvation safeguards.

---

## 🧠 How the Algorithm Works

### 1. Priority Score (Greedy Heuristic)
For each lane $i \in \{\text{North, South, East, West}\}$:
$$\text{Priority}_i = (\text{Queue}_i \times 2) + \text{Waiting}_i$$

The lane with the highest priority score is selected to receive the green light.

### 2. Fairness & Starvation Prevention
If a lane with waiting cars has waited for **60 seconds or longer** (`STARVATION_LIMIT = 60`), the system triggers a **fairness override**:
- That starving lane is served first, regardless of how many cars are waiting on other roads.
- If multiple lanes are starving, the one waiting the longest is served first.

### 3. Dynamic Green Time Allocation
$$\text{Green Time} = \min(60, \max(10, 10 + \text{Queue} \times 2)) \text{ seconds}$$
- Minimum green light: **10 seconds**
- Maximum green light: **60 seconds**
- Vehicle clearance rate: **1 vehicle per 2 seconds**

---

## ⚙️ Prerequisites

Before running the project, make sure you have:
1. **Python 3.8+** installed ([python.org](https://www.python.org/downloads/))
2. **GCC (C Compiler)** installed:
   - **Windows**: MinGW-w64, MSYS2, or GCC.
   - **macOS**: Apple Command Line Tools (`clang`/`gcc`).
   - **Linux**: `build-essential` package (`gcc`).

---

## 🚀 Quick Start Guide

### Step 1: Open a Terminal
Open Command Prompt, PowerShell, or Terminal, and navigate to the project folder:
```bash
cd Smart-Traffic-Signal-Scheduling-main
```

### Step 2: Install Python Dependencies
Install Flask using `pip`:
```bash
pip install -r requirements.txt
```

### Step 3: Run the Application
Start the Flask server (this automatically compiles the C algorithm into an executable):
```bash
python api/app.py
```
*(On Windows, you can also use `py api/app.py`)*

### Step 4: Open the Dashboard
Open your web browser and go to:
```
http://127.0.0.1:5000
```

That's it! You will see the traffic control dashboard ready to simulate.

---

## 💻 OS-Specific Setup

If you or your friend encounter any environment setup issues, follow these instructions for your operating system:

### 🪟 Windows Setup
1. **Python**:
   - Download from [python.org](https://www.python.org/downloads/).
   - ⚠️ **Important**: During installation, check the box **"Add Python to PATH"**.
2. **GCC Compiler**:
   - Check if you have GCC: open PowerShell and type `gcc --version`.
   - If not installed, you can install it via [WinLibs](https://winlibs.com/) or run:
     ```powershell
     winget install MSYS2.MSYS2
     ```
     Or use MinGW.
   - *(Note: A pre-compiled `src/greedy.exe` is already included in `src/` for Windows).*

### 🍎 macOS Setup
1. **GCC / Clang**:
   - Open Terminal and run:
     ```bash
     xcode-select --install
     ```
2. **Python**:
   - Install Python via Homebrew (`brew install python`) or download from [python.org](https://www.python.org/).

### 🐧 Linux (Ubuntu / Debian / Fedora) Setup
1. **Install GCC and Python**:
   ```bash
   sudo apt update
   sudo apt install gcc python3 python3-pip python3-venv
   ```
2. **Install requirements**:
   ```bash
   pip3 install -r requirements.txt
   ```
3. **Run**:
   ```bash
   python3 api/app.py
   ```

---

## 📂 Project Structure

```
Smart-Traffic-Signal-Scheduling/
│
├── api/
│   └── app.py            # Python Flask server & C scheduler compiler/bridge
│
├── dashboard/
│   ├── index.html        # Main dashboard interface
│   ├── style.css         # Modern, high-contrast dashboard styling
│   └── script.js         # Frontend controller & animation engine
│
├── include/
│   └── greedy.h          # C header file with constants & function prototypes
│
├── src/
│   ├── greedy.c          # Core greedy scheduling algorithm in C
│   └── greedy.exe        # Compiled executable
│
├── requirements.txt      # Python dependencies (Flask)
└── README.md             # Project documentation and guide
```

---

## 🎮 How to Use the Dashboard

1. **Set Vehicle Counts**: Enter the number of vehicles waiting on North, South, East, and West in the right-hand panel (e.g. 30, 20, 10, 5).
2. **Apply Counts**: Click **"Apply vehicle counts"** to update the intersection.
3. **Step Through Decisions**: Click **"Next scheduling round"** to execute one round of the greedy algorithm.
   - The selected direction gets a **Green Light**.
   - Vehicles animate through the intersection.
   - Remaining queues and wait times update dynamically.
   - The decision metric cards show the **Priority Score**, **Green Duration**, and **Vehicles Cleared**.
4. **Auto-Run**: Click **"Run full simulation"** to let the algorithm continuously schedule and clear all roads until empty.
5. **Reset**: Click **"Reset"** at any time to restore default values.

---

## ❓ Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **"gcc is not recognized as an internal or external command"** | Install MinGW / GCC and ensure its `bin` folder is added to your system's `PATH`. |
| **"Address already in use / Port 5000 busy"** | Another process is using port 5000. In `api/app.py`, change `port=5000` to `port=5050` and open `http://127.0.0.1:5050`. |
| **"ModuleNotFoundError: No module named 'flask'"** | Run `pip install flask` (or `pip3 install flask`). Ensure you are using the same Python environment. |
| **Dashboard shows "API connection failed"** | Make sure `python api/app.py` is actively running in a terminal window before opening the browser. |

---

## 📜 Academic Reference
This project was developed for the **Design and Analysis of Algorithms (DAA)** curriculum to demonstrate:
- **Greedy Strategy**: Local optimum selection for global traffic flow optimization.
- **Starvation Handling**: Dynamic aging mechanism to prevent indefinite postponement of low-density roads.
- **Time Complexity**: $O(N)$ decision per cycle where $N = 4$ approaches (runs in microseconds).
