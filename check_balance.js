const fs = require('fs');
const content = fs.readFileSync('client/src/components/OutputPanels.tsx', 'utf8');

let balance = 0;
const lines = content.split('\n');
let divBalance = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openDivs = (line.match(/<div/g) || []).length;
    const closeDivs = (line.match(/<\/div>/g) || []).length;

    const prevBalance = divBalance;
    divBalance += openDivs;
    divBalance -= closeDivs;

    if (prevBalance === 0 && divBalance > 0) {
        console.log(`Block start at line ${i + 1}: ${line.trim()}`);
    }
}

console.log(`Final div balance: ${divBalance}`);

// Check specific sections
const deploymentStart = lines.findIndex(l => l.includes('function DeploymentPanel'));
if (deploymentStart !== -1) {
    let dBalance = 0;
    for (let i = deploymentStart; i < lines.length; i++) {
        const line = lines[i];
        const openDivs = (line.match(/<div/g) || []).length;
        const closeDivs = (line.match(/<\/div>/g) || []).length;
        dBalance += openDivs - closeDivs;

        if (openDivs > 0 || closeDivs > 0) {
            // console.log(`Line ${i+1}: Balance ${dBalance} (Change: +${openDivs} -${closeDivs})`);
        }

        if (line.includes('return') && dBalance === 0) {
            console.log(`DeploymentPanel balanced at line ${i + 1}?`);
        }
    }
    console.log(`DeploymentPanel end balance: ${dBalance}`);
}
