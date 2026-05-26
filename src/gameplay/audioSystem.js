import * as THREE from "three";

/**
 * Synthesizes a whimsical retro/chiptune chime sound effect using the Web Audio API context.
 * This ensures immediate playback (zero latency) and offline reliability.
 * @param {THREE.AudioListener} audioListener - ThreeJS audio listener attached to the camera.
 */
export function playCollectSound(audioListener) {
    if (!audioListener) return;
    const context = audioListener.context;
    if (!context) return;

    // Resume the AudioContext if suspended by browser security/autoplay policy
    if (context.state === 'suspended') {
        context.resume().catch(err => console.warn("Failed to resume AudioContext:", err));
    }

    const now = context.currentTime;

    // Giai điệu vui vẻ, thánh thót (Arpeggio: C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.50]; 
    
    notes.forEach((freq, index) => {
        const osc = context.createOscillator();
        const gainNode = context.createGain();
        
        // Triangle wave provides a cozy, warm chiptune instrument sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);
        
        // Cozy envelope: quick attack, exponential decay
        gainNode.gain.setValueAtTime(0.12, now + index * 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.35);
        
        osc.connect(gainNode);
        gainNode.connect(context.destination);
        
        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.4);
    });
}
