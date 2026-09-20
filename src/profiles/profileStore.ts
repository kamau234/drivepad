import { InputTuning, defaultInputTuning } from '../input/inputEngine';

export type ControlLayout = {
  steeringMode: 'wheel' | 'trackpad';
  buttonScale: number;
  buttonOpacity: number;
  leftHanded: boolean;
};

export type DrivepadProfile = {
  id: string;
  name: string;
  tuning: InputTuning;
  layout: ControlLayout;
};

const STORAGE_KEY = 'drivepad.profiles.v1';
const ACTIVE_KEY = 'drivepad.active-profile.v1';

export const defaultControlLayout: ControlLayout = {
  steeringMode: 'wheel',
  buttonScale: 1,
  buttonOpacity: 0.9,
  leftHanded: false
};

export function createProfile(name: string, id = crypto.randomUUID()): DrivepadProfile {
  return {
    id,
    name: name.trim() || 'Custom',
    tuning: { ...defaultInputTuning },
    layout: { ...defaultControlLayout }
  };
}

function canUseStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

export function loadProfiles(): DrivepadProfile[] {
  if (!canUseStorage()) return [createProfile('Street Runner', 'street-runner')];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!Array.isArray(value) || !value.length) return [createProfile('Street Runner', 'street-runner')];
    return value as DrivepadProfile[];
  } catch {
    return [createProfile('Street Runner', 'street-runner')];
  }
}

export function saveProfiles(profiles: DrivepadProfile[]): void {
  if (canUseStorage()) localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function loadActiveProfileId(profiles: DrivepadProfile[]): string {
  const saved = canUseStorage() ? localStorage.getItem(ACTIVE_KEY) : null;
  return profiles.some((profile) => profile.id === saved) ? saved! : profiles[0].id;
}

export function saveActiveProfileId(id: string): void {
  if (canUseStorage()) localStorage.setItem(ACTIVE_KEY, id);
}

export function duplicateProfile(profile: DrivepadProfile): DrivepadProfile {
  return {
    ...profile,
    id: crypto.randomUUID(),
    name: `${profile.name} Copy`,
    tuning: { ...profile.tuning },
    layout: { ...profile.layout }
  };
}
