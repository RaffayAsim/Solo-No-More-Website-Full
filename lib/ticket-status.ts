/**
 * The database stores a checked-in pass as "scanned"; the door/host screens call the
 * same state "admitted". Normalise once where tickets are loaded so every screen
 * agrees.
 */
export function withDoorStatus<T extends { ticket_status?: string | null }>(tickets: T[] | null | undefined): T[] {
  return (tickets || []).map((t) =>
    t.ticket_status === "scanned" ? { ...t, ticket_status: "admitted" } : t
  );
}
