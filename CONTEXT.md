# Crowd Symphony

This context defines the language for a conductor controlling audience audio through hand gestures in a shared live session.

## Language

**Performance Session**:
One temporary real-time room connecting a Conductor with Audience Participants.
_Avoid_: Browser session, music track

**Conductor**:
The camera-enabled participant whose gestures set section-level audio intent.
_Avoid_: DJ identity, server administrator

**Audience Participant**:
A listener device joined to a Performance Session and assigned to an Audience Section.
_Avoid_: Authenticated account, aggregate connection count

**Audience Section**:
The left or right control group whose participants receive the same Target Volume.
_Avoid_: Stereo channel on one device

**Gesture Sample**:
One MediaPipe observation of a tracked hand position and confidence.
_Avoid_: Volume command, persisted user action

**Target Volume**:
The normalized section-level value derived from smoothed Gesture Samples and broadcast by the Conductor.
_Avoid_: Instantaneous hand coordinate, device speaker setting

**Applied Volume**:
The locally smoothed Web Audio gain an Audience Participant actually hears while converging on Target Volume.
_Avoid_: Server-side volume, phone hardware volume

**Control Update**:
A real-time message carrying current section Target Volumes and session state.
_Avoid_: Durable event record

**Track**:
An audio source selected and started by an Audience Participant.
_Avoid_: Performance Session, conductor-controlled playlist

**Effect Threshold**:
A defined Applied Volume boundary that activates bass boost or a visual/haptic audience effect.
_Avoid_: Gesture confidence threshold

**Join Link**:
The QR-encoded URL that identifies a Performance Session for Audience Participants.
_Avoid_: Authentication credential

**Realtime State**:
The current session, participant, and control values shared through Vercel Functions and Runtime Cache. It is operational state, not a historical system of record.
_Avoid_: Analytics warehouse, browser local storage
