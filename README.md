# NeuroDx: Fuzzy Logic–Based Medical Diagnosis System

![NeuroDx Banner](https://img.shields.io/badge/Status-Active-success) ![License](https://img.shields.io/badge/License-MIT-blue) ![Vanilla JS](https://img.shields.io/badge/Tech-Vanilla%20JS%20%7C%20HTML%20%7C%20CSS-f0db4f)

NeuroDx is a sophisticated, interactive expert system designed to simulate specialized medical reasoning using **Fuzzy Logic Math**. The system accepts common patient biometrics—Age, Body Mass Index (BMI), Blood Pressure, and Fasting Blood Sugar—and translates these into linguistic variables. Through a comprehensive overlapping fuzzy rule base, it utilizes Mamdani Inference processing algorithms to generate real-time predictive disease risk assessments.

Unlike Boolean-based diagnostic tools which rely on strict thresholds (e.g., BMI > 25 is strictly Overweight), NeuroDx utilizes fuzzy degrees of membership, allowing for human-like reasoning tailored to complex biological overlaps.

## ✨ Features

- **Interactive UI Dashboard**: Modern glassmorphism aesthetic built from scratch. Reactive inputs natively update processing outputs in real-time.
- **Fuzzification Engine**: Custom-built algorithm using Triangular and Trapezoidal functions mapped to clinical ranges. 
- **Mamdani Rule Inference Engine**: Processes parallel evaluations utilizing MIN/AND logic across up to 81 dynamic conditions.
- **Explainable AI (XAI)**: Demystifies the black-box AI model by algorithmically exposing and dynamically printing which IF-THEN rules triggered the final outcome most aggressively.
- **Visual Membership Mapping**: Configured with `Chart.js` to render the exact fuzzy boundaries dynamically, letting researchers visualize mathematical overlaps directly in the UI.
- **Local Dynamic Rule Editor**: Built-in interface allowing physicians/users to instantly inject new custom diagnostic rules directly into the engine's processing queue.
- **Client-Side Storage**: Leverages Browser `localStorage` to securely track local patient history traces seamlessly.

## 🛠️ Technology Stack
* **Frontend Design**: Semantic HTML5, CSS3 Variables, Glassmorphism aesthetics, Custom pure-CSS Animations, Flexbox/Grid routing.
* **Logic/Processing**: Modular Vanilla JavaScript (ES6+), Mathematical Array Manipulations, Single Page Application (SPA) Hash Routing paradigm.
* **Graphing Subsystem**: [Chart.js](https://www.chartjs.org/) (Sourced securely via CDN).

## 🚀 Quick Start / How to Run

Because the system engine is processed 100% Client-Side for architectural privacy and extreme computing speed, **zero compiling, backend databases, or servers are heavily required**.

### Option A: Direct Open (The Fastest Way)
1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/Utkarsh322/Fuzzylogicmedical.git
   ```
2. Open the cloned folder.
3. Simply double-click the `index.html` file to launch the application instantly in your default web browser (Chrome, Safari, Firefox, Edge).

### Option B: Node.js Serve
If you prefer running via a local development server:
```bash
# Assuming Node is installed globally
npx serve . -p 3000
```
Navigate to `http://localhost:3000`.

## 🧬 Architectural Logic Pipeline

The core mathematical processor (`fuzzy.js`) operates on four distinct procedures:

1. **Crisp Input Normalization**: Takes numeric values natively from UI sliders.
2. **Fuzzification**: Values intersect with overlapping mathematical boundaries (`Low`, `Medium`, `High`) obtaining decimal membership weights. 
3. **Mamdani Inference**: The logic grid dynamically parses rule predicates finding intersecting conditional strings to yield maximum output weights.
4. **Centroid Defuzzification**: Using center-of-gravity formulations, evaluates the geometric union of the risk arrays to establish a single, precision floating-point Risk Factor normalized between `0.00` and `1.00`.

## 📸 Screenshots
*(Add screenshots of your UI here to make the repository visually compelling!)*

## 📄 Licensing & Academic Use
This source code is made available for soft computing research and academic coursework. The logic ranges are simplified conceptual medical arrays and should not be used in lieu of actual clinical care.

Designed dynamically for Soft Computing architecture coursework models.
