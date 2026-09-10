export type Schedule = "AM" | "PM" | "AM & PM";
export interface Owner {
  id: string;
  name: string;
}
export interface Horse {
  id: string;
  name: string;
  registeredName?: string;
  birthDate: string;
  sex: "Mare" | "Gelding" | "Stallion";
  breed: string;
  colour: string;
  owner: Owner;
  arrivalDate: string;
  location: string;
  status: "Active" | "Away" | "Archived";
  specialInstructions: string;
}
export interface CareItem {
  id: string;
  horseId: string;
  name: string;
  schedule: Schedule;
  instructions: string;
  effectiveStart: string;
  effectiveEnd?: string;
}
export interface Medication extends CareItem {
  kind: "medication";
  dose: string;
}
export interface FeedInstruction extends CareItem {
  kind: "feed";
  quantity: string;
}
export interface Supplement extends CareItem {
  kind: "supplement";
  quantity: string;
}
export type CareInstruction = Medication | FeedInstruction | Supplement;
export interface TaskCompletion {
  completedBy: string;
  completedAt: string;
}
export interface CareTask {
  id: string;
  horseId: string;
  date: string;
  category: "Feed" | "Medication" | "Special care";
  period: "AM" | "PM";
  title: string;
  detail: string;
  completion?: TaskCompletion;
}
export type EventType =
  | "Vet"
  | "Farrier"
  | "Dentist"
  | "Medication change"
  | "Feed change"
  | "Vaccination"
  | "Deworming"
  | "Weight check"
  | "Other";
export interface CalendarEvent {
  id: string;
  horseId: string;
  date: string;
  time: string;
  type: EventType;
  provider: string;
  reason: string;
  notes: string;
}
export interface HistoryEntry {
  id: string;
  horseId: string;
  date: string;
  type:
    "Vet" | "Farrier" | "Medication" | "Feed" | "Weight" | "Notes" | "Photo";
  title: string;
  detail: string;
  author: string;
}
