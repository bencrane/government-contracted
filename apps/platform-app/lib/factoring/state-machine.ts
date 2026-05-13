/**
 * Assignment state machine — FAR 32.802/32.805 compliance.
 *
 * Legal sequence (FAR 32.805 procedure):
 *   drafted     → executed    (contractor + factor both signed)
 *   executed    → served      (notice dispatched to CO + DO + surety)
 *   served      → acknowledged(first gov party acknowledges — informational)
 *   served/acked→ perfected   (ALL required gov parties acknowledged)
 *   any         → terminated  (manual termination)
 *   any         → rejected    (contracting officer rejection)
 *
 * Per FAR 32.802(e) + 32.805(b): required gov addressees are
 *   contracting_officer, disbursing_officer, surety (when has_surety).
 */
import { Client } from "pg";

export type AssignmentStatus =
  | "drafted"
  | "executed"
  | "served"
  | "acknowledged"
  | "perfected"
  | "terminated"
  | "rejected";

export type PartyStatus = "pending" | "signed" | "acknowledged" | "declined";

export interface Party {
  role: string;
  status: PartyStatus;
}

/**
 * Evaluate what state the assignment should be in given current parties.
 * Returns the new state, or null if no transition is warranted.
 */
export function evaluateTransition(
  currentStatus: AssignmentStatus,
  parties: Party[],
  hasSurety: boolean
): AssignmentStatus | null {
  const partyByRole = new Map(parties.map((p) => [p.role, p.status]));

  switch (currentStatus) {
    case "drafted": {
      const contractorSigned =
        partyByRole.get("contractor_assignor") === "signed";
      const factorSigned = partyByRole.get("factor_assignee") === "signed";
      if (contractorSigned && factorSigned) return "executed";
      return null;
    }
    case "executed": {
      // Transition to served happens when initiate-signing sends the notice
      // to CO + DO (+ surety). This is triggered explicitly by the API,
      // not by party status. Return null here; the API calls recordTransition directly.
      return null;
    }
    case "served":
    case "acknowledged": {
      // Gov parties required for perfection
      const requiredRoles = ["contracting_officer", "disbursing_officer"];
      if (hasSurety) requiredRoles.push("surety");

      const allAcked = requiredRoles.every(
        (role) => partyByRole.get(role) === "acknowledged"
      );
      if (allAcked) return "perfected";

      // At least one acked but not all — "acknowledged" sub-state
      const anyAcked = requiredRoles.some(
        (role) => partyByRole.get(role) === "acknowledged"
      );
      if (anyAcked && currentStatus === "served") return "acknowledged";
      return null;
    }
    default:
      return null;
  }
}

/**
 * Record a state transition row in assignment_state_transitions.
 * Caller is responsible for the surrounding transaction if needed.
 */
export async function recordTransition(
  client: Client,
  assignmentId: string,
  previousState: AssignmentStatus,
  newState: AssignmentStatus,
  actorUserId: string | null,
  reason: string
): Promise<void> {
  await client.query(
    `INSERT INTO assignment_state_transitions
       (assignment_id, previous_state, new_state, actor_user_id, transition_reason)
     VALUES ($1, $2, $3, $4, $5)`,
    [assignmentId, previousState, newState, actorUserId, reason]
  );
}

/**
 * Apply a transition: update assignments.status + write transition log.
 * Returns the new status.
 */
export async function applyTransition(
  client: Client,
  assignmentId: string,
  previousState: AssignmentStatus,
  newState: AssignmentStatus,
  actorUserId: string | null,
  reason: string
): Promise<AssignmentStatus> {
  await client.query(
    "UPDATE assignments SET status = $1, updated_at = now() WHERE id = $2",
    [newState, assignmentId]
  );
  await recordTransition(
    client,
    assignmentId,
    previousState,
    newState,
    actorUserId,
    reason
  );
  return newState;
}

/**
 * Re-evaluate and apply any pending transition for an assignment.
 * Fetches current state + parties, then calls evaluateTransition.
 */
export async function maybeAdvanceState(
  client: Client,
  assignmentId: string,
  actorUserId: string | null
): Promise<AssignmentStatus | null> {
  const aRow = await client.query<{
    status: AssignmentStatus;
    has_surety: boolean;
  }>("SELECT status, has_surety FROM assignments WHERE id = $1", [
    assignmentId,
  ]);
  if (aRow.rowCount === 0) return null;
  const { status, has_surety } = aRow.rows[0];

  const pRows = await client.query<{ role: string; status: PartyStatus }>(
    "SELECT role, status FROM assignment_parties WHERE assignment_id = $1",
    [assignmentId]
  );
  const parties = pRows.rows;

  const newState = evaluateTransition(status, parties, has_surety);
  if (!newState) return null;

  await applyTransition(
    client,
    assignmentId,
    status,
    newState,
    actorUserId,
    "auto-evaluated from party status"
  );
  return newState;
}
