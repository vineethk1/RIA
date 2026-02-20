from __future__ import annotations

import os
import wave
import asyncio
import tempfile
import threading
import inspect
from typing import Optional, List, Callable, Any
import json
import base64

from controllers.memory_service import (
    get_session_memory,
    initialize_session_memory,
    save_session_memory,
)
from controllers.integration_service import (
    generate_structured_request,
    get_agent_config,
    send_api_request,
)
import numpy as np
from fastrtc import StreamHandler
from config import settings

from .stt_service import get_transcriber
from .llm_service import select_agent, short_reply
from .actions_service import heuristics, llm_refine
from .prompt_service import build_micro_agent_prompt
from .tts_service import tts_elevenlabs


# ---- Lightweight, cross-platform denoiser (no extra deps) ----
class SimpleDenoiser:
    """
    Real-time friendly denoiser for 20ms @ 48kHz frames:
      - high-pass + pre-emphasis
      - adaptive noise floor (EMA)
      - spectral mask (soft gate)
    Pure NumPy, cross-platform. Works best when called per 20ms frame.
    """

    def __init__(
        self,
        sr: int = 48000,
        frame_ms: int = 20,
        hp_cut_hz: float = 120.0,
        pre_emph: float = 0.97,
        ema_alpha_rms: float = 0.95,
        ema_alpha_psd: float = 0.98,
        floor_boost: float = 1.8,
        mask_relax: float = 0.6,
        max_atten_db: float = 18.0,
    ):
        self.sr = sr
        self.N = int(sr * frame_ms / 1000)  # 960 at 48k/20ms
        self.hp_alpha = np.exp(-2.0 * np.pi * hp_cut_hz / sr)
        self.pre_emph = pre_emph
        self.ema_alpha_rms = ema_alpha_rms
        self.ema_alpha_psd = ema_alpha_psd
        self.floor_boost = floor_boost
        self.mask_relax = mask_relax
        self.atten_lin = 10 ** (-max_atten_db / 20.0)

        self._x1 = 0.0       # high-pass state
        self._pe_x1 = 0.0    # pre-emphasis state
        self._rms_floor = None  # EMA RMS floor
        self._psd_floor = None  # EMA PSD floor

        # Hann window for STFT-ish per-frame FFT
        self.win = np.hanning(self.N).astype(np.float32)

        # small epsilon
        self.eps = 1e-8

    def _highpass_preemph(self, x: np.ndarray) -> np.ndarray:
        # 1-pole HPF (difference + leaky integrator)
        y = np.empty_like(x, dtype=np.float32)
        xi = self._x1
        a = self.hp_alpha
        for i in range(x.shape[0]):
            xi_new = a * xi + (1 - a) * x[i]
            y[i] = x[i] - xi_new
            xi = xi_new
        self._x1 = xi

        # pre-emphasis
        z = np.empty_like(y)
        pe_prev = self._pe_x1
        z[0] = y[0] - self.pre_emph * pe_prev
        for i in range(1, y.shape[0]):
            z[i] = y[i] - self.pre_emph * y[i - 1]
        self._pe_x1 = y[-1]
        return z

    def process_20ms_int16(self, pcm16: np.ndarray) -> np.ndarray:
        """
        Input/Output: int16 mono frame of length N (e.g., 960).
        """
        if pcm16.dtype != np.int16:
            pcm16 = pcm16.astype(np.int16, copy=False)
        x = pcm16.astype(np.float32)

        # HPF + pre-emphasis
        x = self._highpass_preemph(x)

        # Window & FFT
        xw = x * self.win
        X = np.fft.rfft(xw)  # (N/2+1,)
        mag = np.abs(X)
        psd = (mag * mag).astype(np.float32)

        # Update EMA floors
        if self._rms_floor is None:
            self._rms_floor = float(np.sqrt(np.mean(psd) + self.eps))
        else:
            cur_rms = float(np.sqrt(np.mean(psd) + self.eps))
            self._rms_floor = (
                self.ema_alpha_rms * self._rms_floor
                + (1 - self.ema_alpha_rms) * cur_rms
            )

        if self._psd_floor is None:
            self._psd_floor = psd.copy()
        else:
            self._psd_floor = (
                self.ema_alpha_psd * self._psd_floor
                + (1 - self.ema_alpha_psd) * psd
            )

        # Build soft mask relative to boosted floor
        floor = self.floor_boost * (self._psd_floor + self.eps)
        ratio = psd / (floor + self.eps)
        mask = ratio / (ratio + 1.0)  # (0..1)
        mask = np.power(mask, self.mask_relax)  # relax mask to avoid artifacts

        # Ensure minimum attenuation (don’t null out completely)
        mask = np.maximum(mask, self.atten_lin).astype(np.float32)

        # Apply mask
        Y = X * mask
        y = np.fft.irfft(Y, n=self.N)

        # De-emphasis (simple 1-pole inverse of pre-emph)
        out = np.empty_like(y)
        de_prev = 0.0
        a = self.pre_emph
        for i in range(y.shape[0]):
            de_prev = y[i] + a * de_prev
            out[i] = de_prev

        # Soft limiter
        peak = np.max(np.abs(out)) + self.eps
        if peak > 32767.0:
            out *= 32767.0 / peak

        # back to int16
        return np.clip(out, -32767.0, 32767.0).astype(np.int16)


class MeetingStreamHandler(StreamHandler):
    """
    WebRTC handler with simple VAD:

      - receive(): buffers int16 frames, computes energy, tracks speaking/silence
      - when ~0.7s of silence after speech -> cut WAV & transcribe
      - send JSON (transcription + optional action items + reply preview/audio)
    """

    def __init__(
        self,
        *,
        refine_with_llm: bool = False,
        send_json_cb: Optional[Callable[[dict], Any]] = None,  # outbound hook
    ):
        super().__init__()

        # audio ring buffer
        self._ring: List[np.ndarray] = []
        self._ring_max_samples = 48_000 * 30  # ~30s @ 48kHz
        self._sr = 48_000
        self._last_frame = None

        # debug log throttle for recv (default off: no spam)
        self._recv_count = 0
        self._recv_log_every = int(os.getenv("RTC_RECV_LOG_EVERY", "0") or 0)

        # transcriber & LLM
        self.transcriber = get_transcriber()
        self.refine_with_llm = bool(settings.OPENAI_API_KEY) and refine_with_llm

        # serialize pause processing
        self._pause_lock = asyncio.Semaphore(1)
        self._pause_in_progress = False

        # --- VAD (state machine + hysteresis) ---
        self._state = "IDLE"  # IDLE | RECORDING | COOLDOWN
        self._frame_ms = 20   # 20ms frames at 48kHz

        # cooldown after a cut to avoid double triggers
        self._cooldown_ms = int(os.getenv("VAD_COOLDOWN_MS", "450"))
        self._cooldown_left = 0

        # start/stop thresholds (int16 RMS); start > stop (hysteresis)
        self._rms_start = float(os.getenv("VAD_START_RMS", "600"))
        self._rms_stop = float(os.getenv("VAD_STOP_RMS", "420"))

        # dynamic silence cutoff bounds (ms)
        self._min_silence_ms = int(os.getenv("VAD_MIN_SIL_MS", "600"))
        self._max_silence_ms = int(os.getenv("VAD_MAX_SIL_MS", "1400"))

        # number of consecutive quiet frames to confirm end of speech
        self._end_guard_frames = int(os.getenv("VAD_END_GUARD_FRAMES", "4"))

        # minimum speech and absolute utterance cap (ms)
        self._min_speech_ms = int(os.getenv("VAD_MIN_SPEECH_MS", "650"))
        self._max_utt_ms = int(os.getenv("MAX_UTTERANCE_MS", "15000"))

        # counters for current utterance
        self._speech_ms = 0
        self._silence_ms = 0
        self._utt_ms = 0

        # UI-ish state
        self._speaking = False
        self._silent_count = 0

        # outbound JSON callback (WebSocket / datachannel / etc.)
        self._send_json_cb = send_json_cb

        # noise suppression flag
        self._use_simple_denoiser = bool(
            os.getenv("USE_SIMPLE_DENOISER", "0") == "1"
            or getattr(settings, "USE_SIMPLE_DENOISER", False)
        )
        self._denoiser = (
            SimpleDenoiser(sr=self._sr, frame_ms=self._frame_ms)
            if self._use_simple_denoiser
            else None
        )

        # event loop for scheduling from sync receive()
        try:
            self._loop = asyncio.get_running_loop()
        except RuntimeError:
            self._loop = asyncio.new_event_loop()
            threading.Thread(target=self._loop.run_forever, daemon=True).start()

    # ----------------- StreamHandler sync hooks -----------------

    def receive(self, frame):
        """
        frame: (ts_or_sr, np.ndarray) — ts=48000, pcm shape=(1,960) or (960,), dtype=int16.
        """
        self._last_frame = frame

        # debug for incoming frames
        if self._recv_log_every:
            self._recv_count += 1
            if (self._recv_count % self._recv_log_every) == 0:
                ts, pcm = frame
                print(
                    f"[recv] ts={ts} shape={getattr(pcm, 'shape', None)} "
                    f"dtype={getattr(pcm, 'dtype', None)}"
                )

        try:
            ts, pcm = frame
            if isinstance(ts, (int, float)):
                self._sr = int(ts)

            if pcm is None:
                return frame

            pcm = np.asarray(pcm)

            # flatten (channels, samples) -> (samples,)
            if pcm.ndim == 2:
                pcm = pcm.reshape(-1)

            # normalize dtype to int16
            if pcm.dtype in (np.float32, np.float64):
                pcm = np.clip(pcm, -1.0, 1.0)
                pcm = (pcm * 32767.0).astype(np.int16)
            elif pcm.dtype != np.int16:
                pcm = pcm.astype(np.int16, copy=False)

            # ---- Noise suppression BEFORE VAD/RMS ----
            frame_len = int(self._sr * self._frame_ms / 1000)
            if self._denoiser is not None and pcm.shape[0] == frame_len:
                pcm = self._denoiser.process_20ms_int16(pcm)

            # ----- VAD state machine with hysteresis -----
            # energy in int16 RMS
            rms = float(np.sqrt(np.mean(np.square(pcm.astype(np.float32)))))
            if self._state in ("IDLE", "COOLDOWN"):
                voiced_now = rms >= self._rms_start
            else:
                voiced_now = rms >= self._rms_stop

            # update cooldown
            if self._state == "COOLDOWN":
                self._cooldown_left -= self._frame_ms
                if self._cooldown_left <= 0:
                    self._state = "IDLE"

            if self._state == "IDLE":
                if voiced_now:
                    # ✨ NEW: auto barge-in: tell FE to stop any assistant audio
                    try:
                        asyncio.run_coroutine_threadsafe(
                            self.send_json({"type": "INTERRUPT_AUDIO"}),
                            self._loop,
                        )
                        print("[barge-in] sent INTERRUPT_AUDIO to client")
                    except Exception as e:
                        print(f"[barge-in] failed to send INTERRUPT_AUDIO: {e}")

                    # start of speech
                    self._state = "RECORDING"
                    self._speech_ms = 0
                    self._silence_ms = 0
                    self._utt_ms = 0
                    self._ring.clear()
                else:
                    return frame  # stay idle, do not buffer

            if self._state == "RECORDING":
                # buffer the frame
                self._ring.append(pcm)
                self._utt_ms += self._frame_ms

                # backstop: ring cap
                total = sum(ch.shape[0] for ch in self._ring)
                while total > self._ring_max_samples and self._ring:
                    total -= self._ring.pop(0).shape[0]

                if voiced_now:
                    self._speech_ms += self._frame_ms
                    self._silence_ms = 0
                else:
                    self._silence_ms += self._frame_ms

                # dynamic silence cutoff based on spoken length
                dyn_cutoff = max(
                    self._min_silence_ms,
                    min(self._max_silence_ms, int(0.22 * self._utt_ms)),
                )

                # require a few consecutive quiet frames to confirm end
                end_guard_ok = (
                    self._silence_ms >= dyn_cutoff
                    and self._silence_ms >= self._end_guard_frames * self._frame_ms
                )

                # cut conditions
                should_cut_for_silence = end_guard_ok
                should_cut_for_length = self._utt_ms >= self._max_utt_ms

                if should_cut_for_silence or should_cut_for_length:
                    # reject too-short speech (noise)
                    if self._speech_ms < self._min_speech_ms:
                        # reset without transcribing
                        self._ring.clear()
                        self._state = "COOLDOWN"
                        self._cooldown_left = self._cooldown_ms
                        self._speech_ms = self._silence_ms = self._utt_ms = 0
                        return frame

                    if not self._pause_in_progress:
                        self._pause_in_progress = True
                        try:
                            asyncio.run_coroutine_threadsafe(
                                self._handle_pause(), self._loop
                            )
                        except Exception as e:
                            self._pause_in_progress = False
                            print(f"[recv] schedule error: {e}")

                    # enter cooldown to avoid double-fire
                    self._state = "COOLDOWN"
                    self._cooldown_left = self._cooldown_ms

            return frame
        except Exception as e:
            print(f"[recv] error: {e}")
            return frame

    def emit(self):
        """No loopback audio to client."""
        return None

    def copy(self):
        """Clone handler for new connections, keep behavior + outbound hook."""
        return MeetingStreamHandler(
            refine_with_llm=self.refine_with_llm,
            send_json_cb=self._send_json_cb,
        )

    # ----------------- outbound methods -----------------
    async def send_json(self, payload: dict):
        """
        Send JSON through FastRTC's send_message API or callback.
        FastRTC provides self.send_message() for sending data through the data channel.
        """
        json_str = json.dumps(payload)

        # Method 1: Try FastRTC's send_message (async)
        if hasattr(self, "send_message"):
            try:
                await self.send_message(json_str)
                print(
                    f"[send_json] ✓ sent via FastRTC send_message: {len(json_str)} bytes"
                )
                return
            except Exception as e:
                print(f"[send_json] send_message error: {e}")

        # Method 2: Try FastRTC's send_message_sync (blocking)
        if hasattr(self, "send_message_sync"):
            try:
                await asyncio.to_thread(self.send_message_sync, json_str)
                print(
                    f"[send_json] ✓ sent via FastRTC send_message_sync: {len(json_str)} bytes"
                )
                return
            except Exception as e:
                print(f"[send_json] send_message_sync error: {e}")

        # Method 3: Try custom callback
        if self._send_json_cb:
            try:
                if inspect.iscoroutinefunction(self._send_json_cb):
                    await self._send_json_cb(payload)
                else:
                    await asyncio.to_thread(self._send_json_cb, payload)
                print("[send_json] ✓ sent via callback")
                return
            except Exception as e:
                print(f"[send_json] callback error: {e}")

        print(
            "[send_json] ✗ WARNING: no outbound channel configured - data not sent!"
        )
        print(
            f"[send_json] Available send methods: send_message={hasattr(self, 'send_message')}, "
            f"send_message_sync={hasattr(self, 'send_message_sync')}"
        )

    # ----------------- helpers -----------------

    def _write_wav_from_ring(self) -> Optional[str]:
        """Cut a temporary mono WAV from the ring buffer (int16). Clears the ring."""
        if not self._ring:
            return None
        pcm16 = np.concatenate(self._ring, axis=0)
        self._ring.clear()

        fd, path = tempfile.mkstemp(suffix=".wav", prefix="rtc_")
        os.close(fd)
        with wave.open(path, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)  # int16
            wf.setframerate(self._sr)
            wf.writeframes(pcm16.tobytes())

        print(f"[pause] wrote wav: {path}, samples={pcm16.shape[0]}, sr={self._sr}")
        return path

    # ----------------- pause path -----------------

    async def _handle_pause(self):
        """Runs after VAD decides we hit a pause."""
        async with self._pause_lock:
            path = None
            try:
                # freeze current speech segment, then reset state for next turn
                path = self._write_wav_from_ring()
                self._speaking = False
                self._silent_count = 0

                if not path:
                    print("[pause] nothing to transcribe (empty ring).")
                    return

                print(f"[pause] transcribing: {path}")
                try:
                    with wave.open(path, "rb") as wf:
                        frames = wf.getnframes()
                        sr = wf.getframerate()
                    dur_ms = int(frames * 1000 / max(1, sr))
                except Exception:
                    dur_ms = 0
                if dur_ms < self._min_speech_ms:
                    print(f"[pause] skipped too-short segment: {dur_ms} ms")
                    return

                # STT off the event loop (no timeouts here, but could add)
                lang_line, code, orig, en_text = await asyncio.to_thread(
                    self.transcriber.transcribe, path
                )
                print(f"[pause] STT original: {orig}")
                print(f"[pause] STT detected: {lang_line} (code={code})")
                if en_text and en_text != orig:
                    print(f"[pause] STT english : {en_text}")

                # include a turn_id for this utterance
                turn_id = os.urandom(8).hex()

                await self.send_json(
                    {
                        "turn_id": turn_id,
                        "transcription": {
                            "lang_code": code,
                            "lang_line": lang_line,
                            "original_text": orig,
                            "english_text": en_text,
                        },
                    }
                )
                await asyncio.sleep(0)

                # Normalize usable_text:
                # - We run NLP in English.
                usable_for_nlp = (en_text or orig or "").strip()
                if not usable_for_nlp:
                    print("[pause] empty transcript after STT, no reply.")
                    await self.send_json(
                        {
                            "turn_id": turn_id,
                            "transcription": {
                                "lang_code": code,
                                "lang_line": lang_line,
                                "original_text": orig,
                                "english_text": en_text,
                            },
                            "micro_agent": {
                                "normalized_prompt": "",
                                "action_items": [],
                            },
                            "reply_preview": None,
                            "reply_audio_b64": None,
                            "reply_audio_mime": None,
                        }
                    )
                    return

                # 1) Heuristics + optional refine for generic action items
                seeds = heuristics(usable_for_nlp)
                items = seeds
                if self.refine_with_llm:
                    items = await asyncio.to_thread(
                        llm_refine, usable_for_nlp, seeds
                    )

                # 2) Micro-agent-style prompt (generic, not domain-specific)
                prompt = build_micro_agent_prompt(usable_for_nlp, items)

                # ---- Your existing COAST agent + memory logic ----
                                # ---- COAST agent + memory logic (with fallback) ----
                agent_text = None
                agent_error = None

                try:
                    agent_config = get_agent_config() or {}
                    agent_name = select_agent(usable_for_nlp, agent_config)

                    # if first request initialise session memory with greeting
                    initialize_session_memory()

                    # fetch session memory from file
                    current_memory = get_session_memory()

                    agent_cfg = agent_config.get(agent_name)
                    if not agent_cfg:
                        raise KeyError(f"Missing agent config for '{agent_name}'")

                    structured_request = generate_structured_request(
                        usable_for_nlp, agent_cfg, current_memory
                    )
                    print("structured_request:", structured_request)

                    agent_result, optional_result = send_api_request(structured_request, agent_cfg)
                    print("agent_result:", agent_result)

                    # extract text from agent_result
                    if isinstance(agent_result, dict) and agent_result:
                        try:
                            first_val = next(iter(agent_result.values()))
                            agent_text = str(first_val)
                        except Exception:
                            agent_text = str(agent_result)
                    else:
                        agent_text = str(agent_result) if agent_result is not None else None

                except Exception as e:
                    agent_error = str(e)
                    print(f"[agent] fallback to generic because agent failed: {agent_error}")

                # --- Fallback behavior ---
                if agent_text and agent_text.strip():
                    reply = short_reply(agent_text)
                    reply_source = "agent"
                else:
                    # Generic fallback: reply from your micro-agent prompt
                    # (You already built `prompt` above; use it.)
                    try:
                        # If you have a smarter generic LLM call, use it here.
                        # Otherwise short_reply() still gives a compact response.
                        reply = short_reply(prompt)
                    except Exception:
                        reply = short_reply(usable_for_nlp)
                    reply_source = "generic_fallback"

                # Save memory even on fallback (optional, but recommended)
                try:
                    save_session_memory(usable_for_nlp, reply)
                except Exception as e:
                    print(f"[memory] save failed (non-fatal): {e}")


                # 4) TTS (embed as base64)
                reply_audio_b64 = None
                reply_audio_mime = None
                try:
                    # Only synth if we actually have text and ELEVENLABS creds/voice configured
                    if (
                        reply
                        and settings.ELEVENLABS_API_KEY
                        and settings.ELEVENLABS_VOICE_ID
                    ):
                        # run blocking HTTP call in a thread
                        audio_bytes = await asyncio.to_thread(
                            tts_elevenlabs,
                            text=reply,
                            voice_id=settings.ELEVENLABS_VOICE_ID,
                            model_id=settings.ELEVENLABS_MODEL,
                            fmt="mp3",  # or "wav"
                        )
                        if audio_bytes:
                            reply_audio_b64 = base64.b64encode(audio_bytes).decode(
                                "utf-8"
                            )
                            reply_audio_mime = "audio/mpeg"  # "audio/wav" if wav
                except Exception as e:
                    print(f"[pause] TTS error: {e}")

                # 5) Send reply payload
                await self.send_json(
                    {
                        "turn_id": turn_id,
                        "reply_preview": reply,
                        "reply_audio_b64": reply_audio_b64,
                        "reply_audio_mime": reply_audio_mime,
                        "optional_response": optional_result,
                    }
                )
            except Exception as e:
                print(f"[pause] error: {e}")
                try:
                    await self.send_json(
                        {
                            "error": "processing_failed",
                            "detail": str(e),
                        }
                    )
                except Exception:
                    pass
            finally:
                if path:
                    try:
                        os.remove(path)
                    except OSError:
                        pass
                self._pause_in_progress = False
