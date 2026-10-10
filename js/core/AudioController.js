export class AudioController {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.lastTickAt = 0;
    }

    init() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    play(type, opts = {}) {
        if (this.muted) return;
        try {
            this.init();
            if (!this.ctx) return;

            // Throttle rapid ticks (e.g. fast slider drags) so the short blips
            // never pile up and overlap into a harsh buzz.
            if (type === 'tick') {
                const nowMs = performance.now();
                if (nowMs - this.lastTickAt < 50) return;
                this.lastTickAt = nowMs;
            }

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            const now = this.ctx.currentTime;
            if (type === 'tick') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(opts.frequency || 400, now);
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                osc.start();
                osc.stop(now + 0.03);
            } else if (type === 'success') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.setValueAtTime(659.25, now + 0.1);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.start();
                osc.stop(now + 0.3);
            } else if (type === 'fail') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.setValueAtTime(160, now + 0.15);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.start();
                osc.stop(now + 0.35);
            }
        } catch (e) {}
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
}
