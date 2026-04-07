const trimf = (x, [a, b, c]) => Math.max(Math.min((x-a)/(b-a || 1e-5), (c-x)/(c-b || 1e-5)), 0);
const trapmf = (x, [a, b, c, d]) => Math.max(Math.min((x-a)/(b-a || 1e-5), 1, (d-x)/(d-c || 1e-5)), 0);

window.NeuroFuzzy = {
    // Default membership parameters
    sets: {
        age: {
            Low: { mf: trapmf, params: [0, 0, 30, 45], label: "Young" },
            Medium: { mf: trimf, params: [35, 50, 65], label: "Middle" },
            High: { mf: trapmf, params: [55, 70, 100, 100], label: "Old" }
        },
        bmi: {
            Low: { mf: trapmf, params: [10, 10, 18.5, 22], label: "Underweight" },
            Medium: { mf: trimf, params: [18.5, 23, 27.5], label: "Normal" },
            High: { mf: trapmf, params: [25, 30, 50, 50], label: "Overweight" }
        },
        bp: {
            Low: { mf: trapmf, params: [80, 80, 115, 125], label: "Normal" },
            Medium: { mf: trimf, params: [115, 130, 145], label: "Elevated" },
            High: { mf: trapmf, params: [135, 150, 200, 200], label: "High" }
        },
        sugar: {
            Low: { mf: trapmf, params: [50, 50, 95, 110], label: "Normal" },
            Medium: { mf: trimf, params: [100, 115, 135], label: "Pre-diabetic" },
            High: { mf: trapmf, params: [125, 140, 300, 300], label: "Diabetic" }
        },
        risk: {
            Low: { mf: trimf, params: [0, 0, 0.45], label: "Low Risk" },
            Medium: { mf: trimf, params: [0.25, 0.5, 0.75], label: "Medium Risk" },
            High: { mf: trimf, params: [0.55, 1, 1], label: "High Risk" }
        }
    },

    defaultRules: [
        // Format: { age: 'High', bmi: '*', bp: 'High', sugar: '*', out: 'High' } ( * means ignored )
        { age: 'High', bmi: 'High', bp: 'High', sugar: 'High', out: 'High' },
        { age: '*', bmi: 'High', bp: 'High', sugar: 'High', out: 'High' },
        { age: 'Low', bmi: 'Low', bp: 'Low', sugar: 'Low', out: 'Low' },
        { age: 'Medium', bmi: 'Medium', bp: 'Medium', sugar: 'Medium', out: 'Medium' },
        { age: '*', bmi: '*', bp: 'Low', sugar: 'Low', out: 'Low' },
        { age: 'High', bmi: '*', bp: 'Medium', sugar: 'High', out: 'High' },
        { age: '*', bmi: 'High', bp: '*', sugar: 'Medium', out: 'Medium' }
    ],

    getRules: function() {
        let stored = localStorage.getItem('neurodx-rules');
        if (stored) return JSON.parse(stored);
        return this.defaultRules;
    },

    saveRules: function(rules) {
        localStorage.setItem('neurodx-rules', JSON.stringify(rules));
    },

    resetRules: function() {
        localStorage.removeItem('neurodx-rules');
    },

    fuzzify: function(value, varName) {
        let sets = this.sets[varName];
        let degrees = {};
        for(let key in sets) {
            degrees[key] = sets[key].mf(value, sets[key].params);
        }
        return degrees;
    },

    evaluate: function(age, bmi, bp, sugar) {
        let fAge = this.fuzzify(age, 'age');
        let fBmi = this.fuzzify(bmi, 'bmi');
        let fBp = this.fuzzify(bp, 'bp');
        let fSugar = this.fuzzify(sugar, 'sugar');

        let rules = this.getRules();
        let riskOutputs = { Low: 0, Medium: 0, High: 0 };
        let triggeredRules = [];

        rules.forEach((rule, idx) => {
            // Find MIN over provided antecedents
            let strength = 1.0;
            if (rule.age !== '*') strength = Math.min(strength, fAge[rule.age]);
            if (rule.bmi !== '*') strength = Math.min(strength, fBmi[rule.bmi]);
            if (rule.bp !== '*') strength = Math.min(strength, fBp[rule.bp]);
            if (rule.sugar !== '*') strength = Math.min(strength, fSugar[rule.sugar]);

            if (strength > 0) {
                // MAX aggregation
                riskOutputs[rule.out] = Math.max(riskOutputs[rule.out], strength);
                
                // Build string for XAI
                let conds = [];
                if (rule.age !== '*') conds.push(`Age is ${rule.age}`);
                if (rule.bmi !== '*') conds.push(`BMI is ${rule.bmi}`);
                if (rule.bp !== '*') conds.push(`BP is ${rule.bp}`);
                if (rule.sugar !== '*') conds.push(`Sugar is ${rule.sugar}`);
                
                triggeredRules.push({
                    id: idx,
                    raw: rule,
                    weight: strength,
                    text: `IF ${conds.join(' AND ')} THEN Risk is ${rule.out}`
                });
            }
        });

        // Fallback rule if no custom rules fire (defaulting cleanly)
        if (triggeredRules.length === 0) {
            let baseRisk = 'Low';
            if (fBmi['High'] > 0.5 || fBp['High'] > 0.5 || fSugar['High'] > 0.5) baseRisk = 'Medium';
            riskOutputs[baseRisk] = 0.5;
            triggeredRules.push({ id: -1, weight: 0.5, text: "Fallback: Standard assessment due to lack of strict matching rule." });
        }

        triggeredRules.sort((a,b) => b.weight - a.weight);

        // Centroid Defuzzification
        let num = 0, den = 0;
        for (let x = 0; x <= 1.0; x += 0.02) {
            let mLow = Math.min(riskOutputs.Low, trimf(x, this.sets.risk.Low.params));
            let mMed = Math.min(riskOutputs.Medium, trimf(x, this.sets.risk.Medium.params));
            let mHigh = Math.min(riskOutputs.High, trimf(x, this.sets.risk.High.params));
            
            let maxM = Math.max(Math.max(mLow, mMed), mHigh);
            num += x * maxM;
            den += maxM;
        }

        let score = den === 0 ? 0 : num / den;

        return { score, riskOutputs, triggeredRules };
    }
};
