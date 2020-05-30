
//=============================
// Audio
//=============================
let context = new (window.AudioContext || window.webkitAudioContext);
let masterGainNode = null;

let noteFreq = null;
let customWaveform = null;
let sineTerms = null;
let cosineTerms = null;

var oscArray = new Array(8);
var voiceArray = new Array(8);


//----------------------------
function audioSetup() {
    masterGainNode = context.createGain();
    masterGainNode.connect(context.destination);
    masterGainNode.gain.setValueAtTime(0.2,context.currentTime);

    // sineTerms = new Float32Array([0, 0, 1, 0, 1]);
    // cosineTerms = new Float32Array(sineTerms.length);
    // customWaveform = context.createPeriodicWave(cosineTerms, sineTerms);

    updateOscGui();
}




//----------------------------
function noteOn(note) {
    noteOn(note, 127);
}




//----------------------------
function noteOn(noteNum, velocity) {
    let found = false;
    let counter = 0;
    while ((found == false) && (counter < 8)) {
        if (oscArray[counter] == undefined) {

            let voice = new SynthVoice(noteNum);
            oscArray[counter] = voice;
            found = true;

        } else {
            counter++;
        }
    }
    updateOscGui();
}








//--------------------------------
// SynthVoice object
function SynthVoice(noteNum) {
    this.name = noteNum;
    this.osc = context.createOscillator();
    this.gainEnv = context.createGain();

    // time = now
    let now = context.currentTime;

    // Waveform type
    //let type = 'sine';
    //this.osc.type = type;
    this.osc.type = document.getElementById("wave").value;

    //ADSR values
    let ampA = Number(document.getElementById("ampAttack").value);
    let ampD = Number(document.getElementById("ampDecay").value);
    let ampS = Number(document.getElementById("ampSustain").value);
    this.ampR = Number(document.getElementById("ampRelease").value);
    console.log(ampA + ", " + ampD + ", " + ampS + ", " + this.ampR);

    // set freq.
    this.osc.frequency.value = Number(xenFreqArray[noteNum]);
    this.osc.frequency.setValueAtTime(xenFreqArray[noteNum], now);

    // Envelope Attack and Decay
    this.gainEnv.gain.setValueAtTime(0, now);
    this.gainEnv.gain.linearRampToValueAtTime(1, now + ampA);
    this.gainEnv.gain.linearRampToValueAtTime(ampS, now + ampA + ampD);

    // connections
    this.osc.connect(this.gainEnv);
    this.gainEnv.connect(masterGainNode);

    // start osc
    this.osc.start();

    // release phase
    this.beginRelease = function() {
        let now = context.currentTime;
        this.gainEnv.gain.cancelScheduledValues(now);
        this.gainEnv.gain.setValueAtTime(this.gainEnv.gain.value, now);
        this.gainEnv.gain.linearRampToValueAtTime(0, now + this.ampR);
        this.osc.stop(now + this.ampR);
    };

    // When finished -- update: not needed?
    // https://stackoverflow.com/questions/36628027/do-i-need-to-disconnect-an-oscillator-audionode-after-stop-it
    // this.onended = function() {
    //     console.log("osc " + this.name + " ended.");
    // }

    return(this);
}












//----------------------------
function noteOff(note) {

    let found = false;
    let counter = 0;

    while ((found == false) && (counter < 8)) {

        if (oscArray[counter] != undefined) {
            if (oscArray[counter].name == note) {
                oscArray[counter].beginRelease();
                oscArray[counter] = undefined;
                found = true;
            }
        }
        counter++;
    }
    updateOscGui();
}






//----------------------------
function killAll() {
    for (var i=0;i<oscArray.length;i++) {
        if (oscArray[i] != undefined) {
            oscArray[i].stop();
            oscArray[i] = undefined;
        }
    }
    updateOscGui();
}






//----------------------------
function updateOscGui() {
    for (var i=0;i<oscArray.length;i++) {
        var d = document.getElementById("osc"+i);
        if (oscArray[i] == undefined) {
            d.innerHTML = "- -";
        } else {
            var s = "";
            s += oscArray[i].name;
            s += " : ";
            s += oscArray[i].osc.frequency.value.toFixed(5);
            d.innerHTML = s;
        }
    }
}






//---------------------
// Master gain
// TK placeholder math
function chVolume(x) {
    let g = (-1 -x)/4;
    masterGainNode.gain.setValueAtTime(g,context.currentTime);
}

























//=============================
// WEB MIDI 
//=============================
if (navigator.requestMIDIAccess) {
    console.log('This browser supports WebMIDI!');
} else {
    console.log('WebMIDI is not supported in this browser.');
}

navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

function onMIDIFailure() {
    console.log('Could not access your MIDI devices.');
}

function onMIDISuccess(midiAccess) {
    for (var input of midiAccess.inputs.values())
    input.onmidimessage = getMIDIMessage;
}

function getMIDIMessage(message) {
    var command = message.data[0];
    var note = message.data[1];
    var velocity = (message.data.length > 2) ? message.data[2] : 0; // a velocity value might not be included with a noteOff command

    switch (command) {
        case 144: // noteOn
            if (velocity > 0) {
                noteOn(note, velocity);
            } else {
                noteOff(note);
            }
            break;
        case 128: // noteOff
            noteOff(note);
            break;
        // we could easily expand this switch statement to cover other types of commands such as controllers or sysex
    }
}