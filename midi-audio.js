
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

            let osc = makeNewOsc(noteNum);
            oscArray[counter] = osc;

            // let voice = new SynthVoice(noteNum);
            // oscArray[counter] = voice;
            found = true;

        } else {
            counter++;
        }
    }
    updateOscGui();
}








//--------------------------
function makeNewOsc(noteNum) {
    let now = context.currentTime;
    let osc = context.createOscillator();

    // Waveform type
    let type = 'sine';
    osc.type = type;

    // Name for note-off
    osc.name = noteNum;

    // set freq.
    osc.frequency.value = Number(xenFreqArray[noteNum]);
    osc.frequency.setValueAtTime(xenFreqArray[noteNum], now);

    // gain node
    let gainEnv = context.createGain();

    // attack
    gainEnv.gain.setValueAtTime(0, now);
    gainEnv.gain.linearRampToValueAtTime(1, now + 3);

    // connections
    osc.connect(gainEnv);
    gainEnv.connect(masterGainNode);

    // start osc
    osc.start();

    return(osc);
}



//--------------------------------
// SynthVoice object
function SynthVoice(noteNum) {
    let now = context.currentTime;
    let osc = context.createOscillator();

    // Waveform type
    let type = 'sine';
    osc.type = type;

    // Name for note-off
    osc.name = noteNum;

    // set freq.
    osc.frequency.value = Number(xenFreqArray[noteNum]);
    osc.frequency.setValueAtTime(xenFreqArray[noteNum], now);

    // gain node
    let gainEnv = context.createGain();

    // attack
    gainEnv.gain.setValueAtTime(0, now);
    gainEnv.gain.linearRampToValueAtTime(1, now + 3);

    // connections
    osc.connect(gainEnv);
    gainEnv.connect(masterGainNode);

    // start osc
    osc.start();

    return(this);
}







//--------------------------
// envelope 
var EnvelopeGenerator = (function(context) {
  function EnvelopeGenerator() {
    this.attackTime = 1.00;
    this.releaseTime = 1.00;
  };

  EnvelopeGenerator.prototype.trigger = function() {
    now = context.currentTime;
    this.param.cancelScheduledValues(now);
    this.param.setValueAtTime(0, now);
    this.param.linearRampToValueAtTime(1, now + this.attackTime);
    this.param.linearRampToValueAtTime(0, now + this.attackTime + this.releaseTime);
  };

  EnvelopeGenerator.prototype.connect = function(param) {
    this.param = param;
  };

  return EnvelopeGenerator;
})(context);
























//----------------------------
function noteOff(note) {

    let found = false;
    let counter = 0;

    while ((found == false) && (counter < 8)) {

        if (oscArray[counter] != undefined) {
            if (oscArray[counter].name == note) {
                oscArray[counter].stop();
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
            s += oscArray[i].frequency.value.toFixed(5);
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