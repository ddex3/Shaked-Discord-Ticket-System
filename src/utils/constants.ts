export const Colors = {
  Primary: 0x5865f2,
  Success: 0x57f287,
  Warning: 0xfee75c,
  Danger: 0xed4245,
  Info: 0x5865f2,
  Escalated: 0xe67e22,
} as const;

export const ButtonIds = {
  OpenTicket: "ticket_open",
  ClaimTicket: "ticket_claim",
  CloseTicket: "ticket_close",
  StaffOptions: "ticket_staff_options",
  RenameTicket: "ticket_rename",
  SendTranscript: "ticket_transcript",
  AddUser: "ticket_add_user",
  RemoveUser: "ticket_remove_user",
  ChangePriority: "ticket_change_priority",
  EscalateTicket: "ticket_escalate",
  ViewNotes: "ticket_view_notes",
  AddNote: "ticket_add_note",
} as const;

export const ModalIds = {
  RenameTicket: "modal_rename_ticket",
  StaffNote: "modal_staff_note",
  CloseTicket: "modal_close_ticket",
} as const;

export const SelectMenuIds = {
  Priority: "select_priority",
  AddUser: "select_add_user",
  RemoveUser: "select_remove_user",
} as const;

export const PriorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const StatusLabels: Record<string, string> = {
  open: "Open",
  claimed: "Claimed",
  closed: "Closed",
  escalated: "Escalated",
};
